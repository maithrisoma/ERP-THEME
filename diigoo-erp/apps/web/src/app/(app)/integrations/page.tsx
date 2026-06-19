"use client";
import * as React from "react";
import {
  Plug, KeyRound, ShieldCheck, Webhook, Plus, Copy, Check, ArrowUpRight, ArrowDownLeft,
  ArrowLeftRight, Trash2, AlertTriangle, Lock, RefreshCw, type LucideIcon,
} from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import {
  CONNECTOR_CATALOG, SCOPE_CATALOG, WEBHOOK_EVENTS,
  type ConnectorDef, type Direction, type AuthKind, type Scope,
  type ApiKey, type OAuthClient, type WebhookEndpoint, type WebhookEvent,
} from "@/platform/integrations";
import {
  PageHeader, Card, Button, Tag, SectionLabel, type Tone,
} from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/overlay";
import { Field, Input, Select, Checkbox } from "@/components/ui/form";
import { FeatureGate, RoleGate } from "@/components/ui/gate";
import { fmtDate } from "@/modules/hrm/ui";

// ─── Local tone maps (static — never build class names dynamically) ──────────
const DIRECTION_TONE: Record<Direction, Tone> = { outbound: "blue", inbound: "purple", bidirectional: "teal" };
const DIRECTION_LABEL: Record<Direction, string> = { outbound: "Outbound", inbound: "Inbound", bidirectional: "Bidirectional" };
const DIRECTION_ICON: Record<Direction, LucideIcon> = { outbound: ArrowUpRight, inbound: ArrowDownLeft, bidirectional: ArrowLeftRight };
const AUTH_LABEL: Record<AuthKind, string> = { oauth2: "OAuth 2.0", api_key: "API key", basic: "Basic auth", csv: "CSV import" };
const ENV_TONE: Record<"production" | "sandbox", Tone> = { production: "navy", sandbox: "amber" };
const KEY_STATUS_TONE: Record<ApiKey["status"], Tone> = { active: "green", revoked: "coral" };
const CLIENT_STATUS_TONE: Record<OAuthClient["status"], Tone> = { active: "green", disabled: "gray" };
const GRANT_LABEL: Record<OAuthClient["grantType"], string> = { client_credentials: "Client credentials", authorization_code: "Authorization code" };
const HOOK_STATUS_TONE: Record<WebhookEndpoint["status"], Tone> = { active: "green", paused: "gray", failing: "coral" };

const SCOPE_LABEL = (s: Scope) => SCOPE_CATALOG.find((c) => c.scope === s)?.label ?? s;

type TabId = "connectors" | "keys" | "oauth" | "webhooks";

// ─── Seed samples (local, client-side state) ─────────────────────────────────
const CONNECTED_IDS = new Set(["adp", "okta", "slack"]);

const SEED_KEYS: ApiKey[] = [
  { id: "k1", name: "Production sync (Gusto)", prefix: "dk_live_a1b2", lastFour: "a1b2", scopes: ["hr.payroll:read", "hr.employees:read"], environment: "production", rateLimitPerMin: 600, createdAt: "2026-02-14", createdBy: "HR Manager", lastUsedAt: "2026-06-12", status: "active" },
  { id: "k2", name: "Reporting warehouse", prefix: "dk_live_9f3c", lastFour: "9f3c", scopes: ["hr.reports:read", "hr.attendance:read", "hr.leave:read"], environment: "production", rateLimitPerMin: 120, createdAt: "2026-03-02", createdBy: "IT Admin", lastUsedAt: "2026-06-11", status: "active" },
  { id: "k3", name: "Sandbox integration test", prefix: "dk_test_44de", lastFour: "44de", scopes: ["hr.employees:read"], environment: "sandbox", rateLimitPerMin: 60, createdAt: "2026-05-20", createdBy: "IT Admin", lastUsedAt: "2026-06-09", status: "active" },
  { id: "k4", name: "Legacy ATS bridge", prefix: "dk_live_07ab", lastFour: "07ab", scopes: ["hr.employees:read", "hr.documents:read"], environment: "production", rateLimitPerMin: 300, createdAt: "2025-11-08", createdBy: "HR Manager", lastUsedAt: "2026-01-30", status: "revoked" },
];

