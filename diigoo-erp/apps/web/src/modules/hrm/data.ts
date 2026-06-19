/**
 * Deterministic seed dataset + repository accessors for the HRM module.
 *
 * Used directly by the Next.js BFF route handlers when DATA_ADAPTER=mock, so
 * the entire product runs with zero external dependencies. The same shapes are
 * served by the Rust core when DATA_ADAPTER=core.
 */
import { money, type Money } from "@/platform/types";
import type {
  ActivityEvent, AttendanceEntry, BenefitEnrollment, BenefitPlan, Candidate,
  ComplianceItem, Department, Employee, EmployeeDocument, Goal, JobRequisition,
  LeaveBalance, LeaveRequest, Location, OnboardingTask, PayrollRun, Payslip,
  PerformanceReview, Position, Shift, Timesheet,
} from "./types";

const TONES = ["navy", "teal", "blue", "purple", "green", "amber", "coral"];

// ─── Locations & departments ─────────────────────────────────────────────────
export const locations: Location[] = [
  { id: "st_001", name: "Downtown Flagship", code: "DTN", region: "rg_east", city: "New York", country: "US", timezone: "America/New_York" },
  { id: "st_002", name: "Riverside Mall", code: "RVS", region: "rg_east", city: "Boston", country: "US", timezone: "America/New_York" },
  { id: "st_003", name: "Westgate Center", code: "WGT", region: "rg_west", city: "Austin", country: "US", timezone: "America/Chicago" },
];

export const departments: Department[] = [
  { id: "dp_exec", name: "Executive", code: "EXE", costCenter: "CC-100" },
  { id: "dp_retail", name: "Retail Operations", code: "RET", costCenter: "CC-200", headEmployeeId: "e_1002" },
  { id: "dp_fin", name: "Finance", code: "FIN", costCenter: "CC-300", headEmployeeId: "e_1005" },
  { id: "dp_hr", name: "People & Culture", code: "HR", costCenter: "CC-400", headEmployeeId: "e_1001" },
  { id: "dp_tech", name: "Technology", code: "TEC", costCenter: "CC-500", headEmployeeId: "e_1008" },
  { id: "dp_mkt", name: "Marketing", code: "MKT", costCenter: "CC-600", headEmployeeId: "e_1011" },
];

export const positions: Position[] = [
  { id: "po_ceo", title: "Chief Executive Officer", departmentId: "dp_exec", level: "exec", band: "E1" },
  { id: "po_hrd", title: "Director of People", departmentId: "dp_hr", level: "director", band: "D1" },
  { id: "po_hrbp", title: "HR Business Partner", departmentId: "dp_hr", level: "senior", band: "S2" },
  { id: "po_recruit", title: "Talent Recruiter", departmentId: "dp_hr", level: "associate", band: "A2" },
  { id: "po_rom", title: "Regional Ops Manager", departmentId: "dp_retail", level: "manager", band: "M2" },
  { id: "po_sm", title: "Store Manager", departmentId: "dp_retail", level: "manager", band: "M1" },
  { id: "po_asm", title: "Assistant Manager", departmentId: "dp_retail", level: "lead", band: "L1" },
  { id: "po_cashier", title: "Sales Associate", departmentId: "dp_retail", level: "associate", band: "A1" },
  { id: "po_cfo", title: "VP Finance", departmentId: "dp_fin", level: "director", band: "D1" },
  { id: "po_acct", title: "Senior Accountant", departmentId: "dp_fin", level: "senior", band: "S2" },
  { id: "po_eng", title: "Engineering Lead", departmentId: "dp_tech", level: "lead", band: "L2" },
  { id: "po_dev", title: "Software Engineer", departmentId: "dp_tech", level: "senior", band: "S1" },
  { id: "po_mktl", title: "Marketing Lead", departmentId: "dp_mkt", level: "lead", band: "L1" },
  { id: "po_mkt", title: "Marketing Specialist", departmentId: "dp_mkt", level: "associate", band: "A2" },
];

interface Spec {
  id: string; no: string; first: string; last: string; pos: string; dept: string;
  loc: string; mgr?: string; type: Employee["employmentType"]; status: Employee["status"];
  hire: string; payType: "salary" | "hourly"; pay: number; exempt: boolean;
}

