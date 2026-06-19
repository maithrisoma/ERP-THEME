"use client";
import * as React from "react";
import { CalendarDays } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { RingProgress } from "@/components/ui/charts";
import { Tag, type Tone } from "@/components/ui/primitives";
import { db } from "@/modules/hrm/repo";
import { fmtDate } from "@/modules/hrm/ui";
import type { ClockSource } from "@/modules/hrm/types";

/**
 * One employee's June-2026 attendance calendar — present/absent/late/remote at
 * a glance, plus a summary ring and a recent-days log. Shared by the Attendance
 * page popup and the employee profile so both stay in sync.
 */
const CAL_TODAY = "2026-06-16";
type DayStatus = "present" | "late" | "remote" | "absent" | "off" | "upcoming";
interface CalDay { date: string; day: number; status: DayStatus; hours: number; clockIn?: string; clockOut?: string; source?: ClockSource }

const CAL_CLASS: Record<DayStatus, string> = {
  present: "bg-green/15 text-green",
  late: "bg-amber/20 text-amber",
  remote: "bg-blue/15 text-blue",
  absent: "bg-coral/15 text-coral",
  off: "bg-subtle text-ink-3/50",
  upcoming: "border border-dashed border-line text-ink-3/40",
};
const CAL_LEGEND: { status: DayStatus; label: string }[] = [
  { status: "present", label: "Present" }, { status: "late", label: "Late" },
  { status: "remote", label: "Remote" }, { status: "absent", label: "Absent" }, { status: "off", label: "Weekend" },
];
const LOG_TONE: Partial<Record<DayStatus, Tone>> = { present: "green", late: "amber", remote: "blue", absent: "coral" };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Build a full June-2026 attendance month for one employee. Real seed entries
 *  are authoritative; remaining workdays are synthesized deterministically so
 *  the calendar reads as a realistic present/absent pattern. */
export function monthAttendance(employeeId: string): CalDay[] {
  const real = new Map(db.attendance.filter((a) => a.employeeId === employeeId).map((a) => [a.date, a]));
  const out: CalDay[] = [];
  for (let d = 1; d <= 30; d++) {
    const date = `2026-06-${String(d).padStart(2, "0")}`;
    const wd = new Date(date + "T00:00:00").getDay();
    const weekend = wd === 0 || wd === 6;
    const r = real.get(date);
    if (weekend) { out.push({ date, day: d, status: "off", hours: 0 }); continue; }
    if (r) { out.push({ date, day: d, status: r.status as DayStatus, hours: r.hoursWorked, clockIn: r.clockIn, clockOut: r.clockOut, source: r.source }); continue; }
    if (date > CAL_TODAY) { out.push({ date, day: d, status: "upcoming", hours: 0 }); continue; }
    const h = hashStr(employeeId + date) % 20;
    const status: DayStatus = h === 0 ? "absent" : h <= 2 ? "late" : h <= 4 ? "remote" : "present";
    const hours = status === "absent" ? 0 : 7.5 + (h % 4) * 0.5;
    out.push({
      date, day: d, status, hours,
      clockIn: status === "absent" ? undefined : `${date}T08:${status === "late" ? "22" : "57"}:00Z`,
      clockOut: status === "absent" ? undefined : `${date}T17:${10 + (h % 5)}:00Z`,
      source: "web",
    });
  }
  return out;
}

function Stat({ label, value, cls }: { label: string; value: React.ReactNode; cls: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-3">{label}</span>
      <span className={cn("font-mono text-sm font-bold", cls)}>{value}</span>
    </div>
  );
}

export function EmployeeMonthAttendance({ employeeId, className }: { employeeId: string; className?: string }) {
  const month = React.useMemo(() => monthAttendance(employeeId), [employeeId]);
  const recorded = month.filter((c) => c.status !== "off" && c.status !== "upcoming");
  const present = recorded.filter((c) => c.status === "present").length;
  const late = recorded.filter((c) => c.status === "late").length;
  const remote = recorded.filter((c) => c.status === "remote").length;
  const absent = recorded.filter((c) => c.status === "absent").length;
  const workdays = recorded.length;
  const rate = workdays ? Math.round(((present + late + remote) / workdays) * 100) : 0;
  const withHours = recorded.filter((c) => c.hours > 0);
  const totalHours = withHours.reduce((s, c) => s + c.hours, 0);
  const avgHours = withHours.length ? totalHours / withHours.length : 0;
  const offset = (new Date("2026-06-01T00:00:00").getDay() + 6) % 7;

  return (
    <div className={className}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,280px)_1fr] sm:items-start">
        {/* Calendar — capped width so the day cells stay small */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-3"><CalendarDays size={13} /> June 2026</div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <div key={d} className="pb-0.5 text-[10px] font-semibold text-ink-3">{d}</div>)}
            {Array.from({ length: offset }).map((_, i) => <div key={`b${i}`} />)}
            {month.map((c) => (
              <div key={c.date} title={`${fmtDate(c.date, { month: "short", day: "numeric" })} · ${c.status}`}
                className={cn("flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold", CAL_CLASS[c.status])}>
                {c.day}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {CAL_LEGEND.map((l) => (
              <span key={l.status} className="inline-flex items-center gap-1.5 text-2xs text-ink-2"><span className={cn("h-2.5 w-2.5 rounded-sm", CAL_CLASS[l.status])} />{l.label}</span>
            ))}
          </div>
        </div>

        {/* Summary + recent days */}
        <div className="min-w-0">
          <div className="flex items-center gap-4 rounded-lg border border-line bg-subtle p-3">
            <RingProgress value={rate} size={58} thickness={7} tone={rate >= 95 ? "green" : rate >= 85 ? "amber" : "coral"} />
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-2xs">
              <Stat label="Present" value={present} cls="text-green" />
              <Stat label="Late" value={late} cls="text-amber" />
              <Stat label="Remote" value={remote} cls="text-blue" />
              <Stat label="Absent" value={absent} cls="text-coral" />
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-base font-bold text-navy">{avgHours.toFixed(1)}</div>
              <div className="text-[10px] text-ink-3">avg hrs/day</div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-ink-2">{totalHours.toFixed(0)}h total</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-3">Recent days</div>
            <div className="divide-y divide-line">
              {recorded.slice().reverse().slice(0, 6).map((c) => (
                <div key={c.date} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="w-12 shrink-0 font-mono text-2xs text-ink-3">{fmtDate(c.date, { month: "short", day: "numeric" })}</span>
                  <Tag tone={LOG_TONE[c.status] ?? "gray"}>{c.status}</Tag>
                  <span className="ml-auto font-mono text-2xs text-ink-3">{c.clockIn ? fmtDate(c.clockIn, TIME_OPTS) : "—"}{c.clockOut ? `–${fmtDate(c.clockOut, TIME_OPTS)}` : ""}</span>
                  <span className="w-12 shrink-0 text-right font-mono text-2xs font-semibold text-navy">{c.hours ? `${c.hours.toFixed(1)}h` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