const SEED_CLIENTS: OAuthClient[] = [
  { id: "c1", name: "Okta SCIM provisioning", clientId: "cid_8f21d4ac90", grantType: "client_credentials", scopes: ["hr.employees:read", "hr.employees:write"], createdAt: "2026-01-22", status: "active" },
  { id: "c2", name: "Partner analytics portal", clientId: "cid_3b77e0fa12", grantType: "authorization_code", scopes: ["hr.reports:read", "hr.attendance:read"], redirectUris: ["https://partner.example.com/oauth/callback"], createdAt: "2026-04-10", status: "active" },
];

const SEED_HOOKS: WebhookEndpoint[] = [
  { id: "w1", url: "https://hooks.northwind.demo/v1/hr-events", events: ["employee.created", "employee.updated", "employee.terminated", "leave.approved"], secretLastFour: "c4e1", status: "active", createdAt: "2026-02-01", lastDeliveryAt: "2026-06-12", successRate: 0.998 },
  { id: "w2", url: "https://payroll-bridge.northwind.demo/ingest", events: ["payroll.finalized", "timesheet.submitted"], secretLastFour: "9a02", status: "active", createdAt: "2026-03-15", lastDeliveryAt: "2026-06-11", successRate: 0.961 },
  { id: "w3", url: "https://legacy.partner.example/webhook", events: ["leave.requested", "leave.rejected", "document.expiring"], secretLastFour: "1d77", status: "failing", createdAt: "2026-05-05", lastDeliveryAt: "2026-06-08", successRate: 0.612 },
];

const TABS = [
  { id: "connectors", label: "Connectors", icon: Plug },
  { id: "keys", label: "API Keys", icon: KeyRound },
  { id: "oauth", label: "OAuth Clients", icon: ShieldCheck },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
];

