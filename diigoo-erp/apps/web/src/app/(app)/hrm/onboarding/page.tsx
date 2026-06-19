"use client";
import * as React from "react";
import {
  UserPlus, CheckCircle2, AlertTriangle, Timer, ClipboardList, FileText,
  Laptop, GraduationCap, Users, ShieldCheck, type LucideIcon,
} from "@/components/icon/lucide";
import { PageHeader, Card, CardHeader, StatCard, Tag, SectionLabel, EmptyState, type Tone } from "@/components/ui/primitives";
import { RingProgress } from "@/components/ui/charts";
import { Checkbox } from "@/components/ui/form";
import { FeatureGate } from "@/components/ui/gate";
import { onboardingFor, db } from "@/modules/hrm/repo";
import { EmployeeCell, fmtDate } from "@/modules/hrm/ui";
import type { Employee, OnboardingTask } from "@/modules/hrm/types";

const TODAY = "2026-06-12";
const DEMO_HIRE = "e_1022";

type Category = OnboardingTask["category"];

const CATEGORY_ORDER: Category[] = ["paperwork", "it", "training", "intro", "compliance"];
const CATEGORY_META: Record<Category, { label: string; icon: LucideIcon; tone: Tone }> = {
  paperwork: { label: "Paperwork", icon: FileText, tone: "navy" },
  it: { label: "IT & Access", icon: Laptop, tone: "blue" },
  training: { label: "Training", icon: GraduationCap, tone: "purple" },
  intro: { label: "Introductions", icon: Users, tone: "teal" },
  compliance: { label: "Compliance", icon: ShieldCheck, tone: "amber" },
};

function isNewHire(e: Employee): boolean {
  if (e.status === "terminated") return false;
  return e.status === "probation" || e.tags.includes("new-hire") || e.hireDate >= "2026-05-01";
}

export default function OnboardingPage() {
  return (
    <FeatureGate feature="hr.onboarding">
      <OnboardingScreen />
    </FeatureGate>
  );
}

function OnboardingScreen() {
  const newHires = React.useMemo(() => db.employees.filter(isNewHire), []);
  const [selectedId, setSelectedId] = React.useState<string | undefined>(() => newHires[0]?.id);

  // Local, toggleable copy of the task list keyed by hire id.
  const [taskState, setTaskState] = React.useState<Record<string, OnboardingTask[]>>({});

  const tasksFor = React.useCallback(
    (empId: string): OnboardingTask[] => {
      if (taskState[empId]) return taskState[empId];
      const own = onboardingFor(empId);
      return own.length > 0 ? own : onboardingFor(DEMO_HIRE);
    },
    [taskState],
  );

  const selectedTasks = selectedId ? tasksFor(selectedId) : [];
  const completed = selectedTasks.filter((t) => t.done).length;
  const pct = selectedTasks.length ? Math.round((completed / selectedTasks.length) * 100) : 0;

  // Org-wide KPIs across every hire in onboarding.
  const kpis = React.useMemo(() => {
    let total = 0, done = 0, overdue = 0;
    newHires.forEach((h) => {
      tasksFor(h.id).forEach((t) => {
        total += 1;
        if (t.done) done += 1;
        else if (t.dueDate < TODAY) overdue += 1;
      });
    });
    return { total, done, overdue, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [newHires, tasksFor]);

  const toggleTask = (empId: string, taskId: string) => {
    setTaskState((prev) => {
      const current = prev[empId] ?? tasksFor(empId).map((t) => ({ ...t }));
      return {
        ...prev,
        [empId]: current.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      };
    });
  };

  const grouped = React.useMemo(() => {
    const map = new Map<Category, OnboardingTask[]>();
    selectedTasks.forEach((t) => {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    });
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ category: c, tasks: map.get(c)! }));
  }, [selectedTasks]);

  const selected = selectedId ? db.byId(db.employees, selectedId) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Onboarding"
        description="Get new hires productive fast — track every paperwork, IT, training and compliance step from day one."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="In onboarding" value={newHires.length} hint="new hires" icon={UserPlus} tone="teal" />
        <StatCard label="Tasks complete" value={`${kpis.pct}%`} hint={`${kpis.done} / ${kpis.total}`} icon={CheckCircle2} tone="green" />
        <StatCard label="Overdue tasks" value={kpis.overdue} hint="past due" icon={AlertTriangle} tone={kpis.overdue > 0 ? "coral" : "gray"} />
        <StatCard label="Time to productive" value="12 days" hint="avg." icon={Timer} tone="navy" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* New hire list */}
        <Card className="lg:col-span-1">
          <CardHeader title="New hires" description={`${newHires.length} in active onboarding`} icon={UserPlus} />
          {newHires.length === 0 ? (
            <EmptyState icon={UserPlus} title="No new hires" description="Nobody is currently in onboarding." />
          ) : (
            <ul className="space-y-1.5">
              {newHires.map((h) => {
                const active = h.id === selectedId;
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(h.id)}
                      className={[
                        "focus-ring flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                        active ? "border-orange/50 bg-orange/[.06]" : "border-transparent hover:bg-subtle",
                      ].join(" ")}
                    >
                      <EmployeeCell id={h.id} />
                      <span className="shrink-0 text-right text-2xs text-ink-3">{fmtDate(h.hireDate, { month: "short", day: "numeric" })}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Selected hire detail */}
        <Card className="lg:col-span-2">
          {!selected ? (
            <EmptyState icon={ClipboardList} title="Select a new hire" description="Pick someone from the list to view their onboarding checklist." />
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy">{selected.firstName} {selected.lastName}</h3>
                  <p className="mt-0.5 text-sm text-ink-3">
                    Started {fmtDate(selected.hireDate)} · {selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <RingProgress value={pct} size={72} tone={pct === 100 ? "green" : pct >= 50 ? "teal" : "amber"} />
                  <div className="leading-tight">
                    <div className="font-mono text-lg font-bold text-navy">{completed}/{selectedTasks.length}</div>
                    <div className="text-2xs uppercase tracking-wide text-ink-3">completed</div>
                  </div>
                </div>
              </div>

              {selectedTasks.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No onboarding tasks" description="This hire has no checklist assigned yet." />
              ) : (
                <div className="space-y-5">
                  {grouped.map(({ category, tasks }) => {
                    const meta = CATEGORY_META[category];
                    const Icon = meta.icon;
                    const doneCount = tasks.filter((t) => t.done).length;
                    return (
                      <div key={category}>
                        <SectionLabel>
                          <Icon size={13} /> {meta.label}
                          <Tag tone={meta.tone}>{doneCount}/{tasks.length}</Tag>
                        </SectionLabel>
                        <div className="divide-y divide-line">
                          {tasks.map((t) => {
                            const overdue = !t.done && t.dueDate < TODAY;
                            return (
                              <div key={t.id} className="flex items-center gap-3 py-2.5">
                                <Checkbox checked={t.done} onChange={() => toggleTask(selected.id, t.id)} />
                                <div className="min-w-0 flex-1">
                                  <div className={t.done ? "text-sm text-ink-3 line-through" : "text-sm font-medium text-ink-2"}>{t.title}</div>
                                  <div className="text-2xs text-ink-3">{t.assigneeRole}</div>
                                </div>
                                {t.done ? (
                                  <Tag tone="green">Done</Tag>
                                ) : overdue ? (
                                  <Tag tone="coral">Overdue</Tag>
                                ) : null}
                                <span className="w-20 shrink-0 text-right font-mono text-2xs text-ink-3">{fmtDate(t.dueDate, { month: "short", day: "numeric" })}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </>
  );
}
