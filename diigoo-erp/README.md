# Diigoo ERP — Unified Retail & Commerce Platform

A modular, multi-tenant ERP platform. This repository implements the **HRM
module** end-to-end and the platform foundation (RBAC, packaging, configuration,
and the inbound/outbound API framework) that every other module (CRM, Finance,
Inventory, …) plugs into.

The UI is a faithful continuation of the *Diigoo Tech — Unified Retail & Commerce
ERP Architecture* document: same palette (navy `#1B2A4A` / orange `#FF4500` /
silver), same typography (DM Sans · DM Mono · Playfair Display), same dense,
professional density.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | **React + TypeScript** (Next.js 14 App Router) |
| Backend / BFF | **TypeScript + Next.js** route handlers (API + SSR) |
| Core services | **Rust** — Axum + SQLx + Tokio (`services/core`, one crate per module) |
| Database | **PostgreSQL** with multi-tenant Row-Level Security |
| Styling | Tailwind CSS configured with the document's design tokens |
| State | Zustand (session, role, tenant, package) |
| Monorepo | pnpm workspaces + Turborepo |

The frontend talks to a **BFF** (Next.js route handlers). The BFF has two
adapters: `mock` (seeded in-memory data — zero dependencies) and `core` (proxies
to the Rust gateway). Switch with the `DATA_ADAPTER` env var.

---

## Run it

### Option A — instant, zero dependencies (recommended first run)

```bash
pnpm install
pnpm dev
# open http://localhost:3000  → redirects to /hrm
```

Runs the full HRM web app with seeded data. No database, no Rust toolchain
needed. Use the **role switcher** and **plan switcher** in the top bar to see
RBAC and package gating change the UI live.

### Option B — full stack (Postgres + Rust core + web) via Docker

```bash
docker compose up --build
# web   → http://localhost:3000   (DATA_ADAPTER=core)
# core  → http://localhost:8080   (Rust gateway, /api/v1)
# db    → localhost:5432          (schema + seed auto-applied)
```

`db/migrations/*.sql` are applied automatically on first boot (schema + RLS +
seed). The Rust core connects as a non-superuser role so Row-Level Security is
genuinely enforced.

### Option C — local dev web app on the live backend (recommended for development)

Run Postgres + the Rust core in containers, and the web app locally with hot reload:

```bash
bash scripts/backend-up.sh     # Postgres (seeded) + Rust core on :8080
pnpm dev                       # apps/web/.env.local already points at the core
# open http://localhost:3000/hrm/employees → table shows "Live · Rust + Postgres"
bash scripts/backend-down.sh   # stop the backend; delete apps/web/.env.local for mock mode
```

The request path is **Browser → Next.js BFF (`/api/v1/*`) → Rust core (Axum) →
PostgreSQL (RLS)**. The BFF forwards the session JWT, so the Rust core enforces
RBAC (sign in as *Marketing* and the employees API returns `403`) and Postgres
RLS scopes every row to the tenant.

### Option D — fully native, no Docker (PostgreSQL + Rust on your Mac)

```bash
brew install postgresql@16 rust   # one-time
bash scripts/core.sh              # terminal 1: starts Postgres + builds/runs the Rust core on :8080
pnpm dev                          # terminal 2: the web app (apps/web/.env.local already points at :8080)
```

`scripts/core.sh` creates the `diigoo` role + `diigoo_erp` database and applies
the migrations on first run, then runs the native core. Sign in with any seeded
account (password `demo1234`) — data is read from your local PostgreSQL with
per-role scoping (Owner → whole org, Store Manager → their store, Employee →
self).

> Wired to live data today: **Employees** + **HR analytics** + **Leave** (the
> Rust endpoints that exist). Other screens still read the bundled seed; each is
> promoted to live data by adding its Rust route + Postgres table and pointing
> the screen at `useApi(...)` — same pattern as `apps/web/src/app/(app)/hrm/employees/page.tsx`.

