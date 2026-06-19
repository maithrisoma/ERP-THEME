"use client";
import * as React from "react";
import Link from "next/link";
import {
  Building2, Boxes, Flag, Sparkles, Save, Palette, Globe, Clock, Coins,
  ShieldCheck, ArrowUpRight, Check, type LucideIcon,
} from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { TIERS, type FeatureKey, type TierId, hasFeature, requiredTier } from "@/platform/packages";
import type { ModuleKey } from "@/platform/rbac";
import {
  Card, CardHeader, PageHeader, Button, Tag, SectionLabel, type Tone,
} from "@/components/ui/primitives";
import { Field, Input, Select, Toggle } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { RoleGate } from "@/components/ui/gate";

type TabId = "organization" | "modules" | "features" | "plan";

const TABS = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "modules", label: "Modules", icon: Boxes },
  { id: "features", label: "Feature flags", icon: Flag },
  { id: "plan", label: "Plan", icon: Sparkles },
];

const MODULES: { key: ModuleKey; name: string }[] = [
  { key: "hr", name: "Human Resources" },
  { key: "sales_crm", name: "Sales & CRM" },
  { key: "ai_analytics", name: "AI Analytics" },
  { key: "integrations", name: "Integrations" },
  { key: "system_admin", name: "System Admin" },
  { key: "finance", name: "Finance" },
  { key: "inventory", name: "Inventory" },
  { key: "pos", name: "POS" },
];

const HR_FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "hr.core", label: "Core HR" },
  { key: "hr.payroll", label: "Payroll" },
  { key: "hr.attendance", label: "Attendance" },
  { key: "hr.scheduling", label: "Scheduling" },
  { key: "hr.advanced_scheduling_ai", label: "AI scheduling" },
  { key: "hr.leave", label: "Leave management" },
  { key: "hr.benefits", label: "Benefits" },
  { key: "hr.performance", label: "Performance" },
  { key: "hr.recruitment", label: "Recruitment" },
  { key: "hr.onboarding", label: "Onboarding" },
  { key: "hr.documents", label: "Documents" },
  { key: "hr.compliance", label: "Compliance" },
  { key: "hr.org_chart", label: "Org chart" },
  { key: "hr.custom_fields", label: "Custom fields" },
  { key: "hr.workflows", label: "Workflows" },
  { key: "hr.self_service", label: "Self-service" },
];

