"use client";
import * as React from "react";
import Link from "next/link";
import { UserPlus, Download, Filter, ExternalLink, Mail, Phone, MapPin, type LucideIcon } from "@/components/icon/lucide";
import { formatMoney } from "@/platform/types";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Card } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { DetailModal, Modal } from "@/components/ui/overlay";
import { useApi, apiWrite } from "@/lib/apiClient";
import { downloadCsv } from "@/lib/export";
import { departments, locations, positionTitle, departmentName, locationName, employeeName } from "@/modules/hrm/data";
import { EmployeeCell, EmpStatusTag, TYPE_LABEL, fmtDate } from "@/modules/hrm/ui";
import type { Employee } from "@/modules/hrm/types";

export default function EmployeesPage() {
  const session = useSession();
  const canCreate = session.can("create", "hr");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [dept, setDept] = React.useState("");
  const [type, setType] = React.useState("");
  const [selected, setSelected] = React.useState<Employee | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  // Live data: BFF → (mock seed | Rust core → Postgres), depending on DATA_ADAPTER.
  const { data: all, loading, error, refetch } = useApi<Employee[]>("/api/v1/employees?per_page=200");
  const { data: health } = useApi<{ adapter: string }>("/api/health");
  const live = health?.adapter === "core";

  // New-employee form (persists via the BFF → Rust core → Postgres in core mode).
  const emptyForm = { firstName: "", lastName: "", email: "", departmentId: departments[0]?.id ?? "", locationId: locations[0]?.id ?? "", employmentType: "full_time", hireDate: "" };
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const upd = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function createEmployee() {
    if (!form.firstName || !form.lastName || !form.email) {
      setFormError("First name, last name and email are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const res = await apiWrite("/api/v1/employees", form);
    setSaving(false);
    if (res.ok) {
      setAddOpen(false);
      setForm(emptyForm);
      refetch();
    } else {
      setFormError(res.error ?? "Could not create employee.");
    }
  }

  const rows = React.useMemo(() => {
    return (all ?? []).filter((e) => {
      if (search) {
        const s = search.toLowerCase();
        if (!`${e.firstName} ${e.lastName} ${e.email} ${e.employeeNo}`.toLowerCase().includes(s)) return false;
      }
      if (status && e.status !== status) return false;
      if (dept && e.departmentId !== dept) return false;
      if (type && e.employmentType !== type) return false;
      return true;
    });
  }, [all, search, status, dept, type]);

  const columns: Column<Employee>[] = [
    { key: "name", header: "Employee", accessor: (e) => e.lastName, render: (e) => <EmployeeCell id={e.id} /> },
    { key: "dept", header: "Department", accessor: (e) => departmentName(e.departmentId), render: (e) => <span className="text-ink-2">{departmentName(e.departmentId)}</span> },
    { key: "loc", header: "Location", render: (e) => <span className="text-ink-3">{locationName(e.locationId)}</span> },
    { key: "type", header: "Type", render: (e) => <Tag tone="gray">{TYPE_LABEL[e.employmentType]}</Tag> },
    { key: "status", header: "Status", accessor: (e) => e.status, render: (e) => <EmpStatusTag status={e.status} /> },
    { key: "mgr", header: "Manager", render: (e) => <span className="text-ink-3">{employeeName(e.managerId)}</span> },
    { key: "hire", header: "Hired", align: "right", accessor: (e) => e.hireDate, render: (e) => <span className="font-mono text-2xs text-ink-3">{fmtDate(e.hireDate)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Employees"
        description="Directory of everyone across all locations. Click a row for the full profile."
        actions={
          <>
            {session.can("export", "hr") && <Button icon={Download} variant="outline" onClick={() => downloadCsv("employees.csv", [["Employee No", "Name", "Email", "Department", "Location", "Type", "Status", "Hired"], ...rows.map((e) => [e.employeeNo, `${e.firstName} ${e.lastName}`, e.email, departmentName(e.departmentId), locationName(e.locationId), TYPE_LABEL[e.employmentType], e.status, e.hireDate])])}>Export</Button>}
            {canCreate && <Button icon={UserPlus} variant="primary" onClick={() => setAddOpen(true)}>Add employee</Button>}
          </>
        }
      />

      <Card padded={false} className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, ID…" className="min-w-[220px] flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:!w-44">
            <option value="">All statuses</option>
            {["active", "on_leave", "probation", "suspended", "terminated"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </Select>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="sm:!w-44">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:!w-44">
            <option value="">All types</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <span className="ml-auto flex items-center gap-2 text-xs text-ink-3">
            <Tag tone={live ? "green" : "gray"}>{live ? "Live · Rust + Postgres" : "Mock seed"}</Tag>
            <span className="flex items-center gap-1.5"><Filter size={13} /> {loading ? "…" : rows.length} result{rows.length === 1 ? "" : "s"}</span>
          </span>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        keyField={(e) => e.id}
        onRowClick={setSelected}
        empty={error ? `⚠ ${error}` : loading ? "Loading employees…" : "No employees match these filters."}
      />

      {/* Profile preview drawer */}
      <DetailModal open={!!selected} onClose={() => setSelected(null)} eyebrow="Employee" title={selected && `${selected.firstName} ${selected.lastName}`}>
        {selected && (
          <div>
            <p className="text-sm text-ink-3">{positionTitle(selected.positionId)} · {departmentName(selected.departmentId)}</p>
            <div className="mt-1.5 flex gap-1.5"><EmpStatusTag status={selected.status} /><Tag tone="gray">{TYPE_LABEL[selected.employmentType]}</Tag></div>

            <dl className="mt-5 space-y-3 text-sm">
              <Detail icon={Mail} label="Email" value={selected.email} />
              <Detail icon={Phone} label="Phone" value={selected.phone} />
              <Detail icon={MapPin} label="Location" value={locationName(selected.locationId)} />
              <Detail label="Employee No." value={selected.employeeNo} />
              <Detail label="Manager" value={employeeName(selected.managerId)} />
              <Detail label="Hire date" value={fmtDate(selected.hireDate)} />
              {session.can("read", "finance") || session.principal.primaryRole === "hr_manager" ? (
                <Detail label="Base compensation" value={`${formatMoney(selected.compensation.base)}${selected.compensation.payType === "hourly" ? " / hr" : " / yr"}`} />
              ) : null}
            </dl>

            <Link href={`/hrm/employees/${selected.id}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              Open full profile <ExternalLink size={14} />
            </Link>
          </div>
        )}
      </DetailModal>

      {/* Add employee modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add employee"
        description="Create a new employee record. Onboarding tasks are generated automatically."
        size="lg"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button><Button variant="primary" onClick={createEmployee} disabled={saving}>{saving ? "Creating…" : "Create employee"}</Button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required><Input value={form.firstName} onChange={upd("firstName")} placeholder="Jordan" /></Field>
          <Field label="Last name" required><Input value={form.lastName} onChange={upd("lastName")} placeholder="Avery" /></Field>
          <Field label="Work email" required className="col-span-2"><Input type="email" value={form.email} onChange={upd("email")} placeholder="jordan.avery@northwind.demo" /></Field>
          <Field label="Department" required>
            <Select value={form.departmentId} onChange={upd("departmentId")}>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
          </Field>
          <Field label="Location" required>
            <Select value={form.locationId} onChange={upd("locationId")}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
          </Field>
          <Field label="Employment type"><Select value={form.employmentType} onChange={upd("employmentType")}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Start date"><Input type="date" value={form.hireDate} onChange={upd("hireDate")} /></Field>
        </div>
        {formError && <div className="mt-3 rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-xs font-medium text-coral">{formError}</div>}
      </Modal>
    </>
  );
}

function Detail({ icon: Icon, label, value }: { icon?: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-ink-3">{Icon && <Icon size={13} />}{label}</dt>
      <dd className="text-right font-medium text-ink-2">{value}</dd>
    </div>
  );
}
