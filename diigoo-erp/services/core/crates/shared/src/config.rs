//! Environment-driven configuration.
use std::env;

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub bind_addr: String,
    pub jwt_secret: String,
    pub jwt_issuer: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://diigoo:diigoo@localhost:5432/diigoo_erp".into()),
            bind_addr: env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "dev-only-change-me".into()),
            jwt_issuer: env::var("JWT_ISSUER").unwrap_or_else(|_| "diigoo-erp".into()),
        }
    }
}
