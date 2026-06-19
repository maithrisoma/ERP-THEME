"use client";
import * as React from "react";
import { LifeBuoy, Plus, AlertTriangle, Check, ArrowRight } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Card, StatCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { CaseBody } from "@/components/crm-detail";
import { cases as seed, type SupportCase, type CaseStatus, type CasePriority } from "@/modules/crm/data";
import { CASE_STATUS_LABEL, CASE_STATUS_TONE, CASE_PRIORITY_TONE } from "@/modules/crm/ui";

const STATUS_ORDER: CaseStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: CasePriority[] = ["urgent", "high", "medium", "low"];

export default function CrmCasesPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<SupportCase[]>(() => seed);
  const [sel, setSel] = React.useState<SupportCase | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ subject: "", account: "", priority: "medium" as CasePriority });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => (status ? c.status === status : true) && (!q || `${c.number} ${c.subject} ${c.account}`.toLowerCase().includes(q)));
  }, [list, search, status]);

  function addCase() {
    if (!form.subject.trim()) return;
    const n = list.length + 1;
    setList((l) => [{ id: "cs_" + Math.random().toString(36).slice(2, 7), number: `CASE-${2000 + n}`, subject: form.subject.trim(), account: form.account || "—", priority: form.priority, status: "open", owner: session.principal.name, createdAt: new Date().toISOString().slice(0, 10) }, ...l]);
    setAddOpen(false);
    setForm({ subject: "", account: "", priority: "medium" });
  }

  const columns: Column<SupportCase>[] = [
    { key: "number", header: "Case #", accessor: (c) => c.number, render: (c) => <span className="font-mono font-semibold text-navy">{c.number}</span> },
    { key: "subject", header: "Subject", accessor: (c) => c.subject, render: (c) => <span className="font-medium text-ink-2">{c.subject}</span> },
    { key: "account", header: "Account", accessor: (c) => c.account, render: (c) => <span className="text-ink-3">{c.account}</span> },
    { key: "priority", header: "Priority", accessor: (c) => c.priority, render: (c) => <Tag tone={CASE_PRIORITY_TONE[c.priority]}>{c.priority}</Tag> },
    { key: "status", header: "Status", accessor: (c) => c.status, render: (c) => <Tag tone={CASE_STATUS_TONE[c.status]}>{CASE_STATUS_LABEL[c.status]}</Tag> },
  ];

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Cases" description="Customer support tickets — open one to triage and resolve."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New case</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={list.filter((c) => c.status === "open").length} icon={LifeBuoy} tone="amber" />
        <StatCard label="Urgent" value={list.filter((c) => c.priority === "urgent" && c.status !== "closed").length} icon={AlertTriangle} tone="coral" />
        <StatCard label="In progress" value={list.filter((c) => c.status === "in_progress").length} icon={ArrowRight} tone="blue" />
        <StatCard label="Resolved" value={list.filter((c) => c.status === "resolved" || c.status === "closed").length} icon={Check} tone="green" />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search case #, subject…" className="min-w-[220px] flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:!w-44">
            <option value="">All statuses</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{CASE_STATUS_LABEL[s]}</option>)}
          </Select>
          <span className="ml-auto text-xs text-ink-3">{rows.length} case{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(c) => c.id} onRowClick={setSel} empty="No cases match." />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New case" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addCase}>Create case</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject" required className="col-span-2"><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="POS sync error" /></Field>
          <Field label="Account"><Input value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))} placeholder="Acme Retail" /></Field>
          <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as CasePriority }))}>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</Select></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow={sel?.number} title={sel?.subject}>
        {sel && <CaseBody item={sel} />}
      </DetailModal>
    </>
  );
}
