"use client";
import * as React from "react";
import Link from "next/link";
import { Users, Building2, UserCog, GitBranch, Briefcase, ChevronRight, ChevronDown, ChevronsUpDown, ChevronsDownUp, Network, LayoutGrid, MapPin, Crown } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { PageHeader, Card, StatCard, Avatar, Button, useToneColor, type Tone } from "@/components/ui/primitives";
import { Select, SearchInput } from "@/components/ui/form";
import { FeatureGate } from "@/components/ui/gate";
import { db } from "@/modules/hrm/repo";
import { departments, departmentName, positionTitle, locationName } from "@/modules/hrm/data";
import type { Employee } from "@/modules/hrm/types";

interface OrgNode { employee: Employee; children: OrgNode[]; depth: number }

// Department → brand colour for accents + the legend, so teams read at a glance.
const DEPT_TONE: Record<string, Tone> = {
  dp_exec: "navy", dp_retail: "orange", dp_fin: "teal", dp_hr: "blue", dp_tech: "purple", dp_mkt: "amber",
};
const deptTone = (id: string): Tone => DEPT_TONE[id] ?? "gray";

const active = () => db.employees.filter((e) => e.status !== "terminated");

function buildTree(): { roots: OrgNode[]; nodeCount: number; managerCount: number; managerIds: string[] } {
  const list = active();
  const byManager = new Map<string, Employee[]>();
  list.forEach((e) => {
    const key = e.managerId ?? "__root__";
    byManager.set(key, [...(byManager.get(key) ?? []), e]);
  });
  let nodeCount = 0, managerCount = 0;
  const managerIds: string[] = [];
  const build = (e: Employee, depth: number): OrgNode => {
    nodeCount += 1;
    const reports = byManager.get(e.id) ?? [];
    if (reports.length) { managerCount += 1; managerIds.push(e.id); }
    return { employee: e, depth, children: reports.slice().sort((a, b) => a.lastName.localeCompare(b.lastName)).map((r) => build(r, depth + 1)) };
  };
  const ids = new Set(list.map((e) => e.id));
  const roots = list.filter((e) => !e.managerId || !ids.has(e.managerId)).sort((a, b) => a.lastName.localeCompare(b.lastName)).map((e) => build(e, 0));
  return { roots, nodeCount, managerCount, managerIds };
}

export default function OrgChartPage() {
  return (
    <FeatureGate feature="hr.org_chart">
      <OrgChart />
    </FeatureGate>
  );
}

