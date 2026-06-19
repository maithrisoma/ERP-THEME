"use client";
import * as React from "react";
import { Building2, Users, DollarSign, Plus } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { formatMoney, money } from "@/platform/types";
import { PageHeader, Button, Tag, Avatar, Card, StatCard, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { AccountBody } from "@/components/crm-detail";
import { accounts as seed, type Account, type AccountType } from "@/modules/crm/data";
import { ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_TONE } from "@/modules/crm/ui";

const TYPES: AccountType[] = ["prospect", "customer", "partner"];

export default function CrmAccountsPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Account[]>(() => seed);
  const [sel, setSel] = React.useState<Account | null>(null);
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", industry: "Grocery", type: "prospect" as AccountType, website: "", phone: "", employees: "50", revenue: "1000000" });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((a) => (type ? a.type === type : true) && (!q || `${a.name} ${a.industry} ${a.owner}`.toLowerCase().includes(q)));
  }, [list, search, type]);

  function addAccount() {
    if (!form.name.trim()) return;
    setList((l) => [{
      id: "ac_" + Math.random().toString(36).slice(2, 7), name: form.name.trim(), industry: form.industry, type: form.type,
      owner: session.principal.name, website: form.website || `${form.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
      phone: form.phone, employees: Number(form.employees) || 0, revenue: money(Number(form.revenue) || 0), tone: "navy",
    }, ...l]);
    setAddOpen(false);
    setForm({ name: "", industry: "Grocery", type: "prospect", website: "", phone: "", employees: "50", revenue: "1000000" });
  }

  const columns: Column<Account>[] = [
    { key: "name", header: "Account", accessor: (a) => a.name, render: (a) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={a.name} tone={a.tone as Tone} size={30} square />
        <div className="min-w-0 leading-tight"><div className="truncate font-semibold text-navy">{a.name}</div><div className="truncate text-2xs text-ink-3">{a.website}</div></div>
      </div>
    ) },
    { key: "industry", header: "Industry", accessor: (a) => a.industry, render: (a) => <span className="text-ink-2">{a.industry}</span> },
    { key: "type", header: "Type", accessor: (a) => a.type, render: (a) => <Tag tone={ACCOUNT_TYPE_TONE[a.type]}>{ACCOUNT_TYPE_LABEL[a.type]}</Tag> },
    { key: "employees", header: "Employees", align: "right", accessor: (a) => a.employees, render: (a) => <span className="font-mono text-ink-2">{a.employees}</span> },
    { key: "revenue", header: "Revenue", align: "right", accessor: (a) => a.revenue.amount, render: (a) => <span className="font-mono font-semibold text-navy">{formatMoney(a.revenue).replace(".00", "")}</span> },
    { key: "owner", header: "Owner", accessor: (a) => a.owner, render: (a) => <span className="text-ink-3">{a.owner}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Accounts" description="The companies you sell to — open one for its contacts and deals."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New account</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Accounts" value={list.length} icon={Building2} tone="navy" />
        <StatCard label="Customers" value={list.filter((a) => a.type === "customer").length} icon={Users} tone="green" />
        <StatCard label="Prospects" value={list.filter((a) => a.type === "prospect").length} tone="amber" />
        <StatCard label="Total revenue" value={formatMoney(money(list.reduce((s, a) => s + a.revenue.amount, 0))).replace(".00", "")} icon={DollarSign} tone="teal" />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search account, industry…" className="min-w-[220px] flex-1" />
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:!w-44">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>)}
          </Select>
          <span className="ml-auto text-xs text-ink-3">{rows.length} account{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(a) => a.id} onRowClick={setSel} empty="No accounts match your search." />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New account" size="lg"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addAccount}>Create account</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Account name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme Retail" /></Field>
          <Field label="Industry"><Select value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}>{["Grocery", "Convenience", "Specialty retail", "Wholesale", "Pharmacy", "Fuel & C-store"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}>{TYPES.map((t) => <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>)}</Select></Field>
          <Field label="Website"><Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="acme.com" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="Employees"><Input type="number" value={form.employees} onChange={(e) => setForm((f) => ({ ...f, employees: e.target.value }))} /></Field>
          <Field label="Annual revenue (USD)"><Input type="number" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Account" title={sel?.name}>
        {sel && <AccountBody account={sel} />}
      </DetailModal>
    </>
  );
}
