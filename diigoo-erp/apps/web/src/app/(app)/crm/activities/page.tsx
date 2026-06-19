"use client";
import * as React from "react";
import { ListChecks, CheckSquare, CalendarClock, Phone, BarChart3, Check, Clock } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Card, CardHeader, StatCard, DetailRow, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SearchInput, Select, Field, Input } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { BarChart, Donut } from "@/components/ui/charts";
import { TaskBody, MeetingBody, CallBody } from "@/components/crm-detail";
import { tasks, meetings, calls, byId, type TaskPriority } from "@/modules/crm/data";
import { PRIORITY_LABEL, PRIORITY_TONE } from "@/modules/crm/ui";

const TODAY = "2026-06-16";
type ActType = "task" | "meeting" | "call";
type ActStatus = "open" | "completed" | "cancelled";
interface Activity {
  id: string; type: ActType; subject: string; related: string; date: string;
  dueLabel: string; priority: TaskPriority; status: ActStatus; owner: string;
}

const TYPE_TONE: Record<ActType, Tone> = { task: "blue", meeting: "purple", call: "teal" };
const TYPE_LABEL: Record<ActType, string> = { task: "Task", meeting: "Meeting", call: "Call" };
const STATUS_LABEL: Record<ActStatus, string> = { open: "Open", completed: "Completed", cancelled: "Cancelled" };
const STATUS_CLASS: Record<ActStatus, string> = { open: "text-orange", completed: "text-green", cancelled: "text-ink-3" };

