import type { TenantConfig } from "@/platform/tenant";

/**
 * Seeded demo tenant. In production this comes from the tenant config service
 * (Postgres, RLS-scoped). Here it powers the standalone, no-database demo.
 */
export const DEMO_TENANT: TenantConfig = {
  id: "t_diigoo_demo",
  tier: "enterprise",
  branding: {
    productName: "Unified Retail ERP",
    companyName: "Northwind Retail Group",
    primary: "#1B2A4A",
    accent: "#004680",
    logoMonogram: "NW",
  },
  locale: "en-US",
  timezone: "America/New_York",
  currency: "USD",
  weekStartsOn: 1,
  fiscalYearStartMonth: 1,
  payCycle: "biweekly",
  country: "US",
  enabledModules: [
    "pos", "inventory", "purchasing", "sales_crm", "finance", "lottery", "gas_station",
    "loyalty", "delivery", "comms", "shipping", "payments", "hr", "ai_analytics",
    "system_admin", "integrations",
  ],
  featureOverrides: {},
  leavePolicies: [
    { id: "lp_pto", name: "Paid Time Off", accrualPerYear: 20, carryOverMax: 5, unit: "days", paid: true },
    { id: "lp_sick", name: "Sick Leave", accrualPerYear: 10, carryOverMax: 0, unit: "days", paid: true },
    { id: "lp_unpaid", name: "Unpaid Leave", accrualPerYear: 0, carryOverMax: 0, unit: "days", paid: false },
  ],
  customFields: [
    { id: "cf_tshirt", module: "hr", entity: "employee", key: "tshirt_size", label: "T-shirt Size", type: "select", required: false, options: ["XS", "S", "M", "L", "XL", "XXL"], group: "Personal" },
    { id: "cf_parking", module: "hr", entity: "employee", key: "parking_spot", label: "Parking Spot", type: "text", required: false, group: "Logistics" },
    { id: "cf_emergency", module: "hr", entity: "employee", key: "emergency_contact", label: "Emergency Contact", type: "phone", required: true, group: "Personal" },
  ],
  workflows: [
    {
      id: "wf_leave_approval",
      name: "Two-step leave approval",
      module: "hr",
      trigger: "leave.requested",
      enabled: true,
      steps: [
        { kind: "approval", config: { role: "store_manager" } },
        { kind: "approval", config: { role: "hr_manager", whenDays: ">5" } },
        { kind: "notify", config: { channel: "email" } },
      ],
    },
    {
      id: "wf_onboarding",
      name: "New hire onboarding",
      module: "hr",
      trigger: "employee.created",
      enabled: true,
      steps: [
        { kind: "assign_task", config: { template: "it_provisioning" } },
        { kind: "assign_task", config: { template: "payroll_setup" } },
        { kind: "notify", config: { channel: "slack", target: "#people-ops" } },
      ],
    },
    {
      id: "wf_doc_expiry",
      name: "Document expiry reminder",
      module: "hr",
      trigger: "document.expiring",
      enabled: true,
      steps: [{ kind: "notify", config: { channel: "email", leadDays: 30 } }],
    },
  ],
};
