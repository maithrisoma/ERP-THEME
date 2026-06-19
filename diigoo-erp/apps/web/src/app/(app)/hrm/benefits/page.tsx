"use client";
import * as React from "react";
import {
  HeartPulse, Smile, Eye, PiggyBank, Shield, Sparkles, Layers, Users, Building2,
  Wallet, CalendarClock, UserPlus, Download, type LucideIcon,
} from "@/components/icon/lucide";
import { formatMoney, type Money } from "@/platform/types";
import { useSession } from "@/platform/session";
import {
  Card, CardHeader, StatCard, PageHeader, Tag, ProgressBar, SectionLabel, Button, DetailRow, type Tone,
} from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { Field, Select } from "@/components/ui/form";
import { FeatureGate } from "@/components/ui/gate";
import { db } from "@/modules/hrm/repo";
import { downloadCsv } from "@/lib/export";
import { EmployeeCell, fmtDate } from "@/modules/hrm/ui";
import type { BenefitPlan, BenefitEnrollment } from "@/modules/hrm/types";

const CATEGORY_TONE: Record<BenefitPlan["category"], Tone> = {
  health: "coral", dental: "blue", vision: "teal", retirement: "green", life: "navy", wellness: "amber",
};
const CATEGORY_ICON: Record<BenefitPlan["category"], LucideIcon> = {
  health: HeartPulse, dental: Smile, vision: Eye, retirement: PiggyBank, life: Shield, wellness: Sparkles,
};
const CATEGORY_LABEL: Record<BenefitPlan["category"], string> = {
  health: "Health", dental: "Dental", vision: "Vision", retirement: "Retirement", life: "Life", wellness: "Wellness",
};

const ENROLLMENT_TONE: Record<BenefitEnrollment["status"], Tone> = {
  enrolled: "green", waived: "gray", pending: "amber",
};

const USD = "USD";
function sumMoney(values: Money[]): Money {
  return { amount: values.reduce((a, m) => a + m.amount, 0), currency: USD };
}

export default function BenefitsPage() {
  return (
    <FeatureGate feature="hr.benefits">
      <BenefitsContent />
    </FeatureGate>
  );
}

