import type { RoleId } from "./rbac";

/**
 * Role-based login accounts. These mirror the users the Rust core seeds into
 * Postgres (same emails/roles/password). Used by the login screen's quick-login
 * and by the mock-auth fallback when the backend isn't running.
 */
export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  role: RoleId;
  name: string;
  employeeId?: string;
  blurb: string;
}

export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "u_owner", email: "owner@northwind.demo", password: DEMO_PASSWORD, role: "owner", name: "Eleanor Vance", employeeId: "e_1000", blurb: "Full access across every module" },
  { id: "u_hr", email: "hr@northwind.demo", password: DEMO_PASSWORD, role: "hr_manager", name: "Marcus Hale", employeeId: "e_1001", blurb: "HR module — employees, payroll" },
  { id: "u_acct", email: "accountant@northwind.demo", password: DEMO_PASSWORD, role: "accountant", name: "Victor Almeida", employeeId: "e_1006", blurb: "Finance + payroll, no people admin" },
  { id: "u_mgr", email: "manager@northwind.demo", password: DEMO_PASSWORD, role: "store_manager", name: "James Okafor", employeeId: "e_1003", blurb: "Single store — view HR" },
  { id: "u_mkt", email: "marketing@northwind.demo", password: DEMO_PASSWORD, role: "marketing_staff", name: "Isabella Conti", blurb: "CRM, loyalty & comms only" },
  { id: "u_it", email: "itadmin@northwind.demo", password: DEMO_PASSWORD, role: "it_admin", name: "IT Administrator", blurb: "System config, no financials" },
  { id: "u_audit", email: "auditor@northwind.demo", password: DEMO_PASSWORD, role: "auditor", name: "External Auditor", blurb: "Read-only across all modules" },
  { id: "u_emp", email: "employee@northwind.demo", password: DEMO_PASSWORD, role: "employee", name: "Grace Bennett", employeeId: "e_1021", blurb: "Self-service — own profile & time off" },
  { id: "u_super", email: "super@diigoo.demo", password: DEMO_PASSWORD, role: "super_admin", name: "Platform Operator", blurb: "Platform-wide (Diigoo operator)" },
];

export const DEMO_TENANT_IDENTITY = { id: "t_diigoo_demo", name: "Northwind Retail Group", tier: "enterprise" as const };
