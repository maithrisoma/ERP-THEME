"use client";
import * as React from "react";
import { Users, UserPlus } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Avatar, Card, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { ContactBody } from "@/components/crm-detail";
import { contacts as seed, type Contact, type ContactStatus } from "@/modules/crm/data";
import { CONTACT_TONE } from "@/modules/crm/ui";

const STATUS_LABEL: Record<ContactStatus, string> = { lead: "Lead", active: "Active", churned: "Churned" };

export default function CrmContactsPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Contact[]>(() => seed);
  const [sel, setSel] = React.useState<Contact | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", company: "", email: "", phone: "", title: "", status: "lead" as ContactStatus });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (status && c.status !== status) return false;
      if (!q) return true;
      return `${c.name} ${c.company} ${c.email} ${c.owner}`.toLowerCase().includes(q);
    });
  }, [list, search, status]);

  function addContact() {
    if (!form.name.trim() || !form.company.trim()) return;
    const c: Contact = {
      id: "ct_" + Math.random().toString(36).slice(2, 7),
      name: form.name.trim(), company: form.company.trim(), email: form.email, phone: form.phone, title: form.title || "Contact",
      owner: session.principal.name, status: form.status, tone: "navy", lastTouch: new Date().toISOString().slice(0, 10),
    };
    setList((l) => [c, ...l]);
    setAddOpen(false);
    setForm({ name: "", company: "", email: "", phone: "", title: "", status: "lead" });
  }

  const columns: Column<Contact>[] = [
    {
      key: "name", header: "Contact", accessor: (c) => c.name,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} tone={c.tone as Tone} size={30} />
          <div className="min-w-0 leading-tight"><div className="truncate font-semibold text-navy">{c.name}</div><div className="truncate text-2xs text-ink-3">{c.title}</div></div>
        </div>
      ),
    },
    { key: "company", header: "Company", accessor: (c) => c.company, render: (c) => <span className="text-ink-2">{c.company}</span> },
    { key: "email", header: "Email", render: (c) => <span className="font-mono text-2xs text-ink-3">{c.email}</span> },
    { key: "owner", header: "Owner", accessor: (c) => c.owner, render: (c) => <span className="text-ink-3">{c.owner}</span> },
    { key: "status", header: "Status", accessor: (c) => c.status, render: (c) => <Tag tone={CONTACT_TONE[c.status]}>{STATUS_LABEL[c.status]}</Tag> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Sales & CRM"
        title="Contacts"
        description="Everyone you do business with — search, filter and open a profile."
        actions={canCreate && <Button icon={UserPlus} variant="primary" onClick={() => setAddOpen(true)}>Add contact</Button>}
      />

      <Card padded={false} className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, company, email…" className="min-w-[220px] flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:!w-44">
            <option value="">All statuses</option><option value="lead">Lead</option><option value="active">Active</option><option value="churned">Churned</option>
          </Select>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-3"><Users size={13} /> {rows.length} contact{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(c) => c.id} onRowClick={setSel} empty="No contacts match your search." />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add contact" size="lg"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addContact}>Create contact</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jordan Avery" /></Field>
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Buyer" /></Field>
          <Field label="Company" required><Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Acme Retail" /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContactStatus }))}><option value="lead">Lead</option><option value="active">Active</option><option value="churned">Churned</option></Select></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Contact" title={sel?.name}>
        {sel && <ContactBody contact={sel} />}
      </DetailModal>
    </>
  );
}
