"use client";
import * as React from "react";
import { ShieldCheck, ListChecks, CheckCircle2, AlertTriangle, CalendarX, Download } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Card, CardHeader, StatCard, ProgressBar, Tag, Button, DetailRow, type Tone } from "@/components/ui/primitives";
import { RingProgress } from "@/components/ui/charts";
import { DataTable, type Column } from "@/components/ui/table";
import { DetailModal } from "@/components/ui/overlay";
import { FeatureGate } from "@/components/ui/gate";
import { complianceItems } from "@/modules/hrm/repo";
import { downloadCsv } from "@/lib/export";
import { fmtDate } from "@/modules/hrm/ui";
import type { ComplianceItem } from "@/modules/hrm/types";

const TODAY = "2026-06-12";

const CATEGORY_LABEL: Record<ComplianceItem["category"], string> = {
  training: "Training",
  certification: "Certification",
  policy_ack: "Policy Ack",
  i9: "I-9",
  background_check: "Background Check",
};
const CATEGORY_TONE: Record<ComplianceItem["category"], Tone> = {
  training: "blue",
  certification: "purple",
  policy_ack: "teal",
  i9: "navy",
  background_check: "amber",
};

type Health = "complete" | "at_risk" | "in_progress";

function pct(item: ComplianceItem) {
  return Math.round((item.completed / Math.max(1, item.total)) * 100);
}
function isComplete(item: ComplianceItem) {
  return item.completed >= item.total;
}
function isOverdue(item: ComplianceItem) {
  return !!item.dueDate && item.dueDate < TODAY && !isComplete(item);
}
function healthOf(item: ComplianceItem): Health {
  if (isComplete(item)) return "complete";
  if (pct(item) < 80) return "at_risk";
  return "in_progress";
}

const HEALTH_TONE: Record<Health, Tone> = { complete: "green", at_risk: "amber", in_progress: "blue" };
const HEALTH_LABEL: Record<Health, string> = { complete: "Complete", at_risk: "At risk", in_progress: "In progress" };

