//! CRM (M04) module crate — stub router demonstrating the modular pattern.
//! Real handlers would mirror the HRM crate (models / repo / routes).
use axum::{response::IntoResponse, routing::get, Router};
use shared::{api::ok, db::Db, error::ApiResult, rbac::{Action, Module}, RequestCtx};

pub fn router(_db: Db) -> Router {
    Router::new().route("/info", get(info))
}

async fn info(ctx: RequestCtx) -> ApiResult<impl IntoResponse> {
    ctx.require(Action::Read, Module::SalesCrm)?;
    Ok(ok(serde_json::json!({
        "module": "sales_crm",
        "status": "scaffold",
        "message": "CRM core mirrors the HRM crate structure (models/repo/routes).",
    })))
}
