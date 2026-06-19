"use client";
import * as React from "react";
import { Avatar, Tag, type Tone } from "@/components/ui/primitives";
import { byId, employees, positionTitle } from "./data";
import type { EmployeeStatus, EmploymentType, LeaveRequest, PerformanceReview } from "./types";

// ─── Formatting ───────────────────────────────────────────────────────────────
export function fmtDate(iso?: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

export function fmtRelative(iso?: string) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = new Date("2026-06-12T12:00:00Z").getTime();
  const mins = Math.round((now - then) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

// ─── Status tones ─────────────────────────────────────────────────────────────
export const EMP_STATUS_TONE: Record<EmployeeStatus, Tone> = {
  active: "green", on_leave: "amber", probation: "blue", suspended: "coral", terminated: "gray",
};
export const TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", intern: "Intern", seasonal: "Seasonal",
};
export const LEAVE_STATUS_TONE: Record<LeaveRequest["status"], Tone> = {
  pending: "amber", approved: "green", rejected: "coral", cancelled: "gray",
};
export const REVIEW_STATUS_TONE: Record<PerformanceReview["status"], Tone> = {
  not_started: "gray", self_review: "blue", manager_review: "purple", calibration: "amber", complete: "green",
};

export function EmpStatusTag({ status }: { status: EmployeeStatus }) {
  return <Tag tone={EMP_STATUS_TONE[status]}>{status.replace("_", " ")}</Tag>;
}

// ─── Employee identity cell (avatar + name + role) ───────────────────────────
export function EmployeeCell({ id, size = 30, subtitle }: { id?: string; size?: number; subtitle?: string }) {
  const e = id ? byId(employees, id) : undefined;
  if (!e) return <span className="text-ink-3">—</span>;
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={`${e.firstName} ${e.lastName}`} tone={e.avatarTone as Tone} size={size} />
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-navy">{e.firstName} {e.lastName}</div>
        <div className="truncate text-2xs text-ink-3">{subtitle ?? positionTitle(e.positionId)}</div>
      </div>
    </div>
  );
}
