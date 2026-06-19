import { can, type RoleId, type ModuleKey } from "./rbac";
import { ensureModulesRegistered, allModules } from "@/modules/registry";

/**
 * The landing path appropriate for a role: the first enabled business module
 * the role can read, else a platform page. So Marketing lands on CRM, IT Admin
 * on Integrations, HR roles on HR — not everyone on /hrm.
 */
export function homePathFor(role: RoleId, enabledModules: ModuleKey[]): string {
  ensureModulesRegistered();
  // All-access roles land on the cross-module launchpad.
  if (role === "owner" || role === "super_admin") return "/home";
  const mod = allModules().find((m) => enabledModules.includes(m.key) && can(role, "read", m.key));
  if (mod) return mod.basePath;
  if (can(role, "read", "integrations")) return "/integrations";
  if (can(role, "read", "system_admin")) return "/settings";
  return "/packages";
}
