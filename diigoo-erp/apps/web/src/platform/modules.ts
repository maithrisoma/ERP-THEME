/**
 * Module registry — the composition layer that lets every business module
 * (HRM, CRM, …) run *individually* yet plug into one shell when *combined*.
 *
 * A module ships a manifest declaring its nav, the module permission it needs,
 * and optional per-item feature gates. The shell renders only the modules a
 * tenant has enabled and a role + package can see. Adding CRM later is a single
 * `registerModule(crmManifest)` call.
 */
import type { LucideIcon } from "@/components/icon/lucide";
import type { Action, ModuleKey, RoleId } from "./rbac";
import type { FeatureKey } from "./packages";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  module: ModuleKey;
  action?: Action; // default "read"
  feature?: FeatureKey; // optional package gate
  badge?: string;
  selfService?: boolean; // visible to the employee self-service role
  /**
   * Optional allow-list of roles this item is relevant to. When set, the item
   * is shown only to these roles (plus super_admin), on top of the module/
   * feature gates — e.g. Recruitment is meaningful only to hiring profiles,
   * not to every role that happens to have HR access (accountant, auditor…).
   */
  roles?: RoleId[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface ModuleManifest {
  key: ModuleKey;
  name: string;
  tagline: string;
  icon: LucideIcon;
  accent: string; // tailwind color token
  basePath: string;
  nav: NavGroup[];
}

const registry = new Map<ModuleKey, ModuleManifest>();

export function registerModule(manifest: ModuleManifest): void {
  registry.set(manifest.key, manifest);
}

export function allModules(): ModuleManifest[] {
  return [...registry.values()];
}

export function getModule(key: ModuleKey): ModuleManifest | undefined {
  return registry.get(key);
}
