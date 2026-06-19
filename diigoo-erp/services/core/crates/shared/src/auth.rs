//! JWT issuing/verification + password hashing. Used by the auth crate to mint
//! tokens at login and by `RequestCtx` to verify them on every request.
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,            // user id
    pub tid: String,            // tenant id
    pub role: String,           // role id
    pub eid: Option<String>,    // linked employee id
    pub name: String,
    pub exp: usize,
    pub iss: String,
}

#[allow(clippy::too_many_arguments)]
pub fn issue(
    secret: &str,
    issuer: &str,
    user_id: &str,
    tenant: &str,
    role: &str,
    eid: Option<String>,
    name: &str,
    hours: i64,
) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = (Utc::now() + Duration::hours(hours)).timestamp() as usize;
    let claims = Claims {
        sub: user_id.to_string(),
        tid: tenant.to_string(),
        role: role.to_string(),
        eid,
        name: name.to_string(),
        exp,
        iss: issuer.to_string(),
    };
    encode(&Header::new(Algorithm::HS256), &claims, &EncodingKey::from_secret(secret.as_bytes()))
}

pub fn verify(secret: &str, issuer: &str, token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let mut v = Validation::new(Algorithm::HS256);
    v.set_issuer(&[issuer]);
    let data = decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &v)?;
    Ok(data.claims)
}

pub fn hash_password(pw: &str) -> Result<String, bcrypt::BcryptError> {
    bcrypt::hash(pw, 10)
}

pub fn verify_password(pw: &str, hash: &str) -> bool {
    bcrypt::verify(pw, hash).unwrap_or(false)
}

/// Read signing config from env (single source of truth for issuer/secret).
pub fn jwt_env() -> (String, String) {
    (
        std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-only-change-me".into()),
        std::env::var("JWT_ISSUER").unwrap_or_else(|_| "diigoo-erp".into()),
    )
}
