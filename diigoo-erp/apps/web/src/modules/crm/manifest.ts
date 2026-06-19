import { LayoutDashboard, Contact, Filter, Megaphone, UserPlus, Building2, FileText, CheckSquare, CalendarClock, Phone, Package, LifeBuoy, ListChecks } from "@/components/icon/lucide";
import type { ModuleManifest } from "@/platform/modules";

/**
 * Sales & CRM (M04) — full sales lifecycle: leads → accounts/contacts → deals →
 * quotes, with activities (tasks, meetings, calls), a product catalog, marketing
 * campaigns and support cases. Every screen is functional in the same shell.
 */
export const crmManifest: ModuleManifest = {
  key: "sales_crm",
  name: "Sales & CRM",
  tagline: "Pipeline, contacts & campaigns",
  icon: Contact,
  accent: "teal",
  basePath: "/crm",
  nav: [
    {
      id: "overview",
      label: "Overview",
      items: [{ id: "crm-dashboard", label: "Dashboard", href: "/crm", icon: LayoutDashboard, module: "sales_crm" }],
    },
    {
      id: "sell",
      label: "Sell",
      items: [
        { id: "leads", label: "Leads", href: "/crm/leads", icon: UserPlus, module: "sales_crm" },
        { id: "contacts", label: "Contacts", href: "/crm/contacts", icon: Contact, module: "sales_crm" },
        { id: "accounts", label: "Accounts", href: "/crm/accounts", icon: Building2, module: "sales_crm" },
        { id: "pipeline", label: "Deals", href: "/crm/pipeline", icon: Filter, module: "sales_crm" },
        { id: "quotes", label: "Quotes", href: "/crm/quotes", icon: FileText, module: "sales_crm" },
      ],
    },
    {
      id: "activities",
      label: "Activities",
      items: [
        { id: "activities", label: "Activities", href: "/crm/activities", icon: ListChecks, module: "sales_crm" },
        { id: "tasks", label: "Tasks", href: "/crm/tasks", icon: CheckSquare, module: "sales_crm" },
        { id: "meetings", label: "Meetings", href: "/crm/meetings", icon: CalendarClock, module: "sales_crm" },
        { id: "calls", label: "Calls", href: "/crm/calls", icon: Phone, module: "sales_crm" },
      ],
    },
    {
      id: "catalog",
      label: "Catalog",
      items: [{ id: "products", label: "Products", href: "/crm/products", icon: Package, module: "sales_crm" }],
    },
    {
      id: "marketing",
      label: "Marketing",
      items: [{ id: "campaigns", label: "Campaigns", href: "/crm/campaigns", icon: Megaphone, module: "loyalty" }],
    },
    {
      id: "support",
      label: "Support",
      items: [{ id: "cases", label: "Cases", href: "/crm/cases", icon: LifeBuoy, module: "sales_crm" }],
    },
  ],
};
