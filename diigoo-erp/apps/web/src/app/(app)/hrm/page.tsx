"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, UserPlus, ClipboardCheck, Briefcase, Wallet, Check, X, Palmtree,
  CalendarDays, MessageSquare, Cake, Award, ArrowRight, FileText, ShieldCheck,
  Clock, HeartPulse, Target, Rocket, BarChart3, Network, SlidersHorizontal, TrendingUp, type LucideIcon,
} from "@/components/icon/lucide";
import { formatMoney } from "@/platform/types";
import { useSession } from "@/platform/session";
import { ROLES } from "@/platform/rbac";
import { hasDashboard, dashboardKind, DASH_KIND_LABEL } from "@/platform/dashboards";
import { Card, CardHeader, Button, Tag, ProgressBar, Avatar, useToneColor, type Tone } from "@/components/ui/primitives";
import { Donut, BarChart, KpiCard, RingProgress, AreaChart } from "@/components/ui/charts";
import { SegmentedControl } from "@/components/ui/tabs";
import { useApi, apiWrite } from "@/lib/apiClient";
import { leaveBalancesFor, payslipsFor, onboardingFor, db, type HrAnalytics } from "@/modules/hrm/repo";
import { fmtDate, fmtRelative } from "@/modules/hrm/ui";

export default function HrDashboardPage() {
  const role = useSession((s) => s.principal.primaryRole);
  // Operational roles land on their workspace, not a KPI dashboard.
  return hasDashboard(role) ? <Dashboard /> : <MyWorkspace />;
}

// ─── Shared bits ──────────────────────────────────────────────────────────
const APPROVER_ROLES = ["owner", "hr_manager", "accountant", "store_manager", "assistant_manager", "regional_manager", "super_admin"];
const TODAY = "2026-06-12";
const WEEK = ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"];

interface LeaveRow { id: string; employeeId: string; policyName: string; startDate: string; endDate: string; days: number; status: string; }

const EVENTS: { id: string; type: string; title: string; date: string; tone: Tone; icon: LucideIcon }[] = [
  { id: "v1", type: "Payroll run", title: "Pay period Jun 1–15", date: "2026-06-20", tone: "orange", icon: Wallet },
  { id: "v2", type: "Interview", title: "Store Manager — Westgate", date: "2026-06-16", tone: "navy", icon: MessageSquare },
  { id: "v3", type: "Holiday", title: "Juneteenth (US)", date: "2026-06-19", tone: "orange", icon: CalendarDays },
  { id: "v4", type: "Birthday", title: "Grace Bennett", date: "2026-06-18", tone: "navy", icon: Cake },
  { id: "v5", type: "Work anniversary", title: "James Okafor · 6 years", date: "2026-06-22", tone: "navy", icon: Award },
  { id: "v6", type: "Meeting", title: "Leadership sync", date: "2026-06-17", tone: "navy", icon: Users },
];

