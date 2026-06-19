"use client";
import * as React from "react";
import {
  Users, TrendingDown, Wallet, PieChart, CalendarClock, ShieldCheck, Scale,
  Filter as FilterIcon, Download, Play, BarChart3, Sparkles, type LucideIcon,
} from "@/components/icon/lucide";
import { formatMoney } from "@/platform/types";
import { useSession } from "@/platform/session";
import { type FeatureKey } from "@/platform/packages";
import {
  Card, CardHeader, PageHeader, Button, Tag, SectionLabel, StatCard, type Tone,
} from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { Field, Select } from "@/components/ui/form";
import { FeatureGate } from "@/components/ui/gate";
import { BarChart, Donut, Sparkline } from "@/components/ui/charts";
import { useApi } from "@/lib/apiClient";
import { type HrAnalytics } from "@/modules/hrm/repo";
import { departments } from "@/modules/hrm/data";

const HEADCOUNT_TREND = [142, 148, 151, 149, 156, 160, 163, 167, 170, 172, 175, 179];

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
  feature?: FeatureKey;
}

const REPORTS: ReportDef[] = [
  { id: "headcount", title: "Headcount", description: "Active employees by department, location and employment type.", icon: Users, tone: "navy" },
  { id: "turnover", title: "Turnover", description: "Voluntary vs involuntary attrition and rolling YTD turnover rate.", icon: TrendingDown, tone: "coral" },
  { id: "payroll", title: "Payroll Cost", description: "Gross, net and employer burden across the most recent pay runs.", icon: Wallet, tone: "green" },
  { id: "dei", title: "Diversity & Inclusion", description: "Representation and pay-equity signals across the organization.", icon: PieChart, tone: "purple" },
  { id: "attendance", title: "Attendance", description: "Presence, lateness and absence trends for the current period.", icon: CalendarClock, tone: "blue" },
  { id: "compliance", title: "Compliance", description: "Training, certification and policy acknowledgement completion.", icon: ShieldCheck, tone: "teal" },
  { id: "compensation", title: "Compensation", description: "Base pay distribution, band placement and merit budget usage.", icon: Scale, tone: "amber" },
  { id: "recruitment", title: "Recruitment Funnel", description: "Applied through hired conversion and stage-by-stage velocity.", icon: BarChart3, tone: "orange", feature: "hr.recruitment" },
];

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = filename;
  el.click();
  URL.revokeObjectURL(url);
}

