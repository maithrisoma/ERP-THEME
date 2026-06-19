"use client";
import * as React from "react";
import { Wallet, Users, Receipt, Banknote, CheckCircle2, CalendarClock } from "@/components/icon/lucide";
import { formatMoney } from "@/platform/types";
import { useSession } from "@/platform/session";
import { PageHeader, Card, CardHeader, StatCard, Button, Tag, SectionLabel, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { DetailModal } from "@/components/ui/overlay";
import { FeatureGate } from "@/components/ui/gate";
import { listPayrollRuns, getPayrollRun } from "@/modules/hrm/repo";
import { fmtDate } from "@/modules/hrm/ui";
import type { PayrollRun, PayrollLine } from "@/modules/hrm/types";

const RUN_STATUS_TONE: Record<PayrollRun["status"], Tone> = {
  draft: "gray",
  processing: "blue",
  pending_approval: "amber",
  finalized: "teal",
  paid: "green",
};

const RUN_STATUS_LABEL: Record<PayrollRun["status"], string> = {
  draft: "Draft",
  processing: "Processing",
  pending_approval: "Pending approval",
  finalized: "Finalized",
  paid: "Paid",
};

const PAY_CYCLE_LABEL: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  semimonthly: "Semi-monthly",
  monthly: "Monthly",
};

export default function PayrollPage() {
  return (
    <FeatureGate feature="hr.payroll">
      <PayrollScreen />
    </FeatureGate>
  );
}

