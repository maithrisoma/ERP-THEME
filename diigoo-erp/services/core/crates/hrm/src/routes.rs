//! HRM HTTP routes (Axum). Mounted by the gateway under /api/v1.
use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    routing::{get, patch},
    Json, Router,
};
use serde::Deserialize;
use shared::{
    api::{ok, ok_page},
    db::Db,
    error::{ApiError, ApiResult},
    rbac::{can, Action, Module, Role},
    RequestCtx,
};
use crate::repo::{self, EmployeeQuery};

pub fn router(db: Db) -> Router {
    Router::new()
        .route("/employees", get(list_employees).post(create_employee))
        .route("/employees/:id", get(get_employee))
        .route("/analytics/hr", get(analytics))
        .route("/leave-requests", get(list_leave).post(create_leave))
        .route("/leave-requests/:id", patch(decide_leave))
        .route("/leave-balances", get(list_balances))
        .with_state(db)
}

#[derive(Deserialize)]
struct CreateEmployee {
    #[serde(rename = "firstName")]
    first_name: String,
    #[serde(rename = "lastName")]
    last_name: String,
    email: String,
    #[serde(rename = "departmentId", default)]
    department_id: String,
    #[serde(rename = "locationId", default)]
    location_id: String,
    #[serde(rename = "employmentType", default)]
    employment_type: String,
    #[serde(rename = "positionId", default)]
    position_id: String,
    #[serde(rename = "hireDate", default)]
    hire_date: Option<String>,
}

async fn create_employee(
    ctx: RequestCtx,
    State(db): State<Db>,
    Json(c): Json<CreateEmployee>,
) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Create, Module::Hr)?;
    if c.first_name.trim().is_empty() || c.last_name.trim().is_empty() || c.email.trim().is_empty() {
        return Err(ApiError::Validation("firstName, lastName and email are required".into()));
    }
    let etype = if c.employment_type.is_empty() { "full_time" } else { &c.employment_type };
    let emp = repo::create_employee(
        &db,
        &ctx.tenant_id,
        c.first_name.trim(),
        c.last_name.trim(),
        c.email.trim(),
        &c.department_id,
        &c.location_id,
        etype,
        &c.position_id,
        c.hire_date.as_deref().filter(|s| !s.is_empty()),
    )
    .await?;
    Ok(ok(emp))
}

#[derive(Deserialize)]
struct ListParams {
    search: Option<String>,
    status: Option<String>,
    department_id: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
}

async fn list_employees(
    ctx: RequestCtx,
    State(db): State<Db>,
    Query(p): Query<ListParams>,
) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Read, Module::Hr)?;
    let page = p.page.unwrap_or(1).max(1);
    let per_page = p.per_page.unwrap_or(20).clamp(1, 100);
    let q = EmployeeQuery {
        search: p.search,
        status: p.status,
        department_id: p.department_id,
        limit: per_page,
        offset: (page - 1) * per_page,
    };
    let (items, total) = repo::list_employees(&db, &ctx.tenant_id, &q, ctx.role, ctx.employee_id.as_deref()).await?;
    Ok(ok_page(items, page, per_page, total))
}

async fn get_employee(
    ctx: RequestCtx,
    State(db): State<Db>,
    Path(id): Path<String>,
) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Read, Module::Hr)?;
    match repo::get_employee(&db, &ctx.tenant_id, &id, ctx.role, ctx.employee_id.as_deref()).await? {
        Some(e) => Ok(ok(e)),
        None => Err(ApiError::NotFound(format!("no employee with id {id}"))),
    }
}

async fn analytics(ctx: RequestCtx, State(db): State<Db>) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Read, Module::Hr)?;
    Ok(ok(repo::analytics(&db, &ctx.tenant_id, ctx.role, ctx.employee_id.as_deref()).await?))
}

#[derive(Deserialize)]
struct LeaveParams {
    status: Option<String>,
}

async fn list_leave(
    ctx: RequestCtx,
    State(db): State<Db>,
    Query(p): Query<LeaveParams>,
) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Read, Module::Hr)?;
    Ok(ok(repo::list_leave(&db, &ctx.tenant_id, p.status.as_deref(), ctx.role, ctx.employee_id.as_deref()).await?))
}

async fn list_balances(ctx: RequestCtx, State(db): State<Db>) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Read, Module::Hr)?;
    Ok(ok(repo::list_balances(&db, &ctx.tenant_id, ctx.role, ctx.employee_id.as_deref()).await?))
}

#[derive(Deserialize)]
struct CreateLeave {
    #[serde(rename = "employeeId", default)]
    employee_id: Option<String>,
    #[serde(rename = "policyId", default)]
    policy_id: String,
    #[serde(rename = "policyName", default)]
    policy_name: String,
    #[serde(rename = "startDate")]
    start_date: String,
    #[serde(rename = "endDate")]
    end_date: String,
    #[serde(default)]
    days: i32,
    #[serde(default)]
    reason: Option<String>,
}

async fn create_leave(ctx: RequestCtx, State(db): State<Db>, Json(c): Json<CreateLeave>) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Read, Module::Hr)?;
    let target = c.employee_id.clone().or_else(|| ctx.employee_id.clone())
        .ok_or_else(|| ApiError::Validation("no employee to request leave for".into()))?;
    let is_self = ctx.employee_id.as_deref() == Some(target.as_str());
    if !is_self && !can(ctx.role, Action::Update, Module::Hr) {
        return Err(ApiError::Forbidden("cannot request leave for another employee".into()));
    }
    if c.start_date.is_empty() || c.end_date.is_empty() {
        return Err(ApiError::Validation("startDate and endDate are required".into()));
    }
    let days = if c.days <= 0 { 1 } else { c.days };
    let policy_id = if c.policy_id.is_empty() { "lp_pto" } else { &c.policy_id };
    let policy_name = if c.policy_name.is_empty() { "Paid Time Off" } else { &c.policy_name };
    let leave = repo::create_leave(&db, &ctx.tenant_id, &target, policy_id, policy_name, &c.start_date, &c.end_date, days, c.reason.as_deref()).await?;
    Ok(ok(leave))
}

#[derive(Deserialize)]
struct DecideLeave {
    decision: String,
}

fn can_decide_leave(role: Role) -> bool {
    use Role::*;
    matches!(role, Owner | HrManager | Accountant | StoreManager | AssistantManager | RegionalManager | SuperAdmin)
}

async fn decide_leave(
    ctx: RequestCtx,
    State(db): State<Db>,
    Path(id): Path<String>,
    Json(d): Json<DecideLeave>,
) -> ApiResult<impl IntoResponse> {
    if !can_decide_leave(ctx.role) {
        return Err(ApiError::Forbidden("your role cannot approve leave".into()));
    }
    if d.decision != "approved" && d.decision != "rejected" {
        return Err(ApiError::Validation("decision must be 'approved' or 'rejected'".into()));
    }
    let decided_by = ctx.employee_id.clone().unwrap_or_else(|| ctx.user_id.clone());
    let res = repo::decide_leave(&db, &ctx.tenant_id, &id, &d.decision, &decided_by, ctx.role, ctx.employee_id.as_deref()).await?;
    Ok(ok(res))
}