const SPECS: Spec[] = [
  { id: "e_1000", no: "EMP-1000", first: "Eleanor", last: "Vance", pos: "po_ceo", dept: "dp_exec", loc: "st_001", type: "full_time", status: "active", hire: "2018-02-01", payType: "salary", pay: 320000, exempt: true },
  { id: "e_1001", no: "EMP-1001", first: "Marcus", last: "Hale", pos: "po_hrd", dept: "dp_hr", loc: "st_001", mgr: "e_1000", type: "full_time", status: "active", hire: "2019-06-15", payType: "salary", pay: 168000, exempt: true },
  { id: "e_1042", no: "EMP-1042", first: "Priya", last: "Nair", pos: "po_hrbp", dept: "dp_hr", loc: "st_001", mgr: "e_1001", type: "full_time", status: "active", hire: "2021-09-01", payType: "salary", pay: 98000, exempt: true },
  { id: "e_1043", no: "EMP-1043", first: "Daniel", last: "Cho", pos: "po_recruit", dept: "dp_hr", loc: "st_001", mgr: "e_1001", type: "full_time", status: "active", hire: "2022-03-21", payType: "salary", pay: 72000, exempt: false },
  { id: "e_1002", no: "EMP-1002", first: "Sofia", last: "Reyes", pos: "po_rom", dept: "dp_retail", loc: "st_001", mgr: "e_1000", type: "full_time", status: "active", hire: "2019-01-10", payType: "salary", pay: 142000, exempt: true },
  { id: "e_1003", no: "EMP-1003", first: "James", last: "Okafor", pos: "po_sm", dept: "dp_retail", loc: "st_001", mgr: "e_1002", type: "full_time", status: "active", hire: "2020-04-12", payType: "salary", pay: 88000, exempt: true },
  { id: "e_1004", no: "EMP-1004", first: "Mia", last: "Lindqvist", pos: "po_sm", dept: "dp_retail", loc: "st_002", mgr: "e_1002", type: "full_time", status: "active", hire: "2020-08-03", payType: "salary", pay: 86000, exempt: true },
  { id: "e_1020", no: "EMP-1020", first: "Tariq", last: "Hassan", pos: "po_asm", dept: "dp_retail", loc: "st_001", mgr: "e_1003", type: "full_time", status: "active", hire: "2021-11-15", payType: "hourly", pay: 31.5, exempt: false },
  { id: "e_1021", no: "EMP-1021", first: "Grace", last: "Bennett", pos: "po_cashier", dept: "dp_retail", loc: "st_001", mgr: "e_1003", type: "part_time", status: "active", hire: "2023-02-20", payType: "hourly", pay: 19.0, exempt: false },
  { id: "e_1022", no: "EMP-1022", first: "Leo", last: "Martins", pos: "po_cashier", dept: "dp_retail", loc: "st_001", mgr: "e_1003", type: "full_time", status: "probation", hire: "2026-04-01", payType: "hourly", pay: 18.5, exempt: false },
  { id: "e_1023", no: "EMP-1023", first: "Hana", last: "Suzuki", pos: "po_cashier", dept: "dp_retail", loc: "st_002", mgr: "e_1004", type: "part_time", status: "active", hire: "2022-07-11", payType: "hourly", pay: 19.5, exempt: false },
  { id: "e_1024", no: "EMP-1024", first: "Omar", last: "Farouk", pos: "po_cashier", dept: "dp_retail", loc: "st_003", mgr: "e_1004", type: "seasonal", status: "on_leave", hire: "2024-05-30", payType: "hourly", pay: 18.0, exempt: false },
  { id: "e_1005", no: "EMP-1005", first: "Helena", last: "Wright", pos: "po_cfo", dept: "dp_fin", loc: "st_001", mgr: "e_1000", type: "full_time", status: "active", hire: "2019-03-18", payType: "salary", pay: 195000, exempt: true },
  { id: "e_1006", no: "EMP-1006", first: "Victor", last: "Almeida", pos: "po_acct", dept: "dp_fin", loc: "st_001", mgr: "e_1005", type: "full_time", status: "active", hire: "2021-01-25", payType: "salary", pay: 92000, exempt: true },
  { id: "e_1007", no: "EMP-1007", first: "Nadia", last: "Petrova", pos: "po_acct", dept: "dp_fin", loc: "st_001", mgr: "e_1005", type: "contract", status: "active", hire: "2023-10-02", payType: "hourly", pay: 55.0, exempt: false },
  { id: "e_1008", no: "EMP-1008", first: "Arjun", last: "Mehta", pos: "po_eng", dept: "dp_tech", loc: "st_001", mgr: "e_1000", type: "full_time", status: "active", hire: "2020-02-17", payType: "salary", pay: 158000, exempt: true },
  { id: "e_1009", no: "EMP-1009", first: "Chloe", last: "Dubois", pos: "po_dev", dept: "dp_tech", loc: "st_001", mgr: "e_1008", type: "full_time", status: "active", hire: "2022-06-06", payType: "salary", pay: 124000, exempt: true },
  { id: "e_1010", no: "EMP-1010", first: "Ravi", last: "Krishnan", pos: "po_dev", dept: "dp_tech", loc: "st_003", mgr: "e_1008", type: "full_time", status: "active", hire: "2023-08-14", payType: "salary", pay: 118000, exempt: true },
  { id: "e_1011", no: "EMP-1011", first: "Isabella", last: "Conti", pos: "po_mktl", dept: "dp_mkt", loc: "st_001", mgr: "e_1000", type: "full_time", status: "active", hire: "2021-05-04", payType: "salary", pay: 112000, exempt: true },
  { id: "e_1012", no: "EMP-1012", first: "Noah", last: "Berg", pos: "po_mkt", dept: "dp_mkt", loc: "st_001", mgr: "e_1011", type: "full_time", status: "active", hire: "2023-01-09", payType: "salary", pay: 68000, exempt: false },
  { id: "e_1013", no: "EMP-1013", first: "Amara", last: "Diallo", pos: "po_mkt", dept: "dp_mkt", loc: "st_002", mgr: "e_1011", type: "part_time", status: "active", hire: "2024-02-12", payType: "hourly", pay: 28.0, exempt: false },
  { id: "e_1014", no: "EMP-1014", first: "Felix", last: "Andersson", pos: "po_cashier", dept: "dp_retail", loc: "st_003", mgr: "e_1004", type: "full_time", status: "terminated", hire: "2020-09-01", payType: "hourly", pay: 20.0, exempt: false },
];

