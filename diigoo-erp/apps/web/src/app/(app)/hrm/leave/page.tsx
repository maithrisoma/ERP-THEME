"use client";
import * as React from "react";
import { Palmtree, Check, X, CalendarPlus, ClipboardList, Scale, FileText } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { Card, CardHeader, PageHeader, Button, Tag, ProgressBar, EmptyState, DetailRow } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs, SegmentedControl } from "@/components/ui/tabs";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { Field, Input, Textarea, Select } from "@/components/ui/form";
import { FeatureGate } from "@/components/ui/gate";
import { useApi, apiWrite } from "@/lib/apiClient";
import { db } from "@/modules/hrm/repo";
import { EmployeeCell, fmtDate, LEAVE_STATUS_TONE } from "@/modules/hrm/ui";
import type { LeaveBalance } from "@/modules/hrm/types";

type TabId = "requests" | "balances" | "policies";

// Shape returned by the leave API (subset of the full LeaveRequest).
interface LeaveRow {
  id: string;
  employeeId: string;
  policyName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason?: string;
}

const APPROVER_ROLES = ["owner", "hr_manager", "accountant", "store_manager", "assistant_manager", "regional_manager", "super_admin"];

export default function LeavePage() {
  return (
    <FeatureGate feature="hr.leave">
      <LeaveScreen />
    </FeatureGate>
  );
}

function daysBetween(a: string, b: string) {
  const d = (new Date(b).getTime() - new Date(a).getTime()) / 86400000 + 1;
  return Number.isFinite(d) ? Math.max(1, Math.round(d)) : 1;
}

function LeaveScreen() {
  const session = useSession();
  const policies = session.tenant.leavePolicies;
  const canApprove = APPROVER_ROLES.includes(session.principal.primaryRole);

  const [tab, setTab] = React.useState<TabId>("requests");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [requestOpen, setRequestOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<LeaveRow | null>(null);

  // Live, role-scoped requests from the backend.
  const { data, loading, error, refetch } = useApi<LeaveRow[]>("/api/v1/leave-requests");
  const requests = data ?? [];

  const filtered = React.useMemo(
    () => (statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter)),
    [requests, statusFilter],
  );
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const [busy, setBusy] = React.useState<string | null>(null);
  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(id);
    const res = await apiWrite(`/api/v1/leave-requests/${id}`, { decision }, "PATCH");
    setBusy(null);
    if (res.ok) refetch();
  }

  // Request form
  const [form, setForm] = React.useState({ policyId: policies[0]?.id ?? "lp_pto", startDate: "2026-06-15", endDate: "2026-06-19", reason: "" });
  const [submitting, setSubmitting] = React.useState(false);
  const [formErr, setFormErr] = React.useState<string | null>(null);
  async function submitRequest() {
    setSubmitting(true);
    setFormErr(null);
    const policy = policies.find((p) => p.id === form.policyId);
    const res = await apiWrite("/api/v1/leave-requests", {
      policyId: form.policyId,
      policyName: policy?.name ?? "Paid Time Off",
      startDate: form.startDate,
      endDate: form.endDate,
      days: daysBetween(form.startDate, form.endDate),
      reason: form.reason || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      setRequestOpen(false);
      setForm((f) => ({ ...f, reason: "" }));
      refetch();
    } else {
      setFormErr(res.error ?? "Could not submit request");
    }
  }

  const columns: Column<LeaveRow>[] = [
    { key: "emp", header: "Employee", accessor: (r) => db.employeeName(r.employeeId), render: (r) => <EmployeeCell id={r.employeeId} /> },
    { key: "policy", header: "Policy", render: (r) => <Tag tone="blue">{r.policyName}</Tag> },
    { key: "range", header: "Dates", accessor: (r) => r.startDate, render: (r) => <span className="text-ink-2">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</span> },
    { key: "days", header: "Days", align: "right", accessor: (r) => r.days, render: (r) => <span className="font-mono text-navy">{r.days}</span> },
    { key: "status", header: "Status", accessor: (r) => r.status, render: (r) => <Tag tone={LEAVE_STATUS_TONE[r.status]}>{r.status}</Tag> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        r.status === "pending" && canApprove ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="subtle" icon={Check} disabled={busy === r.id} onClick={(e) => { e.stopPropagation(); decide(r.id, "approved"); }}>Approve</Button>
            <Button size="sm" variant="ghost" icon={X} disabled={busy === r.id} onClick={(e) => { e.stopPropagation(); decide(r.id, "rejected"); }} aria-label="Reject" />
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Leave & Time Off"
        description="Review requests, track accruals and manage your organization's leave policies."
        actions={<Button icon={CalendarPlus} variant="primary" onClick={() => setRequestOpen(true)}>Request time off</Button>}
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: "requests", label: "Requests", icon: ClipboardList, count: requests.length },
          { id: "balances", label: "Balances", icon: Scale },
          { id: "policies", label: "Policies", icon: FileText, count: policies.length },
        ]}
      />

      {tab === "requests" && (
        <>
          <Card padded={false} className="mb-4 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { id: "all", label: "All" },
                  { id: "pending", label: "Pending" },
                  { id: "approved", label: "Approved" },
                  { id: "rejected", label: "Rejected" },
                ]}
              />
              <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-3">
                <ClipboardList size={13} /> {pendingCount} pending · {filtered.length} shown
              </span>
            </div>
          </Card>

          <DataTable
            columns={columns}
            rows={filtered}
            keyField={(r) => r.id}
            onRowClick={setSelected}
            empty={loading ? "Loading requests…" : error ? `⚠ ${error}` : "No leave requests match this filter."}
          />
        </>
      )}

      {tab === "balances" && <BalancesTab />}
      {tab === "policies" && <PoliciesTab />}

      <DetailModal open={!!selected} onClose={() => setSelected(null)} eyebrow="Leave request" title={selected && db.employeeName(selected.employeeId)}>
        {selected && (
          <div>
            <div><Tag tone={LEAVE_STATUS_TONE[selected.status]}>{selected.status}</Tag></div>
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label="Policy" value={selected.policyName} />
              <DetailRow label="From" value={fmtDate(selected.startDate)} />
              <DetailRow label="To" value={fmtDate(selected.endDate)} />
              <DetailRow label="Days" value={selected.days} />
              <DetailRow label="Reason" value={selected.reason || "—"} />
            </dl>
            {selected.status === "pending" && canApprove && (
              <div className="mt-6 flex gap-2">
                <Button variant="primary" icon={Check} className="flex-1" onClick={() => { decide(selected.id, "approved"); setSelected(null); }}>Approve</Button>
                <Button variant="outline" icon={X} onClick={() => { decide(selected.id, "rejected"); setSelected(null); }}>Reject</Button>
              </div>
            )}
          </div>
        )}
      </DetailModal>

      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request time off"
        description="Submit a new leave request for approval."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRequestOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="primary" icon={Palmtree} onClick={submitRequest} disabled={submitting}>{submitting ? "Submitting…" : "Submit request"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Leave policy" required className="col-span-2">
            <Select value={form.policyId} onChange={(e) => setForm((f) => ({ ...f, policyId: e.target.value }))}>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Start date" required><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></Field>
          <Field label="End date" required><Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} /></Field>
          <Field label="Reason" className="col-span-2" hint={`${daysBetween(form.startDate, form.endDate)} day(s) — optional note for your manager.`}>
            <Textarea placeholder="Add an optional note…" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </Field>
        </div>
        {formErr && <div className="mt-3 rounded-md border border-coral/30 bg-coral/5 px-3 py-2 text-xs font-medium text-coral">{formErr}</div>}
      </Modal>
    </>
  );
}

