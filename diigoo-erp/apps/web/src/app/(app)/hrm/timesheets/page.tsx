"use client";
import * as React from "react";
import { Timer, CheckCircle2, FileClock, Clock, Check, X, Download } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Card, CardHeader, StatCard, Button, Tag, DetailRow, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { DetailModal } from "@/components/ui/overlay";
import { FeatureGate } from "@/components/ui/gate";
import { db } from "@/modules/hrm/repo";
import { downloadCsv } from "@/lib/export";
import { EmployeeCell, fmtDate } from "@/modules/hrm/ui";
import type { Timesheet } from "@/modules/hrm/types";

const STATUS: Record<Timesheet["status"], { tone: Tone; label: string }> = {
  draft: { tone: "gray", label: "Draft" },
  submitted: { tone: "amber", label: "Submitted" },
  approved: { tone: "green", label: "Approved" },
  rejected: { tone: "coral", label: "Rejected" },
};

export default function TimesheetsPage() {
  return (
    <FeatureGate feature="hr.attendance">
      <TimesheetsInner />
    </FeatureGate>
  );
}

function TimesheetsInner() {
  const session = useSession();
  const empId = session.principal.employeeId;
  const isEmployee = session.principal.primaryRole === "employee";
  const canApprove = session.can("approve", "hr") || session.can("update", "hr");
  const canExport = session.can("export", "hr");

  const [rows, setRows] = React.useState<Timesheet[]>(() => db.timesheets);
  const [sel, setSel] = React.useState<Timesheet | null>(null);

  // Employees only ever see their own timesheets.
  const visible = React.useMemo(
    () => (isEmployee && empId ? rows.filter((t) => t.employeeId === empId) : rows),
    [rows, isEmployee, empId],
  );

  function decide(id: string, status: Timesheet["status"]) {
    setRows((rs) => rs.map((t) => (t.id === id ? { ...t, status } : t)));
    setSel((s) => (s && s.id === id ? { ...s, status } : s));
  }

  const submitted = visible.filter((t) => t.status === "submitted").length;
  const approved = visible.filter((t) => t.status === "approved").length;
  const totalHours = visible.reduce((a, t) => a + t.totalHours, 0);
  const otHours = visible.reduce((a, t) => a + t.overtimeHours, 0);

  const columns: Column<Timesheet>[] = [
    { key: "emp", header: "Employee", accessor: (t) => db.employeeName(t.employeeId), render: (t) => <EmployeeCell id={t.employeeId} /> },
    { key: "period", header: "Period", render: (t) => <span className="text-ink-2">{fmtDate(t.periodStart, { month: "short", day: "numeric" })} – {fmtDate(t.periodEnd, { month: "short", day: "numeric" })}</span> },
    { key: "hours", header: "Hours", align: "right", accessor: (t) => t.totalHours, render: (t) => <span className="font-mono font-semibold text-navy">{t.totalHours.toFixed(1)}</span> },
    { key: "ot", header: "Overtime", align: "right", accessor: (t) => t.overtimeHours, render: (t) => <span className="font-mono text-2xs text-ink-3">{t.overtimeHours ? `${t.overtimeHours.toFixed(1)}h` : "—"}</span> },
    { key: "status", header: "Status", accessor: (t) => t.status, render: (t) => <Tag tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Tag> },
    {
      key: "actions", header: "", align: "right",
      render: (t) => (canApprove && t.status === "submitted" ? (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="subtle" icon={Check} onClick={() => decide(t.id, "approved")}>Approve</Button>
          <Button size="sm" variant="ghost" icon={X} aria-label="Return to draft" onClick={() => decide(t.id, "draft")} />
        </div>
      ) : null),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Timesheets"
        description={isEmployee ? "Your recorded hours by pay period." : "Project and task hours by employee, with approvals."}
        actions={canExport ? <Button icon={Download} variant="outline" onClick={() => downloadCsv("timesheets.csv", [["Employee", "Period start", "Period end", "Hours", "Overtime", "Status"], ...visible.map((t) => [db.employeeName(t.employeeId), t.periodStart, t.periodEnd, t.totalHours, t.overtimeHours, STATUS[t.status].label])])}>Export</Button> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Timesheets" value={visible.length} hint="this period" icon={FileClock} tone="navy" />
        <StatCard label="Awaiting approval" value={submitted} icon={Clock} tone={submitted ? "amber" : "green"} />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} tone="teal" />
        <StatCard label="Total hours" value={totalHours.toFixed(0)} hint={`${otHours.toFixed(0)} OT`} icon={Timer} tone="purple" />
      </div>

      <Card className="mt-4" padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Timesheets" description={`${visible.length} timesheet${visible.length === 1 ? "" : "s"} · ${submitted} awaiting approval`} icon={Timer} />
        </div>
        <DataTable columns={columns} rows={visible} keyField={(t) => t.id} onRowClick={setSel} empty="No timesheets recorded." />
      </Card>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Timesheet" title={sel && db.employeeName(sel.employeeId)}>
        {sel && (
          <div>
            <div><Tag tone={STATUS[sel.status].tone}>{STATUS[sel.status].label}</Tag></div>
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label="Period" value={`${fmtDate(sel.periodStart)} – ${fmtDate(sel.periodEnd)}`} />
              <DetailRow label="Total hours" value={`${sel.totalHours.toFixed(1)} h`} />
              <DetailRow label="Overtime" value={sel.overtimeHours ? `${sel.overtimeHours.toFixed(1)} h` : "None"} />
              <DetailRow label="Submitted" value={sel.submittedAt ? fmtDate(sel.submittedAt) : "Not submitted"} />
            </dl>
            {canApprove && sel.status === "submitted" && (
              <div className="mt-6 flex gap-2">
                <Button variant="primary" icon={Check} className="flex-1" onClick={() => { decide(sel.id, "approved"); setSel(null); }}>Approve</Button>
                <Button variant="outline" icon={X} onClick={() => { decide(sel.id, "draft"); setSel(null); }}>Return</Button>
              </div>
            )}
          </div>
        )}
      </DetailModal>
    </>
  );
}
