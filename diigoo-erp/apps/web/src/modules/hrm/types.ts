/**
 * HRM (M13) domain model.
 *
 * Full people-operations surface: org structure, employees, attendance,
 * scheduling, leave, payroll, benefits, performance, recruitment, onboarding,
 * documents and compliance. Mirrored by the Rust `hrm` crate and the Postgres
 * schema (db/migrations).
 */
import type { ID, ISODate, ISODateTime, Money } from "@/platform/types";

// ─── Org structure ───────────────────────────────────────────────────────────
export interface Location {
  id: ID;
  name: string;
  code: string;
  region: string;
  city: string;
  country: string;
  timezone: string;
}

export interface Department {
  id: ID;
  name: string;
  code: string;
  headEmployeeId?: ID;
  parentId?: ID;
  costCenter: string;
}

export interface Position {
  id: ID;
  title: string;
  departmentId: ID;
  level: "intern" | "associate" | "senior" | "lead" | "manager" | "director" | "exec";
  band: string;
}

// ─── Employee ─────────────────────────────────────────────────────────────────
export type EmploymentType = "full_time" | "part_time" | "contract" | "intern" | "seasonal";
export type EmployeeStatus = "active" | "on_leave" | "probation" | "suspended" | "terminated";
export type PayType = "salary" | "hourly";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Compensation {
  payType: PayType;
  base: Money; // annual for salary, hourly rate (in cents) for hourly
  effectiveFrom: ISODate;
  payCycle: "weekly" | "biweekly" | "semimonthly" | "monthly";
  flsaExempt: boolean;
}

export interface Employee {
  id: ID;
  employeeNo: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phone: string;
  avatarTone: string; // color token for the monogram avatar
  status: EmployeeStatus;
  employmentType: EmploymentType;
  positionId: ID;
  departmentId: ID;
  locationId: ID;
  managerId?: ID;
  hireDate: ISODate;
  terminationDate?: ISODate;
  birthDate?: ISODate;
  gender?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  compensation: Compensation;
  customFields: Record<string, unknown>;
  tags: string[];
}

// ─── Attendance & timesheets ──────────────────────────────────────────────────
export type ClockSource = "pos" | "web" | "mobile" | "biometric" | "manual";

export interface AttendanceEntry {
  id: ID;
  employeeId: ID;
  date: ISODate;
  clockIn?: ISODateTime;
  clockOut?: ISODateTime;
  breakMinutes: number;
  hoursWorked: number;
  overtimeHours: number;
  source: ClockSource;
  status: "present" | "late" | "absent" | "remote" | "holiday";
  note?: string;
}

export interface Timesheet {
  id: ID;
  employeeId: ID;
  periodStart: ISODate;
  periodEnd: ISODate;
  totalHours: number;
  overtimeHours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: ISODateTime;
  approvedBy?: ID;
}

// ─── Scheduling ───────────────────────────────────────────────────────────────
export interface Shift {
  id: ID;
  employeeId?: ID; // unassigned = open shift
  locationId: ID;
  role: string;
  date: ISODate;
  start: string; // HH:mm
  end: string; // HH:mm
  status: "scheduled" | "open" | "swapped" | "completed" | "no_show";
  published: boolean;
}

// ─── Leave ────────────────────────────────────────────────────────────────────
export interface LeaveBalance {
  employeeId: ID;
  policyId: ID;
  policyName: string;
  accrued: number;
  used: number;
  pending: number;
  unit: "days" | "hours";
}

