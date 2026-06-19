//! Diigoo ERP core gateway.
//!
//! Composes the enabled module routers into one Axum application. Each module
//! is mounted under `/api/v1`; the same binary can run one module or many,
//! which is how the platform stays "modular — individually or combined".
use axum::{response::IntoResponse, routing::get, Json, Router};
use shared::{db::Db, AppConfig};
use std::time::Duration;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,gateway=debug,hrm=debug".into()),
        )
        .init();

    let cfg = AppConfig::from_env();
    tracing::info!(addr = %cfg.bind_addr, "starting Diigoo ERP core gateway");

    // Connect to Postgres (retry a few times so docker-compose ordering is forgiving).
    let db = connect_with_retry(&cfg.database_url, 10).await?;

    // Ensure role-based login accounts exist (idempotent).
    match auth::seed_users(&db).await {
        Ok(n) => tracing::info!(seeded = n, "ensured seed user accounts"),
        Err(e) => tracing::warn!(error = %e, "could not seed users"),
    }

    // Compose module routers. Adding a module = one more `.merge`/`.nest`.
    let api = Router::new()
        .merge(auth::router(db.clone()))
        .merge(hrm::router(db.clone()))
        .nest("/crm", crm::router(db.clone()));

    let app = Router::new()
        .route("/health", get(health))
        .route("/", get(root))
        .nest("/api/v1", api)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(&cfg.bind_addr).await?;
    tracing::info!("listening on http://{}", cfg.bind_addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn connect_with_retry(url: &str, attempts: u32) -> anyhow::Result<Db> {
    let mut last = None;
    for i in 1..=attempts {
        match Db::connect(url).await {
            Ok(db) => return Ok(db),
            Err(e) => {
                tracing::warn!(attempt = i, error = %e, "db connect failed, retrying");
                last = Some(e);
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    }
    Err(anyhow::anyhow!("could not connect to database: {:?}", last))
}

async fn health() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "success",
        "data": { "service": "diigoo-core-gateway", "status": "healthy", "modules": ["hr", "sales_crm"] }
    }))
}

async fn root() -> impl IntoResponse {
    Json(serde_json::json!({
        "service": "Diigoo ERP Core",
        "version": env!("CARGO_PKG_VERSION"),
        "docs": "/api/v1",
        "modules": { "hr": "/api/v1/employees", "crm": "/api/v1/crm/info" }
    }))
}