export default function CompliancePage() {
  const session = useSession();
  const items = React.useMemo(() => complianceItems(), []);
  const [selected, setSelected] = React.useState<ComplianceItem | null>(null);

  const totals = items.reduce((acc, c) => ({ done: acc.done + c.completed, total: acc.total + c.total }), { done: 0, total: 0 });
  const overall = Math.round((totals.done / Math.max(1, totals.total)) * 100);
  const fullyCompliant = items.filter(isComplete).length;
  const atRisk = items.filter((c) => !isComplete(c) && pct(c) < 80).length;
  const overdue = items.filter(isOverdue).length;
  const flagged = items.filter((c) => isOverdue(c) || (!isComplete(c) && pct(c) < 80));

  const columns: Column<ComplianceItem>[] = [
    {
      key: "name",
      header: "Requirement",
      accessor: (c) => c.name,
      render: (c) => (
        <div className="leading-tight">
          <div className="font-semibold text-navy">{c.name}</div>
          <div className="text-2xs text-ink-3">{c.requiredFor}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      accessor: (c) => CATEGORY_LABEL[c.category],
      render: (c) => <Tag tone={CATEGORY_TONE[c.category]}>{CATEGORY_LABEL[c.category]}</Tag>,
    },
    { key: "jurisdiction", header: "Jurisdiction", accessor: (c) => c.jurisdiction, render: (c) => <span className="text-ink-2">{c.jurisdiction}</span> },
    {
      key: "progress",
      header: "Completion",
      width: "200px",
      accessor: (c) => pct(c),
      render: (c) => (
        <div className="w-40">
          <div className="mb-1 flex items-center justify-between text-2xs">
            <span className="font-mono font-semibold text-navy">{c.completed}/{c.total}</span>
            <span className="text-ink-3">{pct(c)}%</span>
          </div>
          <ProgressBar value={pct(c)} tone={HEALTH_TONE[healthOf(c)]} />
        </div>
      ),
    },
    {
      key: "due",
      header: "Due",
      align: "right",
      accessor: (c) => c.dueDate ?? "",
      render: (c) => (
        <span className={`font-mono text-2xs ${isOverdue(c) ? "font-semibold text-coral" : "text-ink-3"}`}>{fmtDate(c.dueDate)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      accessor: (c) => healthOf(c),
      render: (c) => <Tag tone={HEALTH_TONE[healthOf(c)]}>{HEALTH_LABEL[healthOf(c)]}</Tag>,
    },
  ];

  return (
    <FeatureGate feature="hr.compliance">
      <PageHeader
        eyebrow="Human Resources"
        title="Compliance"
        description="Mandatory training, certifications and statutory requirements across the workforce."
        actions={session.can("export", "hr") ? <Button icon={Download} variant="outline" onClick={() => downloadCsv("compliance.csv", [["Requirement", "Category", "Jurisdiction", "Required for", "Completed", "Total", "%", "Due"], ...items.map((c) => [c.name, CATEGORY_LABEL[c.category], c.jurisdiction, c.requiredFor, c.completed, c.total, pct(c), c.dueDate ?? ""])])}>Export</Button> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Overall completion */}
        <Card className="flex flex-col items-center justify-center text-center">
          <CardHeader title="Overall completion" icon={ShieldCheck} />
          <RingProgress value={overall} size={148} thickness={12} tone={overall >= 90 ? "green" : overall >= 80 ? "blue" : "amber"} />
          <p className="mt-3 text-xs text-ink-3">
            <span className="font-mono font-semibold text-navy">{totals.done}</span> of{" "}
            <span className="font-mono font-semibold text-navy">{totals.total}</span> obligations met
          </p>
        </Card>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatCard label="Items tracked" value={items.length} hint="requirements" icon={ListChecks} tone="navy" />
          <StatCard label="Fully compliant" value={fullyCompliant} hint="complete" icon={CheckCircle2} tone="green" />
          <StatCard label="At risk" value={atRisk} hint="< 80% done" icon={AlertTriangle} tone="amber" />
          <StatCard label="Overdue" value={overdue} hint="past due date" icon={CalendarX} tone="coral" />
        </div>
      </div>

      {/* Attention callout */}
      {flagged.length > 0 && (
        <Card className="mt-4 border-amber/40 bg-amber/[.06]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber/15 text-amber">
              <AlertTriangle size={16} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h3 className="text-md font-bold text-navy">
                {flagged.length} requirement{flagged.length === 1 ? "" : "s"} need{flagged.length === 1 ? "s" : ""} attention
              </h3>
              <p className="mt-0.5 text-xs text-ink-3">Overdue or below the 80% completion threshold. Follow up with the responsible teams.</p>
              <ul className="mt-3 space-y-1.5">
                {flagged.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-navy">{c.name}</span>
                    <span className="text-2xs text-ink-3">· {c.requiredFor}</span>
                    {isOverdue(c) ? <Tag tone="coral">Overdue {fmtDate(c.dueDate)}</Tag> : <Tag tone="amber">{pct(c)}% complete</Tag>}
                    <span className="ml-auto font-mono text-2xs text-ink-2">{c.completed}/{c.total}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Detail table */}
      <Card className="mt-4" padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="Compliance items" description="All tracked statutory and policy requirements" />
        </div>
        <div className="px-5 pb-5">
          <DataTable columns={columns} rows={items} keyField={(c) => c.id} onRowClick={setSelected} empty="No compliance items configured." />
        </div>
      </Card>

      <DetailModal open={!!selected} onClose={() => setSelected(null)} eyebrow="Compliance requirement" title={selected?.name}>
        {selected && (
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Tag tone={CATEGORY_TONE[selected.category]}>{CATEGORY_LABEL[selected.category]}</Tag>
              <Tag tone={HEALTH_TONE[healthOf(selected)]}>{HEALTH_LABEL[healthOf(selected)]}</Tag>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-ink-3">Completion</span>
                <span className="font-mono font-semibold text-navy">{selected.completed}/{selected.total} · {pct(selected)}%</span>
              </div>
              <ProgressBar value={pct(selected)} tone={HEALTH_TONE[healthOf(selected)]} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label="Jurisdiction" value={selected.jurisdiction} />
              <DetailRow label="Required for" value={selected.requiredFor} />
              <DetailRow label="Due date" value={fmtDate(selected.dueDate)} />
              <DetailRow label="Remaining" value={`${Math.max(0, selected.total - selected.completed)} to complete`} />
            </dl>
          </div>
        )}
      </DetailModal>
    </FeatureGate>
  );
}