function PayrollScreen() {
  const session = useSession();
  const runs = React.useMemo(() => listPayrollRuns(), []);
  const pending = React.useMemo(() => runs.find((r) => r.status === "pending_approval"), [runs]);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  // Local status overrides so "Approve & finalize" can flip a run without mutating seed data.
  const [statusOverrides, setStatusOverrides] = React.useState<Record<string, PayrollRun["status"]>>({});

  const canApprove = session.can("approve", "hr");
  const payCycle = session.tenant.payCycle;

  const statusOf = (r: PayrollRun): PayrollRun["status"] => statusOverrides[r.id] ?? r.status;

  const selected = selectedId ? getPayrollRun(selectedId) : undefined;
  const selectedStatus = selected ? statusOf(selected) : undefined;

  const columns: Column<PayrollRun>[] = [
    {
      key: "period",
      header: "Pay period",
      accessor: (r) => r.periodStart,
      render: (r) => (
        <span className="font-medium text-ink-2">
          {fmtDate(r.periodStart, { month: "short", day: "numeric" })} → {fmtDate(r.periodEnd)}
        </span>
      ),
    },
    {
      key: "payDate",
      header: "Pay date",
      accessor: (r) => r.payDate,
      render: (r) => <span className="font-mono text-2xs text-ink-3">{fmtDate(r.payDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => statusOf(r),
      render: (r) => {
        const s = statusOf(r);
        return <Tag tone={RUN_STATUS_TONE[s]}>{RUN_STATUS_LABEL[s]}</Tag>;
      },
    },
    {
      key: "employees",
      header: "Employees",
      align: "right",
      accessor: (r) => r.employeeCount,
      render: (r) => <span className="font-mono text-ink-2">{r.employeeCount}</span>,
    },
    {
      key: "gross",
      header: "Gross",
      align: "right",
      accessor: (r) => r.grossTotal.amount,
      render: (r) => <span className="font-mono text-ink-2">{formatMoney(r.grossTotal)}</span>,
    },
    {
      key: "net",
      header: "Net",
      align: "right",
      accessor: (r) => r.netTotal.amount,
      render: (r) => <span className="font-mono font-semibold text-navy">{formatMoney(r.netTotal)}</span>,
    },
  ];

  const lineColumns: Column<PayrollLine>[] = [
    {
      key: "employee",
      header: "Employee",
      accessor: (l) => l.employeeName,
      render: (l) => <span className="font-medium text-navy">{l.employeeName}</span>,
    },
    { key: "gross", header: "Gross", align: "right", accessor: (l) => l.gross.amount, render: (l) => <span className="font-mono text-ink-2">{formatMoney(l.gross)}</span> },
    { key: "taxes", header: "Taxes", align: "right", accessor: (l) => l.taxes.amount, render: (l) => <span className="font-mono text-ink-3">{formatMoney(l.taxes)}</span> },
    { key: "deductions", header: "Deductions", align: "right", accessor: (l) => l.deductions.amount, render: (l) => <span className="font-mono text-ink-3">{formatMoney(l.deductions)}</span> },
    { key: "net", header: "Net", align: "right", accessor: (l) => l.net.amount, render: (l) => <span className="font-mono font-semibold text-navy">{formatMoney(l.net)}</span> },
  ];

  const approveSelected = () => {
    if (!selected) return;
    setStatusOverrides((prev) => ({ ...prev, [selected.id]: "finalized" }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Payroll"
        description={`Run history and the upcoming pay run. Pay cycle: ${PAY_CYCLE_LABEL[payCycle] ?? payCycle}.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-2">
            <CalendarClock size={14} /> {PAY_CYCLE_LABEL[payCycle] ?? payCycle} cycle
          </span>
        }
      />

      {/* KPI row from the pending run */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Employees" value={pending ? pending.employeeCount : "—"} hint="next run" icon={Users} tone="navy" />
        <StatCard label="Gross" value={pending ? formatMoney(pending.grossTotal) : "—"} hint="next run" icon={Wallet} tone="blue" />
        <StatCard label="Taxes" value={pending ? formatMoney(pending.taxTotal) : "—"} hint="withheld" icon={Receipt} tone="amber" />
        <StatCard label="Net" value={pending ? formatMoney(pending.netTotal) : "—"} hint="next run" icon={Banknote} tone="green" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Payroll runs" description="All pay runs across the fiscal year. Click a run for line-level detail." icon={Wallet} />
        <DataTable
          columns={columns}
          rows={runs}
          keyField={(r) => r.id}
          onRowClick={(r) => setSelectedId(r.id)}
          empty="No payroll runs yet."
        />
      </Card>

      {/* Run detail drawer */}
      <DetailModal
        open={!!selected}
        onClose={() => setSelectedId(null)}
        eyebrow="Payroll run"
        title={selected ? `${fmtDate(selected.periodStart)} → ${fmtDate(selected.periodEnd)}` : undefined}
        size="xl"
        footer={
          selected && selectedStatus === "pending_approval" && canApprove ? (
            <Button variant="primary" icon={CheckCircle2} onClick={approveSelected}>
              Approve &amp; finalize
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xs uppercase tracking-wide text-ink-3">Pay date</div>
                <div className="font-mono text-sm font-semibold text-navy">{fmtDate(selected.payDate)}</div>
              </div>
              <Tag tone={RUN_STATUS_TONE[selectedStatus!]}>{RUN_STATUS_LABEL[selectedStatus!]}</Tag>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryTile label="Employees" value={String(selected.employeeCount)} />
              <SummaryTile label="Gross" value={formatMoney(selected.grossTotal)} />
              <SummaryTile label="Taxes" value={formatMoney(selected.taxTotal)} />
              <SummaryTile label="Deductions" value={formatMoney(selected.deductionTotal)} />
              <SummaryTile label="Net pay" value={formatMoney(selected.netTotal)} highlight />
            </div>

            <div className="mt-5">
              <SectionLabel>Line items</SectionLabel>
              <DataTable
                columns={lineColumns}
                rows={selected.lines}
                keyField={(l) => l.employeeId}
                empty="No line items."
                dense
              />
            </div>
          </div>
        )}
      </DetailModal>
    </>
  );
}

function SummaryTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "col-span-2 rounded-md border border-navy/15 bg-navy/[0.04] p-3" : "rounded-md border border-line bg-subtle p-3"}>
      <div className="text-2xs uppercase tracking-wide text-ink-3">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-bold text-navy">{value}</div>
    </div>
  );
}