// ─── Balances ────────────────────────────────────────────────────────────────
function BalancesTab() {
  const { data, loading } = useApi<LeaveBalance[]>("/api/v1/leave-balances");
  const rows = data ?? [];
  const columns: Column<LeaveBalance>[] = [
    { key: "emp", header: "Employee", accessor: (b) => db.employeeName(b.employeeId), render: (b) => <EmployeeCell id={b.employeeId} /> },
    { key: "policy", header: "Policy", render: (b) => <Tag tone="blue">{b.policyName}</Tag> },
    { key: "accrued", header: "Accrued", align: "right", accessor: (b) => b.accrued, render: (b) => <span className="font-mono text-ink-2">{b.accrued} {b.unit}</span> },
    {
      key: "used", header: "Used", width: 160,
      render: (b) => (
        <div>
          <div className="mb-1 flex items-center justify-between text-2xs text-ink-3"><span>Used</span><span className="font-mono">{b.used}/{b.accrued}</span></div>
          <ProgressBar value={pct(b.used, b.accrued)} tone="coral" />
        </div>
      ),
    },
    {
      key: "pending", header: "Pending", width: 160,
      render: (b) => (
        <div>
          <div className="mb-1 flex items-center justify-between text-2xs text-ink-3"><span>Pending</span><span className="font-mono">{b.pending}/{b.accrued}</span></div>
          <ProgressBar value={pct(b.pending, b.accrued)} tone="amber" />
        </div>
      ),
    },
    { key: "remaining", header: "Remaining", align: "right", accessor: (b) => b.accrued - b.used, render: (b) => <span className="font-mono font-semibold text-navy">{b.accrued - b.used} {b.unit}</span> },
  ];

  return (
    <Card padded={false}>
      <DataTable columns={columns} rows={rows} keyField={(b) => `${b.employeeId}-${b.policyId}`} empty={loading ? "Loading balances…" : "No leave balances recorded."} />
    </Card>
  );
}

// ─── Policies ────────────────────────────────────────────────────────────────
function PoliciesTab() {
  const policies = useSession((s) => s.tenant.leavePolicies);
  if (policies.length === 0) {
    return <EmptyState icon={FileText} title="No leave policies" description="Configure leave policies in tenant settings to enable time-off tracking." />;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {policies.map((p) => (
        <Card key={p.id}>
          <CardHeader title={p.name} icon={Palmtree} action={<Tag tone={p.paid ? "green" : "gray"}>{p.paid ? "Paid" : "Unpaid"}</Tag>} />
          <dl className="space-y-2.5 text-sm">
            <Row label="Accrual / year" value={`${p.accrualPerYear} ${p.unit}`} />
            <Row label="Carry-over max" value={p.carryOverMax > 0 ? `${p.carryOverMax} ${p.unit}` : "None"} />
            <Row label="Unit" value={p.unit} />
          </dl>
        </Card>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-mono font-medium text-ink-2">{value}</dd>
    </div>
  );
}

function pct(value: number, total: number) {
  return Math.min(100, Math.round((value / Math.max(1, total)) * 100));
}