function buildEmployee(s: Spec, i: number): Employee {
  const tone = TONES[i % TONES.length];
  return {
    id: s.id,
    employeeNo: s.no,
    firstName: s.first,
    lastName: s.last,
    email: `${s.first.toLowerCase()}.${s.last.toLowerCase()}@northwind.demo`,
    phone: `+1 (212) 555-${(1000 + i).toString().padStart(4, "0")}`,
    avatarTone: tone,
    status: s.status,
    employmentType: s.type,
    positionId: s.pos,
    departmentId: s.dept,
    locationId: s.loc,
    managerId: s.mgr,
    hireDate: s.hire,
    terminationDate: s.status === "terminated" ? "2026-03-15" : undefined,
    birthDate: `19${80 + (i % 18)}-0${(i % 9) + 1}-1${i % 9}`,
    address: `${100 + i} Market Street, ${locations.find((l) => l.id === s.loc)?.city}`,
    emergencyContact: { name: "Alex " + s.last, relationship: "Spouse", phone: `+1 (212) 555-9${(100 + i).toString().padStart(3, "0")}` },
    compensation: {
      payType: s.payType,
      base: money(s.pay),
      effectiveFrom: s.hire,
      payCycle: "biweekly",
      flsaExempt: s.exempt,
    },
    customFields: { tshirt_size: ["S", "M", "L", "XL"][i % 4], emergency_contact: `+1 (212) 555-9${(100 + i).toString().padStart(3, "0")}` },
    tags: s.status === "probation" ? ["new-hire"] : i % 5 === 0 ? ["high-performer"] : [],
  };
}

export const employees: Employee[] = SPECS.map(buildEmployee);

const activeEmployees = employees.filter((e) => e.status !== "terminated");

// ─── Derived / dependent seed ────────────────────────────────────────────────
export const leaveBalances: LeaveBalance[] = activeEmployees.flatMap((e, i) => [
  { employeeId: e.id, policyId: "lp_pto", policyName: "Paid Time Off", accrued: 20, used: 4 + (i % 8), pending: i % 3, unit: "days" },
  { employeeId: e.id, policyId: "lp_sick", policyName: "Sick Leave", accrued: 10, used: i % 4, pending: 0, unit: "days" },
]);

