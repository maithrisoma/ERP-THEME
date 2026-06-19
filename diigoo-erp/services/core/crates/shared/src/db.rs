//! PostgreSQL connection pool + per-request tenant scoping.
//!
//! Multi-tenancy is enforced with Row-Level Security: every connection that
//! serves a request sets `app.current_tenant`, and RLS policies filter every
//! table by it (see db/migrations). This is exactly the model described in the
//! document's "Multi-tenancy & data isolation" page.
use sqlx::postgres::{PgPool, PgPoolOptions};

#[derive(Clone)]
pub struct Db {
    pub pool: PgPool,
}

impl Db {
    pub async fn connect(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = PgPoolOptions::new()
            .max_connections(20)
            .connect(database_url)
            .await?;
        Ok(Self { pool })
    }

    /// Acquire a connection with the tenant GUC set so RLS applies.
    ///
    /// `is_local = false` (session scope) is required: SQLx runs each query in
    /// its own autocommit transaction, so a transaction-local GUC would be gone
    /// before the next statement. Every request re-sets this before querying, so
    /// a pooled connection can't leak another tenant's scope.
    pub async fn tenant_conn(
        &self,
        tenant_id: &str,
    ) -> Result<sqlx::pool::PoolConnection<sqlx::Postgres>, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query("SELECT set_config('app.current_tenant', $1, false)")
            .bind(tenant_id)
            .execute(&mut *conn)
            .await?;
        Ok(conn)
    }
}
