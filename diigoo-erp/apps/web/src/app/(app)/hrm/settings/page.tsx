"use client";
import * as React from "react";
import {
  Settings2, Plus, ListChecks, Palmtree, Workflow, Globe2, Tags, Hash, Calendar,
  ToggleRight, Mail, Phone, FileText, AlignLeft, ChevronRight, GitBranch, Webhook,
  UserCheck, Bell, ClipboardList, type LucideIcon,
} from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import {
  PageHeader, Card, CardHeader, Button, Tag, SectionLabel, StatCard, type Tone,
} from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { Field, Input, Select, Toggle, Checkbox } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { Tabs } from "@/components/ui/tabs";
import { FeatureGate } from "@/components/ui/gate";
import type { CustomFieldDef, FieldType, LeavePolicy, WorkflowDef, TriggerEvent, WorkflowStep, TenantConfig } from "@/platform/tenant";

// ─── Static lookup tables (never build Tailwind classes dynamically) ─────────
const FIELD_TYPE_TONE: Record<FieldType, Tone> = {
  text: "gray", textarea: "gray", number: "blue", currency: "green", date: "purple",
  select: "teal", multiselect: "teal", boolean: "amber", email: "navy", phone: "navy", file: "coral",
};
const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "Text", textarea: "Long text", number: "Number", currency: "Currency", date: "Date",
  select: "Select", multiselect: "Multi-select", boolean: "Yes / No", email: "Email", phone: "Phone", file: "File",
};
const FIELD_TYPE_ICON: Record<FieldType, LucideIcon> = {
  text: Tags, textarea: AlignLeft, number: Hash, currency: Hash, date: Calendar,
  select: ListChecks, multiselect: ListChecks, boolean: ToggleRight, email: Mail, phone: Phone, file: FileText,
};
const FIELD_TYPES: FieldType[] = ["text", "textarea", "number", "currency", "date", "select", "multiselect", "boolean", "email", "phone", "file"];

const TRIGGER_LABEL: Record<TriggerEvent, string> = {
  "employee.created": "Employee created", "employee.terminated": "Employee terminated",
  "leave.requested": "Leave requested", "leave.approved": "Leave approved",
  "timesheet.submitted": "Timesheet submitted", "payroll.finalized": "Payroll finalized",
  "review.due": "Review due", "document.expiring": "Document expiring",
  "onboarding.stage_changed": "Onboarding stage changed",
};
const STEP_TONE: Record<WorkflowStep["kind"], Tone> = {
  approval: "purple", notify: "blue", assign_task: "teal", webhook: "amber", set_field: "gray",
};
const STEP_LABEL: Record<WorkflowStep["kind"], string> = {
  approval: "Approval", notify: "Notify", assign_task: "Assign task", webhook: "Webhook", set_field: "Set field",
};
const STEP_ICON: Record<WorkflowStep["kind"], LucideIcon> = {
  approval: UserCheck, notify: Bell, assign_task: ClipboardList, webhook: Webhook, set_field: Settings2,
};

const PAY_CYCLE_LABEL: Record<TenantPayCycle, string> = {
  weekly: "Weekly", biweekly: "Bi-weekly", semimonthly: "Semi-monthly", monthly: "Monthly",
};
type TenantPayCycle = "weekly" | "biweekly" | "semimonthly" | "monthly";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type TabId = "fields" | "leave" | "workflows" | "locale";

export default function HrSettingsPage() {
  return (
    <FeatureGate feature="hr.custom_fields">
      <SettingsScreen />
    </FeatureGate>
  );
}

