"use client";
import * as React from "react";
import { CalendarDays, Plus, Bell } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Card, Button, Tag, useToneColor, type Tone } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/form";

const TODAY = "2026-06-19";

// Event categories, aggregated across modules (finance, purchasing, QC, HR, ops…).
type EventType = "meeting" | "delivery" | "invoice" | "payment" | "deadline" | "inspection" | "leave" | "holiday";
type Priority = "low" | "medium" | "high";
interface CalEvent { id: string; date: string; title: string; type: EventType; time?: string; sub?: string; priority: Priority }

const TYPE_META: Record<EventType, { tone: Tone; label: string }> = {
  meeting: { tone: "navy", label: "Meeting" },
  delivery: { tone: "amber", label: "Delivery" },
  invoice: { tone: "purple", label: "Invoice" },
  payment: { tone: "green", label: "Payment" },
  deadline: { tone: "orange", label: "Deadline" },
  inspection: { tone: "blue", label: "Inspection" },
  leave: { tone: "teal", label: "Leave" },
  holiday: { tone: "coral", label: "Holiday" },
};
const TYPE_OPTIONS: EventType[] = ["meeting", "delivery", "invoice", "payment", "deadline", "inspection", "leave", "holiday"];

// Priority shades the event's region (red = high, amber = medium, green = low) —
// the type stays as the dot/filter/legend so the two colour systems never clash.
const PRIORITY_META: Record<Priority, { tone: Tone; label: string }> = {
  high: { tone: "coral", label: "High" },
  medium: { tone: "amber", label: "Medium" },
  low: { tone: "green", label: "Low" },
};
const PRIORITY_OPTIONS: Priority[] = ["high", "medium", "low"];

// ── date helpers (Sun-first weeks) ────────────────────────────────────────────
const parse = (s: string) => new Date(s + "T00:00:00");
const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return isoOf(d); };
const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);
const fmt = (s: string, o: Intl.DateTimeFormatOptions) => parse(s).toLocaleDateString("en-US", o);
const weekDays = (anchor: string) => {
  const d = parse(anchor); const start = new Date(d); start.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); return isoOf(x); });
};
const monthGrid = (anchor: string) => {
  const d = parse(anchor); const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); return isoOf(x); });
};
const relLabel = (date: string) => {
  const diff = Math.round((parse(date).getTime() - parse(TODAY).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  return fmt(date, { month: "short", day: "numeric" });
};

// ── seeded data generator (deterministic → SSR-safe, fills the month like real ops) ──
function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const COMPANIES = ["Brightway Group", "Northwind", "Cedar Mart", "Acme Foods", "Granite Logistics", "Trident Traders", "Bluewave Retail", "Vertex Group", "Harbor Partners", "Summit Stores", "Apex Supplies", "Cedar Group"];
const ITEMS = ["Confectionery", "Stationery", "Frozen storage", "Snacks", "Grocery", "Fuel", "Bakery", "Tobacco", "Household", "Automotive", "Personal Care", "Lottery", "Beverage", "Dairy"];
const NAMES = ["Priya Shah", "Liam Carter", "Neha Park", "Felix Adams", "Eli Watson", "Omar Gupta", "Sara Watson", "Rohan Watson", "Noah Sen", "Mia Coleman", "Aarav Gupta", "Vihaan Singh", "Sam Reyes", "Maya Bose", "Kabir Das", "Rohan Webb", "Ethan Patel", "Adam Nguyen", "Felix Kaur", "Priya Raman"];
const LEAVE_KINDS = ["Sick Leave", "Unpaid Leave", "Annual Leave"];
const OPS = ["Network down", "Printer error", "POS offline", "Deploy store", "Migrate integration", "Access request", "Configure integration", "Login issue", "Review module", "Test report", "Document module", "Refund query", "Price mismatch", "Train integration", "Store Refit", "Deploy workflow", "Review integration", "Review report", "ERP Rollout", "Test module", "Configure workflow", "Cold Chain", "Warehouse Automation"];
const DELIV = ["PO", "RFQ", "WO"];

const GENERATED: CalEvent[] = (() => {
  const rng = mulberry32(20260619);
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)];
  const out: CalEvent[] = [];
  let id = 0;
  const start = "2026-05-31";
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    if (date === TODAY) continue; // keep "today" clean — anchored below
    const wd = parse(date).getDay();
    const count = wd === 0 || wd === 6 ? 1 + Math.floor(rng() * 3) : 3 + Math.floor(rng() * 4);
    for (let k = 0; k < count; k++) {
      const r = rng();
      let type: EventType, title: string;
      if (r < 0.2) { type = "invoice"; title = `INV-${1000 + Math.floor(rng() * 8999)} — ${pick(COMPANIES)}`; }
      else if (r < 0.34) { const p = pick(DELIV); type = "delivery"; title = `${p} — ${pick(ITEMS)} ${p === "PO" ? "restock" : p === "RFQ" ? "supply" : "work"}`; }
      else if (r < 0.46) { type = "inspection"; title = `QC — ${pick(ITEMS)} batch`; }
      else if (r < 0.64) { type = "deadline"; title = pick(OPS) + (rng() < 0.3 ? ` ${1 + Math.floor(rng() * 9)}` : ""); }
      else if (r < 0.8) { type = "leave"; title = `${pick(NAMES)} · ${pick(LEAVE_KINDS)}`; }
      else if (r < 0.9) { type = "payment"; title = `INV-${1000 + Math.floor(rng() * 8999)} — ${pick(COMPANIES)}`; }
      else if (r < 0.975) { type = "meeting"; title = `${pick(COMPANIES)} — ${pick(["Service contract", "Sync", "Review", "Kickoff"])}`; }
      else { type = "holiday"; title = "Public holiday"; }
      const pr = rng();
      out.push({ id: `g${id++}`, date, title, type, priority: pr < 0.3 ? "high" : pr < 0.62 ? "medium" : "low" });
    }
  }
  return out;
})();

