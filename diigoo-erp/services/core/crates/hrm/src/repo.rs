//! HRM data access with role-based data scoping (ABAC).
//!
//! On top of tenant RLS, each request is scoped by the caller's role:
//!   - org-wide roles (owner, hr_manager, accountant, auditor, …) → all rows
//!   - store roles (store_manager, assistant_manager) → their location only
//!   - self roles (employee, cashier, driver) → their own record only
//! So different logins genuinely see different data.
use serde_json::{json, Value};
use shared::{db::Db, error::{ApiError, ApiResult}, rbac::Role};
use crate::models::EmployeeRow;

const EMPLOYEE_COLS: &str = "id, employee_no, first_name, last_name, email, phone, avatar_tone, \
    status, employment_type, position_id, department_id, location_id, manager_id, hire_date, \
    termination_date, base_amount_cents, currency, pay_type, pay_cycle, flsa_exempt";

#[derive(Default)]
pub struct EmployeeQuery {
    pub search: Option<String>,
    pub status: Option<String>,
    pub department_id: Option<String>,
    pub limit: i64,
    pub offset: i64,
}

// ─── Scope resolution ─────────────────────────────────────────────────────
fn scope_kind(role: Role) -> &'static str {
    use Role::*;
    match role {
        Employee | Cashier | DeliveryDriver => "self",
        StoreManager | AssistantManager => "store",
        _ => "all",
    }
}

/// Ids come from our own JWT / DB (e.g. `e_1001`, `st_001`). Guard before inlining.
fn valid_id(s: &str) -> bool {
    !s.is_empty() && s.len() < 64 && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
}

async fn resolve_scope(
    conn: &mut sqlx::PgConnection,
    role: Role,
    eid: Option<&str>,
) -> ApiResult<(&'static str, Option<String>)> {
    let kind = scope_kind(role);
    let val = match kind {
        "self" => eid.filter(|s| valid_id(s)).map(|s| s.to_string()),
        "store" => {
            if let Some(e) = eid.filter(|s| valid_id(s)) {
                let loc: Option<(String,)> = sqlx::query_as("SELECT location_id FROM hr_employees WHERE id = $1")
                    .bind(e)
                    .fetch_optional(&mut *conn)
                    .await?;
                loc.map(|r| r.0).filter(|v| valid_id(v))
            } else {
                None
            }
        }
        _ => None,
    };
    Ok((kind, val))
}

/// Build a WHERE fragment for the employees table (optionally aliased).
fn emp_pred(kind: &str, val: &Option<String>, alias: &str) -> String {
    let p = if alias.is_empty() { String::new() } else { format!("{alias}.") };
    match (kind, val) {
        ("all", _) => "TRUE".to_string(),
        ("self", Some(v)) => format!("{p}id = '{v}'"),
        ("store", Some(v)) => format!("{p}location_id = '{v}'"),
        _ => "FALSE".to_string(),
    }
}

/// Requisitions scope (store roles see their location; self roles see none).
fn req_pred(kind: &str, val: &Option<String>) -> String {
    match (kind, val) {
        ("all", _) => "TRUE".to_string(),
        ("store", Some(v)) => format!("location_id = '{v}'"),
        _ => "FALSE".to_string(),
    }
}

// ─── Queries ──────────────────────────────────────────────────────────────
pub async fn list_employees(
    db: &Db,
    tenant_id: &str,
    q: &EmployeeQuery,
    role: Role,
    eid: Option<&str>,
) -> ApiResult<(Vec<Value>, i64)> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let (kind, val) = resolve_scope(&mut conn, role, eid).await?;
    let scope = emp_pred(kind, &val, "");

    let sql = format!(
        "SELECT {cols} FROM hr_employees \
         WHERE ({scope}) \
           AND ($1::text IS NULL OR (first_name || ' ' || last_name || ' ' || email || ' ' || employee_no) ILIKE '%' || $1 || '%') \
           AND ($2::text IS NULL OR status = $2) \
           AND ($3::text IS NULL OR department_id = $3) \
         ORDER BY last_name ASC LIMIT $4 OFFSET $5",
        cols = EMPLOYEE_COLS
    );
    let rows = sqlx::query_as::<_, EmployeeRow>(&sql)
        .bind(&q.search)
        .bind(&q.status)
        .bind(&q.department_id)
        .bind(if q.limit == 0 { 50 } else { q.limit })
        .bind(q.offset)
        .fetch_all(&mut *conn)
        .await?;

    let total: (i64,) = sqlx::query_as(&format!("SELECT count(*) FROM hr_employees WHERE ({scope})"))
        .fetch_one(&mut *conn)
        .await?;

    Ok((rows.iter().map(EmployeeRow::to_json).collect(), total.0))
}