export const leaveRequests: LeaveRequest[] = [
  { id: "lr_001", employeeId: "e_1021", policyId: "lp_pto", policyName: "Paid Time Off", startDate: "2026-06-22", endDate: "2026-06-26", days: 5, reason: "Family vacation", status: "pending", requestedAt: "2026-06-08T09:12:00Z", approvalStep: 1 },
  { id: "lr_002", employeeId: "e_1009", policyId: "lp_sick", policyName: "Sick Leave", startDate: "2026-06-13", endDate: "2026-06-13", days: 1, reason: "Medical appointment", status: "pending", requestedAt: "2026-06-11T16:40:00Z", approvalStep: 1 },
  { id: "lr_003", employeeId: "e_1020", policyId: "lp_pto", policyName: "Paid Time Off", startDate: "2026-07-01", endDate: "2026-07-03", days: 3, reason: "Personal", status: "approved", requestedAt: "2026-05-30T11:00:00Z", decidedBy: "e_1003", decidedAt: "2026-06-01T10:00:00Z" },
  { id: "lr_004", employeeId: "e_1012", policyId: "lp_pto", policyName: "Paid Time Off", startDate: "2026-06-18", endDate: "2026-06-20", days: 3, reason: "Wedding", status: "pending", requestedAt: "2026-06-10T08:30:00Z", approvalStep: 1 },
  { id: "lr_005", employeeId: "e_1024", policyId: "lp_unpaid", policyName: "Unpaid Leave", startDate: "2026-06-01", endDate: "2026-08-31", days: 65, reason: "Sabbatical", status: "approved", requestedAt: "2026-05-01T08:30:00Z", decidedBy: "e_1001", decidedAt: "2026-05-05T08:30:00Z" },
  { id: "lr_006", employeeId: "e_1023", policyId: "lp_sick", policyName: "Sick Leave", startDate: "2026-06-09", endDate: "2026-06-10", days: 2, reason: "Flu", status: "rejected", requestedAt: "2026-06-08T20:00:00Z", decidedBy: "e_1004", decidedAt: "2026-06-09T07:00:00Z" },
];

function attendanceFor(): AttendanceEntry[] {
  const out: AttendanceEntry[] = [];
  const days = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"];
  activeEmployees.forEach((e, ei) => {
    days.forEach((d, di) => {
      const idx = ei * 5 + di;
      const late = idx % 11 === 0;
      const remote = e.departmentId === "dp_tech" && di % 2 === 0;
      const hours = 7.5 + ((idx % 4) * 0.5);
      out.push({
        id: `at_${e.id}_${d}`,
        employeeId: e.id,
        date: d,
        clockIn: `${d}T${late ? "09:18" : "08:57"}:00Z`,
        clockOut: `${d}T17:${(idx % 6) + 2}0:00Z`,
        breakMinutes: 30,
        hoursWorked: hours,
        overtimeHours: idx % 9 === 0 ? 1.5 : 0,
        source: e.positionId === "po_cashier" ? "pos" : "web",
        status: late ? "late" : remote ? "remote" : "present",
      });
    });
  });
  return out;
}
export const attendance: AttendanceEntry[] = attendanceFor();

export const timesheets: Timesheet[] = activeEmployees.slice(0, 10).map((e, i) => ({
  id: `ts_${e.id}`,
  employeeId: e.id,
  periodStart: "2026-06-01",
  periodEnd: "2026-06-15",
  totalHours: 76 + (i % 6),
  overtimeHours: i % 3,
  status: i % 4 === 0 ? "submitted" : i % 4 === 1 ? "approved" : "draft",
  submittedAt: i % 4 === 0 ? "2026-06-11T18:00:00Z" : undefined,
}));

