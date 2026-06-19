"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Check, Plug, Crown, ShieldCheck, Settings2, ChevronRight, LayoutGrid, CalendarDays, type LucideIcon } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { useClickAway } from "@/lib/hooks";
import { useSession } from "@/platform/session";
import { type ModuleKey } from "@/platform/rbac";
import { type FeatureKey } from "@/platform/packages";
import type { NavItem } from "@/platform/modules";
import { ensureModulesRegistered, allModules } from "@/modules/registry";
import { Tag } from "@/components/ui/primitives";
import { ModuleIcon } from "@/components/icon/module-icon";
import { NavIcon } from "@/components/icon/nav-icon";

ensureModulesRegistered();


interface PlatformItem { id: string; label: string; href: string; icon: LucideIcon; module?: ModuleKey }
const PLATFORM_NAV: PlatformItem[] = [
  { id: "integrations", label: "Integrations & API", href: "/integrations", icon: Plug, module: "integrations" },
  { id: "packages", label: "Packages & Plans", href: "/packages", icon: Crown },
  { id: "access", label: "Access & Roles", href: "/access", icon: ShieldCheck, module: "system_admin" },
  { id: "config", label: "System Settings", href: "/settings", icon: Settings2, module: "system_admin" },
];

function NavRow({ href, label, icon: Icon, active, navId }: { href: string; label: string; icon: LucideIcon; active: boolean; navId?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-orange text-white shadow-sm" : "text-ink-2 hover:bg-black/[.045] hover:text-navy",
      )}
    >
      <NavIcon navId={navId} size={23} fallback={Icon} className={cn(active ? "text-white" : "text-ink-3 group-hover:text-navy")} />
      {label}
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const session = useSession();
  const { principal, tenant } = session;
  const isEmployee = principal.primaryRole === "employee";

  const modules = React.useMemo(
    () => allModules().filter((m) => tenant.enabledModules.includes(m.key) && session.can("read", m.key)),
    [tenant.enabledModules, session, principal.primaryRole],
  );

  const activeModule = React.useMemo(() => {
    const match = modules.find((m) => pathname === m.basePath || pathname.startsWith(m.basePath + "/"));
    return match ?? modules[0];
  }, [pathname, modules]);

  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const switcherRef = useClickAway<HTMLDivElement>(() => setSwitcherOpen(false));

  if (!activeModule) {
    return <aside className="w-64 shrink-0 border-r border-line bg-subtle p-4 text-sm text-ink-2">No accessible modules for this role.</aside>;
  }

  const isActive = (href: string) => (href === activeModule.basePath ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  function itemVisible(item: NavItem) {
    if (isEmployee && !item.selfService) return false;
    if (!session.can(item.action ?? "read", item.module)) return false;
    if (item.feature && !session.feature(item.feature)) return false;
    // Per-item role allow-list (super_admin always passes).
    if (item.roles && principal.primaryRole !== "super_admin" && !item.roles.includes(principal.primaryRole)) return false;
    return true;
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-subtle">
      {/* Module switcher */}
      <div ref={switcherRef} className="relative border-b border-line p-3">
        <button onClick={() => setSwitcherOpen((o) => !o)} className="focus-ring flex w-full items-center gap-2.5 rounded-md border border-line bg-surface px-2.5 py-2 text-left shadow-sm hover:border-ink-3/30">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/[.06]">
            <ModuleIcon moduleKey={activeModule.key} size={30} fallback={activeModule.icon} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-navy">{activeModule.name}</span>
            <span className="block truncate text-2xs text-ink-3">{activeModule.tagline}</span>
          </span>
          <ChevronsUpDown size={14} className="text-ink-3" />
        </button>
        {switcherOpen && (
          <div className="animate-fade-in absolute left-3 right-3 z-[80] mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
            <div className="border-b border-line px-3 py-2 text-2xs font-bold uppercase tracking-wide text-ink-3">Switch module · {modules.length}</div>
            <div className="max-h-[60vh] overflow-y-auto py-1">
              {modules.map((m) => (
                <Link key={m.key} href={m.basePath} onClick={() => { setSwitcherOpen(false); onNavigate?.(); }} className="flex items-center gap-2.5 px-3 py-2 hover:bg-subtle">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-black/5"><ModuleIcon moduleKey={m.key} size={28} fallback={m.icon} /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{m.name}</span>
                  {m.key === activeModule.key && <Check size={14} className="shrink-0 text-orange" />}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active module nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" onClick={onNavigate}>
        {/* Cross-module launchpad — available to every role */}
        <div className="mb-4 space-y-0.5">
          <NavRow href="/home" label="Overview" icon={LayoutGrid} active={pathname === "/home"} navId="overview" />
          <NavRow href="/schedule" label="Schedule" icon={CalendarDays} active={pathname === "/schedule"} navId="schedule" />
        </div>
        {activeModule.nav.map((group) => {
          const items = group.items.filter(itemVisible);
          if (items.length === 0) return null;
          return (
            <div key={group.id} className="mb-4">
              <div className="px-2.5 pb-1.5 text-2xs font-bold uppercase tracking-[1px] text-ink-3">{group.label}</div>
              <div className="space-y-0.5">
                {items.map((item) => <NavRow key={item.id} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} navId={item.id} />)}
              </div>
            </div>
          );
        })}

        {/* Platform section */}
        {!isEmployee && (
          <div className="mt-2 border-t border-line pt-3">
            <div className="px-2.5 pb-1.5 text-2xs font-bold uppercase tracking-[1px] text-ink-3">Platform</div>
            <div className="space-y-0.5">
              {PLATFORM_NAV.filter((p) => !p.module || session.can("read", p.module)).map((p) => (
                <NavRow key={p.id} href={p.href} label={p.label} icon={p.icon} active={isActive(p.href)} navId={p.id} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer status — links to plan management */}
      <div className="border-t border-line p-3">
        <Link
          href="/packages"
          onClick={onNavigate}
          title="View plans & manage your subscription"
          className="focus-ring group flex items-center justify-between gap-2 rounded-md border border-line bg-surface px-2.5 py-2 transition-colors hover:bg-subtle"
        >
          <span className="flex items-center gap-1.5 text-2xs text-ink-2">
            <Crown size={12} className="text-orange" /> Plan
          </span>
          <span className="flex items-center gap-1">
            <Tag tone={tenant.tier === "enterprise" ? "navy" : tenant.tier === "business" ? "orange" : "blue"}>{tenant.tier}</Tag>
            <ChevronRight size={13} className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-navy" />
          </span>
        </Link>
      </div>
    </aside>
  );
}
