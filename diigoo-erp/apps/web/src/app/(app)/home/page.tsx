"use client";
import Link from "next/link";
import { ArrowRight, Plug, Crown, ShieldCheck, Settings2, type LucideIcon } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { ROLES, type ModuleKey } from "@/platform/rbac";
import { allModules } from "@/modules/registry";
import { MODULE_INFO } from "@/modules/catalog";
import { SectionLabel } from "@/components/ui/primitives";
import { ModuleIcon } from "@/components/icon/module-icon";

// HR + CRM are wired to live data; the rest are themed preview workspaces.
const LIVE = new Set<ModuleKey>(["hr", "sales_crm"]);

const PLATFORM: { label: string; href: string; module: ModuleKey | null; icon: LucideIcon }[] = [
  { label: "Integrations & API", href: "/integrations", module: "integrations", icon: Plug },
  { label: "Packages & Plans", href: "/packages", module: null, icon: Crown },
  { label: "Access & Roles", href: "/access", module: "system_admin", icon: ShieldCheck },
  { label: "System Settings", href: "/settings", module: "system_admin", icon: Settings2 },
];

export default function HomePage() {
  const session = useSession();
  const role = ROLES[session.principal.primaryRole];
  const isEmployee = session.principal.primaryRole === "employee";
  const firstName = session.principal.name.split(" ")[0] || role.label;

  const mods = allModules().filter((m) => session.tenant.enabledModules.includes(m.key) && session.can("read", m.key));
  const platform = PLATFORM.filter((p) => !p.module || session.can("read", p.module));

  return (
    <>
      <div className="relative mb-5 overflow-hidden rounded-lg border border-line bg-surface p-6 shadow-card">
        <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,70,128,.07),transparent_70%)]" />
        <div className="relative">
          <div className="text-2xs font-bold uppercase tracking-[2px] text-orange">Workspace launchpad</div>
          <h1 className="mt-1 text-2xl font-bold text-navy">Welcome, {firstName}</h1>
          <p className="mt-1 text-sm text-ink-3">{role.label} · {session.tenant.branding.companyName} · {mods.length} module{mods.length === 1 ? "" : "s"} available</p>
        </div>
      </div>

      <SectionLabel>Your modules</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mods.map((m) => {
          const live = LIVE.has(m.key);
          const desc = MODULE_INFO[m.key]?.description ?? m.tagline;
          return (
            <Link
              key={m.key}
              href={m.basePath}
              className="group flex flex-col rounded-xl border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-orange/40 hover:shadow-pop"
            >
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/[.06]">
                <ModuleIcon moduleKey={m.key} size={40} fallback={m.icon} />
              </span>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-md font-bold text-navy group-hover:text-orange">{m.name}</span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${live ? "bg-green/12 text-green" : "bg-ink-3/12 text-ink-3"}`}>{live ? "Live" : "Preview"}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-3">{desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange">Open <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          );
        })}
      </div>

      {!isEmployee && platform.length > 0 && (
        <>
          <div className="mt-6"><SectionLabel>Platform</SectionLabel></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {platform.map((p) => (
              <Link key={p.href} href={p.href} className="group flex items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-3 shadow-card transition-all hover:border-orange/40 hover:shadow-pop">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-navy/[.06] text-navy"><p.icon size={17} /></span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{p.label}</span>
                <ArrowRight size={14} className="text-line transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
