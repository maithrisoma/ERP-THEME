/**
 * RBAC + ABAC engine.
 *
 * Mirrors the document's "RBAC Design" page: a 15-level role hierarchy (L0–L14)
 * and a module permission matrix. On top of the coarse module matrix we add
 * fine-grained, scope-aware permissions (the ABAC layer) so the HR module can
 * express team-scoped managers and employee self-service correctly.
 *
 * The same role ids and matrix are encoded in the Rust `shared::rbac` crate.
 */

// ─── Roles (L0–L14) ─────────────────────────────────────────────────────────
export type RoleId =
  | "super_admin"
  | "owner"
  | "regional_manager"
  | "store_manager"
  | "assistant_manager"
  | "cashier"
  | "inventory_staff"
  | "delivery_manager"
  | "delivery_driver"
  | "accountant"
  | "hr_manager"
  | "marketing_staff"
  | "it_admin"
  | "auditor"
  | "franchise_partner"
  | "employee"; // L15 — base self-service identity every worker has

export type LoginMethod =
  | "email_password"
  | "sso"
  | "pin"
  | "mobile_otp"
  | "magic_link"
  | "email_ip_allowlist";

export type MfaPolicy = "mandatory" | "recommended" | "optional" | "builtin" | "na";

export interface RoleDef {
  id: RoleId;
  level: string; // "L0" … "L15"
  label: string;
  scope: string; // human description of data scope
  scopeKind: Scope; // machine scope used by can()
  login: LoginMethod;
  mfa: MfaPolicy;
  accent: string; // tailwind color token for chips
}

export const ROLES: Record<RoleId, RoleDef> = {
  super_admin: { id: "super_admin", level: "L0", label: "Super Admin", scope: "Platform-wide (Diigoo operator)", scopeKind: "platform", login: "email_password", mfa: "mandatory", accent: "coral" },
  owner: { id: "owner", level: "L1", label: "Owner / CEO", scope: "Entire business org — all stores", scopeKind: "org", login: "sso", mfa: "mandatory", accent: "navy" },
  regional_manager: { id: "regional_manager", level: "L2", label: "Regional Manager", scope: "Multiple stores (cluster)", scopeKind: "region", login: "email_password", mfa: "mandatory", accent: "blue" },
  store_manager: { id: "store_manager", level: "L3", label: "Store Manager", scope: "Single store — full control", scopeKind: "store", login: "email_password", mfa: "recommended", accent: "teal" },
  assistant_manager: { id: "assistant_manager", level: "L4", label: "Assistant Manager", scope: "Single store — limited financial access", scopeKind: "store", login: "email_password", mfa: "optional", accent: "teal" },
  cashier: { id: "cashier", level: "L5", label: "Cashier / Store Clerk", scope: "POS terminal only", scopeKind: "self", login: "pin", mfa: "na", accent: "gray" },
  inventory_staff: { id: "inventory_staff", level: "L6", label: "Inventory Staff", scope: "Inventory module only", scopeKind: "store", login: "email_password", mfa: "optional", accent: "gray" },
  delivery_manager: { id: "delivery_manager", level: "L7", label: "Delivery Manager", scope: "Delivery module", scopeKind: "store", login: "email_password", mfa: "optional", accent: "amber" },
  delivery_driver: { id: "delivery_driver", level: "L8", label: "Delivery Driver", scope: "Own deliveries only — mobile app", scopeKind: "self", login: "mobile_otp", mfa: "builtin", accent: "amber" },
  accountant: { id: "accountant", level: "L9", label: "Accountant", scope: "Finance module — full access", scopeKind: "org", login: "email_ip_allowlist", mfa: "mandatory", accent: "green" },
  hr_manager: { id: "hr_manager", level: "L10", label: "HR Manager", scope: "HR module — employee records, payroll", scopeKind: "org", login: "email_password", mfa: "recommended", accent: "purple" },
  marketing_staff: { id: "marketing_staff", level: "L11", label: "Marketing Staff", scope: "CRM, email, loyalty modules", scopeKind: "org", login: "email_password", mfa: "optional", accent: "purple" },
  it_admin: { id: "it_admin", level: "L12", label: "IT Admin", scope: "System config — no financial data", scopeKind: "org", login: "email_password", mfa: "mandatory", accent: "navy" },
  auditor: { id: "auditor", level: "L13", label: "Auditor (Read-Only)", scope: "All modules — view only", scopeKind: "org", login: "magic_link", mfa: "mandatory", accent: "blue" },
  franchise_partner: { id: "franchise_partner", level: "L14", label: "Franchise Partner", scope: "Own franchise unit only", scopeKind: "region", login: "sso", mfa: "mandatory", accent: "orange" },
  employee: { id: "employee", level: "L15", label: "Employee (Self-Service)", scope: "Own record, payslips, time-off", scopeKind: "self", login: "email_password", mfa: "optional", accent: "gray" },
};