const SHIFT_TIMES = [
  { start: "08:00", end: "16:00" },
  { start: "10:00", end: "18:00" },
  { start: "12:00", end: "20:00" },
  { start: "14:00", end: "22:00" },
];
export const shifts: Shift[] = (() => {
  const retail = activeEmployees.filter((e) => e.departmentId === "dp_retail");
  const days = ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"];
  const out: Shift[] = [];
  retail.forEach((e, ei) => {
    days.forEach((d, di) => {
      if ((ei + di) % 3 === 2) return; // day off
      const t = SHIFT_TIMES[(ei + di) % SHIFT_TIMES.length];
      out.push({ id: `sh_${e.id}_${d}`, employeeId: e.id, locationId: e.locationId, role: "Sales Floor", date: d, start: t.start, end: t.end, status: "scheduled", published: di < 4 });
    });
  });
  // a couple of open shifts to be filled
  out.push({ id: "sh_open_1", locationId: "st_001", role: "Cashier", date: "2026-06-16", start: "16:00", end: "22:00", status: "open", published: true });
  out.push({ id: "sh_open_2", locationId: "st_002", role: "Stock", date: "2026-06-18", start: "06:00", end: "14:00", status: "open", published: true });
  return out;
})();

function payrollLines(): PayrollRun["lines"] {
  return activeEmployees.map((e) => {
    const annual = e.compensation.payType === "salary" ? e.compensation.base.amount : e.compensation.base.amount * 2080;
    const grossPer = Math.round(annual / 26); // biweekly, cents
    const taxes = Math.round(grossPer * 0.22);
    const deductions = Math.round(grossPer * 0.06);
    return {
      employeeId: e.id,
      employeeName: `${e.firstName} ${e.lastName}`,
      gross: { amount: grossPer, currency: "USD" } as Money,
      taxes: { amount: taxes, currency: "USD" } as Money,
      deductions: { amount: deductions, currency: "USD" } as Money,
      net: { amount: grossPer - taxes - deductions, currency: "USD" } as Money,
      hours: e.compensation.payType === "hourly" ? 80 : undefined,
    };
  });
}

function sum(lines: PayrollRun["lines"], k: "gross" | "taxes" | "deductions" | "net"): Money {
  return { amount: lines.reduce((a, l) => a + l[k].amount, 0), currency: "USD" };
}

const lines = payrollLines();
export const payrollRuns: PayrollRun[] = [
  { id: "pr_2026_11", periodStart: "2026-05-16", periodEnd: "2026-05-31", payDate: "2026-06-05", status: "paid", employeeCount: lines.length, grossTotal: sum(lines, "gross"), taxTotal: sum(lines, "taxes"), deductionTotal: sum(lines, "deductions"), netTotal: sum(lines, "net"), lines, approvedBy: "e_1005" },
  { id: "pr_2026_12", periodStart: "2026-06-01", periodEnd: "2026-06-15", payDate: "2026-06-20", status: "pending_approval", employeeCount: lines.length, grossTotal: sum(lines, "gross"), taxTotal: sum(lines, "taxes"), deductionTotal: sum(lines, "deductions"), netTotal: sum(lines, "net"), lines },
];

export const payslips: Payslip[] = lines.slice(0, 12).map((l, i) => ({
  id: `ps_${l.employeeId}`,
  runId: "pr_2026_11",
  employeeId: l.employeeId,
  periodStart: "2026-05-16",
  periodEnd: "2026-05-31",
  payDate: "2026-06-05",
  gross: l.gross,
  net: l.net,
  earnings: [{ label: "Base", amount: l.gross }],
  deductions: [{ label: "401(k)", amount: { amount: Math.round(l.gross.amount * 0.04), currency: "USD" } }, { label: "Health", amount: { amount: Math.round(l.gross.amount * 0.02), currency: "USD" } }],
  taxes: [{ label: "Federal", amount: { amount: Math.round(l.taxes.amount * 0.7), currency: "USD" } }, { label: "State + FICA", amount: { amount: Math.round(l.taxes.amount * 0.3), currency: "USD" } }],
}));

export const benefitPlans: BenefitPlan[] = [
  { id: "bp_health", name: "PPO Health — Aetna", category: "health", carrier: "Aetna", employeeCost: money(120), employerCost: money(480), enrolledCount: 18 },
  { id: "bp_dental", name: "Dental Plus", category: "dental", carrier: "Delta Dental", employeeCost: money(18), employerCost: money(42), enrolledCount: 16 },
  { id: "bp_vision", name: "Vision Care", category: "vision", carrier: "VSP", employeeCost: money(8), employerCost: money(12), enrolledCount: 14 },
  { id: "bp_401k", name: "401(k) Match (4%)", category: "retirement", carrier: "Fidelity", employeeCost: money(0), employerCost: money(0), enrolledCount: 15 },
  { id: "bp_life", name: "Group Life 2x Salary", category: "life", carrier: "MetLife", employeeCost: money(0), employerCost: money(35), enrolledCount: 20 },
  { id: "bp_well", name: "Wellness Stipend", category: "wellness", carrier: "Internal", employeeCost: money(0), employerCost: money(50), enrolledCount: 12 },
];