function OrgChart() {
  const { roots, nodeCount, managerCount, managerIds } = React.useMemo(() => buildTree(), []);
  const tc = useToneColor();
  const [view, setView] = React.useState<"chart" | "teams">("chart");
  const [dept, setDept] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    const walk = (n: OrgNode) => { if (n.depth < 1) init[n.employee.id] = true; n.children.forEach(walk); };
    roots.forEach(walk);
    return init;
  });

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const expandAll = () => setExpanded(Object.fromEntries(managerIds.map((id) => [id, true])));
  const collapseAll = () => setExpanded({});

  const list = active();
  const deptCount = new Set(list.map((e) => e.departmentId)).size;
  const avgSpan = managerCount > 0 ? ((nodeCount - 1) / managerCount).toFixed(1) : "0";
  const openRoles = db.requisitions.filter((r) => r.status === "open").reduce((s, r) => s + r.openings, 0);
  const usedDepts = departments.filter((d) => list.some((e) => e.departmentId === d.id));

  // Teams view — group active employees by department, lead first.
  const teams = usedDepts.map((d) => {
    const reportsOf = (id: string) => list.filter((e) => e.managerId === id).length;
    const members = list.filter((e) => e.departmentId === d.id)
      .filter((e) => !search || `${e.firstName} ${e.lastName} ${positionTitle(e.positionId)}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.id === d.headEmployeeId ? -1 : b.id === d.headEmployeeId ? 1 : reportsOf(b.id) - reportsOf(a.id) || a.lastName.localeCompare(b.lastName)));
    const head = list.find((e) => e.id === d.headEmployeeId);
    return { dept: d, members, head };
  }).filter((t) => (dept ? t.dept.id === dept : true) && t.members.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="Human Resources"
        title="Org chart"
        description="Reporting structure and teams across the organization — colour-coded by department."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-line bg-surface p-0.5">
              <button onClick={() => setView("chart")} className={cn("flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors", view === "chart" ? "bg-navy text-white" : "text-ink-2 hover:text-navy")}><Network size={13} /> Chart</button>
              <button onClick={() => setView("teams")} className={cn("flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors", view === "teams" ? "bg-navy text-white" : "text-ink-2 hover:text-navy")}><LayoutGrid size={13} /> Teams</button>
            </div>
            {view === "chart" && <><Button size="sm" variant="outline" icon={ChevronsUpDown} onClick={expandAll}>Expand</Button><Button size="sm" variant="outline" icon={ChevronsDownUp} onClick={collapseAll}>Collapse</Button></>}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Headcount" value={nodeCount} hint="active" icon={Users} tone="navy" />
        <StatCard label="Departments" value={deptCount} icon={Building2} tone="teal" />
        <StatCard label="Managers" value={managerCount} hint="with reports" icon={UserCog} tone="purple" />
        <StatCard label="Avg span" value={avgSpan} hint="reports / mgr" icon={GitBranch} tone="blue" />
        <StatCard label="Open roles" value={openRoles} hint="hiring" icon={Briefcase} tone="amber" />
      </div>

      {/* Controls + legend */}
      <Card className="mb-4 mt-4" padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Find a person…" className="min-w-[200px] flex-1" />
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="sm:!w-48">
            <option value="">All departments</option>
            {usedDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <span className="text-2xs font-bold uppercase tracking-wide text-ink-3">Teams</span>
          {usedDepts.map((d) => (
            <span key={d.id} className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tc(deptTone(d.id)) }} />{d.name}
            </span>
          ))}
        </div>
      </Card>

      {view === "chart" ? (
        <Card padded={false}>
          <div className="overflow-x-auto px-5 py-6">
            <ul className="org-tree mx-auto">
              {roots.map((n) => <TreeNode key={n.employee.id} node={n} expanded={expanded} onToggle={toggle} dept={dept} query={search} />)}
            </ul>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {teams.map((t) => <TeamCard key={t.dept.id} dept={t.dept} members={t.members} head={t.head} tc={tc} />)}
          {teams.length === 0 && <Card><div className="py-8 text-center text-sm text-ink-3">No people match your search.</div></Card>}
        </div>
      )}
    </>
  );
}

function TreeNode({ node, expanded, onToggle, dept, query }: { node: OrgNode; expanded: Record<string, boolean>; onToggle: (id: string) => void; dept: string; query: string }) {
  const has = node.children.length > 0;
  const open = dept !== "" || query !== "" ? true : (expanded[node.employee.id] ?? false);
  return (
    <li>
      <NodeCard node={node} open={open} onToggle={onToggle} dept={dept} query={query} />
      {has && open && <ul>{node.children.map((c) => <TreeNode key={c.employee.id} node={c} expanded={expanded} onToggle={onToggle} dept={dept} query={query} />)}</ul>}
    </li>
  );
}

function NodeCard({ node, open, onToggle, dept, query }: { node: OrgNode; open: boolean; onToggle: (id: string) => void; dept: string; query: string }) {
  const e = node.employee;
  const tc = useToneColor();
  const has = node.children.length > 0;
  const q = query.trim().toLowerCase();
  const matchesSearch = !q || `${e.firstName} ${e.lastName} ${positionTitle(e.positionId)} ${departmentName(e.departmentId)}`.toLowerCase().includes(q);
  const matchesDept = dept === "" || e.departmentId === dept;
  const active = matchesSearch && matchesDept;
  const accent = tc(deptTone(e.departmentId));

  return (
    <div
      className={cn(
        "relative w-48 overflow-hidden rounded-lg border bg-surface shadow-card transition-all",
        active ? "border-line hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-pop" : "border-line opacity-30",
        q && matchesSearch && "ring-2 ring-orange",
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <Link href={`/hrm/employees/${e.id}`} className="group flex flex-col items-center px-3 pb-2.5 pt-4 text-center">
        <Avatar name={`${e.firstName} ${e.lastName}`} tone={e.avatarTone as Tone} size={40} />
        <div className="mt-2 w-full truncate text-sm font-semibold text-navy group-hover:text-orange">{e.firstName} {e.lastName}</div>
        <div className="w-full truncate text-2xs text-ink-3">{positionTitle(e.positionId)}</div>
        <div className="mt-1 flex w-full items-center justify-center gap-1 truncate text-[10px] text-ink-3"><MapPin size={9} className="shrink-0" />{locationName(e.locationId)}</div>
        <span className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${accent}14`, color: accent }}>{departmentName(e.departmentId)}</span>
      </Link>
      {has && (
        <button type="button" onClick={() => onToggle(e.id)} aria-label={open ? "Collapse" : "Expand"}
          className="flex w-full items-center justify-center gap-1 border-t border-line py-1.5 text-2xs font-semibold text-ink-3 transition-colors hover:bg-subtle hover:text-navy">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}{node.children.length} report{node.children.length === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}

function TeamCard({ dept, members, head, tc }: { dept: { id: string; name: string; code: string }; members: Employee[]; head?: Employee; tc: (t: Tone) => string }) {
  const accent = tc(deptTone(dept.id));
  return (
    <Card padded={false} className="overflow-hidden">
      <span className="block h-1" style={{ background: accent }} />
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: accent }} />
            <h3 className="truncate text-md font-bold text-navy">{dept.name}</h3>
          </div>
          <p className="mt-0.5 text-2xs text-ink-3">{dept.code} · {members.length} member{members.length === 1 ? "" : "s"}</p>
        </div>
        {head && (
          <Link href={`/hrm/employees/${head.id}`} className="flex shrink-0 items-center gap-2 rounded-md border border-line px-2 py-1 hover:border-orange/40">
            <Avatar name={`${head.firstName} ${head.lastName}`} tone={head.avatarTone as Tone} size={26} />
            <div className="leading-tight"><div className="flex items-center gap-1 text-2xs font-semibold text-navy"><Crown size={10} className="text-orange" />{head.firstName} {head.lastName}</div><div className="text-[10px] text-ink-3">Lead</div></div>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {members.map((m) => (
          <Link key={m.id} href={`/hrm/employees/${m.id}`} className="group flex items-center gap-2 rounded-md border border-line px-2 py-1.5 transition-colors hover:border-orange/40 hover:bg-subtle">
            <Avatar name={`${m.firstName} ${m.lastName}`} tone={m.avatarTone as Tone} size={28} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-2xs font-semibold text-navy group-hover:text-orange">{m.firstName} {m.lastName}</div>
              <div className="truncate text-[10px] text-ink-3">{positionTitle(m.positionId)}</div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
