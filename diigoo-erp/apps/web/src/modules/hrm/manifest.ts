import {
  LayoutDashboard, Users, Network, Clock, CalendarDays, Palmtree, Wallet,
  HeartPulse, Target, UserPlus, Rocket, FileText, ShieldCheck, BarChart3, SlidersHorizontal, Timer,
} from "@/components/icon/lucide";
import type { ModuleManifest } from "@/platform/modules";

/**
 * HRM module manifest. Declares the full navigation surface; the shell filters
 * each item by role (RBAC), package (feature flag) and tenant module-enablement.
 */
export const hrmManifest: ModuleManifest = {
  key: "hr",
  name: "Human Resources",
  tagline: "People operations, payroll & compliance",
  icon: Users,
  accent: "purple",
  basePath: "/hrm",
  nav: [
    {
      id: "overview",
      label: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", href: "/hrm", icon: LayoutDashboard, module: "hr", selfService: true },
      ],
    },
    {
      id: "people",
      label: "People",
      items: [
        { id: "employees", label: "Employees", href: "/hrm/employees", icon: Users, module: "hr" },
        { id: "org", label: "Org Chart", href: "/hrm/org", icon: Network, module: "hr", feature: "hr.org_chart" },
      ],
    },
    {
      id: "time",
      label: "Time & Attendance",
      items: [
        { id: "attendance", label: "Attendance", href: "/hrm/attendance", icon: Clock, module: "hr", feature: "hr.attendance" },
        { id: "timesheets", label: "Timesheets", href: "/hrm/timesheets", icon: Timer, module: "hr", feature: "hr.attendance", selfService: true },
        { id: "scheduling", label: "Scheduling", href: "/hrm/scheduling", icon: CalendarDays, module: "hr", feature: "hr.scheduling" },
        { id: "leave", label: "Leave", href: "/hrm/leave", icon: Palmtree, module: "hr", feature: "hr.leave", selfService: true },
      ],
    },
    {
      id: "pay",
      label: "Pay & Benefits",
      items: [
        { id: "payroll", label: "Payroll", href: "/hrm/payroll", icon: Wallet, module: "hr", feature: "hr.payroll" },
        { id: "benefits", label: "Benefits", href: "/hrm/benefits", icon: HeartPulse, module: "hr", feature: "hr.benefits" },
      ],
    },
    {
      id: "talent",
      label: "Talent",
      items: [
        { id: "performance", label: "Performance", href: "/hrm/performance", icon: Target, module: "hr", feature: "hr.performance", selfService: true },
        { id: "recruitment", label: "Recruitment", href: "/hrm/recruitment", icon: UserPlus, module: "hr", feature: "hr.recruitment", roles: ["owner", "regional_manager", "store_manager", "hr_manager", "franchise_partner"] },
        { id: "onboarding", label: "Onboarding", href: "/hrm/onboarding", icon: Rocket, module: "hr", feature: "hr.onboarding" },
      ],
    },
    {
      id: "records",
      label: "Records & Compliance",
      items: [
        { id: "documents", label: "Documents", href: "/hrm/documents", icon: FileText, module: "hr", feature: "hr.documents", selfService: true },
        { id: "compliance", label: "Compliance", href: "/hrm/compliance", icon: ShieldCheck, module: "hr", feature: "hr.compliance" },
        { id: "reports", label: "Reports", href: "/hrm/reports", icon: BarChart3, module: "hr" },
        { id: "settings", label: "HR Settings", href: "/hrm/settings", icon: SlidersHorizontal, module: "hr", action: "update", feature: "hr.custom_fields" },
      ],
    },
  ],
};
