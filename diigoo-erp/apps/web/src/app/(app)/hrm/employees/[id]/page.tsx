"use client";
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, MapPin, UserX, User, Briefcase, Users, Palmtree,
  FileText, Target, Building2, CalendarDays, BadgeCheck, ShieldAlert, Cake,
  Star, type LucideIcon,
} from "@/components/icon/lucide";
import { formatMoney } from "@/platform/types";
import { useSession } from "@/platform/session";
import {
  PageHeader, Button, Tag, Avatar, Card, CardHeader, ProgressBar, EmptyState, SectionLabel,
  type Tone,
} from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { EmployeeMonthAttendance } from "@/components/hrm/employee-month-attendance";
import { getEmployee, directReports, leaveBalancesFor, db } from "@/modules/hrm/repo";
import { useApi } from "@/lib/apiClient";
import { positionTitle, departmentName, locationName, employeeName, byId, positions } from "@/modules/hrm/data";
import {
  EmployeeCell, EmpStatusTag, TYPE_LABEL, fmtDate, fmtRelative,
  LEAVE_STATUS_TONE, REVIEW_STATUS_TONE,
} from "@/modules/hrm/ui";
import type { Employee, EmployeeDocument, LeaveRequest } from "@/modules/hrm/types";

const DOC_STATUS_TONE: Record<EmployeeDocument["status"], Tone> = {
  valid: "green", expiring: "amber", expired: "coral", missing: "gray",
};
const GOAL_STATUS_TONE: Record<string, Tone> = {
  on_track: "green", at_risk: "amber", behind: "coral", done: "blue",
};

