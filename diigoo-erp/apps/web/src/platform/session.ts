"use client";
/**
 * Session store (Zustand). Populated from the real signed-in user via
 * `/api/auth/me` (see AppShell), not impersonation. The role comes from the
 * server-verified JWT, so RBAC reflects who actually logged in.
 */
import { create } from "zustand";
import { ROLES, type RoleId, type Action, type ModuleKey, can as rbacCan, accessAllows, type MatrixAccess } from "./rbac";
import { type FeatureKey, hasFeature, type TierId } from "./packages";
import type { TenantConfig } from "./tenant";
import { DEMO_TENANT } from "@/data/tenant";

export interface Principal {
  userId: string;
  name: string;
  email: string;
  primaryRole: RoleId;
  employeeId?: string;
  tenantId: string;
  tone: string;
}

export interface MeResponse {
  user: { id: string; name: string; email: string; role: string; employeeId?: string | null; tenantId: string };
  tenant: { id: string; name: string; tier: TierId };
}

const ANON: Principal = { userId: "", name: "", email: "", primaryRole: "employee", tenantId: DEMO_TENANT.id, tone: "gray" };

type Status = "loading" | "authed" | "anon";

// Plan switches are previewed live and persisted locally so they survive reloads
// (a real deployment would persist the tenant tier server-side).
const TIER_KEY = "diigoo-tier";
function savedTier(): TierId | null {
  if (typeof window === "undefined") return null;
  try {
    const t = localStorage.getItem(TIER_KEY);
    return t === "starter" || t === "growth" || t === "business" || t === "enterprise" ? t : null;
  } catch {
    return null;
  }
}

// Tenant RBAC overrides — the CEO can change any role × module permission.
// Keyed `${role}:${module}` → access level. Persisted locally (would be a tenant
// policy table server-side).
const RBAC_KEY = "diigoo-rbac";
type Overrides = Record<string, MatrixAccess>;
function savedOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(RBAC_KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}
function persistOverrides(o: Overrides) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RBAC_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

interface SessionState {
  status: Status;
  principal: Principal;
  tenant: TenantConfig;
  rbacOverrides: Overrides;
  setSession: (me: MeResponse) => void;
  clear: () => void;
  setTier: (tier: TierId) => void;
  toggleFeature: (feature: FeatureKey, value: boolean) => void;
  setRbacOverride: (role: RoleId, module: ModuleKey, access: MatrixAccess) => void;
  resetRbacOverride: (role: RoleId, module: ModuleKey) => void;
  clearRbacOverrides: () => void;
  can: (action: Action, module: ModuleKey) => boolean;
  feature: (feature: FeatureKey) => boolean;
}

export const useSession = create<SessionState>((set, get) => ({
  status: "loading",
  principal: ANON,
  tenant: DEMO_TENANT,
  rbacOverrides: savedOverrides(),
  setSession: (me) => {
    const role = me.user.role as RoleId;
    set({
      status: "authed",
      principal: {
        userId: me.user.id,
        name: me.user.name,
        email: me.user.email,
        primaryRole: role,
        employeeId: me.user.employeeId ?? undefined,
        tenantId: me.user.tenantId,
        tone: ROLES[role]?.accent ?? "navy",
      },
      // Identity + tier come from the session; branding/policies/custom-fields
      // stay as tenant config (would move to DB in a fuller build).
      tenant: {
        ...DEMO_TENANT,
        id: me.tenant.id,
        tier: savedTier() ?? me.tenant.tier,
        branding: { ...DEMO_TENANT.branding, companyName: me.tenant.name },
      },
    });
  },
  clear: () => set({ status: "anon", principal: ANON }),
  setTier: (tier) => {
    try {
      localStorage.setItem(TIER_KEY, tier);
    } catch {
      /* ignore */
    }
    set({ tenant: { ...get().tenant, tier } });
  },
  toggleFeature: (feature, value) =>
    set({ tenant: { ...get().tenant, featureOverrides: { ...get().tenant.featureOverrides, [feature]: value } } }),
  setRbacOverride: (role, module, access) => {
    const next = { ...get().rbacOverrides, [`${role}:${module}`]: access };
    persistOverrides(next);
    set({ rbacOverrides: next });
  },
  resetRbacOverride: (role, module) => {
    const next = { ...get().rbacOverrides };
    delete next[`${role}:${module}`];
    persistOverrides(next);
    set({ rbacOverrides: next });
  },
  clearRbacOverrides: () => {
    persistOverrides({});
    set({ rbacOverrides: {} });
  },
  can: (action, module) => {
    if (get().status !== "authed") return false;
    const role = get().principal.primaryRole;
    const override = get().rbacOverrides[`${role}:${module}`];
    if (override) return accessAllows(override, action);
    return rbacCan(role, action, module);
  },
  feature: (feature) => {
    const { tenant } = get();
    const override = tenant.featureOverrides[feature];
    if (typeof override === "boolean") return override;
    return hasFeature(tenant.tier, feature);
  },
}));
