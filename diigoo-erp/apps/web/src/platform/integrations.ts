/**
 * Integration & API framework.
 *
 * Two directions, both permissioned (the doc's "Integration Architecture" +
 * "API Design" pages):
 *
 *   OUTBOUND — we connect to any provider. Each connector declares the OAuth /
 *              API-key credentials it needs and the permission scopes a tenant
 *              must grant before data leaves the platform.
 *
 *   INBOUND  — other providers call our API. Access is via scoped API keys
 *              (UUID hash, shown once) or OAuth 2.0 client-credentials clients,
 *              each bound to an explicit scope list. Webhooks are HMAC-SHA256
 *              signed with retry + idempotency.
 */
import type { ModuleKey } from "./rbac";

// ─── Permission scopes (granular, OAuth-style) ───────────────────────────────
export type Scope = string; // e.g. "hr.employees:read", "hr.payroll:write"

export const SCOPE_CATALOG: { scope: Scope; label: string; module: ModuleKey }[] = [
  { scope: "hr.employees:read", label: "Read employee records", module: "hr" },
  { scope: "hr.employees:write", label: "Create / update employees", module: "hr" },
  { scope: "hr.payroll:read", label: "Read payroll & payslips", module: "hr" },
  { scope: "hr.payroll:write", label: "Run / adjust payroll", module: "hr" },
  { scope: "hr.attendance:read", label: "Read attendance & timesheets", module: "hr" },
  { scope: "hr.attendance:write", label: "Write attendance & clock events", module: "hr" },
  { scope: "hr.leave:read", label: "Read leave balances & requests", module: "hr" },
  { scope: "hr.leave:write", label: "Submit / approve leave", module: "hr" },
  { scope: "hr.documents:read", label: "Read employee documents", module: "hr" },
  { scope: "hr.reports:read", label: "Read HR analytics & reports", module: "hr" },
  { scope: "crm.contacts:read", label: "Read CRM contacts", module: "sales_crm" },
  { scope: "crm.contacts:write", label: "Write CRM contacts", module: "sales_crm" },
];

// ─── Outbound connector catalogue (subset focused on HR + cross-module) ──────
export type AuthKind = "oauth2" | "api_key" | "basic" | "csv";
export type Direction = "outbound" | "inbound" | "bidirectional";

export interface ConnectorDef {
  id: string;
  name: string;
  category: string;
  logoMonogram: string;
  auth: AuthKind;
  direction: Direction;
  module: ModuleKey;
  /** scopes this connector reads/writes — surfaced on the consent screen */
  requiredScopes: Scope[];
  description: string;
}

export const CONNECTOR_CATALOG: ConnectorDef[] = [
  { id: "adp", name: "ADP Workforce Now", category: "Payroll", logoMonogram: "AD", auth: "oauth2", direction: "outbound", module: "hr", requiredScopes: ["hr.payroll:read", "hr.payroll:write", "hr.employees:read"], description: "Sync payroll runs, deductions and tax filings to ADP." },
  { id: "paychex", name: "Paychex Flex", category: "Payroll", logoMonogram: "PX", auth: "oauth2", direction: "outbound", module: "hr", requiredScopes: ["hr.payroll:read", "hr.payroll:write"], description: "Bi-directional payroll and benefits synchronisation." },
  { id: "gusto", name: "Gusto", category: "Payroll", logoMonogram: "GU", auth: "oauth2", direction: "outbound", module: "hr", requiredScopes: ["hr.payroll:read", "hr.employees:read"], description: "Run payroll and manage benefits via Gusto." },
  { id: "keka", name: "Keka HR", category: "HRIS", logoMonogram: "KE", auth: "api_key", direction: "bidirectional", module: "hr", requiredScopes: ["hr.employees:read", "hr.attendance:read"], description: "HRIS sync for India operations." },
  { id: "quickbooks", name: "QuickBooks", category: "Accounting", logoMonogram: "QB", auth: "oauth2", direction: "outbound", module: "finance", requiredScopes: ["hr.payroll:read"], description: "Post payroll journals to the general ledger." },
  { id: "okta", name: "Okta", category: "Identity / SSO", logoMonogram: "OK", auth: "oauth2", direction: "inbound", module: "system_admin", requiredScopes: ["hr.employees:read"], description: "SSO + SCIM user provisioning." },
  { id: "azure_ad", name: "Microsoft Entra ID", category: "Identity / SSO", logoMonogram: "AZ", auth: "oauth2", direction: "inbound", module: "system_admin", requiredScopes: ["hr.employees:read"], description: "Single sign-on and directory sync." },
  { id: "slack", name: "Slack", category: "Comms", logoMonogram: "SL", auth: "oauth2", direction: "outbound", module: "comms", requiredScopes: ["hr.leave:read"], description: "Notify channels on approvals and onboarding events." },
  { id: "twilio", name: "Twilio", category: "Comms", logoMonogram: "TW", auth: "api_key", direction: "outbound", module: "comms", requiredScopes: ["hr.employees:read"], description: "SMS reminders for shifts and document expiry." },
];

// ─── Inbound credentials ─────────────────────────────────────────────────────
export type ConnectionStatus = "connected" | "error" | "disconnected" | "pending";

export interface OutboundConnection {
  id: string;
  connectorId: string;
  status: ConnectionStatus;
  grantedScopes: Scope[];
  connectedBy: string;
  connectedAt: string;
  lastSyncAt?: string;
  environment: "production" | "sandbox";
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string; // shown after creation, e.g. "dk_live_a1b2"
  lastFour: string;
  scopes: Scope[];
  environment: "production" | "sandbox";
  rateLimitPerMin: number;
  createdAt: string;
  createdBy: string;
  lastUsedAt?: string;
  status: "active" | "revoked";
}

export interface OAuthClient {
  id: string;
  name: string;
  clientId: string;
  grantType: "client_credentials" | "authorization_code";
  scopes: Scope[];
  redirectUris?: string[];
  createdAt: string;
  status: "active" | "disabled";
}

export type WebhookEvent =
  | "employee.created" | "employee.updated" | "employee.terminated"
  | "leave.requested" | "leave.approved" | "leave.rejected"
  | "payroll.finalized" | "timesheet.submitted" | "document.expiring";

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  secretLastFour: string; // HMAC-SHA256 signing secret tail
  status: "active" | "paused" | "failing";
  createdAt: string;
  lastDeliveryAt?: string;
  successRate: number; // 0..1 over last 24h
}

export const WEBHOOK_EVENTS: { id: WebhookEvent; label: string }[] = [
  { id: "employee.created", label: "Employee created" },
  { id: "employee.updated", label: "Employee updated" },
  { id: "employee.terminated", label: "Employee terminated" },
  { id: "leave.requested", label: "Leave requested" },
  { id: "leave.approved", label: "Leave approved" },
  { id: "leave.rejected", label: "Leave rejected" },
  { id: "payroll.finalized", label: "Payroll finalized" },
  { id: "timesheet.submitted", label: "Timesheet submitted" },
  { id: "document.expiring", label: "Document expiring" },
];
