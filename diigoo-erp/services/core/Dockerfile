# ─── Build stage ───────────────────────────────────────────────────────────
# Latest stable Rust 1.x — recent transitive deps (time, icu) require rustc >= 1.88.
FROM rust:1-slim-bookworm AS builder
WORKDIR /build

# System deps for building (rustls = no OpenSSL needed)
RUN apt-get update && apt-get install -y pkg-config && rm -rf /var/lib/apt/lists/*

# Cache dependencies: copy manifests first
COPY Cargo.toml ./
COPY crates/shared/Cargo.toml crates/shared/Cargo.toml
COPY crates/hrm/Cargo.toml crates/hrm/Cargo.toml
COPY crates/crm/Cargo.toml crates/crm/Cargo.toml
COPY apps/gateway/Cargo.toml apps/gateway/Cargo.toml

# Now the sources
COPY crates crates
COPY apps apps

RUN cargo build --release -p gateway

# ─── Runtime stage ──────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /build/target/release/gateway /usr/local/bin/gateway
EXPOSE 8080
ENV BIND_ADDR=0.0.0.0:8080
CMD ["gateway"]