function fmt(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Merge the three activity sources into one unified feed.
function buildActivities(): Activity[] {
  const fromTasks: Activity[] = tasks.map((t) => ({ id: `a_${t.id}`, type: "task", subject: t.subject, related: t.related, date: t.due, dueLabel: fmt(t.due), priority: t.priority, status: t.status === "done" ? "completed" : "open", owner: t.owner }));
  const fromMeetings: Activity[] = meetings.map((m) => ({ id: `a_${m.id}`, type: "meeting", subject: m.title, related: m.account, date: m.date, dueLabel: `${fmt(m.date)} ${m.start}`, priority: "medium", status: "open", owner: m.owner }));
  const fromCalls: Activity[] = calls.map((c) => ({ id: `a_${c.id}`, type: "call", subject: c.subject, related: c.contact, date: c.date, dueLabel: `${fmt(c.date)} ${c.time}`, priority: "medium", status: c.status === "completed" ? "completed" : "open", owner: c.owner }));
  return [...fromTasks, ...fromMeetings, ...fromCalls].sort((a, b) => a.date.localeCompare(b.date));
}

export default function CrmActivitiesPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Activity[]>(() => buildActivities());
  const [sel, setSel] = React.useState<Activity | null>(null);
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [insights, setInsights] = React.useState(false);
  const [createType, setCreateType] = React.useState<ActType | null>(null);
  const [form, setForm] = React.useState({ subject: "", related: "", date: TODAY, time: "10:00", priority: "medium" as TaskPriority });

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((a) => (type ? a.type === type : true) && (status ? a.status === status : true) && (!q || `${a.subject} ${a.related} ${a.owner}`.toLowerCase().includes(q)));
  }, [list, search, type, status]);

  const open = list.filter((a) => a.status === "open").length;
  const completed = list.filter((a) => a.status === "completed").length;
  const overdue = list.filter((a) => a.status === "open" && a.date < TODAY).length;

  function setActStatus(id: string, s: ActStatus) {
    setList((l) => l.map((a) => (a.id === id ? { ...a, status: s } : a)));
  }
  function openCreate(t: ActType) {
    setForm({ subject: "", related: "", date: TODAY, time: "10:00", priority: "medium" });
    setCreateType(t);
  }
  function addActivity() {
    if (!createType || !form.subject.trim()) return;
    const hasTime = createType !== "task";
    setList((l) => [{
      id: "a_" + Math.random().toString(36).slice(2, 7), type: createType, subject: form.subject.trim(), related: form.related || "—",
      date: form.date, dueLabel: hasTime ? `${fmt(form.date)} ${form.time}` : fmt(form.date), priority: form.priority, status: "open", owner: session.principal.name,
    }, ...l]);
    setCreateType(null);
  }

  const byType = (["task", "meeting", "call"] as ActType[]).map((t) => ({ label: TYPE_LABEL[t] + "s", value: list.filter((a) => a.type === t).length }));
  const byStatus = ([
    { s: "open" as ActStatus, tone: "amber" as Tone }, { s: "completed" as ActStatus, tone: "green" as Tone }, { s: "cancelled" as ActStatus, tone: "gray" as Tone },
  ]).map(({ s, tone }) => ({ value: list.filter((a) => a.status === s).length, tone, label: STATUS_LABEL[s] })).filter((x) => x.value > 0);

  const columns: Column<Activity>[] = [
    { key: "subject", header: "Subject", accessor: (a) => a.subject, render: (a) => <span className="font-medium text-navy">{a.subject}</span> },
    { key: "type", header: "Type", accessor: (a) => a.type, render: (a) => <Tag tone={TYPE_TONE[a.type]}>{TYPE_LABEL[a.type]}</Tag> },
    { key: "related", header: "Related to", accessor: (a) => a.related, render: (a) => <span className="text-ink-2">{a.related}</span> },
    { key: "due", header: "Due", accessor: (a) => a.date, render: (a) => <span className={`font-mono text-2xs ${a.status === "open" && a.date < TODAY ? "font-semibold text-coral" : "text-ink-3"}`}>{a.dueLabel}</span> },
    { key: "priority", header: "Priority", accessor: (a) => a.priority, render: (a) => <Tag tone={PRIORITY_TONE[a.priority]}>{PRIORITY_LABEL[a.priority]}</Tag> },
    { key: "status", header: "Status", accessor: (a) => a.status, render: (a) => <span className={`text-xs font-semibold ${STATUS_CLASS[a.status]}`}>{STATUS_LABEL[a.status]}</span> },
    {
      key: "actions", header: "Actions", render: (a) => canCreate ? (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {a.status === "open" ? (
            <>
              <Button size="sm" variant="subtle" icon={Check} onClick={() => setActStatus(a.id, "completed")}>Complete</Button>
              <Button size="sm" variant="ghost" onClick={() => setActStatus(a.id, "cancelled")}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setActStatus(a.id, "open")}>Reopen</Button>
          )}
        </div>
      ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Sales & CRM"
        title="Activities"
        description={`${list.length} activities — tasks, meetings and calls in one feed.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={insights ? "subtle" : "outline"} icon={BarChart3} onClick={() => setInsights((v) => !v)}>Insights</Button>
            {canCreate && <>
              <Button variant="outline" icon={CheckSquare} onClick={() => openCreate("task")}>Task</Button>
              <Button variant="outline" icon={CalendarClock} onClick={() => openCreate("meeting")}>Meeting</Button>
              <Button variant="primary" icon={Phone} onClick={() => openCreate("call")}>Call</Button>
            </>}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={list.length} icon={ListChecks} tone="navy" />
        <StatCard label="Open" value={open} icon={Clock} tone="amber" />
        <StatCard label="Completed" value={completed} icon={Check} tone="green" />
        <StatCard label="Overdue" value={overdue} tone={overdue ? "coral" : "teal"} />
      </div>

      {insights && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Activities by type" />
            <BarChart data={byType} height={150} />
          </Card>
          <Card>
            <CardHeader title="By status" />
            <Donut segments={byStatus} centerValue={list.length} centerLabel="total" />
          </Card>
        </div>
      )}

      <Card padded={false} className="mb-4 mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search activities…" className="min-w-[220px] flex-1" />
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:!w-40">
            <option value="">All types</option><option value="task">Tasks</option><option value="meeting">Meetings</option><option value="call">Calls</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:!w-40">
            <option value="">All statuses</option><option value="open">Open</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} keyField={(a) => a.id} onRowClick={setSel} empty="No activities match." />

      <Modal open={!!createType} onClose={() => setCreateType(null)} title={createType ? `New ${TYPE_LABEL[createType].toLowerCase()}` : ""} size="md"
        footer={<><Button variant="ghost" onClick={() => setCreateType(null)}>Cancel</Button><Button variant="primary" onClick={addActivity}>Create</Button></>}>
        {createType && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subject" required className="col-span-2"><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder={createType === "call" ? "Intro call" : createType === "meeting" ? "Solution demo" : "Follow up"} /></Field>
            <Field label="Related to" className="col-span-2"><Input value={form.related} onChange={(e) => setForm((f) => ({ ...f, related: e.target.value }))} placeholder="Account / contact" /></Field>
            <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
            {createType !== "task" && <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></Field>}
            <Field label="Priority" className={createType === "task" ? "col-span-1" : "col-span-2"}><Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
          </div>
        )}
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow={sel ? TYPE_LABEL[sel.type] : undefined} title={sel?.subject}>
        {sel && <ActivityDetail activity={sel} />}
      </DetailModal>
    </>
  );
}

// Open the underlying task / meeting / call record in the shared body. Newly
// created in-session activities have no source record yet, so fall back to the
// activity's own fields.
function ActivityDetail({ activity: a }: { activity: Activity }) {
  const rid = a.id.slice(2);
  if (a.type === "task") { const r = byId(tasks, rid); if (r) return <TaskBody task={r} />; }
  if (a.type === "meeting") { const r = byId(meetings, rid); if (r) return <MeetingBody meeting={r} />; }
  if (a.type === "call") { const r = byId(calls, rid); if (r) return <CallBody call={r} />; }
  return (
    <>
      <p className="text-sm text-ink-3">{a.related}</p>
      <div className="mt-1.5"><Tag tone={TYPE_TONE[a.type]}>{TYPE_LABEL[a.type]}</Tag></div>
      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <DetailRow label="Related to" value={a.related} />
        <DetailRow label="Due" value={a.dueLabel} />
        <DetailRow label="Owner" value={a.owner} />
        <DetailRow label="Status" value={STATUS_LABEL[a.status]} />
      </dl>
    </>
  );
}
