/**
 * Packaging / licensing tiers.
 *
 * The four tiers (Starter / Growth / Business / Enterprise) and their SLA, RTO,
 * RPO and pricing come from the document's "SLA & Performance" and
 * "Multi-tenancy / Backup" pages. Each tier unlocks a set of feature flags and
 * usage limits — this is the single source of truth the UI uses to gate every
 * feature, so "everything is configurable per package".
 */

export type TierId = "starter" | "growth" | "business" | "enterprise";

/** Feature flags. `true` in a tier = unlocked; gating is purely data-driven. */
export type FeatureKey =
  // HR module capabilities
  | "hr.core"
  | "hr.payroll"
  | "hr.attendance"
  | "hr.scheduling"
  | "hr.advanced_scheduling_ai"
  | "hr.leave"
  | "hr.benefits"
  | "hr.performance"
  | "hr.recruitment"
  | "hr.onboarding"
  | "hr.documents"
  | "hr.compliance"
  | "hr.org_chart"
  | "hr.custom_fields"
  | "hr.workflows"
  | "hr.self_service"
  // platform-wide capabilities
  | "platform.multi_location"
  | "platform.sso"
  | "platform.audit_export"
  | "platform.custom_branding"
  | "platform.ai_insights"
  | "platform.api_inbound"
  | "platform.api_outbound"
  | "platform.webhooks"
  | "platform.oauth_clients"
  | "platform.sandbox_keys"
  | "platform.dedicated_models";

export type LimitKey =
  | "employees"
  | "stores"
  | "api_keys"
  | "outbound_connectors"
  | "webhook_endpoints"
  | "custom_fields"
  | "automations"
  | "report_retention_days";

export interface TierDef {
  id: TierId;
  name: string;
  price: string;
  blurb: string;
  sla: string; // uptime %
  downtime: string;
  rto: string;
  rpo: string;
  support: string;
  backup: string;
  accent: "gray" | "blue" | "orange" | "navy";
  features: FeatureKey[]; // unlocked feature flags
  limits: Record<LimitKey, number>; // -1 = unlimited
}

const ALL_FEATURES: FeatureKey[] = [
  "hr.core", "hr.payroll", "hr.attendance", "hr.scheduling", "hr.advanced_scheduling_ai",
  "hr.leave", "hr.benefits", "hr.performance", "hr.recruitment", "hr.onboarding",
  "hr.documents", "hr.compliance", "hr.org_chart", "hr.custom_fields", "hr.workflows",
  "hr.self_service", "platform.multi_location", "platform.sso", "platform.audit_export",
  "platform.custom_branding", "platform.ai_insights", "platform.api_inbound",
  "platform.api_outbound", "platform.webhooks", "platform.oauth_clients",
  "platform.sandbox_keys", "platform.dedicated_models",
];

export const TIERS: Record<TierId, TierDef> = {
  starter: {
    id: "starter", name: "Starter", price: "Free",
    blurb: "Single-store essentials — free forever. Run people ops without spreadsheets.",
    sla: "99.9%", downtime: "43.8 min/mo", rto: "4h", rpo: "1h",
    support: "Email support (24h)", backup: "Daily", accent: "gray",
    features: [
      "hr.core", "hr.attendance", "hr.leave", "hr.documents", "hr.org_chart",
      "hr.recruitment", "hr.self_service", "platform.api_inbound",
    ],
    limits: { employees: 25, stores: 1, api_keys: 2, outbound_connectors: 1, webhook_endpoints: 1, custom_fields: 5, automations: 2, report_retention_days: 90 },
  },
  growth: {
    id: "growth", name: "Growth", price: "$149 / store / mo",
    blurb: "Multi-store teams — payroll, scheduling and benefits included.",
    sla: "99.95%", downtime: "21.9 min/mo", rto: "2h", rpo: "30 min",
    support: "Email + Chat (4h SLA)", backup: "6-hourly", accent: "blue",
    features: [
      "hr.core", "hr.attendance", "hr.scheduling", "hr.leave", "hr.payroll",
      "hr.benefits", "hr.documents", "hr.org_chart", "hr.recruitment", "hr.onboarding", "hr.self_service",
      "platform.multi_location", "platform.api_inbound", "platform.api_outbound",
      "platform.webhooks", "platform.audit_export",
    ],
    limits: { employees: 150, stores: 10, api_keys: 10, outbound_connectors: 5, webhook_endpoints: 10, custom_fields: 25, automations: 15, report_retention_days: 365 },
  },
  business: {
    id: "business", name: "Business", price: "$299 / store / mo",
    blurb: "Performance, recruitment and AI workforce insights at scale.",
    sla: "99.99%", downtime: "4.4 min/mo", rto: "1h", rpo: "15 min",
    support: "Phone + Chat (1h SLA)", backup: "Hourly", accent: "orange",
    features: [
      "hr.core", "hr.attendance", "hr.scheduling", "hr.advanced_scheduling_ai", "hr.leave",
      "hr.payroll", "hr.benefits", "hr.performance", "hr.recruitment", "hr.onboarding",
      "hr.documents", "hr.compliance", "hr.org_chart", "hr.custom_fields", "hr.workflows",
      "hr.self_service", "platform.multi_location", "platform.sso", "platform.audit_export",
      "platform.custom_branding", "platform.ai_insights", "platform.api_inbound",
      "platform.api_outbound", "platform.webhooks", "platform.oauth_clients",
      "platform.sandbox_keys",
    ],
    limits: { employees: 1000, stores: 50, api_keys: 50, outbound_connectors: 25, webhook_endpoints: 50, custom_fields: 100, automations: 100, report_retention_days: 1095 },
  },
  enterprise: {
    id: "enterprise", name: "Enterprise", price: "Custom pricing",
    blurb: "Unlimited scale, dedicated models, SSO and full API platform.",
    sla: "99.995%", downtime: "2.2 min/mo", rto: "30 min", rpo: "5 min",
    support: "Dedicated TAM (30 min)", backup: "Continuous WAL", accent: "navy",
    features: ALL_FEATURES,
    limits: { employees: -1, stores: -1, api_keys: -1, outbound_connectors: -1, webhook_endpoints: -1, custom_fields: -1, automations: -1, report_retention_days: -1 },
  },
};

export const TIER_ORDER: TierId[] = ["starter", "growth", "business", "enterprise"];

export function hasFeature(tier: TierId, feature: FeatureKey): boolean {
  return TIERS[tier].features.includes(feature);
}

export function limit(tier: TierId, key: LimitKey): number {
  return TIERS[tier].limits[key];
}

export function isUnlimited(tier: TierId, key: LimitKey): boolean {
  return TIERS[tier].limits[key] === -1;
}

/** Smallest tier that unlocks a feature — used for upsell prompts. */
export function requiredTier(feature: FeatureKey): TierId {
  return TIER_ORDER.find((t) => hasFeature(t, feature)) ?? "enterprise";
}