export const benefitEnrollments: BenefitEnrollment[] = activeEmployees.slice(0, 14).map((e, i) => ({
  id: `be_${e.id}`,
  employeeId: e.id,
  planId: "bp_health",
  planName: "PPO Health — Aetna",
  status: i % 6 === 0 ? "waived" : "enrolled",
  effectiveDate: "2026-01-01",
  dependents: i % 3,
}));

export const goals: Goal[] = activeEmployees.slice(0, 12).flatMap((e, i) => [
  { id: `gl_${e.id}_1`, employeeId: e.id, title: "Lift NPS in store cluster", progress: 40 + ((i * 7) % 55), dueDate: "2026-09-30", status: i % 4 === 0 ? "at_risk" : "on_track" },
  { id: `gl_${e.id}_2`, employeeId: e.id, title: "Complete leadership track", progress: 20 + ((i * 11) % 70), dueDate: "2026-12-31", status: i % 5 === 0 ? "behind" : "on_track" },
]);

export const reviews: PerformanceReview[] = activeEmployees.slice(0, 16).map((e, i) => ({
  id: `rv_${e.id}`,
  employeeId: e.id,
  reviewerId: e.managerId ?? "e_1001",
  cycle: "2026 H1",
  rating: i % 3 === 0 ? undefined : 3 + (i % 3),
  status: (["not_started", "self_review", "manager_review", "calibration", "complete"] as const)[i % 5],
  dueDate: "2026-06-30",
  summary: i % 5 === 4 ? "Exceeds expectations; ready for stretch scope." : undefined,
}));

export const requisitions: JobRequisition[] = [
  { id: "jr_001", title: "Store Manager — Westgate", departmentId: "dp_retail", locationId: "st_003", employmentType: "full_time", openings: 1, status: "open", hiringManagerId: "e_1002", postedAt: "2026-05-20", applicantCount: 28 },
  { id: "jr_002", title: "Software Engineer (Backend)", departmentId: "dp_tech", locationId: "st_001", employmentType: "full_time", openings: 2, status: "open", hiringManagerId: "e_1008", postedAt: "2026-05-28", applicantCount: 64 },
  { id: "jr_003", title: "Seasonal Sales Associate", departmentId: "dp_retail", locationId: "st_001", employmentType: "seasonal", openings: 6, status: "open", hiringManagerId: "e_1003", postedAt: "2026-06-01", applicantCount: 112 },
  { id: "jr_004", title: "Marketing Specialist", departmentId: "dp_mkt", locationId: "st_002", employmentType: "full_time", openings: 1, status: "on_hold", hiringManagerId: "e_1011", postedAt: "2026-04-15", applicantCount: 41 },
];

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
const RECRUITER_ID = "e_1043"; // Daniel Cho, Talent Recruiter — default interviewer fallback
export const candidates: Candidate[] = Array.from({ length: 24 }).map((_, i) => {
  const req = requisitions[i % requisitions.length];
  return {
    id: `cd_${i}`,
    requisitionId: req.id,
    name: ["Avery Stone", "Blair Ng", "Cameron Liu", "Devon Park", "Emerson Cole", "Finley Ross", "Gray Hudson", "Harper Vale", "Indra Sen", "Jordan Pike"][i % 10] + ` ${i}`,
    email: `candidate${i}@mail.demo`,
    stage: STAGES[i % STAGES.length],
    rating: (i % 5) + 1,
    source: ["LinkedIn", "Indeed", "Referral", "Career site"][i % 4],
    appliedAt: `2026-06-0${(i % 9) + 1}`,
    avatarTone: TONES[i % TONES.length],
    // Every applicant is assigned to the role's hiring manager (or the recruiter).
    interviewerId: req.hiringManagerId || RECRUITER_ID,
  };
});

