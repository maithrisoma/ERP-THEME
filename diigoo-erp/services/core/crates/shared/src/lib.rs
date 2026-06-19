//! Cross-cutting platform primitives shared by every module crate.
//!
//! Mirrors the TypeScript `platform/*` layer: error envelope, config, DB pool,
//! the API response shape, the RBAC engine and the per-request tenant context.

pub mod api;
pub mod auth;
pub mod config;
pub mod context;
pub mod db;
pub mod error;
pub mod rbac;

pub use config::AppConfig;
pub use context::RequestCtx;
pub use db::Db;
pub use error::{ApiError, ApiResult};
