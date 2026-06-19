import type { RoleId } from "./rbac";

/**
 * Role-based dashboard policy. Dashboards are reserved for managerial,
 * administrative, analytical and decision-making roles. Operational roles land
 * directly on their working module/workspace instead of a KPI dashboard.
 */
export const DASHBOARD_ROLES: RoleId[] = [
  "super_admin",
  "owner",
  "regional_manager",
  "store_manager",
  "assistant_manager",
  "hr_manager",
  "accountant",
  "auditor",
  "franchise_partner",
];

export function hasDashboard(role: RoleId): boolean {
  return DASHBOARD_ROLES.includes(role);
}

export type DashKind = "executive" | "hr" | "manager" | "finance" | "audit";

/** Tailors greeting, emphasis and available actions on the shared dashboard. */
export function dashboardKind(role: RoleId): DashKind {
  switch (role) {
    case "owner":
    case "super_admin":
    case "regional_manager":
    case "franchise_partner":
      return "executive";
    case "hr_manager":
      return "hr";
    case "accountant":
      return "finance";
    case "auditor":
      return "audit";
    default:
      return "manager";
  }
}

export const DASH_KIND_LABEL: Record<DashKind, string> = {
  executive: "Executive overview",
  hr: "People operations",
  manager: "Store overview",
  finance: "Finance & payroll",
  audit: "Audit (read-only)",
};