function greetingFor(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function shiftHours(s: { start: string; end: string }): number {
  const [sh, sm] = s.start.split(":").map(Number);
  const [eh, em] = s.end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

// ─── Executive / managerial dashboard (Bento) ───────────────────────────────
function Dashboard() {
  const session = useSession();
  const role = ROLES[session.principal.primaryRole];
  const kind = dashboardKind(session.principal.primaryRole);
  const router = useRouter();

  const { data: a } = useApi<HrAnalytics>("/api/v1/analytics/hr");
  const { data: pending, refetch } = useApi<LeaveRow[]>("/api/v1/leave-requests?status=pending");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [period, setPeriod] = React.useState("monthly");
  const tc = useToneColor();

  const canApprove = APPROVER_ROLES.includes(session.principal.primaryRole);
  const canCreate = session.can("create", "hr");
  // The executive dashboard shows a full overview of every area regardless of
  // plan — the individual feature *pages* still enforce package gating.
  const showOrg = true;
  const showAttendance = true;
  const showScheduling = true;
  const showLeave = true;
  const showPayroll = true;
  const showBenefits = true;
  const showPerformance = true;
  const showRecruit = true;
  const showOnboarding = true;
  const showDocuments = true;
  const showCompliance = true;

  const firstName = session.principal.name.split(" ")[0] || role.label;
  const initials = (session.principal.name || role.label).split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(id);
    const r = await apiWrite(`/api/v1/leave-requests/${id}`, { decision }, "PATCH");
    setBusy(null);
    if (r.ok) refetch();
  }

  const actions = [
    { label: "Add employee", icon: UserPlus, href: "/hrm/employees", show: canCreate, primary: true },
    { label: "Approve requests", icon: ClipboardCheck, href: "/hrm/leave", show: canApprove && showLeave, primary: false },
    { label: "Generate payroll", icon: Wallet, href: "/hrm/payroll", show: showPayroll && canApprove, primary: false },
    { label: "Post new job", icon: Briefcase, href: "/hrm/recruitment", show: showRecruit && canCreate, primary: false },
  ].filter((x) => x.show);

  if (!a || !a.byType) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-lg bg-line" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-lg border border-line bg-surface" />)}</div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-lg border border-line bg-surface" />)}</div>
      </div>
    );
  }

  const pendingRun = db.payrollRuns.find((r) => r.status === "pending_approval");
  const pendingLeave = pending ?? [];

  // ── Feature aggregations (visualised below) ──
  // Attendance
  const todayAtt = db.attendance.filter((x) => x.date === TODAY);
  const attSegments = [
    { value: todayAtt.filter((x) => x.status === "present").length, tone: "navy" as Tone, label: "Present" },
    { value: todayAtt.filter((x) => x.status === "remote").length, tone: "teal" as Tone, label: "Remote" },
    { value: todayAtt.filter((x) => x.status === "late").length, tone: "orange" as Tone, label: "Late" },
  ].filter((s) => s.value > 0);
  // Scheduling
  const openShifts = db.shifts.filter((s) => s.status === "open").length;
  const scheduledHours = Math.round(db.shifts.reduce((sum, s) => sum + shiftHours(s), 0));
  const coverageDays = WEEK.filter((d) => db.shifts.some((s) => s.date === d)).length;
  const shiftsPerDay = WEEK.map((d) => ({ label: new Date(d).toLocaleDateString("en-US", { weekday: "short" }), value: db.shifts.filter((s) => s.date === d).length }));
  // Payroll
  const run = pendingRun ?? db.payrollRuns[db.payrollRuns.length - 1];
  const kUsd = (m: { amount: number }) => Math.round(m.amount / 100000);
  const payrollBreakdown = [
    { label: "Gross", value: kUsd(run.grossTotal) },
    { label: "Taxes", value: kUsd(run.taxTotal) },
    { label: "Deduct.", value: kUsd(run.deductionTotal) },
    { label: "Net", value: kUsd(run.netTotal) },
  ];
  // Benefits
  const totalEnrolled = db.benefitPlans.reduce((s, p) => s + p.enrolledCount, 0);
  const benefitBars = db.benefitPlans.map((p) => ({ label: cap(p.category), value: p.enrolledCount }));
  // Performance
  const reviewStages: { id: string; label: string }[] = [
    { id: "not_started", label: "Not started" }, { id: "self_review", label: "Self" },
    { id: "manager_review", label: "Manager" }, { id: "calibration", label: "Calib." }, { id: "complete", label: "Done" },
  ];
  const reviewStageBars = reviewStages.map((s) => ({ label: s.label, value: db.reviews.filter((r) => r.status === s.id).length }));
  const reviewsComplete = db.reviews.filter((r) => r.status === "complete").length;
  const rated = db.reviews.filter((r) => typeof r.rating === "number");
  const avgRating = rated.length ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1) : "—";
  const goalsOnTrack = db.goals.filter((g) => g.status === "on_track" || g.status === "done").length;
  // Recruitment
  const stageLabel: Record<string, string> = { applied: "Applied", screening: "Screen", interview: "Interview", offer: "Offer", hired: "Hired" };
  const pcount = (s: string) => db.candidates.filter((c) => c.stage === s).length;
  const pipelineBars = Object.keys(stageLabel).map((s) => ({ label: stageLabel[s], value: pcount(s) }));
  const openReqs = db.requisitions.filter((r) => r.status === "open").length;
  const totalApplicants = db.requisitions.reduce((s, r) => s + r.applicantCount, 0);
  // Onboarding
  const obTotal = db.onboardingTasks.length;
  const obDone = db.onboardingTasks.filter((t) => t.done).length;
  const obPct = Math.round((obDone / Math.max(1, obTotal)) * 100);
  const obHires = new Set(db.onboardingTasks.map((t) => t.employeeId)).size;
  const obOverdue = db.onboardingTasks.filter((t) => !t.done && t.dueDate < TODAY).length;
  // Compliance
  const compDone = db.compliance.reduce((s, c) => s + c.completed, 0);
  const compTotal = db.compliance.reduce((s, c) => s + c.total, 0);
  const compAtRisk = db.compliance.filter((c) => c.completed < c.total);
  // Documents
  const docTotal = db.documents.length;
  const docExpiring = db.documents.filter((d) => d.status === "expiring").length;
  const docCats = Array.from(new Set(db.documents.map((d) => d.category)));
  const docByCategory = docCats.map((c) => ({ label: cap(c), value: db.documents.filter((d) => d.category === c).length }));
  // 12-month trends (deterministic demo series ending at the live values).
  const MONTHS12 = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const headcountTrend = [142, 145, 148, 151, 149, 153, 156, 160, 163, 167, 172, a.headcount];
  const hiresTrend = [4, 5, 3, 6, 4, 5, 7, 4, 6, 5, 8, Math.max(1, a.newHires30d)];
  const attritionTrend = [2, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2];
  const ytdGrowth = Math.round(((a.headcount - headcountTrend[0]) / headcountTrend[0]) * 100);
  const HC_TREND: Record<string, { labels: string[]; data: number[] }> = {
    daily: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], data: [176, 176, 177, 178, 178, 179, a.headcount] },
    weekly: { labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"], data: [168, 170, 171, 173, 174, 176, 177, a.headcount] },
    monthly: { labels: MONTHS12, data: headcountTrend },
  };
  const hc = HC_TREND[period];

  const showTime = showAttendance || showScheduling || showLeave;
  const showPay = showPayroll || showBenefits;
  const showTalent = showPerformance || showRecruit || showOnboarding;
  const showRecords = showCompliance || showDocuments;

  // At-a-glance KPIs (gated, alternating navy/orange).
  const kpis = [
    { show: true, label: "Total employees", value: a.headcount, icon: Users, tone: "navy" as Tone, hint: "active", delta: "+4.2%", up: true, spark: [142, 151, 149, 160, 167, 172, 179] },
    { show: showAttendance, label: "Attendance today", value: `${a.attendanceRate}%`, icon: Clock, tone: "teal" as Tone, hint: "present rate", delta: "+1.8%", up: true, spark: [92, 94, 91, 95, 96, 94, a.attendanceRate] },
    { show: true, label: "Pending approvals", value: a.pendingApprovals, icon: ClipboardCheck, tone: "orange" as Tone, hint: "awaiting action", spark: [5, 7, 4, 8, 6, 5, a.pendingApprovals] },
    { show: showRecruit, label: "Open positions", value: a.openRequisitions, icon: Briefcase, tone: "blue" as Tone, hint: "actively hiring", spark: [1, 2, 2, 3, 2, 3, a.openRequisitions] },
    { show: showPayroll, label: "Payroll (next run)", value: formatMoney(a.payrollNet).replace(".00", ""), icon: Wallet, tone: "green" as Tone, hint: pendingRun ? "pending approval" : "up to date", delta: "+3.1%", up: true, spark: [58, 60, 62, 61, 63, 64, 66] },
    { show: showCompliance, label: "Compliance", value: `${a.complianceRate}%`, icon: ShieldCheck, tone: "purple" as Tone, hint: "completion", delta: "+2%", up: true, spark: [88, 90, 89, 92, 93, 94, a.complianceRate] },
  ].filter((k) => k.show);

  // Quick actions — one per feature the role + package allows.
  const quickActions = [
    { icon: UserPlus, label: "Add employee", href: "/hrm/employees", tone: "navy" as Tone, show: canCreate },
    { icon: Network, label: "View org chart", href: "/hrm/org", tone: "orange" as Tone, show: showOrg },
    { icon: Clock, label: "Review attendance", href: "/hrm/attendance", tone: "navy" as Tone, show: showAttendance },
    { icon: CalendarDays, label: "Edit schedule", href: "/hrm/scheduling", tone: "orange" as Tone, show: showScheduling },
    { icon: Palmtree, label: "Approve leave", href: "/hrm/leave", tone: "navy" as Tone, show: showLeave && canApprove },
    { icon: Wallet, label: "Run payroll", href: "/hrm/payroll", tone: "orange" as Tone, show: showPayroll && canApprove },
    { icon: HeartPulse, label: "Manage benefits", href: "/hrm/benefits", tone: "navy" as Tone, show: showBenefits },
    { icon: Target, label: "Start a review", href: "/hrm/performance", tone: "orange" as Tone, show: showPerformance },
    { icon: Briefcase, label: "Post a job", href: "/hrm/recruitment", tone: "navy" as Tone, show: showRecruit && canCreate },
    { icon: Rocket, label: "Onboard a hire", href: "/hrm/onboarding", tone: "orange" as Tone, show: showOnboarding },
    { icon: FileText, label: "Upload document", href: "/hrm/documents", tone: "navy" as Tone, show: showDocuments },
    { icon: ShieldCheck, label: "Check compliance", href: "/hrm/compliance", tone: "orange" as Tone, show: showCompliance },
    { icon: BarChart3, label: "View reports", href: "/hrm/reports", tone: "navy" as Tone, show: true },
    { icon: SlidersHorizontal, label: "HR settings", href: "/hrm/settings", tone: "orange" as Tone, show: session.feature("hr.custom_fields") && session.can("update", "hr") },
  ].filter((q) => q.show);

  return (
    <div className="space-y-6">
      {/* ─── Hero ─── */}
      <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-6 shadow-card sm:p-7">
        <span className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(0,70,128,.07),transparent_70%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange/10 text-lg font-bold text-orange ring-1 ring-orange/20 sm:flex">{initials}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[2px] text-orange">
                {DASH_KIND_LABEL[kind]}
                <span className="hidden font-medium normal-case tracking-normal text-ink-3 sm:inline">· {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-navy">{greetingFor()}, {firstName}</h1>
              <p className="mt-0.5 text-sm text-ink-3">{role.label} · {session.tenant.branding.companyName}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <HeroChip icon={Users} label="headcount" value={a.headcount} />
                <HeroChip icon={ClipboardCheck} label="pending approvals" value={a.pendingApprovals} />
                {showRecruit && <HeroChip icon={Briefcase} label="open positions" value={a.openRequisitions} />}
              </div>
            </div>
          </div>
          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {actions.map((act) => (
                <Button key={act.label} variant={act.primary ? "primary" : "outline"} icon={act.icon} onClick={() => router.push(act.href)}>{act.label}</Button>
              ))}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink-2"><ShieldCheck size={13} className="text-green" /> Read-only access</span>
          )}
        </div>
      </div>

      {/* ─── At a glance ─── */}
      <Section label="At a glance" sub="Key metrics across your scope">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} tone={k.tone} hint={k.hint} delta={k.delta} up={k.up} spark={k.spark} />
          ))}
        </div>
      </Section>

      {/* ─── Trends ─── */}
      <Section label="Trends" sub="Trailing 12 months" href="/hrm/reports" linkLabel="Analytics">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Headcount growth"
              description={period === "monthly" ? `Active employees · ▲ ${ytdGrowth}% YoY` : period === "weekly" ? "Active employees · last 8 weeks" : "Active employees · last 7 days"}
              icon={TrendingUp}
              action={<SegmentedControl value={period} onChange={setPeriod} options={[{ id: "daily", label: "Day" }, { id: "weekly", label: "Week" }, { id: "monthly", label: "Month" }]} />}
            />
            <AreaChart series={[{ name: "Headcount", tone: "navy", data: hc.data }]} labels={hc.labels} height={210} />
          </Card>
          <Card>
            <CardHeader title="Hiring vs attrition" description="Joiners & leavers / month" icon={UserPlus} />
            <AreaChart series={[{ name: "Hires", tone: "orange", data: hiresTrend }, { name: "Attrition", tone: "coral", data: attritionTrend }]} labels={MONTHS12} height={210} />
          </Card>
        </div>
      </Section>

      {/* ─── Workforce ─── */}
      <Section label="Workforce" sub="People & organization" href="/hrm/employees" linkLabel="Directory">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader title="By employment type" description={`${a.headcount} active people`} icon={Users} />
            <Donut segments={a.byType.map((t) => ({ value: t.value, tone: t.tone, label: t.label }))} centerValue={a.headcount} centerLabel="people" size={150} />
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader title="Headcount by department" description="Tap a bar for its share" icon={BarChart3} action={showOrg ? <Link href="/hrm/org" className="text-xs font-semibold text-orange hover:underline">Org chart →</Link> : undefined} />
            <BarChart data={a.byDepartment} height={190} />
          </Card>
        </div>
      </Section>

      {/* ─── Time & attendance ─── */}
      {showTime && (
        <Section label="Time & attendance">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {showAttendance && (
              <Card>
                <CardHeader title="Attendance today" description={fmtDate(TODAY, { month: "short", day: "numeric" })} icon={Clock} action={<Link href="/hrm/attendance" className="text-xs font-semibold text-orange hover:underline">Details →</Link>} />
                {attSegments.length ? (
                  <Donut segments={attSegments} centerValue={`${a.attendanceRate}%`} centerLabel="present" size={140} />
                ) : <div className="rounded-md bg-subtle py-8 text-center text-sm text-ink-3">No attendance logged.</div>}
              </Card>
            )}
            {showScheduling && (
              <Card>
                <CardHeader title="This week's schedule" description="Jun 15–21" icon={CalendarDays} action={<Link href="/hrm/scheduling" className="text-xs font-semibold text-orange hover:underline">Roster →</Link>} />
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Total shifts" value={db.shifts.length} tone="navy" />
                  <MiniStat label="Open shifts" value={openShifts} tone={openShifts ? "orange" : "navy"} />
                  <MiniStat label="Scheduled hrs" value={scheduledHours} tone="navy" />
                  <MiniStat label="Coverage" value={`${coverageDays}/7`} tone="navy" />
                </div>
                <div className="mt-3"><BarChart data={shiftsPerDay} height={92} tone="navy" /></div>
              </Card>
            )}
            {showLeave && (
              <Card>
                <CardHeader title="Leave approvals" description={`${pendingLeave.length} pending`} icon={Palmtree} action={<Link href="/hrm/leave" className="text-xs font-semibold text-orange hover:underline">View all</Link>} />
                {pendingLeave.length === 0 ? (
                  <div className="rounded-md bg-subtle py-6 text-center text-sm text-ink-3">Nothing pending — you&apos;re all caught up.</div>
                ) : (
                  <div className="divide-y divide-line">
                    {pendingLeave.slice(0, 4).map((r) => (
                      <div key={r.id} className="flex items-center gap-3 py-2">
                        <Avatar name={db.employeeName(r.employeeId)} tone="navy" size={28} />
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="truncate text-sm font-semibold text-navy">{db.employeeName(r.employeeId)}</div>
                          <div className="truncate text-2xs text-ink-3">{r.policyName} · {fmtDate(r.startDate, { month: "short", day: "numeric" })}–{fmtDate(r.endDate, { month: "short", day: "numeric" })} · {r.days}d</div>
                        </div>
                        {canApprove ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="subtle" icon={Check} disabled={busy === r.id} onClick={() => decide(r.id, "approved")}>Approve</Button>
                            <Button size="sm" variant="ghost" icon={X} disabled={busy === r.id} onClick={() => decide(r.id, "rejected")} aria-label="Reject" />
                          </div>
                        ) : <Tag tone="amber">Pending</Tag>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </Section>
      )}

      {/* ─── Pay & benefits ─── */}
      {showPay && (
        <Section label="Pay & benefits">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {showPayroll && (
              <Card>
                <CardHeader title="Payroll — next run" description={`${run.periodStart} → ${run.periodEnd}`} icon={Wallet} action={<Link href="/hrm/payroll" className="text-xs font-semibold text-orange hover:underline">Open →</Link>} />
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xs uppercase tracking-wide text-ink-3">Net total</div>
                    <div className="font-mono text-2xl font-bold text-navy">{formatMoney(run.netTotal).replace(".00", "")}</div>
                  </div>
                  <Tag tone={pendingRun ? "amber" : "green"}>{pendingRun ? "Pending approval" : "Paid"}</Tag>
                </div>
                <div className="mt-3"><BarChart data={payrollBreakdown} height={120} valueFmt={(v) => `$${v}k`} /></div>
                <div className="mt-2 text-2xs text-ink-3">{run.employeeCount} employees · biweekly</div>
              </Card>
            )}
            {showBenefits && (
              <Card>
                <CardHeader title="Benefits enrollment" description={`${totalEnrolled} enrollments · ${db.benefitPlans.length} plans`} icon={HeartPulse} action={<Link href="/hrm/benefits" className="text-xs font-semibold text-orange hover:underline">Plans →</Link>} />
                <BarChart data={benefitBars} height={158} />
              </Card>
            )}
          </div>
        </Section>
      )}

      {/* ─── Talent ─── */}
      {showTalent && (
        <Section label="Talent">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {showPerformance && (
              <Card>
                <CardHeader title="Performance · 2026 H1" description={`${reviewsComplete}/${db.reviews.length} reviews complete`} icon={Target} action={<Link href="/hrm/performance" className="text-xs font-semibold text-orange hover:underline">Reviews →</Link>} />
                <BarChart data={reviewStageBars} height={120} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MiniStat label="Avg rating" value={`${avgRating}${avgRating === "—" ? "" : "/5"}`} tone="orange" />
                  <MiniStat label="Goals on track" value={`${goalsOnTrack}/${db.goals.length}`} tone="navy" />
                </div>
              </Card>
            )}
            {showRecruit && (
              <Card>
                <CardHeader title="Recruitment pipeline" description={`${openReqs} open reqs · ${totalApplicants} applicants`} icon={UserPlus} action={<Link href="/hrm/recruitment" className="text-xs font-semibold text-orange hover:underline">Pipeline →</Link>} />
                <BarChart data={pipelineBars} height={120} />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat label="Interview" value={pcount("interview")} tone="navy" />
                  <MiniStat label="Offers" value={pcount("offer")} tone="orange" />
                  <MiniStat label="Hired" value={pcount("hired")} tone="navy" />
                </div>
              </Card>
            )}
            {showOnboarding && (
              <Card>
                <CardHeader title="Onboarding" description={`${obHires} hire${obHires === 1 ? "" : "s"} in progress`} icon={Rocket} action={<Link href="/hrm/onboarding" className="text-xs font-semibold text-orange hover:underline">Tasks →</Link>} />
                <div className="flex items-center gap-5">
                  <RingProgress value={obPct} size={96} thickness={9} tone={obPct >= 100 ? "green" : "orange"} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm"><span className="text-ink-3">Tasks done</span><span className="font-mono font-semibold text-navy">{obDone}/{obTotal}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-ink-3">Overdue</span><span className={`font-mono font-semibold ${obOverdue ? "text-coral" : "text-green"}`}>{obOverdue}</span></div>
                    <ProgressBar value={obPct} tone={obPct >= 100 ? "green" : "orange"} />
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Section>
      )}

      {/* ─── Records & compliance ─── */}
      {showRecords && (
        <Section label="Records & compliance">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {showCompliance && (
              <Card>
                <CardHeader title="Compliance" description={`${compDone}/${compTotal} requirements met`} icon={ShieldCheck} action={<Link href="/hrm/compliance" className="text-xs font-semibold text-orange hover:underline">Details →</Link>} />
                <div className="flex items-center gap-5">
                  <RingProgress value={a.complianceRate} size={96} thickness={9} tone={a.complianceRate >= 90 ? "green" : a.complianceRate >= 75 ? "amber" : "coral"} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {compAtRisk.length === 0 ? (
                      <div className="text-sm text-ink-3">All requirements on track.</div>
                    ) : compAtRisk.slice(0, 3).map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate text-ink-2">{c.name}</span>
                        <Tag tone={c.completed / c.total >= 0.8 ? "amber" : "coral"}>{c.completed}/{c.total}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
            {showDocuments && (
              <Card>
                <CardHeader title="Documents" description={`${docTotal} on file`} icon={FileText} action={<Link href="/hrm/documents" className="text-xs font-semibold text-orange hover:underline">Library →</Link>} />
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Total on file" value={docTotal} tone="navy" />
                  <MiniStat label="Expiring soon" value={docExpiring} tone={docExpiring ? "orange" : "green"} />
                </div>
                <div className="mt-3"><BarChart data={docByCategory} height={96} /></div>
              </Card>
            )}
          </div>
        </Section>
      )}

      {/* ─── Workspace: activity + events + quick actions ─── */}
      <Section label="Workspace">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Recent activity" description="Across your scope" icon={MessageSquare} />
            <ol className="relative space-y-0.5">
              {db.activity.map((ev, i) => (
                <li key={ev.id} className="relative flex items-start gap-3 py-2 text-sm">
                  {i < db.activity.length - 1 && <span className="absolute bottom-0 left-[15px] top-9 w-px bg-line" />}
                  <Avatar name={ev.actor} tone="navy" size={30} />
                  <div className="min-w-0 flex-1 leading-snug">
                    <span className="text-ink-2"><strong className="text-navy">{ev.actor}</strong> {ev.action} <strong className="text-navy">{ev.target}</strong></span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-ink-3"><Tag tone="gray">{ev.module}</Tag>{fmtRelative(ev.at)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader title="Upcoming" description="Next 7 days" icon={CalendarDays} />
            <div className="divide-y divide-line">
              {[...EVENTS].sort((x, y) => x.date.localeCompare(y.date)).map((e) => (
                <div key={e.id} className="group flex items-center gap-3 py-2">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-subtle leading-none">
                    <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: tc(e.tone) }}>{fmtDate(e.date, { month: "short" })}</span>
                    <span className="mt-0.5 font-mono text-sm font-bold text-navy">{fmtDate(e.date, { day: "numeric" })}</span>
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-xs font-semibold text-navy">{e.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-2xs text-ink-3"><e.icon size={11} style={{ color: tc(e.tone) }} /> {e.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </Section>

      {/* ─── Jump to any feature ─── */}
      <Section label="Jump to" sub="Every feature you can use">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {quickActions.map((q) => (
            <QuickAction key={q.label} icon={q.icon} label={q.label} href={q.href} tone={q.tone} show />
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Dashboard helpers ──────────────────────────────────────────────────────
function Section({ label, sub, href, linkLabel = "View all", children }: { label: string; sub?: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="shrink-0 text-xs font-bold uppercase tracking-[1.5px] text-orange">{label}</h2>
        {sub && <span className="hidden shrink-0 text-2xs text-ink-3 sm:inline">{sub}</span>}
        <span className="h-px flex-1 bg-line" />
        {href && <Link href={href} className="shrink-0 text-xs font-semibold text-orange hover:underline">{linkLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value, tone = "navy" }: { label: string; value: React.ReactNode; tone?: Tone }) {
  const tc = useToneColor();
  return (
    <div className="rounded-md border border-line bg-subtle px-3 py-2">
      <div className="font-mono text-lg font-bold leading-none" style={{ color: tc(tone) }}>{value}</div>
      <div className="mt-1 text-2xs text-ink-3">{label}</div>
    </div>
  );
}

function HeroChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-subtle px-2.5 py-1.5 text-xs text-ink-2">
      <Icon size={13} className="text-orange" /> <strong className="font-mono text-navy">{value}</strong> {label}
    </span>
  );
}

function QuickAction({ icon: Icon, label, href, tone = "navy", show }: { icon: LucideIcon; label: string; href: string; tone?: Tone; show: boolean }) {
  const tc = useToneColor();
  if (!show) return null;
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-2 transition-all hover:border-orange/40 hover:bg-orange/[.03]">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${tc(tone)}1f`, color: tc(tone) }}>
        <Icon size={14} strokeWidth={2} />
      </span>
      <span className="flex-1">{label}</span>
      <ArrowRight size={14} className="text-line transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
    </Link>
  );
}

// ─── Operational / employee workspace (no KPI dashboard) ────────────────────
function MyWorkspace() {
  const empId = useSession((s) => s.principal.employeeId) ?? "e_1042";
  const balances = leaveBalancesFor(empId);
  const payslip = payslipsFor(empId)[0];
  const tasks = onboardingFor(empId);

  return (
    <>
      <div className="relative mb-5 overflow-hidden rounded-lg border border-line bg-surface p-6 shadow-card">
        <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,70,128,.07),transparent_70%)]" />
        <div className="relative">
          <div className="text-2xs font-bold uppercase tracking-[2px] text-orange">My workspace</div>
          <h1 className="mt-1 text-2xl font-bold text-navy">{greetingFor()}</h1>
          <p className="mt-1 text-sm text-ink-3">Your time off, pay and tasks in one place.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Time off balance" icon={Palmtree} />
          <div className="space-y-3">
            {balances.map((b) => (
              <div key={b.policyId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-2">{b.policyName}</span>
                  <span className="font-mono font-semibold text-navy">{b.accrued - b.used} / {b.accrued} {b.unit}</span>
                </div>
                <ProgressBar value={((b.accrued - b.used) / Math.max(1, b.accrued)) * 100} tone="teal" />
              </div>
            ))}
          </div>
          <Button variant="primary" className="mt-4 w-full" icon={Palmtree} onClick={() => (window.location.href = "/hrm/leave")}>Request time off</Button>
        </Card>

        <Card>
          <CardHeader title="Latest payslip" icon={Wallet} />
          {payslip ? (
            <div>
              <div className="text-2xs uppercase tracking-wide text-ink-3">Net pay · {fmtDate(payslip.payDate)}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-navy">{formatMoney(payslip.net)}</div>
              <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs">
                <Row label="Gross" value={formatMoney(payslip.gross)} />
                {payslip.taxes.map((t, i) => <Row key={i} label={t.label} value={`- ${formatMoney(t.amount)}`} />)}
                {payslip.deductions.map((d, i) => <Row key={i} label={d.label} value={`- ${formatMoney(d.amount)}`} />)}
              </div>
            </div>
          ) : <p className="text-sm text-ink-3">No payslip available.</p>}
        </Card>

        <Card>
          <CardHeader title="My tasks" icon={ClipboardCheck} />
          {tasks.length === 0 ? (
            <p className="text-sm text-ink-3">No open tasks. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full ${t.done ? "bg-green text-white" : "border border-line"}`}>{t.done && <Check size={11} />}</span>
                  <span className={t.done ? "text-ink-3 line-through" : "text-ink-2"}>{t.title}</span>
                  <span className="ml-auto text-2xs text-ink-3">{fmtDate(t.dueDate, { month: "short", day: "numeric" })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className="font-mono text-ink-2">{value}</span>
    </div>
  );
}
