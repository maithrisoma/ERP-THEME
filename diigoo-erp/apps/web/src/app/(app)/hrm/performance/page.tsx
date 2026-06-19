"use client";
import * as React from "react";
import { Target, ClipboardCheck, Star, TrendingUp, Gauge, Download } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { Card, CardHeader, StatCard, PageHeader, Button, Tag, ProgressBar, DetailRow, type Tone, toneHex } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { DetailModal } from "@/components/ui/overlay";
import { Donut } from "@/components/ui/charts";
import { FeatureGate } from "@/components/ui/gate";
import { db } from "@/modules/hrm/repo";
import { downloadCsv } from "@/lib/export";
import { employeeName } from "@/modules/hrm/data";
import { EmployeeCell, fmtDate, REVIEW_STATUS_TONE } from "@/modules/hrm/ui";
import type { Goal, PerformanceReview } from "@/modules/hrm/types";

const REVIEW_STAGES: { id: PerformanceReview["status"]; label: string }[] = [
  { id: "not_started", label: "Not started" },
  { id: "self_review", label: "Self review" },
  { id: "manager_review", label: "Manager review" },
  { id: "calibration", label: "Calibration" },
  { id: "complete", label: "Complete" },
];

const GOAL_STATUS: Record<Goal["status"], { tone: Tone; label: string }> = {
  on_track: { tone: "green", label: "On track" },
  at_risk: { tone: "amber", label: "At risk" },
  behind: { tone: "coral", label: "Behind" },
  done: { tone: "blue", label: "Done" },
};

const REVIEW_STATUS_LABEL: Record<PerformanceReview["status"], string> = {
  not_started: "Not started",
  self_review: "Self review",
  manager_review: "Manager review",
  calibration: "Calibration",
  complete: "Complete",
};

const RATING_TONE: Record<number, Tone> = { 1: "coral", 2: "coral", 3: "amber", 4: "teal", 5: "green" };

export default function PerformancePage() {
  return (
    <FeatureGate feature="hr.performance">
      <PerformanceContent />
    </FeatureGate>
  );
}

