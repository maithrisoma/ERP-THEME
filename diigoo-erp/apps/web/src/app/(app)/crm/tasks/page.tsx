"use client";
import * as React from "react";
import { CheckSquare, Plus, Check, Clock, AlertTriangle, Phone, Mail, CalendarClock, ArrowRight, ListChecks, type LucideIcon } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Card, StatCard, Avatar, useToneColor, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SegmentedControl } from "@/components/ui/tabs";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { TaskBody } from "@/components/crm-detail";
import { tasks as seed, type Task, type TaskPriority, type TaskStatus, type TaskType } from "@/modules/crm/data";
import { PRIORITY_LABEL, PRIORITY_TONE, TASK_STATUS_LABEL, TASK_STATUS_TONE, TASK_TYPE_LABEL } from "@/modules/crm/ui";

const TODAY = "2026-06-16";
const COLUMNS: { status: TaskStatus; label: string; accent: Tone }[] = [
  { status: "todo", label: "To do", accent: "navy" },
  { status: "in_progress", label: "In progress", accent: "blue" },
  { status: "done", label: "Completed", accent: "green" },
];
const TYPE_ICON: Record<TaskType, LucideIcon> = { call: Phone, email: Mail, follow_up: ArrowRight, meeting: CalendarClock, todo: CheckSquare };
const TYPE_TONE: Record<TaskType, Tone> = { call: "teal", email: "blue", follow_up: "purple", meeting: "navy", todo: "gray" };
const TYPES: TaskType[] = ["call", "email", "follow_up", "meeting", "todo"];
const fmtShort = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function CrmTasksPage() {
  const session = useSession();
  const tc = useToneColor();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Task[]>(() => seed);
  const [view, setView] = React.useState("board");
  const [search, setSearch] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const [sel, setSel] = React.useState<Task | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ subject: "", related: "", type: "follow_up" as TaskType, priority: "medium" as TaskPriority, due: TODAY });

  const owners = React.useMemo(() => Array.from(new Set(seed.map((t) => t.owner))), []);
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((t) =>
      (priority ? t.priority === priority : true) &&
      (owner ? t.owner === owner : true) &&
      (!q || `${t.subject} ${t.related} ${t.owner}`.toLowerCase().includes(q)),
    );
  }, [list, search, priority, owner]);

  const open = list.filter((t) => t.status !== "done").length;
  const inProgress = list.filter((t) => t.status === "in_progress").length;
  const overdue = list.filter((t) => t.status !== "done" && t.due < TODAY).length;
  const completed = list.filter((t) => t.status === "done").length;

  function move(id: string, status: TaskStatus) {
    setList((l) => l.map((t) => (t.id === id ? { ...t, status } : t)));
    setSel((s) => (s && s.id === id ? { ...s, status } : s));
  }
  function addTask() {
    if (!form.subject.trim()) return;
    setList((l) => [{ id: "tk_" + Math.random().toString(36).slice(2, 7), subject: form.subject.trim(), related: form.related || "—", due: form.due, priority: form.priority, status: "todo", type: form.type, owner: session.principal.name }, ...l]);
    setAddOpen(false);
    setForm({ subject: "", related: "", type: "follow_up", priority: "medium", due: TODAY });
  }

  const columns: Column<Task>[] = [
    { key: "done", header: "", width: 40, render: (t) => (
      <button onClick={(e) => { e.stopPropagation(); move(t.id, t.status === "done" ? "todo" : "done"); }} aria-label="Toggle complete"
        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${t.status === "done" ? "border-green bg-green text-white" : "border-line hover:border-orange"}`}>
        {t.status === "done" && <Check size={12} strokeWidth={3} />}
      </button>
    ) },
    { key: "subject", header: "Task", accessor: (t) => t.subject, render: (t) => (
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${tc(TYPE_TONE[t.type])}1f`, color: tc(TYPE_TONE[t.type]) }}>{React.createElement(TYPE_ICON[t.type], { size: 12 })}</span>
        <span className={t.status === "done" ? "text-ink-3 line-through" : "font-medium text-navy"}>{t.subject}</span>
      </div>
    ) },
    { key: "related", header: "Related to", accessor: (t) => t.related, render: (t) => <span className="text-ink-2">{t.related}</span> },
    { key: "due", header: "Due", align: "right", accessor: (t) => t.due, render: (t) => <DueChip due={t.due} status={t.status} /> },
    { key: "priority", header: "Priority", accessor: (t) => t.priority, render: (t) => <Tag tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Tag> },
    { key: "status", header: "Status", accessor: (t) => t.status, render: (t) => <Tag tone={TASK_STATUS_TONE[t.status]}>{TASK_STATUS_LABEL[t.status]}</Tag> },
    { key: "owner", header: "Owner", accessor: (t) => t.owner, render: (t) => <span className="text-ink-3">{t.owner}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Tasks" description="Your team's to-dos, calls and follow-ups — track them through to done."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl value={view} onChange={setView} options={[{ id: "board", label: "Board" }, { id: "list", label: "List" }]} />
            {canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New task</Button>}
          </div>
        } />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={open} icon={CheckSquare} tone="navy" hint="not done" />
        <StatCard label="In progress" value={inProgress} icon={Clock} tone="blue" />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} tone={overdue ? "coral" : "green"} hint={overdue ? "needs attention" : "on track"} />
        <StatCard label="Completed" value={completed} icon={Check} tone="green" hint={`${Math.round((completed / Math.max(1, list.length)) * 100)}% done`} />
      </div>

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" className="min-w-[200px] flex-1" />
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:!w-36"><option value="">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Select>
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="sm:!w-44"><option value="">All owners</option>{owners.map((o) => <option key={o} value={o}>{o}</option>)}</Select>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-3"><ListChecks size={13} /> {rows.length} task{rows.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      {view === "board" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = rows.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="flex flex-col rounded-lg border border-line bg-subtle/50">
                <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: tc(col.accent) }} />
                    <span className="text-xs font-bold uppercase tracking-wide text-navy">{col.label}</span>
                  </div>
                  <Tag tone={col.accent}>{items.length}</Tag>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2.5">
                  {items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-line py-8 text-center text-2xs text-ink-3">No tasks</div>
                  ) : items.map((t) => <TaskCard key={t.id} t={t} tc={tc} onOpen={() => setSel(t)} onMove={move} canCreate={canCreate} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable columns={columns} rows={rows} keyField={(t) => t.id} onRowClick={setSel} empty="No tasks match." />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New task" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={addTask}>Create task</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject" required className="col-span-2"><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Follow up with Acme" /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TaskType }))}>{TYPES.map((t) => <option key={t} value={t}>{TASK_TYPE_LABEL[t]}</option>)}</Select></Field>
          <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
          <Field label="Related to"><Input value={form.related} onChange={(e) => setForm((f) => ({ ...f, related: e.target.value }))} placeholder="Account / deal" /></Field>
          <Field label="Due date"><Input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Task" title={sel?.subject}>
        {sel && <TaskBody task={sel} />}
      </DetailModal>
    </>
  );
}

