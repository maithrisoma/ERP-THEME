//! Standard success envelope (mirrors the document's API design page).
use axum::{response::IntoResponse, Json};
use serde::Serialize;
use serde_json::json;

#[derive(Serialize)]
pub struct Meta {
    pub request_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub per_page: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<i64>,
}

impl Default for Meta {
    fn default() -> Self {
        Self { request_id: uuid::Uuid::new_v4().to_string(), page: None, per_page: None, total: None }
    }
}

/// `ok(data)` -> `{ "status":"success", "data":..., "meta":{...} }`
pub fn ok<T: Serialize>(data: T) -> impl IntoResponse {
    Json(json!({ "status": "success", "data": data, "meta": Meta::default() }))
}

/// Paginated success envelope.
pub fn ok_page<T: Serialize>(data: T, page: i64, per_page: i64, total: i64) -> impl IntoResponse {
    let meta = Meta { page: Some(page), per_page: Some(per_page), total: Some(total), ..Default::default() };
    Json(json!({ "status": "success", "data": data, "meta": meta }))
}