export default function HrReportsPage() {
  const session = useSession();
  const { data: a } = useApi<HrAnalytics>("/api/v1/analytics/hr");
  const canExport = session.can("export", "hr");
  const [active, setActive] = React.useState<ReportDef | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [period, setPeriod] = React.useState("This month");
  const [dept, setDept] = React.useState("All departments");
  const filtered = dept !== "All departments" || period !== "This month";

  // Department-scoped headcount used by the charts and exports.
  const byDept = React.useMemo(() => {
    if (!a) return [];
    if (dept === "All departments") return a.byDepartment;
    const only = a.byDepartment.filter((d) => d.label === dept);
    return only.length ? only : a.byDepartment;
  }, [a, dept]);

  function csvForReport(id: string): (string | number)[][] {
    if (!a) return [["No data"]];
    switch (id) {
      case "payroll":
        return [["Department", "Headcount"], ...byDept.map((d) => [d.label, d.value]), ["Net payroll (next run)", a.payrollNet.amount / 100]];
      case "turnover":
        return [["Metric", "Value"], ["Headcount", a.headcount], ["Turnover %", a.turnoverRate], ["New hires (30d)", a.newHires30d]];
      default:
        return [["Department", "Active employees"], ...byDept.map((d) => [d.label, d.value])];
    }
  }

  function exportReport(r: ReportDef) {
    downloadCsv(`${r.id}-report.csv`, csvForReport(r.id));
  }

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Reports & analytics"
        description="Run, schedule and export workforce reports across the organization."
        actions={
          <>
            <Button icon={FilterIcon} variant="outline" onClick={() => setFiltersOpen(true)}>Filters</Button>
            {canExport && <Button icon={Download} variant="outline" onClick={() => a && downloadCsv("hr-overview.csv", [["Department", "Headcount"], ...byDept.map((d) => [d.label, d.value])])}>Export all</Button>}
          </>
        }
      />

      {filtered && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-ink-3">Active filters:</span>
          <Tag tone="navy">{period}</Tag>
          {dept !== "All departments" && <Tag tone="orange">{dept}</Tag>}
          <button onClick={() => { setPeriod("This month"); setDept("All departments"); }} className="text-2xs font-semibold text-orange hover:underline">Clear</button>
        </div>
      )}

      <SectionLabel>Report catalog</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.filter((r) => !r.feature || session.feature(r.feature)).map((r) => (
          <Card key={r.id} className="flex flex-col">
            <CardHeader title={r.title} icon={r.icon} />
            <p className="-mt-2 flex-1 text-sm text-ink-3">{r.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" variant="primary" icon={Play} onClick={() => setActive(r)}>Run</Button>
              {canExport && <Button size="sm" variant="outline" icon={Download} onClick={() => exportReport(r)}>Export</Button>}
            </div>
          </Card>
        ))}
      </div>

      {a && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Headcount by department" description={dept === "All departments" ? "Active employees in your scope" : `Scoped to ${dept}`} action={<Sparkline data={HEADCOUNT_TREND} width={120} height={34} tone="teal" />} />
            <BarChart data={byDept} height={180} />
          </Card>
          <Card>
            <CardHeader title="Workforce mix" description="By employment type" />
            <Donut segments={a.byType.map((t) => ({ value: t.value, tone: t.tone, label: t.label }))} centerValue={a.headcount} centerLabel="people" />
          </Card>
        </div>
      )}

      {a && (
        <Card className="mt-4">
          <CardHeader
            title={<span className="inline-flex items-center gap-2">AI workforce narrative<Tag tone="purple"><Sparkles size={11} className="mr-1 inline-block" />AI</Tag></span>}
            description="Generated summary of the trends behind this month's numbers"
          />
          <FeatureGate feature="platform.ai_insights" soft>
            <div className="rounded-md border border-line bg-subtle p-4 text-sm leading-relaxed text-ink-2">
              <p>
                Headcount in your scope is <strong className="text-navy">{a.headcount}</strong> active employees with{" "}
                <strong className="text-navy">{a.newHires30d}</strong> hires in the last 30 days. The largest group is{" "}
                <strong className="text-navy">{a.byDepartment.slice().sort((x, y) => y.value - x.value)[0]?.label ?? "—"}</strong>.
              </p>
              <p className="mt-3">
                YTD turnover is <strong className="text-navy">{a.turnoverRate}%</strong>, attendance{" "}
                <strong className="text-navy">{a.attendanceRate}%</strong>, compliance{" "}
                <strong className="text-navy">{a.complianceRate}%</strong>, with{" "}
                <strong className="text-navy">{a.openRequisitions}</strong> open requisitions and{" "}
                <strong className="text-navy">{a.pendingApprovals}</strong> approvals pending.
              </p>
            </div>
          </FeatureGate>
        </Card>
      )}

      {/* Run report modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `${active.title} report` : ""}
        description={active?.description}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setActive(null)}>Close</Button>
            {active && canExport && <Button variant="primary" icon={Download} onClick={() => exportReport(active)}>Export CSV</Button>}
          </>
        }
      >
        {active && a && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Headcount" value={a.headcount} icon={Users} tone="navy" />
              {active.id === "payroll" ? (
                <StatCard label="Net payroll" value={formatMoney(a.payrollNet).replace(".00", "")} icon={Wallet} tone="green" />
              ) : (
                <StatCard label="New hires" value={a.newHires30d} icon={Users} tone="teal" />
              )}
              <StatCard label="Turnover" value={`${a.turnoverRate}%`} icon={TrendingDown} tone="coral" />
            </div>
            {active.id === "dei" || active.id === "compensation" ? (
              <Donut segments={a.byType.map((t) => ({ value: t.value, tone: t.tone, label: t.label }))} centerValue={a.headcount} centerLabel="people" />
            ) : (
              <div>
                <SectionLabel>By department</SectionLabel>
                <BarChart data={byDept} height={170} />
              </div>
            )}
            <p className="text-xs text-ink-3">Generated {new Date().toLocaleString()} · scope reflects your role.</p>
          </div>
        )}
      </Modal>

      {/* Filters modal */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Report filters"
        description="Scope the reports below."
        footer={<><Button variant="ghost" onClick={() => setFiltersOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => setFiltersOpen(false)}>Apply</Button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Period"><Select value={period} onChange={(e) => setPeriod(e.target.value)}><option>This month</option><option>This quarter</option><option>Year to date</option></Select></Field>
          <Field label="Department"><Select value={dept} onChange={(e) => setDept(e.target.value)}><option>All departments</option>{departments.map((d) => <option key={d.id}>{d.name}</option>)}</Select></Field>
        </div>
      </Modal>
    </>
  );
}
