"use client";
import * as React from "react";
import { UserPlus, Sparkles, Check } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { formatMoney, money } from "@/platform/types";
import { PageHeader, Button, Tag, Avatar, Card, StatCard, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { LeadBody } from "@/components/crm-detail";
import { leads as seed, type Lead, type LeadStatus } from "@/modules/crm/data";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/modules/crm/ui";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "unqualified"];

export default function CrmLeadsPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Lead[]>(() => seed);
  const [sel, setSel] = React.useState<Lead | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", company: "", email: "", phone: "", source: "Website", value: "10000", status: "new" as LeadStatus });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((l) => (status ? l.status === status : true) && (!q || `${l.name} ${l.company} ${l.email} ${l.owner}`.toLowerCase().includes(q)));
  }, [list, search, status]);

  const qualified = list.filter((l) => l.status === "qualified").length;
  const pipelineValue = list.filter((l) => l.status !== "unqualified").reduce((s, l) => s + l.value.amount, 0);

  function addLead() {
    if (!form.name.trim() || !form.company.trim()) return;
    setList((l) => [{
      id: "ld_" + Math.random().toString(36).slice(2, 7),
      name: form.name.trim(), company: form.company.trim(), email: form.email, phone: form.phone,
      source: form.source, status: form.status, owner: session.principal.name, value: money(Number(form.value) || 0),
      tone: "navy", createdAt: new Date().toISOString().slice(0, 10),
    }, ...l]);
    setAddOpen(false);
    setForm({ name: "", company: "", email: "", phone: "", source: "Website", value: "10000", status: "new" });
  }

  const columns: Column<Lead>[] = [
    { key: "name", header: "Lead", accessor: (l) => l.name, render: (l) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={l.name} tone={l.tone as Tone} size={30} />
        <div className="min-w-0 leading-tight"><div className="truncate font-semibold text-navy">{l.name}</div><div className="truncate text-2xs text-ink-3">{l.company}</div></div>
      </div>
    ) },
    { key: "source", header: "Source", accessor: (l) => l.source, render: (l) => <span className="text-ink-2">{l.source}</span> },
    { key: "value", header: "Est. value", align: "right", accessor: (l) => l.value.amount, render: (l) => <span className="font-mono font-semibold text-navy">{formatMoney(l.value).replace(".00", "")}</span> },
    { key: "owner", header: "Owner", accessor: (l) => l.owner, render: (l) => <span className="text-ink-3">{l.owner}</span> },
    { key: "status", header: "Status", accessor: (l) => l.status, render: (l) => <Tag tone={LEAD_STATUS_TONE[l.status]}>{LEAD_STATUS_LABEL[l.status]}</Tag> },
  ];

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Leads" description="Capture and qualify new prospects before they become deals."
        actions={canCreate && <Button icon={UserPlus} variant="primary" onClick={() => setAddOpen(true)}>New lead</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total leads" value={list.length} icon={UserPlus} tone="navy" />
        <StatCard label="Qualified" value={qualified} icon={Check} tone="green" />
        <StatCard label="New this week" value={list.filter((l) => l.status === "new").length} icon={Sparkles} tone="blue" />
        <StatCard label="Open pipeline" value={formatMoney(money(pipelineValue)).replace(".00", "")} tone="amber" />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, company, email…" className="min-w-[220px] flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:!w-44">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
          </Select>
          <span className="ml-auto text-xs text-ink-3">{rows.length} lead{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(l) => l.id} onRowClick={setSel} empty="No leads match your search." />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New lead" size="lg"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addLead}>Create lead</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jordan Avery" /></Field>
          <Field label="Company" required><Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Acme Retail" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="Source"><Select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>{["Website", "Referral", "Trade show", "Cold call", "LinkedIn", "Webinar"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Est. value (USD)"><Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} /></Field>
          <Field label="Status" className="col-span-2"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LeadStatus }))}>{STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}</Select></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Lead" title={sel?.name}>
        {sel && <LeadBody lead={sel} />}
      </DetailModal>
    </>
  );
}