// Hand-placed anchors so the focused day + upcoming feed read cleanly.
const ANCHORS: CalEvent[] = [
  { id: "a1", date: "2026-06-19", title: "Priya Shah · Unpaid Leave", type: "leave", sub: "5 days · pending", priority: "medium" },
  { id: "a2", date: "2026-06-19", title: "Liam Carter · Sick Leave", type: "leave", sub: "6 days · pending", priority: "high" },
  { id: "a3", date: "2026-06-20", title: "Harbor Partners — Service contract", type: "meeting", sub: "Renewal review", priority: "medium" },
  { id: "a4", date: "2026-06-20", title: "PO — Lottery restock", type: "delivery", priority: "low" },
  { id: "a5", date: "2026-06-20", title: "Deploy workflow", type: "deadline", priority: "high" },
];

type View = "month" | "week" | "day";

export default function SchedulePage() {
  const session = useSession();
  const tc = useToneColor();
  const canCreate = session.can("create", "hr") || session.can("create", "sales_crm");

  const [extra, setExtra] = React.useState<CalEvent[]>([]);
  const events = React.useMemo(() => [...GENERATED, ...ANCHORS, ...extra], [extra]);

  const [view, setView] = React.useState<View>("month");
  const [anchor, setAnchor] = React.useState<string>(TODAY);
  const [selected, setSelected] = React.useState<string>(TODAY);
  const [filter, setFilter] = React.useState<EventType | "all">("all");

  const byDate = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (filter !== "all" && e.type !== filter) continue;
      const a = map.get(e.date) ?? []; a.push(e); map.set(e.date, a);
    }
    for (const a of map.values()) a.sort((x, y) => (x.time ?? "12:00").localeCompare(y.time ?? "12:00"));
    return map;
  }, [events, filter]);
  const dayEvents = React.useCallback((d: string) => byDate.get(d) ?? [], [byDate]);

  const selectedEvents = dayEvents(selected);
  const upcoming = React.useMemo(() => {
    const from = addDays(TODAY, -1);
    return events
      .filter((e) => (filter === "all" || e.type === filter) && e.date >= from)
      .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      .slice(0, 6);
  }, [events, filter]);

  const shift = (dir: number) => {
    if (view === "month") { const d = parse(anchor); d.setMonth(d.getMonth() + dir); setAnchor(isoOf(d)); }
    else if (view === "week") setAnchor(addDays(anchor, dir * 7));
    else { const ns = addDays(selected, dir); setSelected(ns); setAnchor(ns); }
  };
  const goToday = () => { setAnchor(TODAY); setSelected(TODAY); };
  const openDay = (d: string) => { setSelected(d); setAnchor(d); };

  const rangeLabel = view === "month" ? fmt(anchor, { month: "long", year: "numeric" })
    : view === "week" ? `${fmt(weekDays(anchor)[0], { month: "short", day: "numeric" })} – ${fmt(weekDays(anchor)[6], { month: "short", day: "numeric" })}`
    : fmt(selected, { weekday: "long", month: "long", day: "numeric" });

  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", date: TODAY, time: "10:00", type: "meeting" as EventType, priority: "medium" as Priority });
  function addEvent() {
    if (!form.title.trim()) return;
    setExtra((arr) => [...arr, { id: "ev_" + Math.random().toString(36).slice(2, 7), title: form.title.trim(), date: form.date, time: form.time, type: form.type, priority: form.priority }]);
    openDay(form.date);
    setAddOpen(false);
    setForm({ title: "", date: TODAY, time: "10:00", type: "meeting", priority: "medium" });
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Calendar"
        description="Upcoming events, deadlines, leaves and schedules across your modules."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New event</Button>}
      />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-subtle px-3 py-2.5">
        <span className="mr-1 text-2xs font-bold uppercase tracking-wide text-ink-3">Filter</span>
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} />
        {TYPE_OPTIONS.map((t) => (
          <FilterPill key={t} active={filter === t} tone={TYPE_META[t].tone} label={TYPE_META[t].label} tc={tc} onClick={() => setFilter((f) => (f === t ? "all" : t))} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Calendar */}
        <Card className="lg:col-span-3" padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange/10 text-orange"><CalendarDays size={16} /></span>
              <div className="leading-tight">
                <h2 className="text-sm font-bold text-navy">Calendar</h2>
                <div className="text-2xs text-ink-3">{rangeLabel}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-line p-0.5">
                {(["month", "week", "day"] as View[]).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${view === v ? "bg-orange text-white" : "text-ink-3 hover:text-navy"}`}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => shift(-1)} aria-label="Previous" className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-ink-3 hover:bg-subtle hover:text-navy">‹</button>
                <button onClick={goToday} className="focus-ring rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-subtle">Today</button>
                <button onClick={() => shift(1)} aria-label="Next" className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-ink-3 hover:bg-subtle hover:text-navy">›</button>
              </div>
            </div>
          </div>

          {view === "month" && <MonthView anchor={anchor} selected={selected} onPick={setSelected} dayEvents={dayEvents} tc={tc} />}
          {view === "week" && <WeekView anchor={anchor} selected={selected} onPick={setSelected} dayEvents={dayEvents} tc={tc} />}
          {view === "day" && <DayView date={selected} dayEvents={dayEvents} tc={tc} />}

          <Legend tc={tc} />
        </Card>

        {/* Side: selected day + upcoming */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">{fmt(selected, { weekday: "short", month: "short", day: "numeric" })}</h3>
              {selected === TODAY && <Tag tone="green">Today</Tag>}
            </div>
            {selectedEvents.length === 0 ? (
              <div className="rounded-md bg-subtle py-8 text-center text-sm text-ink-3">No events this day.</div>
            ) : (
              <div className="space-y-2">{selectedEvents.map((e) => <EventRow key={e.id} e={e} tc={tc} />)}</div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Bell size={15} className="text-orange" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-3">Upcoming</h3>
            </div>
            <div className="space-y-1">
              {upcoming.map((e) => {
                const M = TYPE_META[e.type];
                return (
                  <button key={e.id} onClick={() => openDay(e.date)} className="flex w-full items-center gap-3 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-subtle">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-subtle leading-none">
                      <span className="font-mono text-sm font-bold text-navy">{Number(e.date.slice(8))}</span>
                      <span className="text-[8px] font-bold uppercase text-ink-3">{fmt(e.date, { month: "short" })}</span>
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-xs font-semibold text-navy">{e.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-ink-3">
                        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: tc(M.tone) }} />{M.label}</span>
                        <span>· {relLabel(e.date)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {upcoming.length === 0 && <div className="py-6 text-center text-sm text-ink-3">Nothing upcoming.</div>}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New event" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={addEvent}>Add to calendar</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title" required className="col-span-2"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Leadership sync" /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}>{TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}</Select></Field>
          <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}>{PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}</Select></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
        </div>
      </Modal>
    </>
  );
}

// ── shared bits ───────────────────────────────────────────────────────────────
const SURFACE_RING = "0 0 0 1.5px rgb(var(--surface))";

function FilterPill({ active, tone, label, tc, onClick }: { active: boolean; tone?: Tone; label?: string; tc?: (t: Tone) => string; onClick: () => void }) {
  if (!tone) {
    return (
      <button type="button" onClick={onClick}
        className={`rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-wide transition-colors ${active ? "bg-orange text-white" : "border border-line bg-surface text-ink-2 hover:bg-subtle"}`}>
        All
      </button>
    );
  }
  const c = tc!(tone);
  return (
    <button type="button" onClick={onClick}
      style={{ background: `${c}14`, boxShadow: active ? `0 0 0 2px ${c}` : undefined }}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-ink-2 transition-shadow">
      <span className="h-2 w-2 rounded-full" style={{ background: c }} />{label}
    </button>
  );
}

function EventChip({ e, tc }: { e: CalEvent; tc: (t: Tone) => string }) {
  const pc = tc(PRIORITY_META[e.priority].tone);
  return (
    <div className="flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${pc}24` }}
      title={`${TYPE_META[e.type].label} · ${PRIORITY_META[e.priority].label} priority${e.time ? " · " + e.time : ""} · ${e.title}`}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tc(TYPE_META[e.type].tone), boxShadow: SURFACE_RING }} />
      <span className="truncate text-ink-2">{e.title}</span>
    </div>
  );
}

