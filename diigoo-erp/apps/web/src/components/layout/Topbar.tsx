"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, ChevronRight, Menu, Search, LogOut, Crown, Mail, ShieldCheck, Palmtree, Wallet, FileText, UserPlus, CheckCheck, Contact, Megaphone, Plug, KeyRound, CalendarCheck, Sun, Moon, type LucideIcon } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { useClickAway } from "@/lib/hooks";
import { useSession } from "@/platform/session";
import { useTheme } from "@/platform/theme";
import { useNotifications } from "@/platform/notifications";
import { ROLES, can, type RoleId } from "@/platform/rbac";
import { TIERS } from "@/platform/packages";
import { ensureModulesRegistered, allModules } from "@/modules/registry";
import { Avatar, Tag, type Tone } from "@/components/ui/primitives";

ensureModulesRegistered();

// Top navigation tabs (shown next to the brand).
const TOP_NAV: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Files", href: "/files" },
  { label: "About", href: "/about" },
  { label: "Settings", href: "/settings" },
];

interface Notif { id: string; icon: LucideIcon; tone: string; title: string; body: string; time: string; href?: string; read: boolean }

const NOTIF_TONE: Record<string, string> = {
  amber: "bg-amber/12 text-amber", navy: "bg-navy/10 text-navy", coral: "bg-coral/12 text-coral",
  teal: "bg-teal/12 text-teal", blue: "bg-blue/12 text-blue", green: "bg-green/12 text-green", purple: "bg-purple/12 text-purple",
};

