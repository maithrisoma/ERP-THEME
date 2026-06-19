"use client";
import * as React from "react";
import { FileText, Upload, Filter, FileWarning, FileX, FileCheck, UploadCloud, Download, Trash2, User } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Card, StatCard, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { downloadCsv } from "@/lib/export";
import { downloadPdf } from "@/lib/pdf";
import { FeatureGate } from "@/components/ui/gate";
import { db } from "@/modules/hrm/repo";
import { EmployeeCell, fmtDate } from "@/modules/hrm/ui";
import type { EmployeeDocument } from "@/modules/hrm/types";

type DocCategory = EmployeeDocument["category"];
type DocStatus = EmployeeDocument["status"];

const CATEGORY_LABEL: Record<DocCategory, string> = {
  contract: "Contract",
  id: "ID",
  tax: "Tax",
  certification: "Certification",
  policy: "Policy",
  visa: "Visa",
  other: "Other",
};
const CATEGORY_TONE: Record<DocCategory, Tone> = {
  contract: "navy",
  id: "blue",
  tax: "purple",
  certification: "teal",
  policy: "gray",
  visa: "orange",
  other: "gray",
};
const STATUS_TONE: Record<DocStatus, Tone> = {
  valid: "green",
  expiring: "amber",
  expired: "coral",
  missing: "gray",
};
const STATUS_LABEL: Record<DocStatus, string> = {
  valid: "Valid",
  expiring: "Expiring",
  expired: "Expired",
  missing: "Missing",
};

const CATEGORY_OPTIONS: DocCategory[] = ["contract", "id", "tax", "certification", "policy", "visa", "other"];

export default function DocumentsPage() {
  return (
    <FeatureGate feature="hr.documents">
      <DocumentsScreen />
    </FeatureGate>
  );
}