const TABS = [
  { id: "overview", label: "Overview", icon: User as LucideIcon },
  { id: "job", label: "Job & Comp", icon: Briefcase as LucideIcon },
  { id: "team", label: "Team", icon: Users as LucideIcon },
  { id: "timeoff", label: "Time off", icon: Palmtree as LucideIcon },
  { id: "attendance", label: "Attendance", icon: CalendarDays as LucideIcon },
  { id: "documents", label: "Documents", icon: FileText as LucideIcon },
  { id: "performance", label: "Performance", icon: Target as LucideIcon },
];

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const session = useSession();
  // Prefer the rich mock record when present; otherwise fetch the live one
  // from the backend so DB-only employees resolve instead of 404-ing.
  const mockEmp = getEmployee(params.id);
  const { data: liveEmp, loading } = useApi<Employee>(mockEmp ? null : `/api/v1/employees/${params.id}`);
  const employee = mockEmp ?? liveEmp ?? null;
  const [tab, setTab] = React.useState("overview");

  if (!employee) {
    if (loading) {
      return (
        <>
          <PageHeader eyebrow="Human Resources" title="Employee profile" />
          <div className="py-20 text-center text-sm text-ink-3">Loading profile…</div>
        </>
      );
    }
    return (
      <>
        <PageHeader eyebrow="Human Resources" title="Employee profile" />
        <EmptyState
          icon={UserX}
          title="Employee not found"
          description="This employee record doesn't exist or has been removed."
          action={
            <Link href="/hrm/employees" className="inline-flex items-center gap-2 rounded-md bg-navy px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              <ArrowLeft size={14} /> Back to directory
            </Link>
          }
        />
      </>
    );
  }

  const reports = directReports(employee.id);
  const canSeeComp =
    session.can("read", "finance") ||
    ["owner", "hr_manager", "accountant"].includes(session.principal.primaryRole);

  return (
    <>
      <Link href="/hrm/employees" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 transition-colors hover:text-navy">
        <ArrowLeft size={14} /> Back to employees
      </Link>

      {/* Identity header */}
      <Card className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={`${employee.firstName} ${employee.lastName}`} tone={employee.avatarTone as Tone} size={64} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-navy">
                {employee.firstName} {employee.lastName}
                {employee.preferredName && <span className="ml-2 text-sm font-medium text-ink-3">&ldquo;{employee.preferredName}&rdquo;</span>}
              </h1>
              <p className="mt-0.5 text-sm text-ink-3">
                {positionTitle(employee.positionId)} · {departmentName(employee.departmentId)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <EmpStatusTag status={employee.status} />
                <Tag tone="gray">{TYPE_LABEL[employee.employmentType]}</Tag>
                <Tag tone="navy">{employee.employeeNo}</Tag>
                {employee.tags.map((t) => <Tag key={t} tone="teal">{t}</Tag>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip icon={Mail} href={`mailto:${employee.email}`}>{employee.email}</Chip>
            <Chip icon={Phone} href={`tel:${employee.phone}`}>{employee.phone}</Chip>
            <Chip icon={MapPin}>{locationName(employee.locationId)}</Chip>
          </div>
        </div>
      </Card>

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-4" />

      {tab === "overview" && <OverviewTab employee={employee} />}
      {tab === "job" && <JobTab employee={employee} canSeeComp={canSeeComp} />}
      {tab === "team" && <TeamTab employee={employee} reports={reports} />}
      {tab === "timeoff" && <TimeOffTab employee={employee} />}
      {tab === "attendance" && (
        <Card>
          <CardHeader title="Attendance — June 2026" description="Daily present / absent / late record for this employee." icon={CalendarDays} />
          <EmployeeMonthAttendance employeeId={employee.id} className="mt-1" />
        </Card>
      )}
      {tab === "documents" && <DocumentsTab employee={employee} />}
      {tab === "performance" && <PerformanceTab employee={employee} />}
    </>
  );
}

// ─── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ employee }: { employee: Employee }) {
  const tenant = useSession((s) => s.tenant);
  const customFields = tenant.customFields.filter((f) => f.entity === "employee" && f.module === "hr");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Personal details" icon={User} />
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Detail icon={Mail} label="Work email" value={employee.email} />
          <Detail icon={Phone} label="Phone" value={employee.phone} />
          <Detail icon={MapPin} label="Address" value={employee.address} className="sm:col-span-2" />
          <Detail icon={Cake} label="Date of birth" value={fmtDate(employee.birthDate)} />
          <Detail label="Gender" value={employee.gender ?? "Not specified"} />
          {employee.emergencyContact && (
            <Detail
              icon={ShieldAlert}
              label="Emergency contact"
              value={`${employee.emergencyContact.name} · ${employee.emergencyContact.relationship} · ${employee.emergencyContact.phone}`}
              className="sm:col-span-2"
            />
          )}
        </dl>
      </Card>

      <Card>
        <CardHeader title="Custom fields" description="Tenant-defined attributes" icon={BadgeCheck} />
        {customFields.length === 0 ? (
          <p className="text-sm text-ink-3">No custom fields configured.</p>
        ) : (
          <dl className="space-y-3">
            {customFields.map((f) => {
              const raw = employee.customFields[f.key];
              const value = raw === undefined || raw === null || raw === "" ? "—" : String(raw);
              return (
                <div key={f.id} className="flex items-center justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
                  <dt className="text-xs text-ink-3">
                    {f.label}
                    {f.group && <span className="ml-1.5 text-2xs text-ink-3/70">· {f.group}</span>}
                  </dt>
                  <dd className="text-right text-sm font-medium text-ink-2">{value}</dd>
                </div>
              );
            })}
          </dl>
        )}
      </Card>
    </div>
  );
}

