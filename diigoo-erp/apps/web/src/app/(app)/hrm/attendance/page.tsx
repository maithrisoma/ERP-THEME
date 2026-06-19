"use client";
import * as React from "react";
import { Clock, LogIn, AlarmClockOff, Wifi, UserX, Timer, CheckCircle2, Check, Download } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { useSession } from "@/platform/session";
import { PageHeader, Card, CardHeader, StatCard, Button, Tag } from "@/components/ui/primitives";
import type { Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/table";
import { SegmentedControl } from "@/components/ui/tabs";
import { Donut, BarChart } from "@/components/ui/charts";
import { DetailModal } from "@/components/ui/overlay";
import { FeatureGate } from "@/components/ui/gate";
import { downloadCsv } from "@/lib/export";
import { db } from "@/modules/hrm/repo";
import { EmployeeCell, fmtDate } from "@/modules/hrm/ui";
import type { AttendanceEntry, ClockSource, Timesheet } from "@/modules/hrm/types";
import { EmployeeMonthAttendance } from "@/components/hrm/employee-month-attendance";

const DAYS = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"];
const DEFAULT_DAY = "2026-06-12";

const ATT_STATUS_TONE: Record<AttendanceEntry["status"], Tone> = {
  present: "green",
  late: "amber",
  remote: "blue",
  absent: "coral",
  holiday: "gray",
};

const SOURCE_LABEL: Record<ClockSource, string> = {
  pos: "POS",
  web: "Web",
  mobile: "Mobile",
  biometric: "Biometric",
  manual: "Manual",
};

const TS_STATUS_TONE: Record<Timesheet["status"], Tone> = {
  draft: "gray",
  submitted: "amber",
  approved: "green",
  rejected: "coral",
};

const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

export default function AttendancePage() {
  return (
    <FeatureGate feature="hr.attendance">
      <AttendanceScreen />
    </FeatureGate>
  );
}

function AttendanceScreen() {
  const session = useSession();
  const canUpdate = session.can("update", "hr");

  const [day, setDay] = React.useState(DEFAULT_DAY);
  const [selEmp, setSelEmp] = React.useState<string | null>(null);

  // Active employees expected to be present (excludes terminated).
  const activeEmployees = React.useMemo(() => db.employees.filter((e) => e.status !== "terminated"), []);

  // Attendance rows for the selected day, plus synthesized "absent" rows for
  // active employees who have no entry that day.
  const dayRows = React.useMemo<AttendanceEntry[]>(() => {
    const present = db.attendance.filter((a) => a.date === day);
    const seen = new Set(present.map((a) => a.employeeId));
    const absentees: AttendanceEntry[] = activeEmployees
      .filter((e) => !seen.has(e.id))
      .map((e) => ({
        id: `absent_${e.id}_${day}`,
        employeeId: e.id,
        date: day,
        breakMinutes: 0,
        hoursWorked: 0,
        overtimeHours: 0,
        source: "manual",
        status: "absent",
      }));
    return [...present, ...absentees];
  }, [day, activeEmployees]);

  const kpis = React.useMemo(() => {
    const present = dayRows.filter((r) => r.status === "present").length;
    const late = dayRows.filter((r) => r.status === "late").length;
    const remote = dayRows.filter((r) => r.status === "remote").length;
    const absent = dayRows.filter((r) => r.status === "absent").length;
    const worked = dayRows.filter((r) => r.hoursWorked > 0);
    const avgHours = worked.length ? worked.reduce((s, r) => s + r.hoursWorked, 0) / worked.length : 0;
    return { present, late, remote, absent, avgHours };
  }, [dayRows]);

  // Timesheets with local approval state.
  const [timesheets, setTimesheets] = React.useState<Timesheet[]>(() => db.timesheets);
  const approve = (id: string) =>
    setTimesheets((rows) => rows.map((t) => (t.id === id ? { ...t, status: "approved", approvedBy: session.principal.employeeId } : t)));

  const attColumns: Column<AttendanceEntry>[] = [
    { key: "emp", header: "Employee", accessor: (r) => db.employeeName(r.employeeId), render: (r) => <EmployeeCell id={r.employeeId} /> },
    { key: "status", header: "Status", accessor: (r) => r.status, render: (r) => <Tag tone={ATT_STATUS_TONE[r.status]}>{r.status}</Tag> },
    { key: "in", header: "Clock in", render: (r) => <span className="font-mono text-2xs text-ink-2">{r.clockIn ? fmtDate(r.clockIn, TIME_OPTS) : "—"}</span> },
    { key: "out", header: "Clock out", render: (r) => <span className="font-mono text-2xs text-ink-2">{r.clockOut ? fmtDate(r.clockOut, TIME_OPTS) : "—"}</span> },
    { key: "hours", header: "Hours", align: "right", accessor: (r) => r.hoursWorked, render: (r) => <span className="font-mono text-ink-2">{r.hoursWorked ? r.hoursWorked.toFixed(1) : "—"}</span> },
    { key: "ot", header: "Overtime", align: "right", accessor: (r) => r.overtimeHours, render: (r) => <span className="font-mono text-ink-3">{r.overtimeHours ? `+${r.overtimeHours.toFixed(1)}` : "—"}</span> },
    { key: "source", header: "Source", render: (r) => (r.status === "absent" ? <span className="text-ink-3">—</span> : <Tag tone="gray">{SOURCE_LABEL[r.source]}</Tag>) },
  ];

  const tsColumns: Column<Timesheet>[] = [
    { key: "emp", header: "Employee", accessor: (t) => db.employeeName(t.employeeId), render: (t) => <EmployeeCell id={t.employeeId} /> },
    { key: "period", header: "Period", render: (t) => <span className="text-ink-2">{fmtDate(t.periodStart, { month: "short", day: "numeric" })} – {fmtDate(t.periodEnd, { month: "short", day: "numeric" })}</span> },
    { key: "total", header: "Total hours", align: "right", accessor: (t) => t.totalHours, render: (t) => <span className="font-mono text-ink-2">{t.totalHours.toFixed(1)}</span> },
    { key: "ot", header: "OT", align: "right", accessor: (t) => t.overtimeHours, render: (t) => <span className="font-mono text-ink-3">{t.overtimeHours ? `+${t.overtimeHours.toFixed(1)}` : "—"}</span> },
    { key: "status", header: "Status", accessor: (t) => t.status, render: (t) => <Tag tone={TS_STATUS_TONE[t.status]}>{t.status}</Tag> },
    {
      key: "action",
      header: "",
      align: "right",
      render: (t) =>
        canUpdate && t.status === "submitted" ? (
          <Button size="sm" variant="subtle" icon={Check} onClick={() => approve(t.id)}>
            Approve
          </Button>
        ) : t.status === "approved" ? (
          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-green"><CheckCircle2 size={13} /> Approved</span>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Attendance & timesheets"
        description="Daily clock-in activity and timesheet approvals across the workforce."
        actions={
          <>
            <SegmentedControl
              value={day}
              onChange={setDay}
              options={DAYS.map((d) => ({ id: d, label: fmtDate(d, { month: "short", day: "numeric" }) }))}
            />
            {session.can("export", "hr") && <Button icon={Download} variant="outline" onClick={() => downloadCsv(`attendance-${day}.csv`, [["Employee", "Status", "Clock in", "Clock out", "Hours", "Overtime", "Source"], ...dayRows.map((r) => [db.employeeName(r.employeeId), r.status, r.clockIn ?? "", r.clockOut ?? "", r.hoursWorked, r.overtimeHours, r.source])])}>Export</Button>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Present" value={kpis.present} icon={LogIn} tone="green" hint="on time" />
        <StatCard label="Late" value={kpis.late} icon={AlarmClockOff} tone="amber" />
        <StatCard label="Remote" value={kpis.remote} icon={Wifi} tone="blue" />
        <StatCard label="Absent" value={kpis.absent} icon={UserX} tone="coral" hint="no entry" />
        <StatCard label="Avg hours" value={kpis.avgHours.toFixed(1)} icon={Timer} tone="navy" hint="per worker" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Attendance mix" description={`Status breakdown · ${fmtDate(day, { month: "short", day: "numeric" })}`} />
          <Donut
            segments={[
              { value: kpis.present, tone: "green" as const, label: "Present" },
              { value: kpis.late, tone: "amber" as const, label: "Late" },
              { value: kpis.remote, tone: "blue" as const, label: "Remote" },
              { value: kpis.absent, tone: "coral" as const, label: "Absent" },
            ].filter((s) => s.value > 0)}
            centerValue={dayRows.length}
            centerLabel="people"
          />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Clock-ins this week" description="Employees who clocked in each day" />
          <BarChart data={DAYS.map((d) => ({ label: fmtDate(d, { weekday: "short" }), value: db.attendance.filter((a) => a.date === d).length }))} height={170} />
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Attendance log"
          description={`${dayRows.length} ${dayRows.length === 1 ? "record" : "records"} for ${fmtDate(day)}`}
          icon={Clock}
        />
        <DataTable
          columns={attColumns}
          rows={dayRows}
          keyField={(r) => r.id}
          onRowClick={(r) => setSelEmp(r.employeeId)}
          empty="No attendance recorded for this day."
        />
      </Card>

      <DetailModal open={!!selEmp} onClose={() => setSelEmp(null)} eyebrow="Attendance" title={selEmp && db.employeeName(selEmp)} size="lg">
        {selEmp && <EmployeeAttendance employeeId={selEmp} />}
      </DetailModal>

      <Card className="mt-4">
        <CardHeader
          title="Timesheets — current period"
          description="Jun 1 – Jun 15, 2026 · submit and approve worked hours"
          icon={Timer}
        />
        <DataTable
          columns={tsColumns}
          rows={timesheets}
          keyField={(t) => t.id}
          empty="No timesheets in this period."
        />
      </Card>
    </>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-3">{label}</span>
      <span className={cn("font-mono text-sm font-bold", cls)}>{value}</span>
    </div>
  );
}

/** One employee's month of attendance — the calendar itself is the shared
 *  EmployeeMonthAttendance component (also used on the employee profile). */
function EmployeeAttendance({ employeeId }: { employeeId: string }) {
  const emp = db.byId(db.employees, employeeId);
  return (
    <div>
      <p className="text-sm text-ink-3">{emp ? `${db.positionTitle(emp.positionId)} · ${db.departmentName(emp.departmentId)}` : ""}</p>
      <EmployeeMonthAttendance employeeId={employeeId} className="mt-4" />
    </div>
  );
}