export const ROLE_ORDER: RoleId[] = [
  "super_admin", "owner", "regional_manager", "store_manager", "assistant_manager",
  "cashier", "inventory_staff", "delivery_manager", "delivery_driver", "accountant",
  "hr_manager", "marketing_staff", "it_admin", "auditor", "franchise_partner", "employee",
];

// ─── Module permission matrix (the doc's RBAC page) ──────────────────────────
export type ModuleKey =
  | "pos" | "inventory" | "purchasing" | "sales_crm" | "finance"
  | "lottery" | "gas_station" | "loyalty" | "delivery" | "comms"
  | "shipping" | "payments" | "hr" | "ai_analytics" | "system_admin"
  | "integrations";

/** Access level labels exactly as printed in the document's matrix. */
export type MatrixAccess =
  | "full" | "view" | "edit" | "operate" | "approve"
  | "create" | "create_approve" | "restock" | "redeem"
  | "store_level" | "fin_only" | "crm_only" | "limited" | "none";

export interface MatrixModule {
  key: ModuleKey;
  label: string;
}

export const MATRIX_MODULES: MatrixModule[] = [
  { key: "pos", label: "POS" },
  { key: "inventory", label: "Inventory" },
  { key: "purchasing", label: "Purchasing" },
  { key: "sales_crm", label: "Sales & CRM" },
  { key: "finance", label: "Finance" },
  { key: "lottery", label: "Lottery" },
  { key: "gas_station", label: "Gas Station" },
  { key: "loyalty", label: "Loyalty / CRM" },
  { key: "delivery", label: "Delivery" },
  { key: "comms", label: "Email / Comms" },
  { key: "payments", label: "Payments" },
  { key: "hr", label: "HR / Payroll" },
  { key: "ai_analytics", label: "AI Analytics" },
  { key: "system_admin", label: "System Admin" },
  { key: "integrations", label: "Integrations / API" },
];

/** Columns shown in the document matrix. */
export const MATRIX_ROLE_COLUMNS: RoleId[] = [
  "owner", "regional_manager", "store_manager", "assistant_manager", "cashier",
  "inventory_staff", "accountant", "marketing_staff", "it_admin", "auditor",
];

type Row = Partial<Record<RoleId, MatrixAccess>>;

/**
 * Full module × role matrix. Values for the 10 columns come verbatim from the
 * document; HR Manager / Delivery / Franchise / Employee columns are derived
 * from each role's documented scope so every role resolves deterministically.
 */
