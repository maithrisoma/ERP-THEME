"use client";
import * as React from "react";
import { CalendarClock, Plus, MapPin, Building2, Clock, Video } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Button, Tag, Card, StatCard, Avatar } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { MeetingBody } from "@/components/crm-detail";
import { meetings as seed, type Meeting } from "@/modules/crm/data";

const TODAY = "2026-06-16";
function dayLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function CrmMeetingsPage() {
  const session = useSession();
  const canCreate = session.can("create", "sales_crm");
  const [list, setList] = React.useState<Meeting[]>(() => seed);
  const [sel, setSel] = React.useState<Meeting | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", account: "", date: TODAY, start: "10:00", end: "10:30", location: "Google Meet" });

  const days = React.useMemo(() => {
    const map = new Map<string, Meeting[]>();
    [...list].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).forEach((m) => {
      const arr = map.get(m.date) ?? [];
      arr.push(m);
      map.set(m.date, arr);
    });
    return [...map.entries()];
  }, [list]);

  function addMeeting() {
    if (!form.title.trim()) return;
    setList((l) => [...l, {
      id: "mt_" + Math.random().toString(36).slice(2, 7), title: form.title.trim(), account: form.account || "—",
      date: form.date, start: form.start, end: form.end, location: form.location, attendees: [session.principal.name], owner: session.principal.name,
    }]);
    setAddOpen(false);
    setForm({ title: "", account: "", date: TODAY, start: "10:00", end: "10:30", location: "Google Meet" });
  }

  return (
    <>
      <PageHeader eyebrow="Sales & CRM" title="Meetings" description="Schedule and track customer meetings across the week."
        actions={canCreate && <Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>Schedule meeting</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Scheduled" value={list.length} icon={CalendarClock} tone="navy" />
        <StatCard label="Today" value={list.filter((m) => m.date === TODAY).length} icon={Clock} tone="orange" />
        <StatCard label="Online" value={list.filter((m) => m.location !== "On-site").length} icon={Video} tone="blue" />
        <StatCard label="On-site" value={list.filter((m) => m.location === "On-site").length} icon={MapPin} tone="teal" />
      </div>

      <div className="mt-4 space-y-5">
        {days.map(([date, items]) => (
          <div key={date}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy">{dayLabel(date)}</h3>
              {date === TODAY && <Tag tone="orange">Today</Tag>}
              <span className="text-2xs text-ink-3">{items.length} meeting{items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-2">
              {items.map((m) => (
                <Card key={m.id} className="cursor-pointer transition-all hover:border-orange/40 hover:shadow-pop" padded={false}>
                  <button onClick={() => setSel(m)} className="flex w-full items-center gap-4 p-3.5 text-left">
                    <div className="w-20 shrink-0 text-center">
                      <div className="font-mono text-sm font-bold text-navy">{m.start}</div>
                      <div className="font-mono text-2xs text-ink-3">{m.end}</div>
                    </div>
                    <div className="h-10 w-px shrink-0 bg-line" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-navy">{m.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-ink-3"><Building2 size={11} /> {m.account}</div>
                    </div>
                    <Tag tone={m.location === "On-site" ? "teal" : "blue"}>{m.location}</Tag>
                    <div className="hidden shrink-0 sm:flex">{m.attendees.slice(0, 3).map((a, i) => <span key={i} className={i ? "-ml-1.5" : ""}><Avatar name={a} tone="navy" size={26} /></span>)}</div>
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Schedule meeting" size="lg"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={addMeeting}>Schedule</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title" required className="col-span-2"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Solution demo" /></Field>
          <Field label="Account" className="col-span-2"><Input value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))} placeholder="Acme Retail" /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Location"><Select value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}><option>Google Meet</option><option>Zoom</option><option>On-site</option><option>Phone</option></Select></Field>
          <Field label="Start"><Input type="time" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} /></Field>
          <Field label="End"><Input type="time" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Meeting" title={sel?.title}>
        {sel && <MeetingBody meeting={sel} />}
      </DetailModal>
    </>
  );
}
