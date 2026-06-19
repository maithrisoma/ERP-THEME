"use client";
import * as React from "react";
import { FileText, Plus, Check } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { formatMoney, money } from "@/platform/types";
import { PageHeader, Button, Tag, Card, StatCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { QuoteBody } from "@/components/crm-detail";
import { quotes as seed, quoteTotal, type Quote, type QuoteStatus } from "@/modules/crm/data";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/modules/crm/ui";

const STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "declined"];

export default function CrmQuotesPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Quote[]>(() => seed);
  const [sel, setSel] = React.useState<Quote | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ account: "", item: "POS Terminal Pro", qty: "1", price: "1200", status: "draft" as QuoteStatus, validUntil: "2026-07-31" });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((x) => (status ? x.status === status : true) && (!q || `${x.number} ${x.account} ${x.owner}`.toLowerCase().includes(q)));
  }, [list, search, status]);

  const accepted = list.filter((q) => q.status === "accepted").length;
  const openValue = list.filter((q) => q.status === "draft" || q.status === "sent").reduce((s, q) => s + quoteTotal(q), 0);
  const decided = list.filter((q) => q.status === "accepted" || q.status === "declined").length;
  const winRate = decided ? Math.round((accepted / decided) * 100) : 0;

  function addQuote() {
    if (!form.account.trim()) return;
    const n = list.length + 1;
    setList((l) => [{
      id: "qt_" + Math.random().toString(36).slice(2, 7), number: `Q-2026-${1000 + n}`, account: form.account.trim(),
      status: form.status, owner: session.principal.name, createdAt: new Date().toISOString().slice(0, 10), validUntil: form.validUntil,
      lines: [{ item: form.item, qty: Number(form.qty) || 1, price: Number(form.price) || 0 }],
    }, ...l]);
    setAddOpen(false);
    setForm({ account: "", item: "POS Terminal Pro", qty: "1", price: "1200", status: "draft", validUntil: "2026-07-31" });
  }

  const columns: Column<Quote>[] = [
    { key: "number", header: "Quote #", accessor: (q) => q.number, render: (q) => <span className="font-mono font-semibold text-navy">{q.number}</span> },
    { key: "account", header: "Account", accessor: (q) => q.account, render: (q) => <span className="text-ink-2">{q.account}</span> },
    { key: "total", header: "Total", align: "right", accessor: (q) => quoteTotal(q), render: (q) => <span className="font-mono font-semibold text-navy">{formatMoney(money(quoteTotal(q))).replace(".00", "")}</span> },
    { key: "valid", header: "Valid until", align: "right", accessor: (q) => q.validUntil, render: (q) => <span className="font-mono text-2xs text-ink-3">{q.validUntil}</span> },
    { key: "status", header: "Status", accessor: (q) => q.status, render: (q) => <Tag tone={QUOTE_STATUS_TONE[q.status]}>{QUOTE_STATUS_LABEL[q.status]}</Tag> },
  ];

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Quotes" description="Build, send and track sales quotations — open one for its line items."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New quote</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Quotes" value={list.length} icon={FileText} tone="navy" />
        <StatCard label="Accepted" value={accepted} icon={Check} tone="green" />
        <StatCard label="Open value" value={formatMoney(money(openValue)).replace(".00", "")} tone="amber" />
        <StatCard label="Win rate" value={`${winRate}%`} tone="teal" />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search quote #, account…" className="min-w-[220px] flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:!w-44">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{QUOTE_STATUS_LABEL[s]}</option>)}
          </Select>
          <span className="ml-auto text-xs text-ink-3">{rows.length} quote{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(q) => q.id} onRowClick={setSel} empty="No quotes match your search." />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New quote" size="lg"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addQuote}>Create quote</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Account" required className="col-span-2"><Input value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))} placeholder="Acme Retail" /></Field>
          <Field label="Item" className="col-span-2"><Input value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} /></Field>
          <Field label="Quantity"><Input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} /></Field>
          <Field label="Unit price (USD)"><Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as QuoteStatus }))}>{STATUSES.map((s) => <option key={s} value={s}>{QUOTE_STATUS_LABEL[s]}</option>)}</Select></Field>
          <Field label="Valid until"><Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Quote" title={sel?.number}>
        {sel && <QuoteBody quote={sel} />}
      </DetailModal>
    </>
  );
}