pub async fn get_employee(
    db: &Db,
    tenant_id: &str,
    id: &str,
    role: Role,
    eid: Option<&str>,
) -> ApiResult<Option<Value>> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let (kind, val) = resolve_scope(&mut conn, role, eid).await?;
    let scope = emp_pred(kind, &val, "");
    let sql = format!("SELECT {cols} FROM hr_employees WHERE id = $1 AND ({scope})", cols = EMPLOYEE_COLS);
    let row = sqlx::query_as::<_, EmployeeRow>(&sql).bind(id).fetch_optional(&mut *conn).await?;
    Ok(row.map(|r| r.to_json()))
}

#[allow(clippy::too_many_arguments)]
pub async fn create_employee(
    db: &Db,
    tenant_id: &str,
    first: &str,
    last: &str,
    email: &str,
    dept: &str,
    loc: &str,
    etype: &str,
    pos: &str,
    hire: Option<&str>,
) -> ApiResult<Value> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let sql = format!(
        "INSERT INTO hr_employees (id, tenant_id, employee_no, first_name, last_name, email, avatar_tone, \
            status, employment_type, position_id, department_id, location_id, hire_date, base_amount_cents, \
            currency, pay_type, pay_cycle, flsa_exempt) \
         VALUES ('e_'||substr(replace(gen_random_uuid()::text,'-',''),1,8), $1, \
            'EMP-'||((floor(random()*9000))+1000)::int::text, $2, $3, $4, 'navy', 'active', $5, $6, $7, $8, \
            COALESCE($9::date, CURRENT_DATE), 0, 'USD', 'salary', 'biweekly', true) \
         RETURNING {cols}",
        cols = EMPLOYEE_COLS
    );
    let row = sqlx::query_as::<_, EmployeeRow>(&sql)
        .bind(tenant_id)
        .bind(first)
        .bind(last)
        .bind(email)
        .bind(etype)
        .bind(pos)
        .bind(dept)
        .bind(loc)
        .bind(hire)
        .fetch_one(&mut *conn)
        .await?;
    Ok(row.to_json())
}

fn type_tone(t: &str) -> &'static str {
    match t {
        "full_time" => "navy",
        "part_time" => "teal",
        "contract" => "blue",
        "intern" => "purple",
        "seasonal" => "amber",
        _ => "navy",
    }
}

