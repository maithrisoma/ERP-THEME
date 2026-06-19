-- ════════════════════════════════════════════════════════════════════════
-- Authentication: real user accounts. Login is pre-tenant-context (looked up
-- by email), so this table is NOT under tenant RLS. Passwords are bcrypt-hashed
-- by the Rust core, which seeds the demo accounts on first boot.
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL,
  employee_id   TEXT,
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

-- The app role needs full DML on users (no RLS here).
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO diigoo_app;
