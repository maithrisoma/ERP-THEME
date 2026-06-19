//! Authentication module: real login (bcrypt + JWT), `/me`, and idempotent
//! seeding of role-based demo accounts on boot. The `users` table is global
//! (login is pre-tenant); everything else is tenant-scoped via RLS.
use axum::{extract::State, response::IntoResponse, routing::{get, post}, Json, Router};
use serde::Deserialize;
use serde_json::json;
use shared::{api::ok, auth, db::Db, error::{ApiError, ApiResult}, RequestCtx};

pub fn router(db: Db) -> Router {
    Router::new()
        .route("/auth/login", post(login))
        .route("/auth/me", get(me))
        .with_state(db)
}

#[derive(Deserialize)]
struct LoginBody {
    email: String,
    password: String,
}

async fn login(State(db): State<Db>, Json(body): Json<LoginBody>) -> ApiResult<impl IntoResponse> {
    let row: Option<(String, String, String, String, Option<String>, String, String)> = sqlx::query_as(
        "SELECT id, tenant_id, password_hash, role, employee_id, name, status FROM users WHERE lower(email) = lower($1)",
    )
    .bind(&body.email)
    .fetch_optional(&db.pool)
    .await?;

    let (id, tid, hash, role, eid, name, status) = row.ok_or(ApiError::Unauthorized)?;
    if status != "active" || !auth::verify_password(&body.password, &hash) {
        return Err(ApiError::Unauthorized);
    }

    let (secret, issuer) = auth::jwt_env();
    let token = auth::issue(&secret, &issuer, &id, &tid, &role, eid.clone(), &name, 8)
        .map_err(|e| ApiError::Internal(e.to_string()))?;
    let _ = sqlx::query("UPDATE users SET last_login_at = now() WHERE id = $1").bind(&id).execute(&db.pool).await;

    Ok(ok(json!({
        "token": token,
        "user": { "id": id, "name": name, "email": body.email, "role": role, "employeeId": eid, "tenantId": tid }
    })))
}

async fn me(ctx: RequestCtx, State(db): State<Db>) -> ApiResult<impl IntoResponse> {
    let user: Option<(String, String, String, Option<String>, String)> = sqlx::query_as(
        "SELECT email, role, name, employee_id, tenant_id FROM users WHERE id = $1",
    )
    .bind(&ctx.user_id)
    .fetch_optional(&db.pool)
    .await?;
    let (email, role, name, eid, tid) = user.ok_or(ApiError::Unauthorized)?;

    let tenant: Option<(String, String, String)> =
        sqlx::query_as("SELECT id, name, tier FROM tenants WHERE id = $1").bind(&tid).fetch_optional(&db.pool).await?;
    let (t_id, t_name, t_tier) = tenant.unwrap_or((tid.clone(), "Tenant".into(), "enterprise".into()));

    Ok(ok(json!({
        "user": { "id": ctx.user_id, "name": name, "email": email, "role": role, "employeeId": eid, "tenantId": tid },
        "tenant": { "id": t_id, "name": t_name, "tier": t_tier }
    })))
}

/// Seed role-based accounts (idempotent). All share password `demo1234`.
pub async fn seed_users(db: &Db) -> anyhow::Result<u64> {
    const PW: &str = "demo1234";
    let seeds: &[(&str, &str, &str, Option<&str>, &str)] = &[
        ("u_super", "super@diigoo.demo", "super_admin", None, "Platform Operator"),
        ("u_owner", "owner@northwind.demo", "owner", Some("e_1000"), "Eleanor Vance"),
        ("u_hr", "hr@northwind.demo", "hr_manager", Some("e_1001"), "Marcus Hale"),
        ("u_acct", "accountant@northwind.demo", "accountant", Some("e_1006"), "Victor Almeida"),
        ("u_mgr", "manager@northwind.demo", "store_manager", Some("e_1003"), "James Okafor"),
        ("u_mkt", "marketing@northwind.demo", "marketing_staff", None, "Isabella Conti"),
        ("u_it", "itadmin@northwind.demo", "it_admin", None, "IT Administrator"),
        ("u_audit", "auditor@northwind.demo", "auditor", None, "External Auditor"),
        ("u_emp", "employee@northwind.demo", "employee", Some("e_1021"), "Grace Bennett"),
    ];
    let hash = auth::hash_password(PW).map_err(|e| anyhow::anyhow!(e.to_string()))?;
    let mut n = 0u64;
    for (id, email, role, eid, name) in seeds {
        let res = sqlx::query(
            "INSERT INTO users (id, tenant_id, email, password_hash, role, employee_id, name) \
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING",
        )
        .bind(id)
        .bind("t_diigoo_demo")
        .bind(email)
        .bind(&hash)
        .bind(role)
        .bind(*eid)
        .bind(name)
        .execute(&db.pool)
        .await?;
        n += res.rows_affected();
    }
    Ok(n)
}