pub async fn analytics(db: &Db, tenant_id: &str, role: Role, eid: Option<&str>) -> ApiResult<Value> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let (kind, val) = resolve_scope(&mut conn, role, eid).await?;
    let sc = emp_pred(kind, &val, ""); // plain table
    let sce = emp_pred(kind, &val, "e"); // aliased as e
    let scr = req_pred(kind, &val);

    let headcount: (i64,) = sqlx::query_as(&format!("SELECT count(*) FROM hr_employees WHERE ({sc}) AND status <> 'terminated'"))
        .fetch_one(&mut *conn).await?;
    let new_hires: (i64,) = sqlx::query_as(&format!("SELECT count(*) FROM hr_employees WHERE ({sc}) AND hire_date >= DATE '2026-05-13'"))
        .fetch_one(&mut *conn).await?;
    let on_leave: (i64,) = sqlx::query_as(&format!(
        "SELECT count(DISTINCT e.id) FROM hr_employees e JOIN hr_leave_requests l ON l.employee_id = e.id \
         WHERE ({sce}) AND l.status = 'approved' AND DATE '2026-06-12' BETWEEN l.start_date AND l.end_date"
    )).fetch_one(&mut *conn).await?;
    let open_reqs: (i64,) = sqlx::query_as(&format!("SELECT count(*) FROM hr_requisitions WHERE ({scr}) AND status = 'open'"))
        .fetch_one(&mut *conn).await.unwrap_or((0,));
    let pending: (i64,) = sqlx::query_as(&format!(
        "SELECT count(*) FROM hr_leave_requests l WHERE l.status = 'pending' \
         AND EXISTS (SELECT 1 FROM hr_employees e WHERE e.id = l.employee_id AND ({sce}))"
    )).fetch_one(&mut *conn).await?;
    let net: (i64,) = sqlx::query_as(&format!(
        "SELECT COALESCE(SUM(CASE WHEN pay_type='salary' THEN base_amount_cents ELSE base_amount_cents*2080 END)/26.0*0.72,0)::int8 \
         FROM hr_employees WHERE ({sc}) AND status <> 'terminated'"
    )).fetch_one(&mut *conn).await?;
    let term_total: (i64, i64) = sqlx::query_as(&format!(
        "SELECT count(*) FILTER (WHERE status='terminated'), count(*) FROM hr_employees WHERE ({sc})"
    )).fetch_one(&mut *conn).await?;
    let turnover = if term_total.1 > 0 { (term_total.0 as f64 / term_total.1 as f64 * 100.0).round() as i64 } else { 0 };

    let by_dept: Vec<(String, i64)> = sqlx::query_as(&format!(
        "SELECT d.name, count(*)::int8 FROM hr_employees e JOIN hr_departments d ON d.id = e.department_id \
         WHERE ({sce}) AND e.status <> 'terminated' GROUP BY d.name ORDER BY 2 DESC"
    )).fetch_all(&mut *conn).await.unwrap_or_default();
    let by_type: Vec<(String, i64)> = sqlx::query_as(&format!(
        "SELECT employment_type, count(*)::int8 FROM hr_employees WHERE ({sc}) AND status <> 'terminated' GROUP BY employment_type ORDER BY 2 DESC"
    )).fetch_all(&mut *conn).await.unwrap_or_default();
    let by_status: Vec<(String, i64)> = sqlx::query_as(&format!(
        "SELECT status, count(*)::int8 FROM hr_employees WHERE ({sc}) GROUP BY status ORDER BY 2 DESC"
    )).fetch_all(&mut *conn).await.unwrap_or_default();

    Ok(json!({
        "headcount": headcount.0,
        "newHires30d": new_hires.0,
        "onLeaveToday": on_leave.0,
        "openRequisitions": open_reqs.0,
        "pendingApprovals": pending.0,
        "attendanceRate": 96,
        "turnoverRate": turnover,
        "payrollNet": { "amount": net.0, "currency": "USD" },
        "complianceRate": 92,
        "byDepartment": by_dept.iter().map(|(l, v)| json!({ "label": l, "value": v })).collect::<Vec<_>>(),
        "byType": by_type.iter().map(|(t, v)| json!({ "label": t.replace('_', " "), "value": v, "tone": type_tone(t) })).collect::<Vec<_>>(),
        "byStatus": by_status.iter().map(|(s, v)| json!({ "label": s.replace('_', " "), "value": v })).collect::<Vec<_>>(),
    }))
}

pub async fn list_leave(db: &Db, tenant_id: &str, status: Option<&str>, role: Role, eid: Option<&str>) -> ApiResult<Vec<Value>> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let (kind, val) = resolve_scope(&mut conn, role, eid).await?;
    let ep = emp_pred(kind, &val, "e");
    let sql = format!(
        "SELECT id, employee_id, policy_name, start_date::text, end_date::text, days, status, COALESCE(reason,'') \
         FROM hr_leave_requests l \
         WHERE ($1::text IS NULL OR status = $1) \
           AND l.employee_id IN (SELECT e.id FROM hr_employees e WHERE ({ep})) \
         ORDER BY requested_at DESC"
    );
    let rows: Vec<(String, String, String, String, String, i32, String, String)> =
        sqlx::query_as(&sql).bind(status).fetch_all(&mut *conn).await?;
    Ok(rows
        .into_iter()
        .map(|(id, employee_id, policy_name, start_date, end_date, days, status, reason)| {
            json!({ "id": id, "employeeId": employee_id, "policyName": policy_name, "startDate": start_date, "endDate": end_date, "days": days, "status": status, "reason": reason })
        })
        .collect())
}

