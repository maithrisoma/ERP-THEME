"use client";
import * as React from "react";
import { Phone, Plus, PhoneIncoming, PhoneOutgoing, Clock, Check } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Card, StatCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { CallBody } from "@/components/crm-detail";
import { calls as seed, type Call, type CallDirection } from "@/modules/crm/data";

export default function CrmCallsPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Call[]>(() => seed);
  const [sel, setSel] = React.useState<Call | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ subject: "", contact: "", date: "2026-06-16", time: "10:00", direction: "outbound" as CallDirection, durationMin: "15" });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => (status ? c.status === status : true) && (!q || `${c.subject} ${c.contact} ${c.owner}`.toLowerCase().includes(q)));
  }, [list, search, status]);

  function addCall() {
    if (!form.subject.trim()) return;
    setList((l) => [{ id: "cl_" + Math.random().toString(36).slice(2, 7), subject: form.subject.trim(), contact: form.contact || "—", date: form.date, time: form.time, direction: form.direction, durationMin: Number(form.durationMin) || 0, status: "scheduled", outcome: "—", owner: session.principal.name }, ...l]);
    setAddOpen(false);
    setForm({ subject: "", contact: "", date: "2026-06-16", time: "10:00", direction: "outbound", durationMin: "15" });
  }

  const columns: Column<Call>[] = [
    { key: "dir", header: "", width: 40, render: (c) => c.direction === "inbound" ? <PhoneIncoming size={15} className="text-teal" /> : <PhoneOutgoing size={15} className="text-blue" /> },
    { key: "subject", header: "Call", accessor: (c) => c.subject, render: (c) => <span className="font-medium text-navy">{c.subject}</span> },
    { key: "contact", header: "Contact", accessor: (c) => c.contact, render: (c) => <span className="text-ink-2">{c.contact}</span> },
    { key: "when", header: "When", accessor: (c) => c.date + c.time, render: (c) => <span className="font-mono text-2xs text-ink-3">{c.date} · {c.time}</span> },
    { key: "dur", header: "Duration", align: "right", accessor: (c) => c.durationMin, render: (c) => <span className="font-mono text-2xs text-ink-3">{c.durationMin}m</span> },
    { key: "status", header: "Status", accessor: (c) => c.status, render: (c) => <Tag tone={c.status === "completed" ? "green" : "amber"}>{c.status === "completed" ? "Completed" : "Scheduled"}</Tag> },
  ];

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Calls" description="Schedule and log calls with contacts — open one for details."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>Schedule call</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={list.length} icon={Phone} tone="navy" />
        <StatCard label="Scheduled" value={list.filter((c) => c.status === "scheduled").length} icon={Clock} tone="amber" />
        <StatCard label="Completed" value={list.filter((c) => c.status === "completed").length} icon={Check} tone="green" />
        <StatCard label="Outbound" value={list.filter((c) => c.direction === "outbound").length} icon={PhoneOutgoing} tone="blue" />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search calls, contacts…" className="min-w-[220px] flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:!w-44">
            <option value="">All calls</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option>
          </Select>
          <span className="ml-auto text-xs text-ink-3">{rows.length} call{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(c) => c.id} onRowClick={setSel} empty="No calls match." />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Schedule call" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addCall}>Schedule</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject" required className="col-span-2"><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Intro call" /></Field>
          <Field label="Contact" className="col-span-2"><Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Olivia Hart" /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></Field>
          <Field label="Direction"><Select value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as CallDirection }))}><option value="outbound">Outbound</option><option value="inbound">Inbound</option></Select></Field>
          <Field label="Duration (min)"><Input type="number" value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Call" title={sel?.subject}>
        {sel && <CallBody call={sel} />}
      </DetailModal>
    </>
  );
}