---

## What's built

### HRM module (`/hrm`)
Dashboard · Employees (directory + full profile) · Org chart · Attendance &
timesheets · Scheduling · Leave · Payroll · Benefits · Performance · Recruitment
(ATS) · Onboarding · Documents · Compliance · Reports · HR Settings.

Employees with the **Employee** role get a self-service dashboard (their time
off, latest payslip, tasks) — the same app, a different lens.

### Platform
- **Access & Roles** (`/access`) — the 15-level role hierarchy and the module
  permission matrix, exactly as in the architecture doc.
- **Packages & Plans** (`/packages`) — Starter / Growth / Business / Enterprise
  tiers with live feature gating and a comparison matrix.
- **Integrations & API** (`/integrations`) — outbound connectors (ADP, Gusto,
  Okta, …) with scope consent; inbound scoped API keys, OAuth clients, and
  HMAC-signed webhooks. *Connect to any provider, and let providers use our API
  — all permissioned.*
- **System Settings** (`/settings`) — branding, locale, module enablement, and
  per-tenant feature-flag overrides.

### CRM (`/crm`)
A stub module proving the registry pattern: a second module composes into the
same shell, RBAC, packaging and API framework with no shell changes.

---

## How the platform requirements map to code

| Requirement | Where |
| --- | --- |
| Role-based access (15 levels) | `apps/web/src/platform/rbac.ts` + `services/core/crates/shared/src/rbac.rs` |
| Per-package tiers (configurable features) | `apps/web/src/platform/packages.ts` |
| Everything configurable / customizable | `apps/web/src/platform/tenant.ts` (custom fields, workflows, policies, branding) + `/hrm/settings`, `/settings` |
| Modules work individually **and** combined | `apps/web/src/platform/modules.ts` (registry) + `services/core` (one crate per module) |
| Connect to any external API (permissioned) | `apps/web/src/platform/integrations.ts` (outbound connectors + scopes) |
| Others use our API (permissioned) | scoped API keys + OAuth clients + webhooks in `/integrations`; envelope in `apps/web/src/lib/http.ts` |
| Multi-tenant isolation | Postgres RLS (`db/migrations/0001_init.sql`) + `shared::db::tenant_conn` |

---

## Project structure

```
diigoo-erp/
├── apps/web/                 # Next.js (React frontend + TS BFF)
│   └── src/
│       ├── app/              # routes (App Router) + /api BFF handlers
│       ├── platform/         # rbac, packages, tenant, integrations, modules, session
│       ├── modules/          # hrm/ (full) + crm/ (stub) — self-registering
│       ├── components/ui/    # design-system primitives (the doc's look)
│       └── components/layout/# topbar (role/plan switcher), sidebar, shell
├── services/core/            # Rust workspace
│   ├── crates/shared/        # error, config, db(RLS), api envelope, rbac, ctx
│   ├── crates/hrm/           # HR models, repo (SQLx), routes (Axum)
│   ├── crates/crm/           # CRM stub router
│   └── apps/gateway/         # binary mounting the module routers
├── db/migrations/            # Postgres schema (RLS) + seed
└── docker-compose.yml        # db + core + web
```

## API

REST, JSON envelope identical to the architecture doc:

```jsonc
// success
{ "status": "success", "data": { … }, "meta": { "request_id": "…", "total": 20 } }
// error
{ "status": "error", "error": { "code": "NOT_FOUND", "message": "…" }, "meta": { "request_id": "…" } }
```

Reference endpoints (served by both the TS BFF and the Rust core):
`GET /api/v1/employees`, `GET /api/v1/employees/{id}`, `GET /api/v1/analytics/hr`,
`GET /api/v1/leave-requests`, `GET /api/health`.

## Scripts

```bash
pnpm dev          # web app (mock data)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm stack:up     # docker compose up --build
```

---
© Diigoo Tech Private Limited — Confidential · Internal Use Only.