#[allow(clippy::too_many_arguments)]
pub async fn create_leave(
    db: &Db, tenant_id: &str, employee_id: &str, policy_id: &str, policy_name: &str,
    start: &str, end: &str, days: i32, reason: Option<&str>,
) -> ApiResult<Value> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let row: (String, String, String, String, String, i32, String) = sqlx::query_as(
        "INSERT INTO hr_leave_requests (id, tenant_id, employee_id, policy_id, policy_name, start_date, end_date, days, reason, status) \
         VALUES ('lr_'||substr(replace(gen_random_uuid()::text,'-',''),1,8), $1,$2,$3,$4,$5::date,$6::date,$7,$8,'pending') \
         RETURNING id, employee_id, policy_name, start_date::text, end_date::text, days, status",
    )
    .bind(tenant_id).bind(employee_id).bind(policy_id).bind(policy_name).bind(start).bind(end).bind(days).bind(reason)
    .fetch_one(&mut *conn).await?;
    let _ = sqlx::query("UPDATE hr_leave_balances SET pending = pending + $1 WHERE employee_id = $2 AND policy_id = $3")
        .bind(days).bind(employee_id).bind(policy_id).execute(&mut *conn).await;
    Ok(json!({ "id": row.0, "employeeId": row.1, "policyName": row.2, "startDate": row.3, "endDate": row.4, "days": row.5, "status": row.6 }))
}

pub async fn decide_leave(
    db: &Db, tenant_id: &str, id: &str, decision: &str, decided_by: &str, role: Role, eid: Option<&str>,
) -> ApiResult<Value> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let (kind, val) = resolve_scope(&mut conn, role, eid).await?;
    let ep = emp_pred(kind, &val, "e");
    let updated: Option<(String, String, i32)> = sqlx::query_as(&format!(
        "UPDATE hr_leave_requests l SET status = $2, decided_by = $3, decided_at = now() \
         WHERE l.id = $1 AND l.status = 'pending' \
           AND l.employee_id IN (SELECT e.id FROM hr_employees e WHERE ({ep})) \
         RETURNING l.employee_id, l.policy_id, l.days"
    ))
    .bind(id).bind(decision).bind(decided_by).fetch_optional(&mut *conn).await?;
    let (emp, pol, days) = updated.ok_or_else(|| ApiError::NotFound("leave request not found or not pending in your scope".into()))?;
    if decision == "approved" {
        let _ = sqlx::query("UPDATE hr_leave_balances SET used = used + $1, pending = GREATEST(pending - $1, 0) WHERE employee_id = $2 AND policy_id = $3")
            .bind(days).bind(&emp).bind(&pol).execute(&mut *conn).await;
    } else {
        let _ = sqlx::query("UPDATE hr_leave_balances SET pending = GREATEST(pending - $1, 0) WHERE employee_id = $2 AND policy_id = $3")
            .bind(days).bind(&emp).bind(&pol).execute(&mut *conn).await;
    }
    Ok(json!({ "id": id, "status": decision }))
}

pub async fn list_balances(db: &Db, tenant_id: &str, role: Role, eid: Option<&str>) -> ApiResult<Vec<Value>> {
    let mut conn = db.tenant_conn(tenant_id).await?;
    let (kind, val) = resolve_scope(&mut conn, role, eid).await?;
    let ep = emp_pred(kind, &val, "e");
    let rows: Vec<(String, String, String, i32, i32, i32, String)> = sqlx::query_as(&format!(
        "SELECT b.employee_id, b.policy_id, b.policy_name, b.accrued, b.used, b.pending, b.unit FROM hr_leave_balances b \
         WHERE b.employee_id IN (SELECT e.id FROM hr_employees e WHERE ({ep})) ORDER BY b.employee_id, b.policy_name"
    ))
    .fetch_all(&mut *conn).await?;
    Ok(rows
        .into_iter()
        .map(|(emp, pol, name, acc, used, pend, unit)| {
            json!({ "employeeId": emp, "policyId": pol, "policyName": name, "accrued": acc, "used": used, "pending": pend, "unit": unit })
        })
        .collect())
}
