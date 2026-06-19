"use client";
import * as React from "react";
import {
  CalendarDays, Plus, Users, MessageSquare, Wallet, Cake,
  Award, Target, CheckSquare, Phone, Palmtree, Rocket, Clock, type LucideIcon,
} from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Card, Button, Tag, useToneColor, type Tone } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/form";
import { meetings, tasks, calls } from "@/modules/crm/data";

const TODAY = "2026-06-16";
type EventType =
  | "meeting" | "interview" | "holiday" | "payroll" | "birthday" | "anniversary"
  | "review" | "task" | "call" | "leave" | "onboarding" | "deadline";

interface CalEvent { id: string; date: string; title: string; type: EventType; time?: string; sub?: string }

const TYPE_META: Record<EventType, { tone: Tone; icon: LucideIcon; label: string }> = {
  meeting: { tone: "navy", icon: Users, label: "Meeting" },
  interview: { tone: "purple", icon: MessageSquare, label: "Interview" },
  holiday: { tone: "orange", icon: CalendarDays, label: "Holiday" },
  payroll: { tone: "green", icon: Wallet, label: "Payroll" },
  birthday: { tone: "coral", icon: Cake, label: "Birthday" },
  anniversary: { tone: "amber", icon: Award, label: "Anniversary" },
  review: { tone: "blue", icon: Target, label: "Review" },
  task: { tone: "teal", icon: CheckSquare, label: "Task" },
  call: { tone: "teal", icon: Phone, label: "Call" },
  leave: { tone: "amber", icon: Palmtree, label: "Leave" },
  onboarding: { tone: "blue", icon: Rocket, label: "Onboarding" },
  deadline: { tone: "coral", icon: Clock, label: "Deadline" },
};
const TYPE_OPTIONS: EventType[] = ["meeting", "interview", "call", "review", "deadline", "holiday", "payroll", "birthday", "anniversary", "onboarding", "leave", "task"];