function SettingsScreen() {
  const session = useSession();
  const { tenant } = session;
  const canManage = session.can("update", "hr");

  const [tab, setTab] = React.useState<TabId>("fields");

  // Local-only toggle state keyed by record id (this is a configuration demo).
  const [requiredById, setRequiredById] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(tenant.customFields.map((f) => [f.id, f.required])),
  );
  const [paidById, setPaidById] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(tenant.leavePolicies.map((p) => [p.id, p.paid])),
  );
  const [enabledById, setEnabledById] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(tenant.workflows.map((w) => [w.id, w.enabled])),
  );

  const [addOpen, setAddOpen] = React.useState(false);
  const [extraFields, setExtraFields] = React.useState<CustomFieldDef[]>([]);
  const customFields = React.useMemo(() => [...tenant.customFields, ...extraFields], [tenant.customFields, extraFields]);

  const activeWorkflows = tenant.workflows.filter((w) => enabledById[w.id]).length;
  const requiredFields = customFields.filter((f) => requiredById[f.id]).length;

  const tabs = [
    { id: "fields", label: "Custom Fields", count: customFields.length, icon: Tags },
    { id: "leave", label: "Leave Policies", count: tenant.leavePolicies.length, icon: Palmtree },
    { id: "workflows", label: "Workflows", count: tenant.workflows.length, icon: Workflow },
    { id: "locale", label: "Pay & Locale", icon: Globe2 },
  ];

  return (
    <>
      <PageHeader
        eyebrow="HR Configuration"
        title="Settings & Customization"
        description={`Reshape ${tenant.branding.companyName}'s HR module without code — custom fields, leave policies, automation and locale.`}
        actions={
          <>
            <Tag tone="navy">{tenant.tier} plan</Tag>
            {canManage && tab === "fields" && (
              <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>Add field</Button>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Custom fields" value={customFields.length} hint={`${requiredFields} required`} icon={Tags} tone="teal" />
        <StatCard label="Leave policies" value={tenant.leavePolicies.length} icon={Palmtree} tone="blue" />
        <StatCard label="Active workflows" value={`${activeWorkflows}/${tenant.workflows.length}`} hint="enabled" icon={Workflow} tone="purple" />
        <StatCard label="Pay cycle" value={PAY_CYCLE_LABEL[tenant.payCycle]} hint={tenant.currency} icon={Globe2} tone="navy" />
      </div>

      <Tabs tabs={tabs} value={tab} onChange={(id) => setTab(id as TabId)} className="mb-4" />

      {tab === "fields" && (
        <CustomFieldsTab
          fields={customFields}
          requiredById={requiredById}
          onToggleRequired={(id, v) => setRequiredById((m) => ({ ...m, [id]: v }))}
          canManage={canManage}
        />
      )}

      {tab === "leave" && (
        <LeavePoliciesTab
          policies={tenant.leavePolicies}
          paidById={paidById}
          onTogglePaid={(id, v) => setPaidById((m) => ({ ...m, [id]: v }))}
          canManage={canManage}
        />
      )}

      {tab === "workflows" && (
        <WorkflowsTab
          workflows={tenant.workflows}
          enabledById={enabledById}
          onToggleEnabled={(id, v) => setEnabledById((m) => ({ ...m, [id]: v }))}
          canManage={canManage}
        />
      )}

      {tab === "locale" && <PayLocaleTab tenant={tenant} canManage={canManage} />}

      <AddFieldModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={(f) => {
          setExtraFields((arr) => [...arr, f]);
          setRequiredById((m) => ({ ...m, [f.id]: f.required }));
        }}
      />
    </>
  );
}

// ─── Custom Fields ────────────────────────────────────────────────────────────
function CustomFieldsTab({
  fields, requiredById, onToggleRequired, canManage,
}: {
  fields: CustomFieldDef[];
  requiredById: Record<string, boolean>;
  onToggleRequired: (id: string, v: boolean) => void;
  canManage: boolean;
}) {
  const columns: Column<CustomFieldDef>[] = [
    {
      key: "label", header: "Field", accessor: (f) => f.label,
      render: (f) => {
        const Icon = FIELD_TYPE_ICON[f.type];
        return (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-navy/[.06] text-navy"><Icon size={14} /></span>
            <div className="leading-tight">
              <div className="font-semibold text-navy">{f.label}</div>
              <div className="font-mono text-2xs text-ink-3">{f.key}</div>
            </div>
          </div>
        );
      },
    },
    { key: "entity", header: "Entity", accessor: (f) => f.entity, render: (f) => <span className="capitalize text-ink-2">{f.entity}</span> },
    { key: "type", header: "Type", accessor: (f) => f.type, render: (f) => <Tag tone={FIELD_TYPE_TONE[f.type]}>{FIELD_TYPE_LABEL[f.type]}</Tag> },
    { key: "group", header: "Group", accessor: (f) => f.group ?? "", render: (f) => f.group ? <Tag tone="gray">{f.group}</Tag> : <span className="text-ink-3">—</span> },
    {
      key: "required", header: "Required", align: "center",
      render: (f) => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Toggle checked={!!requiredById[f.id]} onChange={(v) => onToggleRequired(f.id, v)} disabled={!canManage} label={`${f.label} required`} />
        </div>
      ),
    },
  ];

  return (
    <Card padded={false}>
      <div className="border-b border-line px-5 py-4">
        <CardHeader
          title="Custom fields"
          description="Add bespoke attributes to any HR entity — these render automatically across employee profiles and forms."
          icon={Tags}
        />
      </div>
      <div className="p-5 pt-0">
        <DataTable columns={columns} rows={fields} keyField={(f) => f.id} empty="No custom fields defined yet." />
      </div>
    </Card>
  );
}

function AddFieldModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (f: CustomFieldDef) => void }) {
  const [label, setLabel] = React.useState("");
  const [key, setKey] = React.useState("");
  const [type, setType] = React.useState<FieldType>("text");
  const [required, setRequired] = React.useState(false);
  const [group, setGroup] = React.useState("");

  React.useEffect(() => {
    if (open) { setLabel(""); setKey(""); setType("text"); setRequired(false); setGroup(""); }
  }, [open]);

  // Auto-suggest machine key from label, demonstrating the config UX.
  const suggestKey = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add custom field"
      description="Define a new attribute. It becomes available immediately on the chosen entity."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={Plus}
            disabled={!label.trim()}
            onClick={() => {
              const k = (key || suggestKey(label)).trim();
              onCreate({
                id: "cf_" + Math.random().toString(36).slice(2, 7),
                module: "hr",
                entity: "employee",
                key: k || "field",
                label: label.trim(),
                type,
                required,
                ...(group.trim() ? { group: group.trim() } : {}),
              });
              onClose();
            }}
          >
            Create field
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Label" required className="col-span-2">
          <Input value={label} placeholder="Blood Type" onChange={(e) => { setLabel(e.target.value); setKey(suggestKey(e.target.value)); }} />
        </Field>
        <Field label="Key" hint="Machine name, lowercase">
          <Input value={key} placeholder="blood_type" className="font-mono" onChange={(e) => setKey(e.target.value)} />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as FieldType)}>
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
          </Select>
        </Field>
        <Field label="Group" hint="UI grouping (optional)" className="col-span-2">
          <Input value={group} placeholder="Personal" onChange={(e) => setGroup(e.target.value)} />
        </Field>
        <div className="col-span-2 rounded-md border border-line bg-subtle px-3 py-2.5">
          <Checkbox checked={required} onChange={setRequired} label="Required field — must be filled before saving the record" />
        </div>
      </div>
    </Modal>
  );
}

