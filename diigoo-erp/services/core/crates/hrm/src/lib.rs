//! HRM (M13) module crate.
//!
//! Self-contained: it exposes an Axum `Router` over the shared DB pool and can
//! be mounted by the gateway alongside other modules, or driven on its own in
//! integration tests. All reads/writes go through Postgres with RLS scoping.
pub mod models;
pub mod repo;
pub mod routes;

pub use routes::router;