// ─── Job & Comp ──────────────────────────────────────────────────────────────
function JobTab({ employee, canSeeComp }: { employee: Employee; canSeeComp: boolean }) {
  const position = byId(positions, employee.positionId);
  const comp = employee.compensation;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Position & org" icon={Building2} />
        <dl className="space-y-3">
          <Detail icon={Briefcase} label="Position" value={positionTitle(employee.positionId)} />
          <Detail icon={Building2} label="Department" value={departmentName(employee.departmentId)} />
          <Detail icon={MapPin} label="Location" value={locationName(employee.locationId)} />
          <Detail icon={Users} label="Manager" value={employeeName(employee.managerId)} />
          <Detail label="Band / level" value={position ? `${position.band} · ${position.level}` : "—"} />
          <Detail label="Employment type" value={TYPE_LABEL[employee.employmentType]} />
        </dl>
      </Card>

      <Card>
        <CardHeader title="Dates & tenure" icon={CalendarDays} />
        <dl className="space-y-3">
          <Detail icon={CalendarDays} label="Hire date" value={fmtDate(employee.hireDate)} />
          <Detail label="Tenure" value={tenure(employee.hireDate)} />
          {employee.terminationDate && <Detail label="Termination date" value={fmtDate(employee.terminationDate)} />}
          <Detail label="Pay cycle" value={comp.payCycle} />
          <Detail label="FLSA" value={comp.flsaExempt ? "Exempt" : "Non-exempt"} />
        </dl>

        <SectionLabel>Compensation</SectionLabel>
        {canSeeComp ? (
          <div className="rounded-md bg-subtle p-4">
            <div className="text-2xs uppercase tracking-wide text-ink-3">Base {comp.payType === "hourly" ? "rate" : "salary"}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-navy">
              {formatMoney(comp.base)}
              <span className="ml-1 text-sm font-medium text-ink-3">{comp.payType === "hourly" ? "/ hr" : "/ yr"}</span>
            </div>
            <div className="mt-1 text-xs text-ink-3">Effective {fmtDate(comp.effectiveFrom)}</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-subtle p-4 text-sm text-ink-3">
            <ShieldAlert size={15} /> Compensation is restricted to People &amp; Finance roles.
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Team ──────────────────────────────────────────────────────────────────────
function TeamTab({ employee, reports }: { employee: Employee; reports: Employee[] }) {
  const manager = employee.managerId ? getEmployee(employee.managerId) : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Reports to" icon={Users} />
        {manager ? (
          <Link href={`/hrm/employees/${manager.id}`} className="block rounded-md p-1 transition-colors hover:bg-subtle">
            <EmployeeCell id={manager.id} size={36} />
          </Link>
        ) : (
          <p className="text-sm text-ink-3">No manager (top of org).</p>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader
          title="Direct reports"
          description={`${reports.length} active report${reports.length === 1 ? "" : "s"}`}
          icon={Users}
        />
        {reports.length === 0 ? (
          <EmptyState icon={Users} title="No direct reports" description="This employee doesn't manage anyone." />
        ) : (
          <div className="divide-y divide-line">
            {reports.map((r) => (
              <Link key={r.id} href={`/hrm/employees/${r.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-subtle">
                <div className="min-w-0 flex-1"><EmployeeCell id={r.id} size={34} /></div>
                <span className="hidden text-xs text-ink-3 sm:block">{departmentName(r.departmentId)}</span>
                <EmpStatusTag status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Time off ──────────────────────────────────────────────────────────────────
function TimeOffTab({ employee }: { employee: Employee }) {
  const balances = leaveBalancesFor(employee.id);
  const requests = db.leaveRequests.filter((l) => l.employeeId === employee.id);

  const columns: Column<LeaveRequest>[] = [
    { key: "policy", header: "Policy", render: (r) => <span className="font-medium text-ink-2">{r.policyName}</span> },
    { key: "range", header: "Dates", render: (r) => <span className="text-ink-3">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</span> },
    { key: "days", header: "Days", align: "right", accessor: (r) => r.days, render: (r) => <span className="font-mono font-semibold text-navy">{r.days}</span> },
    { key: "reason", header: "Reason", render: (r) => <span className="text-ink-3">{r.reason ?? "—"}</span> },
    { key: "status", header: "Status", accessor: (r) => r.status, render: (r) => <Tag tone={LEAVE_STATUS_TONE[r.status]}>{r.status}</Tag> },
    { key: "req", header: "Requested", align: "right", render: (r) => <span className="text-2xs text-ink-3">{fmtRelative(r.requestedAt)}</span> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Leave balances" icon={Palmtree} />
        {balances.length === 0 ? (
          <p className="text-sm text-ink-3">No balances on file.</p>
        ) : (
          <div className="space-y-4">
            {balances.map((b) => {
              const remaining = b.accrued - b.used;
              return (
                <div key={b.policyId}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-2">{b.policyName}</span>
                    <span className="font-mono font-semibold text-navy">{remaining} / {b.accrued} {b.unit}</span>
                  </div>
                  <ProgressBar value={(remaining / Math.max(1, b.accrued)) * 100} tone="teal" />
                  {b.pending > 0 && <div className="mt-1 text-2xs text-ink-3">{b.pending} {b.unit} pending</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Leave requests" description={`${requests.length} on record`} icon={CalendarDays} />
        <DataTable columns={columns} rows={requests} keyField={(r) => r.id} empty="No leave requests yet." dense />
      </Card>
    </div>
  );
}

// ─── Documents ──────────────────────────────────────────────────────────────────
function DocumentsTab({ employee }: { employee: Employee }) {
  const docs = db.documents.filter((d) => d.employeeId === employee.id);

  const columns: Column<EmployeeDocument>[] = [
    { key: "name", header: "Document", accessor: (d) => d.name, render: (d) => <span className="flex items-center gap-2 font-medium text-navy"><FileText size={14} className="text-ink-3" />{d.name}</span> },
    { key: "category", header: "Category", render: (d) => <Tag tone="gray">{d.category}</Tag> },
    { key: "uploaded", header: "Uploaded", accessor: (d) => d.uploadedAt, render: (d) => <span className="text-ink-3">{fmtDate(d.uploadedAt)}</span> },
    { key: "expires", header: "Expires", render: (d) => <span className="text-ink-3">{d.expiresAt ? fmtDate(d.expiresAt) : "—"}</span> },
    { key: "size", header: "Size", align: "right", accessor: (d) => d.sizeKb, render: (d) => <span className="font-mono text-2xs text-ink-3">{d.sizeKb} KB</span> },
    { key: "status", header: "Status", accessor: (d) => d.status, render: (d) => <Tag tone={DOC_STATUS_TONE[d.status]}>{d.status}</Tag> },
  ];

  return (
    <Card padded={false} className="p-4">
      <CardHeader title="Documents" description={`${docs.length} file${docs.length === 1 ? "" : "s"} on record`} icon={FileText} />
      <DataTable columns={columns} rows={docs} keyField={(d) => d.id} empty="No documents uploaded for this employee." dense />
    </Card>
  );
}

// ─── Performance ──────────────────────────────────────────────────────────────
function PerformanceTab({ employee }: { employee: Employee }) {
  const reviews = db.reviews.filter((r) => r.employeeId === employee.id);
  const goals = db.goals.filter((g) => g.employeeId === employee.id);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Reviews" description="Performance cycle history" icon={Star} />
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews" description="No performance reviews on record." />
        ) : (
          <div className="divide-y divide-line">
            {reviews.map((r) => (
              <div key={r.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-navy">{r.cycle}</div>
                    <div className="text-2xs text-ink-3">Reviewer · {employeeName(r.reviewerId)} · due {fmtDate(r.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof r.rating === "number" && (
                      <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-navy"><Star size={13} className="text-amber" />{r.rating.toFixed(1)}</span>
                    )}
                    <Tag tone={REVIEW_STATUS_TONE[r.status]}>{r.status.replace("_", " ")}</Tag>
                  </div>
                </div>
                {r.summary && <p className="mt-1.5 text-xs text-ink-3">{r.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Goals" description="Objectives & progress" icon={Target} />
        {goals.length === 0 ? (
          <EmptyState icon={Target} title="No goals" description="No goals assigned to this employee." />
        ) : (
          <div className="space-y-4">
            {goals.map((g) => (
              <div key={g.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-medium text-ink-2">{g.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Tag tone={GOAL_STATUS_TONE[g.status] ?? "gray"}>{g.status.replace("_", " ")}</Tag>
                    <span className="font-mono font-semibold text-navy">{g.progress}%</span>
                  </span>
                </div>
                <ProgressBar value={g.progress} tone={g.status === "behind" ? "coral" : g.status === "at_risk" ? "amber" : "teal"} />
                <div className="mt-1 text-2xs text-ink-3">Due {fmtDate(g.dueDate)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Shared bits ──────────────────────────────────────────────────────────────
function Detail({ icon: Icon, label, value, className }: { icon?: LucideIcon; label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-xs text-ink-3">{Icon && <Icon size={13} />}{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink-2">{value || "—"}</dd>
    </div>
  );
}

function Chip({ icon: Icon, href, children }: { icon: LucideIcon; href?: string; children: React.ReactNode }) {
  const cls = "inline-flex items-center gap-1.5 rounded-md border border-line bg-subtle px-2.5 py-1.5 text-xs font-medium text-ink-2";
  const inner = <><Icon size={13} className="text-ink-3" />{children}</>;
  return href ? <a href={href} className={`${cls} transition-colors hover:border-ink-3/40 hover:text-navy`}>{inner}</a> : <span className={cls}>{inner}</span>;
}

function tenure(hireDate: string) {
  const start = new Date(hireDate).getTime();
  const now = new Date("2026-06-12T12:00:00Z").getTime();
  const years = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 1) return `${Math.max(0, Math.round(years * 12))} mo`;
  return `${years.toFixed(1)} yrs`;
}