function DueChip({ due, status }: { due: string; status: TaskStatus }) {
  const overdue = status !== "done" && due < TODAY;
  const today = status !== "done" && due === TODAY;
  const cls = status === "done" ? "text-ink-3" : overdue ? "text-coral font-semibold" : today ? "text-amber font-semibold" : "text-ink-3";
  return <span className={`font-mono text-2xs ${cls}`}>{overdue ? "Overdue · " : today ? "Today" : ""}{today ? "" : fmtShort(due)}</span>;
}

function TaskCard({ t, tc, onOpen, onMove, canCreate }: { t: Task; tc: (x: Tone) => string; onOpen: () => void; onMove: (id: string, s: TaskStatus) => void; canCreate: boolean }) {
  const Icon = TYPE_ICON[t.type];
  return (
    <div className="rounded-md border border-line bg-surface shadow-card transition-colors hover:border-orange/40">
      <button onClick={onOpen} className="block w-full p-2.5 text-left">
        <div className="flex items-start gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${tc(TYPE_TONE[t.type])}1f`, color: tc(TYPE_TONE[t.type]) }}><Icon size={14} /></span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className={`truncate text-sm font-semibold ${t.status === "done" ? "text-ink-3 line-through" : "text-navy"}`}>{t.subject}</div>
            <div className="truncate text-2xs text-ink-3">{t.related}</div>
          </div>
          <Tag tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Tag>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
          <DueChip due={t.due} status={t.status} />
          <span className="inline-flex items-center gap-1.5 text-2xs text-ink-3"><Avatar name={t.owner} tone="navy" size={18} /> {t.owner.split(" ")[0]}</span>
        </div>
      </button>
      {canCreate && (
        <div className="flex gap-1 border-t border-line px-2.5 py-1.5">
          {t.status === "todo" && <Button size="sm" variant="subtle" className="flex-1" onClick={() => onMove(t.id, "in_progress")}>Start</Button>}
          {t.status !== "done" && <Button size="sm" variant="primary" icon={Check} className="flex-1" onClick={() => onMove(t.id, "done")}>Complete</Button>}
          {t.status === "done" && <Button size="sm" variant="ghost" className="flex-1" onClick={() => onMove(t.id, "todo")}>Reopen</Button>}
        </div>
      )}
    </div>
  );
}
