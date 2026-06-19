-- ════════════════════════════════════════════════════════════════════════
-- Diigoo ERP — core schema (HRM module) with multi-tenant Row-Level Security.
--
-- Tenancy model (from the architecture doc): every row carries tenant_id and
-- RLS policies filter by current_setting('app.current_tenant'). The Rust core
-- sets that GUC per connection (see shared::db::Db::tenant_conn). FORCE RLS is
-- on so even the table owner is subject to the policies.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  tier        TEXT NOT NULL DEFAULT 'starter',
  country     TEXT NOT NULL DEFAULT 'US',
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_locations (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  name       TEXT NOT NULL,
  code       TEXT NOT NULL,
  region     TEXT NOT NULL,
  city       TEXT NOT NULL,
  country    TEXT NOT NULL,
  timezone   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hr_departments (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL,
  name             TEXT NOT NULL,
  code             TEXT NOT NULL,
  cost_center      TEXT NOT NULL DEFAULT '',
  head_employee_id TEXT,
  parent_id        TEXT
);

CREATE TABLE IF NOT EXISTS hr_positions (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  title         TEXT NOT NULL,
  department_id TEXT NOT NULL,
  level         TEXT NOT NULL,
  band          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hr_employees (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL,
  employee_no       TEXT NOT NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL DEFAULT '',
  avatar_tone       TEXT NOT NULL DEFAULT 'navy',
  status            TEXT NOT NULL DEFAULT 'active',
  employment_type   TEXT NOT NULL DEFAULT 'full_time',
  position_id       TEXT NOT NULL,
  department_id     TEXT NOT NULL,
  location_id       TEXT NOT NULL,
  manager_id        TEXT,
  hire_date         DATE NOT NULL,
  termination_date  DATE,
  base_amount_cents BIGINT NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'USD',
  pay_type          TEXT NOT NULL DEFAULT 'salary',
  pay_cycle         TEXT NOT NULL DEFAULT 'biweekly',
  flsa_exempt       BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hr_employees_tenant ON hr_employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_dept ON hr_employees (department_id);

CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  employee_id   TEXT NOT NULL,
  policy_id     TEXT NOT NULL,
  policy_name   TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  days          INT NOT NULL DEFAULT 1,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by    TEXT,
  decided_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr_requisitions (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL,
  title             TEXT NOT NULL,
  department_id     TEXT NOT NULL,
  location_id       TEXT NOT NULL,
  employment_type   TEXT NOT NULL DEFAULT 'full_time',
  openings          INT NOT NULL DEFAULT 1,
  status            TEXT NOT NULL DEFAULT 'open',
  hiring_manager_id TEXT NOT NULL,
  posted_at         DATE NOT NULL,
  applicant_count   INT NOT NULL DEFAULT 0
);

-- ─── Row-Level Security ──────────────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['hr_locations','hr_departments','hr_positions','hr_employees','hr_leave_requests','hr_requisitions']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = current_setting('app.current_tenant', true))
        WITH CHECK (tenant_id = current_setting('app.current_tenant', true))
    $f$, t);
  END LOOP;
END $$;

-- ─── Application role ─────────────────────────────────────────────────────
-- The Rust core connects as this NON-superuser role so FORCE'd RLS actually
-- applies at runtime (superusers bypass RLS). Seed runs as the superuser owner.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'diigoo_app') THEN
    CREATE ROLE diigoo_app LOGIN PASSWORD 'diigoo_app';
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO diigoo_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO diigoo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO diigoo_app;
