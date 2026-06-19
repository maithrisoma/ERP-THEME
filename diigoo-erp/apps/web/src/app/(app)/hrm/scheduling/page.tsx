"use client";
import * as React from "react";
import { CalendarClock, CalendarDays, Clock, Send, CheckCircle2, UserPlus, MapPin, LayoutGrid } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Card, CardHeader, StatCard, Button, Tag, Avatar, DetailRow, type Tone } from "@/components/ui/primitives";
import { DetailModal } from "@/components/ui/overlay";
import { FeatureGate } from "@/components/ui/gate";
import { db } from "@/modules/hrm/repo";
import { locationName } from "@/modules/hrm/data";
import { fmtDate } from "@/modules/hrm/ui";
import type { Shift } from "@/modules/hrm/types";

const WEEK_DAYS = ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"];

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function dayLabel(iso: string): { weekday: string; day: string } {
  const d = new Date(iso);
  return {
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d),
    day: new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(d),
  };
}

export default function SchedulingPage() {
  return (
    <FeatureGate feature="hr.scheduling">
      <SchedulingBoard />
    </FeatureGate>
  );
}

function SchedulingBoard() {
  const session = useSession();
  const canPublish = session.can("update", "hr");
  const [published, setPublished] = React.useState(false);
  const [claimed, setClaimed] = React.useState<Set<string>>(() => new Set());
  const [selShift, setSelShift] = React.useState<Shift | null>(null);

  const retail = React.useMemo(
    () => db.employees.filter((e) => e.departmentId === "dp_retail" && e.status !== "terminated"),
    [],
  );

  const weekShifts = React.useMemo(() => db.shifts.filter((s) => WEEK_DAYS.includes(s.date)), []);

  // Index assigned shifts by `${employeeId}|${date}` for O(1) cell lookup.
  const shiftMap = React.useMemo(() => {
    const m = new Map<string, Shift>();
    weekShifts.forEach((s) => {
      if (s.employeeId) m.set(`${s.employeeId}|${s.date}`, s);
    });
    return m;
  }, [weekShifts]);

  const openShifts = React.useMemo(() => weekShifts.filter((s) => s.status === "open" && !claimed.has(s.id)), [weekShifts, claimed]);

  const totalShifts = weekShifts.length;
  const scheduledHours = React.useMemo(
    () => Math.round(weekShifts.reduce((sum, s) => sum + hoursBetween(s.start, s.end), 0)),
    [weekShifts],
  );
  const coverageDays = React.useMemo(() => new Set(weekShifts.map((s) => s.date)).size, [weekShifts]);

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Shift scheduling"
        description="Weekly retail roster for the week of Jun 15–21, 2026. Build coverage and publish the schedule to the team."
        actions={
          canPublish ? (
            <Button
              icon={published ? CheckCircle2 : Send}
              variant={published ? "subtle" : "primary"}
              onClick={() => setPublished((p) => !p)}
            >
              {published ? "Published" : "Publish week"}
            </Button>
          ) : undefined
        }
      />

      {published && (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-green/30 bg-green/8 px-3.5 py-2.5 text-sm text-navy">
          <CheckCircle2 size={16} className="text-green" />
          <span>
            <strong>Week published.</strong> All {retail.length} retail team members have been notified of their shifts for Jun 15–21.
          </span>
          <button onClick={() => setPublished(false)} className="ml-auto text-xs font-semibold text-ink-3 hover:text-navy">
            Unpublish
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total shifts" value={totalShifts} hint="this week" icon={CalendarClock} tone="navy" />
        <StatCard label="Open shifts" value={openShifts.length} hint="need coverage" icon={UserPlus} tone={openShifts.length > 0 ? "amber" : "green"} />
        <StatCard label="Scheduled hours" value={scheduledHours} hint="across all staff" icon={Clock} tone="teal" />
        <StatCard label="Coverage days" value={`${coverageDays} / 7`} hint="days staffed" icon={CalendarDays} tone="blue" />
      </div>

      {/* Weekly grid */}
      <Card className="mt-4" padded={false}>
        <div className="p-4 pb-0">
          <CardHeader title="Weekly roster" description="Retail Operations · Jun 15–21, 2026" icon={LayoutGrid} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-52 border-b border-line bg-surface px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wide text-ink-3">
                  Employee
                </th>
                {WEEK_DAYS.map((d) => {
                  const { weekday, day } = dayLabel(d);
                  return (
                    <th key={d} className="border-b border-l border-line px-3 py-2.5 text-center">
                      <div className="text-2xs font-semibold uppercase tracking-wide text-ink-3">{weekday}</div>
                      <div className="font-mono text-sm font-bold text-navy">{day}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {retail.map((e) => (
                <tr key={e.id} className="group">
                  <td className="sticky left-0 z-10 border-b border-line bg-surface px-4 py-2.5 group-hover:bg-subtle">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${e.firstName} ${e.lastName}`} tone={e.avatarTone as Tone} size={28} />
                      <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm font-semibold text-navy">{e.firstName} {e.lastName}</div>
                        <div className="truncate text-2xs text-ink-3">{locationName(e.locationId)}</div>
                      </div>
                    </div>
                  </td>
                  {WEEK_DAYS.map((d) => {
                    const shift = shiftMap.get(`${e.id}|${d}`);
                    return (
                      <td key={d} className="border-b border-l border-line px-2 py-2.5 text-center align-middle">
                        {shift ? (
                          <button onClick={() => setSelShift(shift)} className="focus-ring inline-flex items-center rounded-md bg-navy/8 px-2 py-1 font-mono text-2xs font-semibold text-navy transition-colors hover:bg-orange/15 hover:text-orange-dark">
                            {shift.start}–{shift.end}
                          </button>
                        ) : (
                          <span className="text-sm text-line">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Open shifts */}
      <Card className="mt-4">
        <CardHeader
          title="Open shifts"
          description={`${openShifts.length} unassigned shift${openShifts.length === 1 ? "" : "s"} awaiting coverage`}
          icon={UserPlus}
        />
        {openShifts.length === 0 ? (
          <div className="rounded-md bg-subtle py-8 text-center text-sm text-ink-3">No open shifts — full coverage this week.</div>
        ) : (
          <div className="divide-y divide-line">
            {openShifts.map((s) => (
              <div key={s.id} onClick={() => setSelShift(s)} className="flex cursor-pointer flex-wrap items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-subtle">
                <Tag tone="amber">{s.role}</Tag>
                <span className="flex items-center gap-1.5 text-sm text-ink-2">
                  <MapPin size={13} className="text-ink-3" /> {locationName(s.locationId)}
                </span>
                <span className="text-sm text-ink-2">{fmtDate(s.date, { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="font-mono text-sm font-semibold text-navy">{s.start}–{s.end}</span>
                <span className="ml-auto text-2xs text-ink-3">{Math.round(hoursBetween(s.start, s.end))}h</span>
                <Button size="sm" variant="outline" icon={UserPlus} onClick={(e) => { e.stopPropagation(); setClaimed((c) => new Set(c).add(s.id)); }}>Claim / Assign</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <DetailModal open={!!selShift} onClose={() => setSelShift(null)} eyebrow="Shift" title={selShift && (selShift.employeeId ? db.employeeName(selShift.employeeId) : "Open shift")}>
        {selShift && (
          <div>
            <div><Tag tone={selShift.status === "open" ? "amber" : "teal"}>{selShift.status}</Tag></div>
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label="Role" value={selShift.role} />
              <DetailRow label="Location" value={locationName(selShift.locationId)} />
              <DetailRow label="Date" value={fmtDate(selShift.date, { weekday: "long", month: "short", day: "numeric" })} />
              <DetailRow label="Time" value={`${selShift.start} – ${selShift.end}`} />
              <DetailRow label="Hours" value={`${Math.round(hoursBetween(selShift.start, selShift.end))} h`} />
              <DetailRow label="Published" value={selShift.published ? "Yes" : "Draft"} />
            </dl>
            {selShift.status === "open" && !claimed.has(selShift.id) && (
              <Button variant="primary" icon={UserPlus} className="mt-6 w-full" onClick={() => { setClaimed((c) => new Set(c).add(selShift.id)); setSelShift(null); }}>Claim / Assign</Button>
            )}
          </div>
        )}
      </DetailModal>
    </>
  );
}
