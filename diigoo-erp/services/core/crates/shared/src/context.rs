//! Per-request identity + tenant context.
//!
//! Every protected request must carry `Authorization: Bearer <JWT>`. This
//! extractor verifies the token's signature + issuer and derives the tenant,
//! role and user from its claims — no header trust. Missing/invalid tokens are
//! rejected with 401 before any handler runs. `require()` adds the RBAC check.
use axum::{extract::FromRequestParts, http::request::Parts};
use crate::{
    auth,
    error::ApiError,
    rbac::{can, Action, Module, Role},
};

#[derive(Debug, Clone)]
pub struct RequestCtx {
    pub tenant_id: String,
    pub role: Role,
    pub user_id: String,
    pub employee_id: Option<String>,
}

impl RequestCtx {
    pub fn require(&self, action: Action, module: Module) -> Result<(), ApiError> {
        if can(self.role, action, module) {
            Ok(())
        } else {
            Err(ApiError::Forbidden(format!("role not permitted for {:?} on {:?}", action, module)))
        }
    }
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for RequestCtx
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .ok_or(ApiError::Unauthorized)?;

        let (secret, issuer) = auth::jwt_env();
        let claims = auth::verify(&secret, &issuer, token).map_err(|_| ApiError::Unauthorized)?;
        let role = Role::parse(&claims.role).ok_or(ApiError::Unauthorized)?;

        Ok(RequestCtx {
            tenant_id: claims.tid,
            role,
            user_id: claims.sub,
            employee_id: claims.eid,
        })
    }
}
