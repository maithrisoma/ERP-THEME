/**
 * Tenant model + customization layer.
 *
 * Everything a tenant can reshape without code lives here: branding, locale,
 * fiscal setup, the enabled-module set, feature-flag overrides, and — crucially
 * for "fully configurable" — custom field definitions and workflow/automation
 * definitions that the HR module renders dynamically.
 */
import type { TierId, FeatureKey } from "./packages";
import type { ModuleKey } from "./rbac";

export type FieldType =
  | "text" | "textarea" | "number" | "currency" | "date"
  | "select" | "multiselect" | "boolean" | "email" | "phone" | "file";

export interface CustomFieldDef {
  id: string;
  module: ModuleKey;
  entity: string; // e.g. "employee"
  key: string; // machine name
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // for select/multiselect
  group?: string; // UI grouping
  helpText?: string;
  visibleToRoles?: string[]; // optional ABAC visibility
}

export type TriggerEvent =
  | "employee.created" | "employee.terminated" | "leave.requested"
  | "leave.approved" | "timesheet.submitted" | "payroll.finalized"
  | "review.due" | "document.expiring" | "onboarding.stage_changed";

export interface WorkflowStep {
  kind: "approval" | "notify" | "assign_task" | "webhook" | "set_field";
  config: Record<string, unknown>;
}

export interface WorkflowDef {
  id: string;
  name: string;
  module: ModuleKey;
  trigger: TriggerEvent;
  enabled: boolean;
  steps: WorkflowStep[];
}

export interface LeavePolicy {
  id: string;
  name: string;
  accrualPerYear: number; // days
  carryOverMax: number;
  unit: "days" | "hours";
  paid: boolean;
}

export interface TenantBranding {
  productName: string;
  companyName: string;
  primary: string; // hex
  accent: string; // hex
  logoMonogram: string;
}

export interface TenantConfig {
  id: string;
  tier: TierId;
  branding: TenantBranding;
  locale: string;
  timezone: string;
  currency: string;
  weekStartsOn: 0 | 1;
  fiscalYearStartMonth: number; // 1-12
  payCycle: "weekly" | "biweekly" | "semimonthly" | "monthly";
  country: string;
  enabledModules: ModuleKey[];
  /** explicit overrides on top of the tier defaults (admin toggles) */
  featureOverrides: Partial<Record<FeatureKey, boolean>>;
  leavePolicies: LeavePolicy[];
  customFields: CustomFieldDef[];
  workflows: WorkflowDef[];
}

/** Effective feature flag = tier default unless explicitly overridden by admin. */
export function effectiveFeature(
  cfg: Pick<TenantConfig, "tier" | "featureOverrides">,
  feature: FeatureKey,
  tierHas: (t: TierId, f: FeatureKey) => boolean,
): boolean {
  const override = cfg.featureOverrides[feature];
  if (typeof override === "boolean") return override;
  return tierHas(cfg.tier, feature);
}