// ─── Leave Policies ───────────────────────────────────────────────────────────
function LeavePoliciesTab({
  policies, paidById, onTogglePaid, canManage,
}: {
  policies: LeavePolicy[];
  paidById: Record<string, boolean>;
  onTogglePaid: (id: string, v: boolean) => void;
  canManage: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {policies.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue/10 text-blue"><Palmtree size={17} /></span>
              <div>
                <h3 className="text-md font-bold text-navy">{p.name}</h3>
                <Tag tone={paidById[p.id] ? "green" : "gray"}>{paidById[p.id] ? "Paid" : "Unpaid"}</Tag>
              </div>
            </div>
          </div>

          <dl className="mt-4 space-y-2.5 border-t border-line pt-3 text-sm">
            <PolicyRow label="Accrual / year" value={p.accrualPerYear === 0 ? "—" : `${p.accrualPerYear} ${p.unit}`} />
            <PolicyRow label="Carry-over max" value={p.carryOverMax === 0 ? "None" : `${p.carryOverMax} ${p.unit}`} />
            <PolicyRow label="Unit" value={<span className="capitalize">{p.unit}</span>} />
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs font-semibold text-ink-2">Paid leave</span>
            <Toggle checked={!!paidById[p.id]} onChange={(v) => onTogglePaid(p.id, v)} disabled={!canManage} label={`${p.name} paid`} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-mono font-semibold text-navy">{value}</dd>
    </div>
  );
}

// ─── Workflows ────────────────────────────────────────────────────────────────
function WorkflowsTab({
  workflows, enabledById, onToggleEnabled, canManage,
}: {
  workflows: WorkflowDef[];
  enabledById: Record<string, boolean>;
  onToggleEnabled: (id: string, v: boolean) => void;
  canManage: boolean;
}) {
  return (
    <Card padded={false}>
      <div className="border-b border-line px-5 py-4">
        <CardHeader
          title="Automation workflows"
          description="Event-driven automations. Each fires its steps in order when its trigger occurs."
          icon={Workflow}
        />
      </div>
      <div className="divide-y divide-line">
        {workflows.map((w) => {
          const on = !!enabledById[w.id];
          return (
            <div key={w.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-navy/[.06] text-navy"><GitBranch size={14} /></span>
                  <span className="font-semibold text-navy">{w.name}</span>
                  <Tag tone="purple">{TRIGGER_LABEL[w.trigger]}</Tag>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-9 text-2xs text-ink-3">
                  <SectionLabelInline>{w.steps.length} step{w.steps.length === 1 ? "" : "s"}</SectionLabelInline>
                  {w.steps.map((s, i) => {
                    const Icon = STEP_ICON[s.kind];
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && <ChevronRight size={11} className="text-ink-3/60" />}
                        <span className="inline-flex items-center gap-1">
                          <Tag tone={STEP_TONE[s.kind]}><Icon size={10} className="mr-0.5" />{STEP_LABEL[s.kind]}</Tag>
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2.5 pl-9 sm:pl-0">
                <span className={on ? "text-xs font-semibold text-green" : "text-xs font-semibold text-ink-3"}>{on ? "Enabled" : "Disabled"}</span>
                <Toggle checked={on} onChange={(v) => onToggleEnabled(w.id, v)} disabled={!canManage} label={`${w.name} enabled`} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SectionLabelInline({ children }: { children: React.ReactNode }) {
  return <span className="mr-1 font-semibold uppercase tracking-wide text-ink-3">{children}</span>;
}

// ─── Pay & Locale ─────────────────────────────────────────────────────────────
function PayLocaleTab({ tenant, canManage }: { tenant: TenantConfig; canManage: boolean }) {
  const [payCycle, setPayCycle] = React.useState<TenantConfig["payCycle"]>(tenant.payCycle);
  const [currency, setCurrency] = React.useState(tenant.currency);
  const [timezone, setTimezone] = React.useState(tenant.timezone);
  const [weekStartsOn, setWeekStartsOn] = React.useState<0 | 1>(tenant.weekStartsOn);
  const [fiscalMonth, setFiscalMonth] = React.useState(tenant.fiscalYearStartMonth);
  const [country, setCountry] = React.useState(tenant.country);
  const [saved, setSaved] = React.useState(false);

  const disabled = !canManage;
  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <Card>
      <CardHeader
        title="Pay & locale"
        description="Organization-wide defaults applied to payroll runs, schedules and date formatting."
        icon={Globe2}
        action={canManage ? (saved ? <Tag tone="green">Saved ✓</Tag> : <Button variant="primary" size="sm" onClick={save}>Save changes</Button>) : <Tag tone="amber">Read-only</Tag>}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Pay cycle" hint="Frequency payroll is run">
          <Select value={payCycle} onChange={(e) => setPayCycle(e.target.value as TenantPayCycle)} disabled={disabled}>
            {(Object.keys(PAY_CYCLE_LABEL) as TenantPayCycle[]).map((c) => <option key={c} value={c}>{PAY_CYCLE_LABEL[c]}</option>)}
          </Select>
        </Field>
        <Field label="Currency" hint="ISO 4217 code">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={disabled}>
            {["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Timezone">
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={disabled}>
            {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Country" hint="ISO 3166-1 alpha-2">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} disabled={disabled}>
            {["US", "CA", "GB", "AU", "IN", "FR", "DE", "JP"].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Week starts on">
          <Select value={String(weekStartsOn)} onChange={(e) => setWeekStartsOn(Number(e.target.value) as 0 | 1)} disabled={disabled}>
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
          </Select>
        </Field>
        <Field label="Fiscal year start" hint="First month of the fiscal year">
          <Select value={String(fiscalMonth)} onChange={(e) => setFiscalMonth(Number(e.target.value))} disabled={disabled}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
        </Field>
      </div>

      <div className="mt-5 rounded-md border border-line bg-subtle px-4 py-3 text-xs text-ink-3">
        <span className="font-semibold text-ink-2">Locale:</span> {tenant.locale}
        <span className="mx-2 text-ink-3/50">·</span>
        These settings cascade to every module. Changes here are scoped to this tenant only.
      </div>
    </Card>
  );
}