const PLATFORM_FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "platform.multi_location", label: "Multi-location" },
  { key: "platform.sso", label: "Single sign-on" },
  { key: "platform.audit_export", label: "Audit export" },
  { key: "platform.custom_branding", label: "Custom branding" },
  { key: "platform.ai_insights", label: "AI insights" },
  { key: "platform.api_inbound", label: "Inbound API" },
  { key: "platform.api_outbound", label: "Outbound API" },
  { key: "platform.webhooks", label: "Webhooks" },
  { key: "platform.oauth_clients", label: "OAuth clients" },
  { key: "platform.sandbox_keys", label: "Sandbox keys" },
  { key: "platform.dedicated_models", label: "Dedicated models" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PAY_CYCLES: { id: string; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Bi-weekly" },
  { id: "semimonthly", label: "Semi-monthly" },
  { id: "monthly", label: "Monthly" },
];

const TIER_TONE: Record<TierId, Tone> = {
  starter: "gray", growth: "blue", business: "orange", enterprise: "navy",
};

export default function SettingsPage() {
  return (
    <RoleGate module="system_admin">
      <SettingsScreen />
    </RoleGate>
  );
}

function SettingsScreen() {
  const [tab, setTab] = React.useState<TabId>("organization");
  return (
    <>
      <PageHeader
        eyebrow="Platform · Configuration"
        title="System settings"
        description="Branding, locale, modules, feature flags and your subscription plan — everything a tenant can reshape without code."
      />
      <Tabs tabs={TABS} value={tab} onChange={(id) => setTab(id as TabId)} className="mb-5" />
      {tab === "organization" && <OrganizationTab />}
      {tab === "modules" && <ModulesTab />}
      {tab === "features" && <FeatureFlagsTab />}
      {tab === "plan" && <PlanTab />}
    </>
  );
}

// ─── Organization ──────────────────────────────────────────────────────────────
function OrganizationTab() {
  const tenant = useSession((s) => s.tenant);
  const [form, setForm] = React.useState({
    companyName: tenant.branding.companyName,
    productName: tenant.branding.productName,
    logoMonogram: tenant.branding.logoMonogram,
    primary: tenant.branding.primary,
    accent: tenant.branding.accent,
    locale: tenant.locale,
    timezone: tenant.timezone,
    currency: tenant.currency,
    weekStartsOn: String(tenant.weekStartsOn),
    fiscalYearStartMonth: String(tenant.fiscalYearStartMonth),
    payCycle: tenant.payCycle as string,
    country: tenant.country,
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [saved, setSaved] = React.useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Branding" description="How the product presents itself across the workspace." icon={Building2} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company name" required>
            <Input value={form.companyName} onChange={(e) => set("companyName")(e.target.value)} />
          </Field>
          <Field label="Product name" required>
            <Input value={form.productName} onChange={(e) => set("productName")(e.target.value)} />
          </Field>
          <Field label="Logo monogram" hint="Two letters shown in the sidebar mark.">
            <Input value={form.logoMonogram} maxLength={3} onChange={(e) => set("logoMonogram")(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={(e) => set("country")(e.target.value)} />
          </Field>
          <Field label="Primary color">
            <ColorField value={form.primary} onChange={set("primary")} />
          </Field>
          <Field label="Accent color">
            <ColorField value={form.accent} onChange={set("accent")} />
          </Field>
        </div>

        <SectionLabel>Locale &amp; finance</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Locale">
            <Select value={form.locale} onChange={(e) => set("locale")(e.target.value)}>
              {["en-US", "en-GB", "fr-FR", "de-DE", "es-ES", "hi-IN"].map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Timezone">
            <Select value={form.timezone} onChange={(e) => set("timezone")(e.target.value)}>
              {["America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Kolkata"].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={(e) => set("currency")(e.target.value)}>
              {["USD", "EUR", "GBP", "INR", "CAD", "AUD"].map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Week starts on">
            <Select value={form.weekStartsOn} onChange={(e) => set("weekStartsOn")(e.target.value)}>
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
            </Select>
          </Field>
          <Field label="Fiscal year starts">
            <Select value={form.fiscalYearStartMonth} onChange={(e) => set("fiscalYearStartMonth")(e.target.value)}>
              {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Pay cycle">
            <Select value={form.payCycle} onChange={(e) => set("payCycle")(e.target.value)}>
              {PAY_CYCLES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-line pt-4">
          {saved && <span className="flex items-center gap-1.5 text-xs font-semibold text-green"><Check size={14} /> Settings saved</span>}
          <Button variant="primary" icon={Save} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }}>Save changes</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Preview" description="Live reflection of branding values." icon={Palette} />
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: form.primary }}
          >
            {form.logoMonogram || "—"}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-bold text-navy">{form.productName || "Product name"}</div>
            <div className="truncate text-2xs text-ink-3">{form.companyName || "Company name"}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2.5 border-t border-line pt-3 text-xs">
          <PreviewRow icon={Palette} label="Primary" value={<Swatch hex={form.primary} />} />
          <PreviewRow icon={Palette} label="Accent" value={<Swatch hex={form.accent} />} />
          <PreviewRow icon={Globe} label="Locale" value={<span className="font-mono text-ink-2">{form.locale}</span>} />
          <PreviewRow icon={Clock} label="Timezone" value={<span className="font-mono text-ink-2">{form.timezone}</span>} />
          <PreviewRow icon={Coins} label="Currency" value={<span className="font-mono text-ink-2">{form.currency}</span>} />
          <PreviewRow icon={Coins} label="Pay cycle" value={<span className="text-ink-2">{PAY_CYCLES.find((p) => p.id === form.payCycle)?.label ?? form.payCycle}</span>} />
        </div>
      </Card>
    </div>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-1"
        aria-label="Color picker"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono uppercase" />
    </div>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-4 w-4 rounded border border-line" style={{ backgroundColor: hex }} />
      <span className="font-mono text-ink-2">{hex.toUpperCase()}</span>
    </span>
  );
}

function PreviewRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-ink-3"><Icon size={13} />{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

// ─── Modules ────────────────────────────────────────────────────────────────────
function ModulesTab() {
  const tenant = useSession((s) => s.tenant);
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(MODULES.map((m) => [m.key, tenant.enabledModules.includes(m.key)])),
  );
  const toggle = (key: ModuleKey) => (v: boolean) => setEnabled((s) => ({ ...s, [key]: v }));

  return (
    <Card padded={false}>
      <div className="p-5">
        <CardHeader title="Enabled modules" description="Turn entire product areas on or off for this tenant." icon={Boxes} />
      </div>
      <div className="divide-y divide-line border-t border-line">
        {MODULES.map((m) => {
          const inPlan = tenant.enabledModules.includes(m.key);
          return (
            <div key={m.key} className="flex items-center gap-3 px-5 py-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-navy/[.06] text-navy">
                <Boxes size={15} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-navy">{m.name}</div>
                <div className="font-mono text-2xs text-ink-3">{m.key}</div>
              </div>
              {inPlan ? (
                <Tag tone="teal">in plan</Tag>
              ) : (
                <Tag tone="gray">add-on</Tag>
              )}
              <Toggle checked={!!enabled[m.key]} onChange={toggle(m.key)} label={`Enable ${m.name}`} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Feature flags ──────────────────────────────────────────────────────────────
function FeatureFlagsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <FeatureGroup title="Human Resources" description="Capabilities within the HR module." features={HR_FEATURES} />
      <FeatureGroup title="Platform" description="Cross-cutting platform capabilities." features={PLATFORM_FEATURES} />
    </div>
  );
}

function FeatureGroup({ title, description, features }: { title: string; description: string; features: { key: FeatureKey; label: string }[] }) {
  return (
    <Card padded={false}>
      <div className="p-5">
        <CardHeader title={title} description={description} icon={Flag} />
      </div>
      <div className="divide-y divide-line border-t border-line">
        {features.map((f) => <FeatureRow key={f.key} featureKey={f.key} label={f.label} />)}
      </div>
    </Card>
  );
}

function FeatureRow({ featureKey, label }: { featureKey: FeatureKey; label: string }) {
  const on = useSession((s) => s.feature(featureKey));
  const toggleFeature = useSession((s) => s.toggleFeature);
  const tier = useSession((s) => s.tenant.tier);
  const override = useSession((s) => s.tenant.featureOverrides[featureKey]);

  const tierDefault = hasFeature(tier, featureKey);
  const isOverridden = typeof override === "boolean";

  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-navy">{label}</div>
        <div className="flex items-center gap-1.5 font-mono text-2xs text-ink-3">
          {featureKey}
          {isOverridden && <Tag tone="amber">override</Tag>}
        </div>
      </div>
      <span className="hidden text-2xs text-ink-3 sm:block">
        Default {tierDefault ? <span className="font-semibold text-green">on</span> : <span className="font-semibold text-ink-3">off</span>}
        {!tierDefault && <span className="ml-1 text-ink-3">({TIERS[requiredTier(featureKey)].name}+)</span>}
      </span>
      <Toggle checked={on} onChange={(v) => toggleFeature(featureKey, v)} label={`Toggle ${label}`} />
    </div>
  );
}

// ─── Plan ───────────────────────────────────────────────────────────────────────
function PlanTab() {
  const tier = useSession((s) => s.tenant.tier);
  const def = TIERS[tier];
  const tone = TIER_TONE[tier];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title={`${def.name} plan`}
          description={def.blurb}
          icon={Sparkles}
          action={<Tag tone={tone}>Current</Tag>}
        />
        <div className="mb-4 font-mono text-2xl font-bold text-navy">{def.price}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SlaTile label="Uptime SLA" value={def.sla} />
          <SlaTile label="Max downtime" value={def.downtime} />
          <SlaTile label="RTO" value={def.rto} />
          <SlaTile label="RPO" value={def.rpo} />
          <SlaTile label="Support" value={def.support} />
          <SlaTile label="Backups" value={def.backup} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Link
            href="/packages"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-orange px-3.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Change plan <ArrowUpRight size={15} strokeWidth={2.2} />
          </Link>
          <span className="text-xs text-ink-3">Compare every tier on the packages page.</span>
        </div>
      </Card>

      <Card>
        <CardHeader title="Included features" icon={ShieldCheck} />
        <ul className="space-y-2 text-sm">
          {def.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green text-white">
                <Check size={11} strokeWidth={3} />
              </span>
              <span className="font-mono text-2xs text-ink-2">{f}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function SlaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-subtle p-3">
      <div className="text-2xs font-medium uppercase tracking-wide text-ink-3">{label}</div>
      <div className="mt-1 text-sm font-semibold text-navy">{value}</div>
    </div>
  );
}