function DocumentsScreen() {
  const session = useSession();
  const canCreate = session.can("create", "hr");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const [docs, setDocs] = React.useState<EmployeeDocument[]>(() => db.documents);
  const all = docs;
  const [selected, setSelected] = React.useState<EmployeeDocument | null>(null);
  const [form, setForm] = React.useState({ employeeId: db.employees[0]?.id ?? "", category: "contract" as DocCategory, name: "", expiresAt: "" });

  function downloadDoc(d: EmployeeDocument) {
    const b = session.tenant.branding;
    downloadPdf(
      d.name,
      d.name.replace(/\.(pdf|png|jpg|jpeg)$/i, ""),
      [
        ["Employee", db.employeeName(d.employeeId)],
        ["Category", CATEGORY_LABEL[d.category]],
        ["Status", STATUS_LABEL[d.status]],
        ["Uploaded", d.uploadedAt],
        ["Expires", d.expiresAt ?? "No expiry"],
        ["File size", `${d.sizeKb} KB`],
        ["Document ID", d.id],
      ],
      "Official Document Record",
      { company: b.companyName, monogram: b.logoMonogram, primary: b.primary, accent: b.accent, product: `${b.productName} - Human Resources` },
    );
  }
  function deleteDoc(id: string) {
    setDocs((ds) => ds.filter((x) => x.id !== id));
    setSelected(null);
  }

  function uploadDoc() {
    if (!form.name.trim()) return;
    const name = form.name.trim();
    const d: EmployeeDocument = {
      id: "doc_" + Math.random().toString(36).slice(2, 7),
      employeeId: form.employeeId,
      name: /\.(pdf|png|jpg|jpeg)$/i.test(name) ? name : `${name}.pdf`,
      category: form.category,
      uploadedAt: new Date().toISOString().slice(0, 10),
      expiresAt: form.expiresAt || undefined,
      sizeKb: 180 + Math.floor(Math.random() * 320),
      status: "valid",
    };
    setDocs((ds) => [d, ...ds]);
    setUploadOpen(false);
    setForm((f) => ({ ...f, name: "", expiresAt: "" }));
  }

  const counts = React.useMemo(() => {
    const c = { total: all.length, expiring: 0, expired: 0, valid: 0 };
    for (const d of all) {
      if (d.status === "expiring") c.expiring += 1;
      else if (d.status === "expired") c.expired += 1;
      else if (d.status === "valid") c.valid += 1;
    }
    return c;
  }, [all]);

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((d) => {
      if (category && d.category !== category) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        db.employeeName(d.employeeId).toLowerCase().includes(q) ||
        CATEGORY_LABEL[d.category].toLowerCase().includes(q)
      );
    });
  }, [all, search, category]);

  const flagged = (s: DocStatus) => s === "expiring" || s === "expired";

  const columns: Column<EmployeeDocument>[] = [
    {
      key: "name",
      header: "Document",
      accessor: (d) => d.name,
      render: (d) => (
        <div className="flex items-center gap-2.5">
          {flagged(d.status) && (
            <span
              className="block h-7 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: d.status === "expired" ? "#DC2626" : "#D97706" }}
              aria-hidden
            />
          )}
          <FileText size={16} className="shrink-0 text-ink-3" />
          <span className="font-medium text-navy">{d.name}</span>
        </div>
      ),
    },
    { key: "emp", header: "Employee", accessor: (d) => db.employeeName(d.employeeId), render: (d) => <EmployeeCell id={d.employeeId} /> },
    {
      key: "cat",
      header: "Category",
      accessor: (d) => CATEGORY_LABEL[d.category],
      render: (d) => <Tag tone={CATEGORY_TONE[d.category]}>{CATEGORY_LABEL[d.category]}</Tag>,
    },
    { key: "uploaded", header: "Uploaded", accessor: (d) => d.uploadedAt, render: (d) => <span className="font-mono text-2xs text-ink-3">{fmtDate(d.uploadedAt)}</span> },
    { key: "expires", header: "Expires", accessor: (d) => d.expiresAt ?? "", render: (d) => <span className="font-mono text-2xs text-ink-3">{fmtDate(d.expiresAt)}</span> },
    { key: "size", header: "Size", align: "right", accessor: (d) => d.sizeKb, render: (d) => <span className="font-mono text-2xs text-ink-3">{d.sizeKb} KB</span> },
    { key: "status", header: "Status", accessor: (d) => d.status, render: (d) => <Tag tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Tag> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Documents"
        description="Employee contracts, IDs, certifications and compliance files — with expiry tracking."
        actions={
          <>
            {session.can("export", "hr") && <Button icon={Download} variant="outline" onClick={() => downloadCsv("documents.csv", [["Document", "Employee", "Category", "Uploaded", "Expires", "Status"], ...rows.map((d) => [d.name, db.employeeName(d.employeeId), CATEGORY_LABEL[d.category], d.uploadedAt, d.expiresAt ?? "", d.status])])}>Export</Button>}
            {canCreate && <Button icon={Upload} variant="primary" onClick={() => setUploadOpen(true)}>Upload document</Button>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total documents" value={counts.total} icon={FileText} tone="navy" />
        <StatCard label="Expiring soon" value={counts.expiring} hint="needs renewal" icon={FileWarning} tone="amber" />
        <StatCard label="Expired" value={counts.expired} hint="action required" icon={FileX} tone="coral" />
        <StatCard label="Valid" value={counts.valid} icon={FileCheck} tone="green" />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search document, employee…" className="min-w-[220px] flex-1" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:!w-44">
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </Select>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-3"><Filter size={13} /> {rows.length} result{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(d) => d.id} onRowClick={setSelected} empty="No documents match these filters." />

      <DetailModal open={!!selected} onClose={() => setSelected(null)} eyebrow="Document" title={selected?.name}>
        {selected && (
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Tag tone={CATEGORY_TONE[selected.category]}>{CATEGORY_LABEL[selected.category]}</Tag>
              <Tag tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Tag>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <DocRow icon={User} label="Employee" value={db.employeeName(selected.employeeId)} />
              <DocRow label="Uploaded" value={fmtDate(selected.uploadedAt)} />
              <DocRow label="Expires" value={fmtDate(selected.expiresAt)} />
              <DocRow label="Size" value={`${selected.sizeKb} KB`} />
              <DocRow label="Category" value={CATEGORY_LABEL[selected.category]} />
              <DocRow label="Status" value={STATUS_LABEL[selected.status]} />
            </dl>
            <div className="mt-6 flex gap-2">
              <Button variant="navy" icon={Download} className="flex-1" onClick={() => downloadDoc(selected)}>Download</Button>
              {session.can("delete", "hr") && <Button variant="outline" icon={Trash2} onClick={() => deleteDoc(selected.id)}>Delete</Button>}
            </div>
          </div>
        )}
      </DetailModal>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload document"
        description="Attach a file to an employee record and set an optional expiry for compliance tracking."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Upload} onClick={uploadDoc}>Upload</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee" required>
            <Select value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>{db.employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</Select>
          </Field>
          <Field label="Category" required>
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as DocCategory }))}>{CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</Select>
          </Field>
          <Field label="Document name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Employment Contract.pdf" /></Field>
          <Field label="Expiry date" hint="Leave blank if the document does not expire"><Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} /></Field>
          <Field label="File" className="col-span-2">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-subtle px-4 py-8 text-center hover:border-navy">
              <UploadCloud size={26} className={form.name ? "text-green" : "text-ink-3"} />
              <span className="text-sm font-medium text-ink-2">{form.name || "Drop a file here or click to browse"}</span>
              <span className="text-2xs text-ink-3">PDF, PNG or JPG up to 10 MB</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) setForm((prev) => ({ ...prev, name: file.name })); }}
              />
            </label>
          </Field>
        </div>
      </Modal>
    </>
  );
}

function DocRow({ icon: Icon, label, value }: { icon?: typeof User; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-ink-3">{Icon && <Icon size={13} />}{label}</dt>
      <dd className="text-right font-medium text-ink-2">{value}</dd>
    </div>
  );
}
