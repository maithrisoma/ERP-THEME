/**
 * HRM repository — pure query + aggregate functions over the seed data.
 *
 * Screens import these directly for instant, synchronous reads (snappy UX);
 * the Next.js BFF route handlers call the same functions, so the API and the
 * UI never diverge. Swapping `DATA_ADAPTER=core` routes these through the Rust
 * service instead (see lib/api.ts).
 */
import type { Money } from "@/platform/types";
import * as db from "./data";
import type { Employee, LeaveRequest, PipelineStage } from "./types";

const TODAY = "2026-06-12";

function zeroMoney(): Money {
  return { amount: 0, currency: "USD" };
}
function addMoney(a: Money, b: Money): Money {
  return { amount: a.amount + b.amount, currency: a.currency };
}

// ─── Employees ────────────────────────────────────────────────────────────────
export interface EmployeeQuery {
  search?: string;
  status?: string;
  departmentId?: string;
  locationId?: string;
  employmentType?: string;
}

export function listEmployees(q: EmployeeQuery = {}): Employee[] {
  let rows = db.employees;
  if (q.search) {
    const s = q.search.toLowerCase();
    rows = rows.filter((e) => `${e.firstName} ${e.lastName} ${e.email} ${e.employeeNo}`.toLowerCase().includes(s));
  }
  if (q.status) rows = rows.filter((e) => e.status === q.status);
  if (q.departmentId) rows = rows.filter((e) => e.departmentId === q.departmentId);
  if (q.locationId) rows = rows.filter((e) => e.locationId === q.locationId);
  if (q.employmentType) rows = rows.filter((e) => e.employmentType === q.employmentType);
  return rows;
}

export const getEmployee = (id: string) => db.byId(db.employees, id);
export const directReports = (managerId: string) => db.employees.filter((e) => e.managerId === managerId && e.status !== "terminated");

// ─── Dashboard analytics ───────────────────────────────────────────────────
export interface HrAnalytics {
  headcount: number;
  newHires30d: number;
  onLeaveToday: number;
  openRequisitions: number;
  pendingApprovals: number;
  attendanceRate: number;
  turnoverRate: number;
  payrollNet: Money;
  complianceRate: number;
  byDepartment: { label: string; value: number }[];
  byType: { label: string; value: number; tone: "navy" | "orange" | "teal" | "blue" | "purple" }[];
  byStatus: { label: string; value: number }[];
}

export function hrAnalytics(): HrAnalytics {
  const active = db.employees.filter((e) => e.status !== "terminated");
  const newHires = db.employees.filter((e) => e.hireDate >= "2026-05-13").length;
  const onLeave = db.employees.filter((e) => e.status === "on_leave").length;
  const pendingLeave = db.leaveRequests.filter((l) => l.status === "pending").length;
  const pendingTs = db.timesheets.filter((t) => t.status === "submitted").length;
  const present = db.attendance.filter((a) => a.date === TODAY && a.status !== "absent").length;
  const expectedToday = active.length;

  const byDeptMap = new Map<string, number>();
  active.forEach((e) => byDeptMap.set(e.departmentId, (byDeptMap.get(e.departmentId) ?? 0) + 1));
  const byDepartment = [...byDeptMap.entries()].map(([id, value]) => ({ label: db.departmentName(id).split(" ")[0], value }));

  const typeTones = { full_time: "navy", part_time: "orange", contract: "teal", intern: "blue", seasonal: "purple" } as const;
  const byTypeMap = new Map<string, number>();
  active.forEach((e) => byTypeMap.set(e.employmentType, (byTypeMap.get(e.employmentType) ?? 0) + 1));
  const byType = [...byTypeMap.entries()].map(([k, value]) => ({ label: k.replace("_", " "), value, tone: typeTones[k as keyof typeof typeTones] ?? "navy" }));

  const statusMap = new Map<string, number>();
  db.employees.forEach((e) => statusMap.set(e.status, (statusMap.get(e.status) ?? 0) + 1));
  const byStatus = [...statusMap.entries()].map(([k, value]) => ({ label: k.replace("_", " "), value }));

  const net = db.payrollRuns.find((r) => r.status === "pending_approval")?.netTotal ?? zeroMoney();
  const compTotals = db.compliance.reduce((acc, c) => ({ done: acc.done + c.completed, total: acc.total + c.total }), { done: 0, total: 0 });

  return {
    headcount: active.length,
    newHires30d: newHires,
    onLeaveToday: onLeave,
    openRequisitions: db.requisitions.filter((r) => r.status === "open").length,
    pendingApprovals: pendingLeave + pendingTs,
    attendanceRate: Math.round((present / Math.max(1, expectedToday)) * 100),
    turnoverRate: Math.round((db.employees.filter((e) => e.status === "terminated").length / db.employees.length) * 100),
    payrollNet: net,
    complianceRate: Math.round((compTotals.done / Math.max(1, compTotals.total)) * 100),
    byDepartment,
    byType,
    byStatus,
  };
}

// ─── Leave ────────────────────────────────────────────────────────────────────
export function listLeave(status?: LeaveRequest["status"]): LeaveRequest[] {
  return status ? db.leaveRequests.filter((l) => l.status === status) : db.leaveRequests;
}
export const leaveBalancesFor = (employeeId: string) => db.leaveBalances.filter((b) => b.employeeId === employeeId);

// ─── Payroll ──────────────────────────────────────────────────────────────────
export const listPayrollRuns = () => db.payrollRuns;
export const getPayrollRun = (id: string) => db.byId(db.payrollRuns, id);
export const payslipsFor = (employeeId: string) => db.payslips.filter((p) => p.employeeId === employeeId);

// ─── Recruitment ───────────────────────────────────────────────────────────
export function candidatesByStage(): Record<PipelineStage, typeof db.candidates> {
  const stages: PipelineStage[] = ["applied", "screening", "interview", "offer", "hired", "rejected"];
  const out = Object.fromEntries(stages.map((s) => [s, [] as typeof db.candidates])) as Record<PipelineStage, typeof db.candidates>;
  db.candidates.forEach((c) => out[c.stage].push(c));
  return out;
}

// ─── Compliance ───────────────────────────────────────────────────────────
export const complianceItems = () => db.compliance;
export const onboardingFor = (employeeId: string) => db.onboardingTasks.filter((t) => t.employeeId === employeeId);

// Re-export the raw collections for convenience in screens.
export { db };