// Curated company events for June 2026.
const SEED: CalEvent[] = [
  { id: "s1", date: "2026-06-09", title: "Onboarding — Priya Nair", type: "onboarding", sub: "Day 1 setup" },
  { id: "s2", date: "2026-06-12", title: "All-hands meeting", type: "meeting", time: "14:00", sub: "Company-wide" },
  { id: "s3", date: "2026-06-16", title: "Interview — Store Manager, Westgate", type: "interview", time: "10:00", sub: "Sofia Reyes" },
  { id: "s4", date: "2026-06-17", title: "Leadership sync", type: "meeting", time: "09:30" },
  { id: "s5", date: "2026-06-18", title: "Grace Bennett — Birthday", type: "birthday" },
  { id: "s6", date: "2026-06-19", title: "Juneteenth (US holiday)", type: "holiday", sub: "Office closed" },
  { id: "s7", date: "2026-06-20", title: "Payroll run — Jun 1–15", type: "payroll", sub: "Approve & finalize" },
  { id: "s8", date: "2026-06-22", title: "James Okafor — 6yr anniversary", type: "anniversary" },
  { id: "s9", date: "2026-06-23", title: "Q2 performance reviews due", type: "review", sub: "Manager submissions" },
  { id: "s10", date: "2026-06-24", title: "Marcus Hale — on leave", type: "leave", sub: "Jun 24–26" },
  { id: "s11", date: "2026-06-25", title: "Benefits open enrollment closes", type: "deadline" },
  { id: "s12", date: "2026-06-26", title: "Regional ops review", type: "meeting", time: "11:00" },
  { id: "s13", date: "2026-06-30", title: "Month-end close", type: "deadline", sub: "Finance" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function SchedulePage() {
  const session = useSession();
  const tc = useToneColor();
  const canCreate = session.can("create", "hr") || session.can("create", "sales_crm");

  // Aggregate events from CRM modules + the curated company calendar.
  const baseEvents = React.useMemo<CalEvent[]>(() => {
    const fromMeetings: CalEvent[] = meetings.map((m) => ({ id: `mt_${m.id}`, date: m.date, title: m.title, type: "meeting", time: m.start, sub: m.account }));
    const fromCalls: CalEvent[] = calls.filter((c) => c.status === "scheduled").map((c) => ({ id: `cl_${c.id}`, date: c.date, title: c.subject, type: "call", time: c.time, sub: c.contact }));
    const fromTasks: CalEvent[] = tasks.filter((t) => t.status !== "done").map((t) => ({ id: `tk_${t.id}`, date: t.due, title: t.subject, type: "task", sub: t.related }));
    return [...SEED, ...fromMeetings, ...fromCalls, ...fromTasks];
  }, []);

  const [extra, setExtra] = React.useState<CalEvent[]>([]);
  const events = React.useMemo(() => [...baseEvents, ...extra], [baseEvents, extra]);

  const [cursor, setCursor] = React.useState({ y: 2026, m: 5 }); // June 2026
  const [selected, setSelected] = React.useState<string>(TODAY);

  const byDate = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) { const a = map.get(e.date) ?? []; a.push(e); map.set(e.date, a); }
    for (const a of map.values()) a.sort((x, y) => (x.time ?? "00:00").localeCompare(y.time ?? "00:00"));
    return map;
  }, [events]);

  // Month grid (Mon-first), padded to full weeks.
  const weeks = React.useMemo(() => {
    const { y, m } = cursor;
    const days = new Date(y, m + 1, 0).getDate();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(y, m, i + 1))];
    while (cells.length % 7 !== 0) cells.push(null);
    const out: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cursor]);

  const selectedEvents = byDate.get(selected) ?? [];
  const upcoming = React.useMemo(
    () => events.filter((e) => e.date >= TODAY).sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? ""))).slice(0, 8),
    [events],
  );
  const monthCount = events.filter((e) => e.date.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`)).length;

  const shiftMonth = (dir: number) => setCursor((c) => {
    const m = c.m + dir;
    return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
  });

  // New-event form
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", date: TODAY, time: "10:00", type: "meeting" as EventType });
  function addEvent() {
    if (!form.title.trim()) return;
    setExtra((arr) => [...arr, { id: "ev_" + Math.random().toString(36).slice(2, 7), title: form.title.trim(), date: form.date, time: form.time, type: form.type }]);
    setSelected(form.date);
    setCursor({ y: Number(form.date.slice(0, 4)), m: Number(form.date.slice(5, 7)) - 1 });
    setAddOpen(false);
    setForm({ title: "", date: TODAY, time: "10:00", type: "meeting" });
  }

  function fmtLong(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Schedule"
        description="Company calendar — meetings, interviews, payroll, holidays, deadlines and more in one place."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New event</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-md font-bold text-navy">{MONTHS[cursor.m]} {cursor.y}</h2>
              <Tag tone="navy">{monthCount} events</Tag>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-ink-3 hover:bg-subtle hover:text-navy">‹</button>
              <button onClick={() => { setCursor({ y: 2026, m: 5 }); setSelected(TODAY); }} className="focus-ring rounded-md px-2.5 py-1 text-xs font-semibold text-orange hover:bg-orange/5">Today</button>
              <button onClick={() => shiftMonth(1)} aria-label="Next month" className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-ink-3 hover:bg-subtle hover:text-navy">›</button>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 pb-1 text-center">
              {WEEKDAYS.map((d) => <div key={d} className="text-[10px] font-bold uppercase tracking-wide text-ink-3">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((d, i) => {
                if (!d) return <div key={`b${i}`} className="min-h-[78px] rounded-md bg-subtle/40" />;
                const evs = byDate.get(d) ?? [];
                const isToday = d === TODAY;
                const isSel = d === selected;
                const day = Number(d.slice(8));
                return (
                  <button
                    key={d}
                    onClick={() => setSelected(d)}
                    className={`min-h-[78px] rounded-md border p-1.5 text-left transition-colors ${isSel ? "border-orange bg-orange/[.05]" : "border-line hover:border-orange/40 hover:bg-subtle"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold ${isToday ? "bg-orange text-white" : "text-navy"}`}>{day}</span>
                      {evs.length > 0 && <span className="text-[9px] font-semibold text-ink-3">{evs.length}</span>}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {evs.slice(0, 2).map((e) => (
                        <div key={e.id} className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[9px] font-medium" style={{ background: `${tc(TYPE_META[e.type].tone)}1f`, color: tc(TYPE_META[e.type].tone) }}>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tc(TYPE_META[e.type].tone) }} />
                          <span className="truncate">{e.time ? `${e.time} ` : ""}{e.title}</span>
                        </div>
                      ))}
                      {evs.length > 2 && <div className="px-1 text-[9px] font-semibold text-ink-3">+{evs.length - 2} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-line pt-3">
              {(["meeting", "interview", "payroll", "holiday", "deadline", "birthday"] as EventType[]).map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-2xs text-ink-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tc(TYPE_META[t].tone) }} />{TYPE_META[t].label}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Side: selected day + upcoming */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-orange" />
              <h3 className="text-sm font-bold text-navy">{selected === TODAY ? "Today" : fmtLong(selected)}</h3>
            </div>
            {selectedEvents.length === 0 ? (
              <div className="rounded-md bg-subtle py-8 text-center text-sm text-ink-3">No events scheduled.</div>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((e) => <EventRow key={e.id} e={e} tc={tc} />)}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Clock size={16} className="text-orange" />
              <h3 className="text-sm font-bold text-navy">Upcoming</h3>
            </div>
            <div className="divide-y divide-line">
              {upcoming.map((e) => {
                const M = TYPE_META[e.type];
                return (
                  <button key={e.id} onClick={() => { setSelected(e.date); setCursor({ y: Number(e.date.slice(0, 4)), m: Number(e.date.slice(5, 7)) - 1 }); }} className="flex w-full items-center gap-3 py-2 text-left">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-subtle leading-none">
                      <span className="text-[8px] font-bold uppercase" style={{ color: tc(M.tone) }}>{new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="mt-0.5 font-mono text-sm font-bold text-navy">{Number(e.date.slice(8))}</span>
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-xs font-semibold text-navy">{e.title}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-2xs text-ink-3"><M.icon size={11} style={{ color: tc(M.tone) }} /> {M.label}{e.time ? ` · ${e.time}` : ""}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New event" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={addEvent}>Add to calendar</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title" required className="col-span-2"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Leadership sync" /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}>{TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}</Select></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></Field>
          <Field label="Date" className="col-span-2"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
        </div>
      </Modal>
    </>
  );
}

function EventRow({ e, tc }: { e: CalEvent; tc: (t: Tone) => string }) {
  const M = TYPE_META[e.type];
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-line p-2.5">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: `${tc(M.tone)}1f`, color: tc(M.tone) }}><M.icon size={15} /></span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-sm font-semibold text-navy">{e.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-ink-3">
          <Tag tone={M.tone}>{M.label}</Tag>
          {e.time && <span className="font-mono">{e.time}</span>}
          {e.sub && <span className="truncate">· {e.sub}</span>}
        </div>
      </div>
    </div>
  );
}
