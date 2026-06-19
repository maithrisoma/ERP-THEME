-- ════════════════════════════════════════════════════════════════════════
-- Leave balances (tenant-scoped, RLS). Leave requests already exist (0001).
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hr_leave_balances (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  policy_id   TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  accrued     INT NOT NULL DEFAULT 0,
  used        INT NOT NULL DEFAULT 0,
  pending     INT NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT 'days'
);

ALTER TABLE hr_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_balances FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON hr_leave_balances;
CREATE POLICY tenant_isolation ON hr_leave_balances
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON hr_leave_balances TO diigoo_app;

-- Seed two balances per employee.
SELECT set_config('app.current_tenant', 't_diigoo_demo', false);
INSERT INTO hr_leave_balances (id, tenant_id, employee_id, policy_id, policy_name, accrued, used, pending, unit)
SELECT 'lb_' || e.id || '_pto', 't_diigoo_demo', e.id, 'lp_pto', 'Paid Time Off', 20,
       (abs(hashtext(e.id)) % 8) + 2, 0, 'days'
FROM hr_employees e
ON CONFLICT (id) DO NOTHING;
INSERT INTO hr_leave_balances (id, tenant_id, employee_id, policy_id, policy_name, accrued, used, pending, unit)
SELECT 'lb_' || e.id || '_sick', 't_diigoo_demo', e.id, 'lp_sick', 'Sick Leave', 10,
       (abs(hashtext(e.id)) % 4), 0, 'days'
FROM hr_employees e
ON CONFLICT (id) DO NOTHING;