// Lucide icon resolved from a pushed notification's serialisable iconKey.
const ICON_BY_KEY: Record<string, LucideIcon> = {
  interview: CalendarCheck, leave: Palmtree, payroll: Wallet, document: FileText, recruit: UserPlus, default: Bell,
};
function relTime(ms: number): string {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const HR_NOTIFS: Notif[] = [
  { id: "hr1", icon: Palmtree, tone: "amber", title: "Leave request awaiting approval", body: "A team member requested time off.", time: "5m ago", href: "/hrm/leave", read: false },
  { id: "hr2", icon: Wallet, tone: "navy", title: "Payroll run pending approval", body: "Pay period Jun 1–15 is ready to finalize.", time: "1h ago", href: "/hrm/payroll", read: false },
  { id: "hr3", icon: FileText, tone: "coral", title: "Document expiring soon", body: "A work authorization expires within 30 days.", time: "3h ago", href: "/hrm/documents", read: false },
  { id: "hr4", icon: UserPlus, tone: "teal", title: "Onboarding in progress", body: "A new hire has tasks remaining.", time: "1d ago", href: "/hrm/onboarding", read: true },
];
const EMPLOYEE_NOTIFS: Notif[] = [
  { id: "em1", icon: Palmtree, tone: "green", title: "Your leave was approved", body: "Your PTO request was approved.", time: "2h ago", href: "/hrm/leave", read: false },
  { id: "em2", icon: Wallet, tone: "navy", title: "New payslip available", body: "Your latest payslip is ready to view.", time: "1d ago", href: "/hrm", read: false },
  { id: "em3", icon: FileText, tone: "amber", title: "Action needed", body: "Please upload an updated ID document.", time: "2d ago", href: "/hrm/documents", read: true },
];
const CRM_NOTIFS: Notif[] = [
  { id: "cr1", icon: Contact, tone: "teal", title: "New lead assigned", body: "A high-intent lead was routed to you.", time: "12m ago", href: "/crm/pipeline", read: false },
  { id: "cr2", icon: Megaphone, tone: "purple", title: "Campaign milestone", body: "Spring campaign passed 10k opens.", time: "2h ago", href: "/crm/campaigns", read: false },
  { id: "cr3", icon: Contact, tone: "blue", title: "Follow-up due", body: "3 contacts need a follow-up today.", time: "5h ago", href: "/crm/contacts", read: false },
];
const SYSTEM_NOTIFS: Notif[] = [
  { id: "sy1", icon: Plug, tone: "blue", title: "Integration healthy", body: "Okta SSO sync completed successfully.", time: "20m ago", href: "/integrations", read: false },
  { id: "sy2", icon: KeyRound, tone: "amber", title: "New API key created", body: "A scoped key was issued for a webhook.", time: "4h ago", href: "/integrations", read: false },
  { id: "sy3", icon: ShieldCheck, tone: "navy", title: "All systems nominal", body: "No security alerts in the last 24h.", time: "1d ago", href: "/settings", read: true },
];
const GENERIC_NOTIFS: Notif[] = [
  { id: "ge1", icon: Crown, tone: "navy", title: "Welcome to Diigoo ERP", body: "Explore the modules available on your plan.", time: "now", href: "/packages", read: false },
];

function notifsForRole(role: RoleId): Notif[] {
  if (role === "employee") return EMPLOYEE_NOTIFS;
  if (can(role, "read", "hr")) return HR_NOTIFS;
  if (can(role, "read", "sales_crm")) return CRM_NOTIFS;
  if (can(role, "read", "system_admin")) return SYSTEM_NOTIFS;
  return GENERIC_NOTIFS;
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const principal = useSession((s) => s.principal);
  const tenant = useSession((s) => s.tenant);
  const role = ROLES[principal.primaryRole];

  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = useClickAway<HTMLDivElement>(() => setMenuOpen(false));

  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = useClickAway<HTMLDivElement>(() => setNotifOpen(false));

  // Static, per-role sample notifications (read-state persisted locally).
  const [staticNotifs, setStaticNotifs] = React.useState<Notif[]>(() => notifsForRole(principal.primaryRole));
  React.useEffect(() => {
    try {
      const ids = new Set(JSON.parse(localStorage.getItem("diigoo-notif-read") ?? "[]") as string[]);
      if (ids.size) setStaticNotifs((ns) => ns.map((n) => (ids.has(n.id) ? { ...n, read: true } : n)));
    } catch {
      /* ignore */
    }
  }, []);

  // Dynamic notifications addressed to this user (e.g. interview assignments).
  const allPushed = useNotifications((s) => s.items);
  const markPushedRead = useNotifications((s) => s.markRead);
  const markPushedAllReadFor = useNotifications((s) => s.markAllReadFor);
  const empId = principal.employeeId;
  const pushedIds = React.useMemo(() => new Set(allPushed.map((n) => n.id)), [allPushed]);
  const dynamicNotifs = React.useMemo<Notif[]>(
    () =>
      (empId ? allPushed.filter((n) => n.to === empId) : [])
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((n) => ({ id: n.id, icon: ICON_BY_KEY[n.iconKey] ?? ICON_BY_KEY.default, tone: n.tone, title: n.title, body: n.body, time: relTime(n.createdAt), href: n.href, read: n.read })),
    [allPushed, empId],
  );

  const notifs = React.useMemo(() => [...dynamicNotifs, ...staticNotifs], [dynamicNotifs, staticNotifs]);
  const unread = notifs.filter((n) => !n.read).length;

  const persistRead = (ids: string[]) => {
    try {
      const cur = JSON.parse(localStorage.getItem("diigoo-notif-read") ?? "[]") as string[];
      localStorage.setItem("diigoo-notif-read", JSON.stringify(Array.from(new Set([...cur, ...ids]))));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = () => {
    setStaticNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
    persistRead(staticNotifs.map((n) => n.id));
    if (empId) markPushedAllReadFor(empId);
  };

  const openNotif = (n: Notif) => {
    // Decrease the count immediately + persist, then navigate client-side
    // (router.push keeps the Topbar mounted, so the count stays decremented).
    if (pushedIds.has(n.id)) {
      markPushedRead(n.id);
    } else {
      setStaticNotifs((ns) => ns.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      persistRead([n.id]);
    }
    setNotifOpen(false);
    if (n.href) router.push(n.href);
  };

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-[100] flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 shadow-sm">
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenu} className="focus-ring rounded-md p-1.5 text-ink-3 hover:text-navy lg:hidden" aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange text-xs font-bold text-white">{tenant.branding.logoMonogram}</span>
          <div className="hidden min-w-0 leading-tight sm:block">
            <div className="truncate text-sm font-bold tracking-wide text-navy">{tenant.branding.companyName}</div>
            <div className="truncate text-2xs text-ink-3"><span className="text-orange">Diigoo</span> ERP · {tenant.branding.productName}</div>
          </div>
        </div>

        {/* Top nav */}
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          {TOP_NAV.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                  active ? "bg-orange text-white shadow-sm" : "text-ink-2 hover:bg-subtle hover:text-navy",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Search */}
      <div className="hidden flex-1 justify-center px-4 md:flex">
        <GlobalSearch />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5">
        <Link
          href="/packages"
          title="View plans & billing"
          className="focus-ring hidden items-center gap-1.5 rounded-md border border-line bg-subtle px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-ink-3/30 hover:bg-line/50 sm:inline-flex"
        >
          <Crown size={13} className="text-orange" /> {TIERS[tenant.tier].name}
        </Link>

        <button
          onClick={toggleTheme}
          className="focus-ring rounded-md p-2 text-ink-3 transition-colors hover:text-navy"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div ref={notifRef} className="relative">
          <button onClick={() => setNotifOpen((o) => !o)} className="focus-ring relative rounded-md p-2 text-ink-3 hover:text-navy" aria-label="Notifications">
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange px-1 text-[9px] font-bold text-white">{unread}</span>
            )}
          </button>
          {notifOpen && (
            <div className="animate-fade-in absolute right-0 z-[120] mt-2 w-80 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="text-sm font-bold text-navy">Notifications {unread > 0 && <span className="ml-1 text-2xs font-medium text-ink-3">({unread} new)</span>}</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-2xs font-semibold text-orange hover:underline"><CheckCheck size={12} /> Mark all read</button>
                )}
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-3">You&apos;re all caught up.</div>
                ) : (
                  notifs.map((n) => (
                    <button key={n.id} onClick={() => openNotif(n)} className={cn("flex w-full items-start gap-2.5 border-b border-line px-3.5 py-2.5 text-left last:border-0 hover:bg-subtle", !n.read && "bg-orange/[.04]")}>
                      <span className={cn("mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md", NOTIF_TONE[n.tone] ?? NOTIF_TONE.navy)}><n.icon size={14} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-navy">{n.title}</span>
                          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />}
                        </span>
                        <span className="mt-0.5 block text-2xs text-ink-3">{n.body}</span>
                        <span className="mt-0.5 block text-[10px] text-ink-3/70">{n.time}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="focus-ring flex items-center gap-2 rounded-md border border-line bg-subtle px-2 py-1.5 pr-2.5 hover:bg-line/50">
            <Avatar name={principal.name || role.label} tone={(principal.tone as Tone) ?? "navy"} size={26} />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[120px] truncate text-xs font-semibold text-navy">{principal.name || role.label}</span>
              <span className="block text-2xs text-ink-3">{role.label}</span>
            </span>
            <ChevronDown size={12} className="text-ink-3" />
          </button>
          {menuOpen && (
            <div className="animate-fade-in absolute right-0 z-[120] mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
              <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
                <Avatar name={principal.name || role.label} tone={(principal.tone as Tone) ?? "navy"} size={38} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-navy">{principal.name || role.label}</div>
                  <div className="flex items-center gap-1.5 text-2xs text-ink-3"><Mail size={11} /> <span className="truncate">{principal.email}</span></div>
                </div>
              </div>
              <div className="px-3.5 py-2.5 text-xs">
                <Row label="Role"><span className="flex items-center gap-1.5"><span className="rounded bg-navy/[.06] px-1 font-mono text-[9px] font-bold text-navy">{role.level}</span>{role.label}</span></Row>
                <Row label="Tenant">{tenant.branding.companyName}</Row>
                <Row label="Plan"><Tag tone={tenant.tier === "enterprise" ? "navy" : "orange"}>{TIERS[tenant.tier].name}</Tag></Row>
                <Row label="MFA"><span className="flex items-center gap-1 text-green"><ShieldCheck size={12} />{role.mfa}</span></Row>
              </div>
              <button onClick={signOut} className="flex w-full items-center gap-2 border-t border-line px-3.5 py-2.5 text-left text-sm font-semibold text-coral hover:bg-coral/5">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-ink-3">{label}</span>
      <span className="font-medium text-ink-2">{children}</span>
    </div>
  );
}

interface SearchHit { label: string; sub: string; href: string; icon: LucideIcon }

/** Global search — matches every module + page the current role can access and navigates to it. */
function GlobalSearch() {
  const session = useSession();
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wrapRef = useClickAway<HTMLDivElement>(() => setOpen(false));
  const inputRef = React.useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl-K focuses search; Escape closes it.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Build the searchable index from accessible modules and their nav items.
  const index = React.useMemo<SearchHit[]>(() => {
    const items: SearchHit[] = [];
    for (const m of allModules()) {
      if (!session.tenant.enabledModules.includes(m.key) || !session.can("read", m.key)) continue;
      items.push({ label: m.name, sub: "Module", href: m.basePath, icon: m.icon });
      for (const group of m.nav) {
        for (const it of group.items) {
          if (!session.can(it.action ?? "read", it.module)) continue;
          if (it.feature && !session.feature(it.feature)) continue;
          items.push({ label: it.label, sub: m.name, href: it.href, icon: it.icon });
        }
      }
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.principal.primaryRole, session.tenant]);

  const results = React.useMemo<SearchHit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const seen = new Set<string>();
    return index
      .filter((i) => {
        if (seen.has(i.href) || !`${i.label} ${i.sub}`.toLowerCase().includes(term)) return false;
        seen.add(i.href);
        return true;
      })
      .slice(0, 8);
  }, [q, index]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-silver/70" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" && results[0]) go(results[0].href); }}
        placeholder="Search modules, pages, features…"
        className="focus-ring h-9 w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-14 text-sm text-white placeholder:text-silver/60"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/15 px-1.5 py-0.5 text-2xs text-silver/70">⌘K</kbd>
      {open && q.trim() && (
        <div className="animate-fade-in absolute left-0 right-0 z-[120] mt-2 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          {results.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-xs text-ink-3">No matches for “{q.trim()}”.</div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto py-1">
              {results.map((r) => (
                <button key={r.href} onClick={() => go(r.href)} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-subtle">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy/[.06] text-navy"><r.icon size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy">{r.label}</span>
                    <span className="block truncate text-2xs text-ink-3">{r.sub}</span>
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-ink-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