function PerformanceContent() {
  const session = useSession();
  const reviews = db.reviews;
  const goals = db.goals;
  const [selReview, setSelReview] = React.useState<PerformanceReview | null>(null);
  const [selGoal, setSelGoal] = React.useState<Goal | null>(null);

  const cycle = reviews[0]?.cycle ?? "2026 H1";
  const completeCount = reviews.filter((r) => r.status === "complete").length;
  const onTrack = goals.filter((g) => g.status === "on_track" || g.status === "done").length;

  const rated = reviews.filter((r) => typeof r.rating === "number");
  const avgRating = rated.length
    ? (rated.reduce((a, r) => a + (r.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";

  // Cycle stage counts
  const stageCounts = REVIEW_STAGES.map((s) => ({
    ...s,
    value: reviews.filter((r) => r.status === s.id).length,
  }));
  const stageMax = Math.max(...stageCounts.map((s) => s.value), 1);

  // Ratings distribution donut (1..5, ignore undefined)
  const ratingSegments = [5, 4, 3, 2, 1]
    .map((n) => ({ value: rated.filter((r) => r.rating === n).length, tone: RATING_TONE[n], label: `${n} ★` }))
    .filter((s) => s.value > 0);

  const reviewColumns: Column<PerformanceReview>[] = [
    { key: "emp", header: "Employee", accessor: (r) => employeeName(r.employeeId), render: (r) => <EmployeeCell id={r.employeeId} /> },
    { key: "reviewer", header: "Reviewer", accessor: (r) => employeeName(r.reviewerId), render: (r) => <span className="text-ink-2">{employeeName(r.reviewerId)}</span> },
    { key: "cycle", header: "Cycle", render: (r) => <span className="text-ink-3">{r.cycle}</span> },
    { key: "status", header: "Status", accessor: (r) => r.status, render: (r) => <Tag tone={REVIEW_STATUS_TONE[r.status]}>{REVIEW_STATUS_LABEL[r.status]}</Tag> },
    { key: "rating", header: "Rating", align: "center", accessor: (r) => r.rating ?? -1, render: (r) => <RatingCell rating={r.rating} /> },
    { key: "due", header: "Due", align: "right", accessor: (r) => r.dueDate, render: (r) => <span className="font-mono text-2xs text-ink-3">{fmtDate(r.dueDate)}</span> },
  ];

  const goalColumns: Column<Goal>[] = [
    { key: "emp", header: "Employee", accessor: (g) => employeeName(g.employeeId), render: (g) => <EmployeeCell id={g.employeeId} /> },
    { key: "title", header: "Goal", render: (g) => <span className="font-medium text-ink-2">{g.title}</span> },
    {
      key: "progress",
      header: "Progress",
      width: 180,
      render: (g) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={g.progress} tone={GOAL_STATUS[g.status].tone} className="flex-1" />
          <span className="w-9 text-right font-mono text-2xs font-semibold text-navy">{g.progress}%</span>
        </div>
      ),
    },
    { key: "status", header: "Status", accessor: (g) => g.status, render: (g) => <Tag tone={GOAL_STATUS[g.status].tone}>{GOAL_STATUS[g.status].label}</Tag> },
    { key: "due", header: "Due", align: "right", accessor: (g) => g.dueDate, render: (g) => <span className="font-mono text-2xs text-ink-3">{fmtDate(g.dueDate)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Performance"
        description="Review cycle progress, ratings calibration and goal tracking across the organization."
        actions={session.can("export", "hr") ? <Button icon={Download} variant="outline" onClick={() => downloadCsv("performance.csv", [["Employee", "Reviewer", "Cycle", "Status", "Rating", "Due"], ...reviews.map((r) => [employeeName(r.employeeId), employeeName(r.reviewerId), r.cycle, REVIEW_STATUS_LABEL[r.status], r.rating ?? "", r.dueDate])])}>Export</Button> : undefined}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Review cycle" value={cycle} hint="active" icon={Gauge} tone="navy" />
        <StatCard label="Reviews complete" value={`${completeCount} / ${reviews.length}`} hint="finalized" icon={ClipboardCheck} tone="teal" />
        <StatCard label="Goals on track" value={`${onTrack} / ${goals.length}`} icon={Target} tone="purple" />
        <StatCard label="Avg rating" value={`${avgRating}${avgRating === "—" ? "" : " / 5"}`} hint={`${rated.length} rated`} icon={Star} tone="amber" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cycle progress */}
        <Card className="lg:col-span-2">
          <CardHeader title="Cycle progress" description={`${cycle} — reviews by stage`} icon={TrendingUp} />
          <div className="space-y-3">
            {stageCounts.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: toneHex(REVIEW_STATUS_TONE[s.id]) }} />
                    {s.label}
                  </span>
                  <span className="font-mono font-semibold text-navy">{s.value}</span>
                </div>
                <ProgressBar value={(s.value / stageMax) * 100} tone={REVIEW_STATUS_TONE[s.id]} />
              </div>
            ))}
          </div>
        </Card>

        {/* Ratings distribution */}
        <Card>
          <CardHeader title="Ratings distribution" description="Calibrated review scores" icon={Star} />
          {ratingSegments.length === 0 ? (
            <div className="rounded-md bg-subtle py-8 text-center text-sm text-ink-3">No ratings submitted yet.</div>
          ) : (
            <Donut segments={ratingSegments} centerValue={avgRating} centerLabel="avg" />
          )}
        </Card>
      </div>

      {/* Reviews table */}
      <Card className="mt-4" padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Performance reviews" description={`${reviews.length} reviews this cycle`} icon={ClipboardCheck} />
        </div>
        <DataTable columns={reviewColumns} rows={reviews} keyField={(r) => r.id} onRowClick={setSelReview} empty="No reviews in this cycle." />
      </Card>

      {/* Goals table */}
      <Card className="mt-4" padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Goals" description={`${goals.length} active goals · ${onTrack} on track`} icon={Target} />
        </div>
        <DataTable columns={goalColumns} rows={goals} keyField={(g) => g.id} onRowClick={setSelGoal} empty="No goals defined." />
      </Card>

      <DetailModal open={!!selReview} onClose={() => setSelReview(null)} eyebrow="Performance review" title={selReview && employeeName(selReview.employeeId)}>
        {selReview && (
          <div>
            <div><Tag tone={REVIEW_STATUS_TONE[selReview.status]}>{REVIEW_STATUS_LABEL[selReview.status]}</Tag></div>
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label="Reviewer" value={employeeName(selReview.reviewerId)} />
              <DetailRow label="Cycle" value={selReview.cycle} />
              <DetailRow label="Rating" value={selReview.rating ? `${selReview.rating} / 5` : "Not rated"} />
              <DetailRow label="Due" value={fmtDate(selReview.dueDate)} />
            </dl>
            {selReview.summary && (
              <div className="mt-4 rounded-md border border-line bg-subtle p-3 text-sm text-ink-2">
                <div className="mb-1 text-2xs font-bold uppercase tracking-wide text-ink-3">Manager summary</div>
                {selReview.summary}
              </div>
            )}
          </div>
        )}
      </DetailModal>

      <DetailModal open={!!selGoal} onClose={() => setSelGoal(null)} eyebrow="Goal" title={selGoal?.title}>
        {selGoal && (
          <div>
            <p className="text-2xs text-ink-3">{employeeName(selGoal.employeeId)}</p>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-ink-3">Progress</span>
                <span className="font-mono font-semibold text-navy">{selGoal.progress}%</span>
              </div>
              <ProgressBar value={selGoal.progress} tone={GOAL_STATUS[selGoal.status].tone} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label="Status" value={<Tag tone={GOAL_STATUS[selGoal.status].tone}>{GOAL_STATUS[selGoal.status].label}</Tag>} />
              <DetailRow label="Due" value={fmtDate(selGoal.dueDate)} />
            </dl>
          </div>
        )}
      </DetailModal>
    </>
  );
}

function RatingCell({ rating }: { rating?: number }) {
  if (typeof rating !== "number") return <span className="text-ink-3">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex" aria-label={`${rating} of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={11} className={n <= rating ? "fill-amber text-amber" : "text-line"} strokeWidth={2} />
        ))}
      </span>
      <span className="font-mono text-2xs font-semibold text-navy">{rating}/5</span>
    </span>
  );
}