export interface LeaveRequest {
  id: ID;
  employeeId: ID;
  policyId: ID;
  policyName: string;
  startDate: ISODate;
  endDate: ISODate;
  days: number;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedAt: ISODateTime;
  decidedBy?: ID;
  decidedAt?: ISODateTime;
  approvalStep?: number;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────
export interface PayrollLine {
  employeeId: ID;
  employeeName: string;
  gross: Money;
  taxes: Money;
  deductions: Money;
  net: Money;
  hours?: number;
}

export interface PayrollRun {
  id: ID;
  periodStart: ISODate;
  periodEnd: ISODate;
  payDate: ISODate;
  status: "draft" | "processing" | "pending_approval" | "finalized" | "paid";
  employeeCount: number;
  grossTotal: Money;
  taxTotal: Money;
  deductionTotal: Money;
  netTotal: Money;
  lines: PayrollLine[];
  approvedBy?: ID;
}

export interface Payslip {
  id: ID;
  runId: ID;
  employeeId: ID;
  periodStart: ISODate;
  periodEnd: ISODate;
  payDate: ISODate;
  gross: Money;
  net: Money;
  earnings: { label: string; amount: Money }[];
  deductions: { label: string; amount: Money }[];
  taxes: { label: string; amount: Money }[];
}

// ─── Benefits ─────────────────────────────────────────────────────────────────
export interface BenefitPlan {
  id: ID;
  name: string;
  category: "health" | "dental" | "vision" | "retirement" | "life" | "wellness";
  carrier: string;
  employeeCost: Money; // per pay period
  employerCost: Money;
  enrolledCount: number;
}

export interface BenefitEnrollment {
  id: ID;
  employeeId: ID;
  planId: ID;
  planName: string;
  status: "enrolled" | "waived" | "pending";
  effectiveDate: ISODate;
  dependents: number;
}

// ─── Performance ──────────────────────────────────────────────────────────────
export interface Goal {
  id: ID;
  employeeId: ID;
  title: string;
  progress: number; // 0..100
  dueDate: ISODate;
  status: "on_track" | "at_risk" | "behind" | "done";
}

export interface PerformanceReview {
  id: ID;
  employeeId: ID;
  reviewerId: ID;
  cycle: string; // e.g. "2026 H1"
  rating?: number; // 1..5
  status: "not_started" | "self_review" | "manager_review" | "calibration" | "complete";
  dueDate: ISODate;
  summary?: string;
}

// ─── Recruitment ──────────────────────────────────────────────────────────────
export interface JobRequisition {
  id: ID;
  title: string;
  departmentId: ID;
  locationId: ID;
  employmentType: EmploymentType;
  openings: number;
  status: "open" | "on_hold" | "closed" | "filled";
  hiringManagerId: ID;
  postedAt: ISODate;
  applicantCount: number;
}

export type PipelineStage = "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";

export interface Candidate {
  id: ID;
  requisitionId: ID;
  name: string;
  email: string;
  stage: PipelineStage;
  rating: number; // 0..5
  source: string;
  appliedAt: ISODate;
  avatarTone: string;
  interviewerId: ID; // employee responsible for taking the interview
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export interface OnboardingTask {
  id: ID;
  employeeId: ID;
  title: string;
  category: "paperwork" | "it" | "training" | "intro" | "compliance";
  assigneeRole: string;
  dueDate: ISODate;
  done: boolean;
}

// ─── Documents & compliance ─────────────────────────────────────────────────
export interface EmployeeDocument {
  id: ID;
  employeeId: ID;
  name: string;
  category: "contract" | "id" | "tax" | "certification" | "policy" | "visa" | "other";
  uploadedAt: ISODate;
  expiresAt?: ISODate;
  sizeKb: number;
  status: "valid" | "expiring" | "expired" | "missing";
}

export interface ComplianceItem {
  id: ID;
  name: string;
  category: "training" | "certification" | "policy_ack" | "i9" | "background_check";
  jurisdiction: string;
  requiredFor: string; // role / department
  completed: number;
  total: number;
  dueDate?: ISODate;
}

// ─── Activity feed ─────────────────────────────────────────────────────────
export interface ActivityEvent {
  id: ID;
  actor: string;
  action: string;
  target: string;
  module: string;
  at: ISODateTime;
  tone: "navy" | "green" | "amber" | "coral" | "blue" | "purple" | "teal";
}