function DayNumber({ date, muted }: { date: string; muted?: boolean }) {
  const isToday = date === TODAY;
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold ${isToday ? "bg-orange text-white" : muted ? "text-ink-3/50" : "text-navy"}`}>
      {Number(date.slice(8))}
    </span>
  );
}

function MonthView({ anchor, selected, onPick, dayEvents, tc }: { anchor: string; selected: string; onPick: (d: string) => void; dayEvents: (d: string) => CalEvent[]; tc: (t: Tone) => string }) {
  const cells = monthGrid(anchor);
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="p-3">
      <div className="grid grid-cols-7 pb-1 text-center">
        {WEEKDAYS.map((d) => <div key={d} className="text-[10px] font-bold uppercase tracking-wide text-ink-3">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const evs = dayEvents(d);
          const inMonth = sameMonth(d, anchor);
          const isSel = d === selected;
          return (
            <button key={d} onClick={() => onPick(d)}
              className={`flex min-h-[92px] flex-col rounded-md border p-1.5 text-left transition-colors ${isSel ? "border-orange ring-1 ring-orange/40" : "border-line hover:border-orange/40 hover:bg-subtle"} ${inMonth ? "" : "bg-subtle/40"}`}>
              <div className="mb-1 flex items-center justify-between">
                <DayNumber date={d} muted={!inMonth} />
                {evs.length > 0 && <span className="text-[9px] font-semibold text-ink-3">{evs.length}</span>}
              </div>
              <div className="space-y-0.5">
                {evs.slice(0, 3).map((e) => <EventChip key={e.id} e={e} tc={tc} />)}
                {evs.length > 3 && <div className="px-1 text-[9px] font-semibold text-ink-3">+{evs.length - 3} more</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ anchor, selected, onPick, dayEvents, tc }: { anchor: string; selected: string; onPick: (d: string) => void; dayEvents: (d: string) => CalEvent[]; tc: (t: Tone) => string }) {
  const days = weekDays(anchor);
  return (
    <div className="grid grid-cols-7 gap-2 p-3">
      {days.map((d) => {
        const evs = dayEvents(d);
        const isSel = d === selected;
        return (
          <button key={d} onClick={() => onPick(d)}
            className={`flex min-h-[260px] flex-col rounded-md border p-2 text-left transition-colors ${isSel ? "border-orange ring-1 ring-orange/40" : "border-line hover:border-orange/40"}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-3">{fmt(d, { weekday: "short" })}</span>
              <DayNumber date={d} />
            </div>
            <div className="space-y-1">
              {evs.slice(0, 6).map((e) => <EventChip key={e.id} e={e} tc={tc} />)}
              {evs.length > 6 && <div className="px-1 text-[9px] font-semibold text-ink-3">+{evs.length - 6} more</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayView({ date, dayEvents, tc }: { date: string; dayEvents: (d: string) => CalEvent[]; tc: (t: Tone) => string }) {
  const evs = dayEvents(date);
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between rounded-md bg-subtle px-3 py-2">
        <h3 className="text-sm font-bold text-navy">{fmt(date, { weekday: "long", month: "long", day: "numeric" })}</h3>
        {date === TODAY && <Tag tone="green">Today</Tag>}
      </div>
      {evs.length === 0 ? (
        <div className="rounded-md bg-subtle py-12 text-center text-sm text-ink-3">No events this day.</div>
      ) : (
        <div className="space-y-2">{evs.map((e) => <EventRow key={e.id} e={e} tc={tc} />)}</div>
      )}
    </div>
  );
}

function Legend({ tc }: { tc: (t: Tone) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line px-4 py-3">
      {TYPE_OPTIONS.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5 text-2xs text-ink-2">
          <span className="h-2 w-2 rounded-full" style={{ background: tc(TYPE_META[t].tone) }} />{TYPE_META[t].label}
        </span>
      ))}
      <span className="mx-1 h-3 w-px bg-line" />
      <span className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Priority</span>
      {PRIORITY_OPTIONS.map((p) => (
        <span key={p} className="inline-flex items-center gap-1.5 text-2xs text-ink-2">
          <span className="h-3 w-4 rounded-sm" style={{ background: `${tc(PRIORITY_META[p].tone)}33` }} />{PRIORITY_META[p].label}
        </span>
      ))}
    </div>
  );
}

function EventRow({ e, tc }: { e: CalEvent; tc: (t: Tone) => string }) {
  const M = TYPE_META[e.type];
  const pc = tc(PRIORITY_META[e.priority].tone);
  // The row's region is softly shaded by priority; type stays as the dot + tag.
  return (
    <div className="rounded-md p-2.5" style={{ background: `${pc}1a` }}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tc(M.tone), boxShadow: SURFACE_RING }} />
        <span className="truncate text-sm font-semibold text-navy">{e.title}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-4 text-2xs text-ink-3">
        <Tag tone={M.tone}>{M.label}</Tag>
        <span className="font-semibold" style={{ color: pc }}>{PRIORITY_META[e.priority].label}</span>
        {e.time && <span className="font-mono">{e.time}</span>}
        {e.sub && <span className="truncate">{e.sub}</span>}
      </div>
    </div>
  );
}