export const PERMISSION_MATRIX: Record<ModuleKey, Row> = {
  pos: { owner: "view", regional_manager: "view", store_manager: "full", assistant_manager: "full", cashier: "operate", inventory_staff: "none", accountant: "view", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  inventory: { owner: "view", regional_manager: "full", store_manager: "full", assistant_manager: "edit", cashier: "view", inventory_staff: "full", accountant: "view", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "view", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  purchasing: { owner: "approve", regional_manager: "approve", store_manager: "create_approve", assistant_manager: "create", cashier: "none", inventory_staff: "create", accountant: "view", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  sales_crm: { owner: "full", regional_manager: "full", store_manager: "full", assistant_manager: "edit", cashier: "view", inventory_staff: "none", accountant: "view", marketing_staff: "full", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "view", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  finance: { owner: "full", regional_manager: "view", store_manager: "view", assistant_manager: "none", cashier: "none", inventory_staff: "none", accountant: "full", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "view", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  lottery: { owner: "view", regional_manager: "view", store_manager: "full", assistant_manager: "full", cashier: "operate", inventory_staff: "none", accountant: "view", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  gas_station: { owner: "view", regional_manager: "view", store_manager: "full", assistant_manager: "full", cashier: "operate", inventory_staff: "restock", accountant: "view", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  loyalty: { owner: "full", regional_manager: "full", store_manager: "full", assistant_manager: "edit", cashier: "redeem", inventory_staff: "none", accountant: "none", marketing_staff: "full", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  delivery: { owner: "view", regional_manager: "full", store_manager: "full", assistant_manager: "view", cashier: "none", inventory_staff: "none", accountant: "none", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "full", delivery_driver: "operate", franchise_partner: "view", employee: "none", super_admin: "full" },
  comms: { owner: "full", regional_manager: "full", store_manager: "edit", assistant_manager: "none", cashier: "none", inventory_staff: "none", accountant: "none", marketing_staff: "full", it_admin: "full", auditor: "view", hr_manager: "edit", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  shipping: { owner: "view", regional_manager: "full", store_manager: "full", assistant_manager: "edit", cashier: "none", inventory_staff: "edit", accountant: "view", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "full", delivery_driver: "view", franchise_partner: "view", employee: "none", super_admin: "full" },
  payments: { owner: "full", regional_manager: "view", store_manager: "view", assistant_manager: "none", cashier: "operate", inventory_staff: "none", accountant: "full", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "none", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
  hr: { owner: "full", regional_manager: "view", store_manager: "view", assistant_manager: "none", cashier: "none", inventory_staff: "none", accountant: "full", marketing_staff: "none", it_admin: "none", auditor: "view", hr_manager: "full", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "view", super_admin: "full" },
  ai_analytics: { owner: "full", regional_manager: "full", store_manager: "store_level", assistant_manager: "store_level", cashier: "none", inventory_staff: "none", accountant: "fin_only", marketing_staff: "crm_only", it_admin: "none", auditor: "view", hr_manager: "fin_only", delivery_manager: "none", delivery_driver: "none", franchise_partner: "store_level", employee: "none", super_admin: "full" },
  system_admin: { owner: "full", regional_manager: "limited", store_manager: "limited", assistant_manager: "none", cashier: "none", inventory_staff: "none", accountant: "none", marketing_staff: "none", it_admin: "full", auditor: "view", hr_manager: "none", delivery_manager: "none", delivery_driver: "none", franchise_partner: "none", employee: "none", super_admin: "full" },
  integrations: { owner: "full", regional_manager: "view", store_manager: "view", assistant_manager: "none", cashier: "none", inventory_staff: "none", accountant: "view", marketing_staff: "edit", it_admin: "full", auditor: "view", hr_manager: "edit", delivery_manager: "none", delivery_driver: "none", franchise_partner: "view", employee: "none", super_admin: "full" },
};

// ─── Capability resolution ───────────────────────────────────────────────────
export type Action = "create" | "read" | "update" | "delete" | "approve" | "operate" | "export";
export type Scope = "platform" | "org" | "region" | "store" | "team" | "self";

const ACCESS_ACTIONS: Record<MatrixAccess, Action[]> = {
  full: ["create", "read", "update", "delete", "approve", "operate", "export"],
  edit: ["create", "read", "update", "export"],
  create: ["create", "read"],
  create_approve: ["create", "read", "approve"],
  approve: ["read", "approve", "operate"],
  operate: ["read", "operate"],
  view: ["read"],
  store_level: ["read", "export"],
  fin_only: ["read", "export"],
  crm_only: ["read", "export"],
  restock: ["read", "update", "operate"],
  redeem: ["read", "operate"],
  limited: ["read", "update"],
  none: [],
};

export function moduleAccess(role: RoleId, module: ModuleKey): MatrixAccess {
  if (role === "super_admin") return "full";
  return PERMISSION_MATRIX[module]?.[role] ?? "none";
}

export function hasModule(role: RoleId, module: ModuleKey): boolean {
  return moduleAccess(role, module) !== "none";
}

/** Coarse, module-level capability check used to gate navigation and pages. */
export function can(role: RoleId, action: Action, module: ModuleKey): boolean {
  const access = moduleAccess(role, module);
  return ACCESS_ACTIONS[access].includes(action);
}

/** Does an explicit access level grant an action? Used with tenant overrides. */
export function accessAllows(access: MatrixAccess, action: Action): boolean {
  return ACCESS_ACTIONS[access].includes(action);
}

/** Assignable levels offered in the editable matrix (simple → powerful). */
export const ASSIGNABLE_ACCESS: MatrixAccess[] = ["none", "view", "operate", "edit", "approve", "full"];

/** Friendly label for the matrix cells (matches the doc's legend). */
export const ACCESS_LABEL: Record<MatrixAccess, string> = {
  full: "Full", view: "View", edit: "Edit", operate: "Operate", approve: "Approve",
  create: "Create", create_approve: "Create/Appr", restock: "Restock", redeem: "Redeem",
  store_level: "Store-level", fin_only: "Fin only", crm_only: "CRM only", limited: "Limited", none: "—",
};

export const ACCESS_TONE: Record<MatrixAccess, "perm-full" | "perm-view" | "perm-edit" | "perm-op" | "perm-none"> = {
  full: "perm-full", edit: "perm-edit", create: "perm-edit", create_approve: "perm-edit",
  approve: "perm-op", operate: "perm-op", restock: "perm-op", redeem: "perm-op",
  view: "perm-view", store_level: "perm-edit", fin_only: "perm-edit", crm_only: "perm-edit",
  limited: "perm-edit", none: "perm-none",
};