export const onboardingTasks: OnboardingTask[] = [
  { id: "ob_1", employeeId: "e_1022", title: "Sign offer & I-9 verification", category: "paperwork", assigneeRole: "HR", dueDate: "2026-06-14", done: true },
  { id: "ob_2", employeeId: "e_1022", title: "Provision POS login & badge", category: "it", assigneeRole: "IT Admin", dueDate: "2026-06-15", done: true },
  { id: "ob_3", employeeId: "e_1022", title: "Complete food-safety training", category: "training", assigneeRole: "Store Manager", dueDate: "2026-06-18", done: false },
  { id: "ob_4", employeeId: "e_1022", title: "Payroll & direct deposit setup", category: "paperwork", assigneeRole: "HR", dueDate: "2026-06-16", done: false },
  { id: "ob_5", employeeId: "e_1022", title: "Team intro & buddy assignment", category: "intro", assigneeRole: "Store Manager", dueDate: "2026-06-17", done: false },
  { id: "ob_6", employeeId: "e_1022", title: "Anti-harassment policy ack", category: "compliance", assigneeRole: "HR", dueDate: "2026-06-19", done: false },
];

export const documents: EmployeeDocument[] = activeEmployees.slice(0, 14).flatMap((e, i) => [
  { id: `doc_${e.id}_c`, employeeId: e.id, name: "Employment Contract.pdf", category: "contract", uploadedAt: e.hireDate, sizeKb: 240, status: "valid" },
  { id: `doc_${e.id}_id`, employeeId: e.id, name: "Work Authorization.pdf", category: "visa", uploadedAt: e.hireDate, expiresAt: i % 4 === 0 ? "2026-07-15" : "2028-01-01", sizeKb: 180, status: i % 4 === 0 ? "expiring" : "valid" },
]);

export const compliance: ComplianceItem[] = [
  { id: "co_i9", name: "I-9 Employment Eligibility", category: "i9", jurisdiction: "US Federal", requiredFor: "All employees", completed: 19, total: 20, dueDate: "2026-06-30" },
  { id: "co_harass", name: "Anti-Harassment Training", category: "training", jurisdiction: "NY State", requiredFor: "All employees", completed: 17, total: 20, dueDate: "2026-07-31" },
  { id: "co_food", name: "Food Handler Certification", category: "certification", jurisdiction: "NYC DOH", requiredFor: "Retail Operations", completed: 8, total: 11, dueDate: "2026-08-15" },
  { id: "co_pci", name: "PCI-DSS Awareness", category: "training", jurisdiction: "Internal", requiredFor: "Cashiers", completed: 6, total: 7 },
  { id: "co_bg", name: "Background Check", category: "background_check", jurisdiction: "US", requiredFor: "Finance, Management", completed: 9, total: 9 },
];

export const activity: ActivityEvent[] = [
  { id: "ac_1", actor: "Priya Nair", action: "approved leave for", target: "Tariq Hassan", module: "Leave", at: "2026-06-12T09:40:00Z", tone: "green" },
  { id: "ac_2", actor: "System", action: "flagged document expiring for", target: "Grace Bennett", module: "Compliance", at: "2026-06-12T08:15:00Z", tone: "amber" },
  { id: "ac_3", actor: "Helena Wright", action: "submitted payroll run", target: "2026-06-01 → 06-15", module: "Payroll", at: "2026-06-11T18:02:00Z", tone: "navy" },
  { id: "ac_4", actor: "Daniel Cho", action: "moved candidate to Offer", target: "Avery Stone 4", module: "Recruitment", at: "2026-06-11T15:20:00Z", tone: "purple" },
  { id: "ac_5", actor: "Marcus Hale", action: "added new hire", target: "Leo Martins", module: "Onboarding", at: "2026-06-10T11:00:00Z", tone: "blue" },
  { id: "ac_6", actor: "Sofia Reyes", action: "published schedule for", target: "Downtown Flagship", module: "Scheduling", at: "2026-06-09T17:45:00Z", tone: "teal" },
];

// ─── Lookups ─────────────────────────────────────────────────────────────────
export const byId = <T extends { id: string }>(arr: T[], id: string) => arr.find((x) => x.id === id);
export const employeeName = (id?: string) => {
  const e = id ? byId(employees, id) : undefined;
  return e ? `${e.firstName} ${e.lastName}` : "—";
};
export const departmentName = (id: string) => byId(departments, id)?.name ?? "—";
export const positionTitle = (id: string) => byId(positions, id)?.title ?? "—";
export const locationName = (id: string) => byId(locations, id)?.name ?? "—";