function BenefitsContent() {
  const session = useSession();
  const canManage = session.can("update", "hr");
  const plans = db.benefitPlans;
  const [enrollments, setEnrollments] = React.useState<BenefitEnrollment[]>(() => db.benefitEnrollments);
  const headcount = React.useMemo(() => db.employees.filter((e) => e.status !== "terminated").length, []);

  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [selPlan, setSelPlan] = React.useState<BenefitPlan | null>(null);
  const [form, setForm] = React.useState({ employeeId: db.employees[0]?.id ?? "", planId: db.benefitPlans[0]?.id ?? "", dependents: 0 });
  function enroll() {
    const plan = db.benefitPlans.find((p) => p.id === form.planId);
    if (!plan) return;
    const e: BenefitEnrollment = {
      id: "be_" + Math.random().toString(36).slice(2, 7),
      employeeId: form.employeeId, planId: form.planId, planName: plan.name,
      status: "enrolled", effectiveDate: new Date().toISOString().slice(0, 10), dependents: Number(form.dependents) || 0,
    };
    setEnrollments((es) => [e, ...es]);
    setEnrollOpen(false);
    setForm((f) => ({ ...f, dependents: 0 }));
  }

  const totalEnrolled = plans.reduce((a, p) => a + p.enrolledCount, 0);
  const monthlyEmployer = sumMoney(plans.map((p) => ({ amount: p.employerCost.amount * p.enrolledCount, currency: USD })));
  const monthlyEmployee = sumMoney(plans.map((p) => ({ amount: p.employeeCost.amount * p.enrolledCount, currency: USD })));

  const columns: Column<BenefitEnrollment>[] = [
    { key: "emp", header: "Employee", accessor: (r) => db.employeeName(r.employeeId), render: (r) => <EmployeeCell id={r.employeeId} /> },
    { key: "plan", header: "Plan", accessor: (r) => r.planName, render: (r) => <span className="text-ink-2">{r.planName}</span> },
    { key: "status", header: "Status", accessor: (r) => r.status, render: (r) => <Tag tone={ENROLLMENT_TONE[r.status]}>{r.status}</Tag> },
    { key: "deps", header: "Dependents", align: "right", accessor: (r) => r.dependents, render: (r) => <span className="font-mono text-ink-2">{r.dependents}</span> },
    { key: "eff", header: "Effective", align: "right", accessor: (r) => r.effectiveDate, render: (r) => <span className="font-mono text-2xs text-ink-3">{fmtDate(r.effectiveDate)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Benefits"
        description="Plan catalog, employer contributions and enrollment status across the organization."
        actions={
          <>
            {session.can("export", "hr") && <Button icon={Download} variant="outline" onClick={() => downloadCsv("benefit-enrollments.csv", [["Employee", "Plan", "Status", "Dependents", "Effective"], ...enrollments.map((r) => [db.employeeName(r.employeeId), r.planName, r.status, r.dependents, r.effectiveDate])])}>Export</Button>}
            {canManage && <Button icon={UserPlus} variant="primary" onClick={() => setEnrollOpen(true)}>Enroll employee</Button>}
          </>
        }
      />

      {/* Open enrollment banner */}
      <Card className="mb-4 border-orange/30 bg-[#fff8f4]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange/12 text-orange-dark">
            <CalendarClock size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-bold text-navy">Open enrollment is in progress</h3>
              <Tag tone="orange">Window open</Tag>
            </div>
            <p className="mt-0.5 text-sm text-ink-3">
              Employees can review and change their elections through{" "}
              <span className="font-semibold text-ink-2">{fmtDate("2026-06-30")}</span>. Changes take effect the following pay cycle.
            </p>
          </div>
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active plans" value={plans.length} icon={Layers} tone="navy" hint="in catalog" />
        <StatCard label="Total enrolled" value={totalEnrolled} icon={Users} tone="teal" hint="across plans" />
        <StatCard label="Employer cost" value={formatMoney(monthlyEmployer).replace(".00", "")} icon={Building2} tone="green" hint="per period" />
        <StatCard label="Employee cost" value={formatMoney(monthlyEmployee).replace(".00", "")} icon={Wallet} tone="amber" hint="per period" />
      </div>

      {/* Plan catalog */}
      <Card className="mt-4">
        <SectionLabel>Plan catalog</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => {
            const tone = CATEGORY_TONE[p.category];
            const Icon = CATEGORY_ICON[p.category];
            const pct = Math.round((p.enrolledCount / Math.max(1, headcount)) * 100);
            return (
              <div key={p.id} onClick={() => setSelPlan(p)} className="cursor-pointer rounded-lg border border-line bg-surface p-4 shadow-card transition-colors hover:border-orange/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={iconWrapCls(tone)}>
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <Tag tone={tone}>{CATEGORY_LABEL[p.category]}</Tag>
                  </div>
                  <span className="text-2xs text-ink-3">{p.carrier}</span>
                </div>

                <h4 className="mt-3 text-sm font-bold text-navy">{p.name}</h4>

                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-3">Employee / period</dt>
                    <dd className="font-mono font-semibold text-ink-2">{formatMoney(p.employeeCost)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-3">Employer / period</dt>
                    <dd className="font-mono font-semibold text-navy">{formatMoney(p.employerCost)}</dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-line pt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-ink-3">Enrolled</span>
                    <span className="font-mono font-semibold text-navy">{p.enrolledCount} / {headcount}</span>
                  </div>
                  <ProgressBar value={pct} tone={tone} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Enrollment table */}
      <Card className="mt-4" padded={false}>
        <div className="p-5 pb-0">
          <CardHeader
            title="Enrollments"
            description={`${enrollments.length} employee election${enrollments.length === 1 ? "" : "s"} on record`}
          />
        </div>
        <DataTable
          columns={columns}
          rows={enrollments}
          keyField={(r) => r.id}
          empty="No enrollments on record."
          className="rounded-t-none border-0 border-t"
        />
      </Card>

      <DetailModal open={!!selPlan} onClose={() => setSelPlan(null)} eyebrow="Benefit plan" title={selPlan?.name}>
        {selPlan && (() => {
          return (
            <div>
              <div><Tag tone={CATEGORY_TONE[selPlan.category]}>{CATEGORY_LABEL[selPlan.category]}</Tag></div>
              <dl className="mt-5 space-y-3 text-sm">
                <DetailRow label="Carrier" value={selPlan.carrier} />
                <DetailRow label="Employee / period" value={formatMoney(selPlan.employeeCost)} />
                <DetailRow label="Employer / period" value={formatMoney(selPlan.employerCost)} />
                <DetailRow label="Enrolled" value={`${selPlan.enrolledCount} / ${headcount}`} />
              </dl>
              {canManage && (
                <Button variant="primary" icon={UserPlus} className="mt-6 w-full" onClick={() => { setForm((f) => ({ ...f, planId: selPlan.id })); setSelPlan(null); setEnrollOpen(true); }}>Enroll into this plan</Button>
              )}
            </div>
          );
        })()}
      </DetailModal>

      <Modal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        title="Enroll employee"
        description="Add a benefit election for an employee."
        size="md"
        footer={<><Button variant="ghost" onClick={() => setEnrollOpen(false)}>Cancel</Button><Button variant="primary" icon={UserPlus} onClick={enroll}>Enroll</Button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee" required><Select value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>{db.employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</Select></Field>
          <Field label="Plan" required><Select value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}>{db.benefitPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Dependents"><Select value={String(form.dependents)} onChange={(e) => setForm((f) => ({ ...f, dependents: Number(e.target.value) }))}>{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
        </div>
      </Modal>
    </>
  );
}

function iconWrapCls(tone: Tone) {
  const map: Record<Tone, string> = {
    navy: "bg-navy/10 text-navy", teal: "bg-teal/12 text-teal", blue: "bg-blue/10 text-blue",
    purple: "bg-purple/12 text-purple", green: "bg-green/12 text-green", amber: "bg-amber/12 text-amber",
    coral: "bg-coral/12 text-coral", gray: "bg-ink-3/12 text-ink-2", orange: "bg-orange/12 text-orange-dark",
  };
  return `inline-flex h-7 w-7 items-center justify-center rounded-md ${map[tone]}`;
}
