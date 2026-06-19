//! Error type that serialises to the document's standard error envelope.
use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("{0}")]
    NotFound(String),
    #[error("{0}")]
    Validation(String),
    #[error("forbidden: {0}")]
    Forbidden(String),
    #[error("unauthorized")]
    Unauthorized,
    #[error("conflict: {0}")]
    Conflict(String),
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error("{0}")]
    Internal(String),
}

pub type ApiResult<T> = Result<T, ApiError>;

impl ApiError {
    fn parts(&self) -> (StatusCode, &'static str) {
        match self {
            ApiError::NotFound(_) => (StatusCode::NOT_FOUND, "NOT_FOUND"),
            ApiError::Validation(_) => (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_ERROR"),
            ApiError::Forbidden(_) => (StatusCode::FORBIDDEN, "FORBIDDEN"),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
            ApiError::Conflict(_) => (StatusCode::CONFLICT, "CONFLICT"),
            ApiError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "DB_ERROR"),
            ApiError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL"),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code) = self.parts();
        if let ApiError::Database(ref e) = self {
            tracing::error!(error = %e, "database error");
        }
        let body = json!({
            "status": "error",
            "error": { "code": code, "message": self.to_string() },
            "meta": { "request_id": uuid::Uuid::new_v4().to_string() }
        });
        (status, Json(body)).into_response()
    }
}