export default function IntegrationsPage() {
  const [tab, setTab] = React.useState<TabId>("connectors");

  return (
    <RoleGate module="integrations">
      <PageHeader
        eyebrow="Platform · Integrations"
        title="Integrations & API"
        description="Connect to any provider (outbound) and let providers call our API (inbound) — every grant is scoped and permissioned."
      />

      <Tabs tabs={TABS} value={tab} onChange={(v) => setTab(v as TabId)} className="mb-5" />

      {tab === "connectors" && <ConnectorsTab />}
      {tab === "keys" && <ApiKeysTab />}
      {tab === "oauth" && <OAuthTab />}
      {tab === "webhooks" && <WebhooksTab />}
    </RoleGate>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Connectors
// ════════════════════════════════════════════════════════════════════════════
function ConnectorsTab() {
  const [consent, setConsent] = React.useState<ConnectorDef | null>(null);
  const [connected, setConnected] = React.useState<Set<string>>(() => new Set(CONNECTED_IDS));

  const categories = React.useMemo(() => {
    const map = new Map<string, ConnectorDef[]>();
    for (const c of CONNECTOR_CATALOG) {
      const arr = map.get(c.category) ?? [];
      arr.push(c);
      map.set(c.category, arr);
    }
    return [...map.entries()];
  }, []);

  const authorize = (id: string) => {
    setConnected((prev) => new Set(prev).add(id));
    setConsent(null);
  };

  return (
    <>
      <FeatureGate feature="platform.api_outbound" soft>
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-blue/30 bg-blue/[.04] px-4 py-3 text-sm text-ink-2">
          <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-blue" />
          <span>
            <strong className="text-navy">Outbound connectors</strong> push data to external providers. Each one requests
            explicit permission scopes on a consent screen before any data leaves the platform.
          </span>
        </div>
      </FeatureGate>

      {categories.map(([category, items]) => (
        <div key={category} className="mb-5">
          <SectionLabel>{category}</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => {
              const isConnected = connected.has(c.id);
              const DirIcon = DIRECTION_ICON[c.direction];
              return (
                <Card key={c.id} className="flex flex-col">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy/[.06] font-mono text-sm font-bold text-navy">
                      {c.logoMonogram}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-navy">{c.name}</h3>
                        {isConnected && <Tag tone="green">Connected</Tag>}
                      </div>
                      <p className="text-2xs uppercase tracking-wide text-ink-3">{c.category}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs text-ink-3">{c.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Tag tone={DIRECTION_TONE[c.direction]}>
                      <DirIcon size={11} className="mr-1 inline" />{DIRECTION_LABEL[c.direction]}
                    </Tag>
                    <Tag tone="gray">{AUTH_LABEL[c.auth]}</Tag>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-2xs text-ink-3">{c.requiredScopes.length} scope{c.requiredScopes.length === 1 ? "" : "s"}</span>
                    {isConnected ? (
                      <Button size="sm" variant="ghost" icon={Check} disabled>Connected</Button>
                    ) : (
                      <Button size="sm" variant="outline" icon={Plug} onClick={() => setConsent(c)}>Connect</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Consent / authorization modal */}
      <Modal
        open={!!consent}
        onClose={() => setConsent(null)}
        title={consent ? `Connect ${consent.name}` : undefined}
        description="Review the permissions this connector requests before authorizing."
        size="md"
        footer={
          consent && (
            <>
              <Button variant="ghost" onClick={() => setConsent(null)}>Cancel</Button>
              <Button variant="primary" icon={ShieldCheck} onClick={() => authorize(consent.id)}>Authorize & connect</Button>
            </>
          )
        }
      >
        {consent && (
          <div>
            <div className="flex items-center gap-3 rounded-md bg-subtle px-3 py-2.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy/[.06] font-mono text-sm font-bold text-navy">{consent.logoMonogram}</span>
              <div>
                <div className="text-sm font-bold text-navy">{consent.name}</div>
                <div className="mt-0.5 flex gap-1.5">
                  <Tag tone={DIRECTION_TONE[consent.direction]}>{DIRECTION_LABEL[consent.direction]}</Tag>
                  <Tag tone="gray">{AUTH_LABEL[consent.auth]}</Tag>
                </div>
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs text-ink-2">
              <Lock size={13} className="mt-0.5 shrink-0 text-ink-3" />
              <span><strong className="text-navy">{consent.name}</strong> is requesting the following permission scopes. Authorizing grants this provider scoped access — you can revoke it at any time.</span>
            </p>

            <ul className="mt-3 divide-y divide-line rounded-md border border-line">
              {consent.requiredScopes.map((s) => (
                <li key={s} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm text-ink-2">
                    <ShieldCheck size={14} className="shrink-0 text-teal" />
                    {SCOPE_LABEL(s)}
                  </div>
                  <code className="font-mono text-2xs text-ink-3">{s}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// API Keys (inbound)
// ════════════════════════════════════════════════════════════════════════════
function ApiKeysTab() {
  const session = useSession();
  const canCreate = session.can("create", "integrations");
  const [keys, setKeys] = React.useState<ApiKey[]>(() => SEED_KEYS);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [env, setEnv] = React.useState<"production" | "sandbox">("production");
  const [scopes, setScopes] = React.useState<Set<Scope>>(() => new Set());
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const reset = () => {
    setName(""); setEnv("production"); setScopes(new Set()); setGenerated(null); setCopied(false);
  };
  const close = () => { setOpen(false); reset(); };

  const toggleScope = (s: Scope) =>
    setScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });

  const create = () => {
    const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const prefix = env === "production" ? "dk_live_" : "dk_test_";
    const fullKey = `${prefix}${rand}`;
    const lastFour = rand.slice(-4);
    const newKey: ApiKey = {
      id: `k_${Date.now()}`,
      name: name || "Untitled key",
      prefix: `${prefix}${rand.slice(0, 4)}`,
      lastFour,
      scopes: [...scopes],
      environment: env,
      rateLimitPerMin: env === "production" ? 600 : 60,
      createdAt: "2026-06-12",
      createdBy: session.principal.name,
      status: "active",
    };
    setKeys((prev) => [newKey, ...prev]);
    setGenerated(fullKey);
  };

  const revoke = (id: string) =>
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)));

  const copy = () => {
    if (generated) navigator.clipboard?.writeText(generated).catch(() => {});
    setCopied(true);
  };

  const columns: Column<ApiKey>[] = [
    { key: "name", header: "Name", accessor: (k) => k.name, render: (k) => <span className="font-semibold text-navy">{k.name}</span> },
    { key: "key", header: "Key", render: (k) => <code className="font-mono text-2xs text-ink-2">dk_live_••••{k.lastFour}</code> },
    { key: "scopes", header: "Scopes", align: "center", render: (k) => <Tag tone="blue">{k.scopes.length}</Tag> },
    { key: "env", header: "Env", render: (k) => <Tag tone={ENV_TONE[k.environment]}>{k.environment}</Tag> },
    { key: "rate", header: "Rate / min", align: "right", accessor: (k) => k.rateLimitPerMin, render: (k) => <span className="font-mono text-2xs text-ink-2">{k.rateLimitPerMin}</span> },
    { key: "used", header: "Last used", align: "right", accessor: (k) => k.lastUsedAt ?? "", render: (k) => <span className="font-mono text-2xs text-ink-3">{fmtDate(k.lastUsedAt)}</span> },
    { key: "status", header: "Status", accessor: (k) => k.status, render: (k) => <Tag tone={KEY_STATUS_TONE[k.status]}>{k.status}</Tag> },
    {
      key: "actions", header: "", align: "right", render: (k) =>
        k.status === "active" && canCreate ? (
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => revoke(k.id)}>Revoke</Button>
        ) : null,
    },
  ];

  return (
    <>
      <Card padded={false} className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-ink-2">
            <ArrowDownLeft size={16} className="mt-0.5 shrink-0 text-purple" />
            <span>Other providers use our API with scoped, permissioned keys. Keys are shown once at creation and stored hashed.</span>
          </div>
          {canCreate && <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Create API key</Button>}
        </div>
      </Card>

      <DataTable columns={columns} rows={keys} keyField={(k) => k.id} empty="No API keys yet." />

      <Modal
        open={open}
        onClose={close}
        title={generated ? "API key created" : "Create API key"}
        description={generated ? undefined : "Scope the key to only the permissions the integration needs."}
        size="md"
        footer={
          generated ? (
            <Button variant="primary" onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button variant="primary" icon={KeyRound} onClick={create} disabled={!name || scopes.size === 0}>Generate key</Button>
            </>
          )
        }
      >
        {generated ? (
          <div>
            <div className="flex items-start gap-2.5 rounded-md border border-amber/40 bg-amber/[.06] px-3 py-2.5 text-xs text-ink-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber" />
              <span>Copy this key now — for security it <strong className="text-navy">won&apos;t be shown again</strong>. Store it in your secrets manager.</span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-line bg-subtle px-3 py-2.5">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-navy">{generated}</code>
              <Button size="sm" variant="outline" icon={copied ? Check : Copy} onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Key name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production sync (Gusto)" />
            </Field>
            <Field label="Environment" required>
              <Select value={env} onChange={(e) => setEnv(e.target.value as "production" | "sandbox")}>
                <option value="production">Production</option>
                <option value="sandbox">Sandbox</option>
              </Select>
            </Field>
            <Field label="Scopes" hint="Grant only what the integration needs." required>
              <div className="grid grid-cols-1 gap-2 rounded-md border border-line p-3 sm:grid-cols-2">
                {SCOPE_CATALOG.map((s) => (
                  <Checkbox key={s.scope} checked={scopes.has(s.scope)} onChange={() => toggleScope(s.scope)} label={<span className="text-xs">{s.label} <code className="ml-1 font-mono text-2xs text-ink-3">{s.scope}</code></span>} />
                ))}
              </div>
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// OAuth Clients (inbound)
// ════════════════════════════════════════════════════════════════════════════
function OAuthTab() {
  const session = useSession();
  const canCreate = session.can("create", "integrations");
  const [clients, setClients] = React.useState<OAuthClient[]>(() => SEED_CLIENTS);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [grant, setGrant] = React.useState<OAuthClient["grantType"]>("client_credentials");
  const [scopes, setScopes] = React.useState<Set<Scope>>(() => new Set());

  const close = () => { setOpen(false); setName(""); setGrant("client_credentials"); setScopes(new Set()); };
  const toggleScope = (s: Scope) =>
    setScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });

  const register = () => {
    const newClient: OAuthClient = {
      id: `c_${Date.now()}`,
      name: name || "Untitled client",
      clientId: `cid_${Math.random().toString(16).slice(2, 12)}`,
      grantType: grant,
      scopes: [...scopes],
      createdAt: "2026-06-12",
      status: "active",
    };
    setClients((prev) => [newClient, ...prev]);
    close();
  };

  const columns: Column<OAuthClient>[] = [
    { key: "name", header: "Name", accessor: (c) => c.name, render: (c) => <span className="font-semibold text-navy">{c.name}</span> },
    { key: "clientId", header: "Client ID", render: (c) => <code className="font-mono text-2xs text-ink-2">{c.clientId}</code> },
    { key: "grant", header: "Grant type", render: (c) => <Tag tone="blue">{GRANT_LABEL[c.grantType]}</Tag> },
    { key: "scopes", header: "Scopes", align: "center", render: (c) => <Tag tone="purple">{c.scopes.length}</Tag> },
    { key: "created", header: "Created", align: "right", accessor: (c) => c.createdAt, render: (c) => <span className="font-mono text-2xs text-ink-3">{fmtDate(c.createdAt)}</span> },
    { key: "status", header: "Status", accessor: (c) => c.status, render: (c) => <Tag tone={CLIENT_STATUS_TONE[c.status]}>{c.status}</Tag> },
  ];

  return (
    <>
      <Card padded={false} className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-ink-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal" />
            <span>OAuth 2.0 clients let trusted partners authenticate machine-to-machine or on behalf of a user, bound to an explicit scope list.</span>
          </div>
          {canCreate && <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Register client</Button>}
        </div>
      </Card>

      <DataTable columns={columns} rows={clients} keyField={(c) => c.id} empty="No OAuth clients registered." />

      <Modal
        open={open}
        onClose={close}
        title="Register OAuth client"
        description="Create a confidential client bound to specific scopes."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="primary" icon={ShieldCheck} onClick={register} disabled={!name || scopes.size === 0}>Register client</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Client name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Partner analytics portal" />
          </Field>
          <Field label="Grant type" required>
            <Select value={grant} onChange={(e) => setGrant(e.target.value as OAuthClient["grantType"])}>
              <option value="client_credentials">Client credentials (machine-to-machine)</option>
              <option value="authorization_code">Authorization code (on behalf of a user)</option>
            </Select>
          </Field>
          <Field label="Scopes" hint="The client may only request scopes granted here." required>
            <div className="grid grid-cols-1 gap-2 rounded-md border border-line p-3 sm:grid-cols-2">
              {SCOPE_CATALOG.map((s) => (
                <Checkbox key={s.scope} checked={scopes.has(s.scope)} onChange={() => toggleScope(s.scope)} label={<span className="text-xs">{s.label} <code className="ml-1 font-mono text-2xs text-ink-3">{s.scope}</code></span>} />
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Webhooks (inbound notifications)
// ════════════════════════════════════════════════════════════════════════════
function WebhooksTab() {
  const session = useSession();
  const canCreate = session.can("create", "integrations");
  const [hooks, setHooks] = React.useState<WebhookEndpoint[]>(() => SEED_HOOKS);
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<Set<WebhookEvent>>(() => new Set());

  const close = () => { setOpen(false); setUrl(""); setEvents(new Set()); };
  const toggleEvent = (e: WebhookEvent) =>
    setEvents((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e); else next.add(e);
      return next;
    });

  const add = () => {
    const newHook: WebhookEndpoint = {
      id: `w_${Date.now()}`,
      url: url || "https://example.com/webhook",
      events: [...events],
      secretLastFour: Math.random().toString(16).slice(2, 6),
      status: "active",
      createdAt: "2026-06-12",
      successRate: 1,
    };
    setHooks((prev) => [newHook, ...prev]);
    close();
  };

  const columns: Column<WebhookEndpoint>[] = [
    { key: "url", header: "Endpoint URL", render: (w) => <code className="block max-w-[280px] truncate font-mono text-2xs text-ink-2">{w.url}</code> },
    { key: "events", header: "Events", align: "center", render: (w) => <Tag tone="blue">{w.events.length}</Tag> },
    { key: "status", header: "Status", accessor: (w) => w.status, render: (w) => <Tag tone={HOOK_STATUS_TONE[w.status]}>{w.status}</Tag> },
    { key: "rate", header: "Success rate", align: "right", accessor: (w) => w.successRate, render: (w) => <span className={`font-mono text-2xs ${w.successRate >= 0.95 ? "text-green" : w.successRate >= 0.8 ? "text-amber" : "text-coral"}`}>{(w.successRate * 100).toFixed(1)}%</span> },
    { key: "delivery", header: "Last delivery", align: "right", accessor: (w) => w.lastDeliveryAt ?? "", render: (w) => <span className="font-mono text-2xs text-ink-3">{fmtDate(w.lastDeliveryAt)}</span> },
  ];

  return (
    <>
      <Card padded={false} className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-ink-2">
            <Webhook size={16} className="mt-0.5 shrink-0 text-blue" />
            <span>Endpoints receive event notifications signed with <strong className="text-navy">HMAC-SHA256</strong>, delivered with automatic retries and idempotency keys.</span>
          </div>
          {canCreate && <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Add endpoint</Button>}
        </div>
      </Card>

      <DataTable columns={columns} rows={hooks} keyField={(w) => w.id} empty="No webhook endpoints configured." />

      <Modal
        open={open}
        onClose={close}
        title="Add webhook endpoint"
        description="Deliver platform events to your service."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="primary" icon={Webhook} onClick={add} disabled={!url || events.size === 0}>Add endpoint</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Endpoint URL" required hint="Must be an HTTPS URL.">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.example.com/diigoo" />
          </Field>
          <Field label="Events" required>
            <div className="grid grid-cols-1 gap-2 rounded-md border border-line p-3 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <Checkbox key={ev.id} checked={events.has(ev.id)} onChange={() => toggleEvent(ev.id)} label={<span className="text-xs">{ev.label} <code className="ml-1 font-mono text-2xs text-ink-3">{ev.id}</code></span>} />
              ))}
            </div>
          </Field>
          <div className="flex items-start gap-2.5 rounded-md border border-line bg-subtle px-3 py-2.5 text-xs text-ink-2">
            <RefreshCw size={14} className="mt-0.5 shrink-0 text-ink-3" />
            <span>Each delivery is signed with <strong className="text-navy">HMAC-SHA256</strong> using your endpoint secret. Failed deliveries retry with exponential backoff and carry an idempotency key.</span>
          </div>
        </div>
      </Modal>
    </>
  );
}
