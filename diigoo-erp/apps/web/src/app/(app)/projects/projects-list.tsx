"use client";
import * as React from "react";
import { ClipboardList, CheckCircle2, Clock, Plus, Search, Download, FileText, Trash2 } from "@/components/icon/lucide";
import { PageHeader, Card, Button, Tag, ProgressBar, StatCard, DetailRow } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/form";
import { SegmentedControl } from "@/components/ui/tabs";
import { useProjects, STATUS_META, STATUS_OPTS, OWNERS, type Row, type PStatus } from "./store";

export function ProjectsList({ initialOpenId }: { initialOpenId?: string }) {
  const projects = useProjects((s) => s.projects);
  const tasks = useProjects((s) => s.tasks);
  const add = useProjects((s) => s.add);
  const update = useProjects((s) => s.update);
  const remove = useProjects((s) => s.remove);

  const [tab, setTab] = React.useState<"projects" | "tasks">("projects");
  const rows = tab === "projects" ? projects : tasks;
  const noun = tab === "projects" ? "Project" : "Task";

  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | PStatus>("all");
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const [detail, setDetail] = React.useState<Row | null>(null); // detail/edit pop-up
  const setD = (patch: Partial<Row>) => setDetail((d) => d && { ...d, ...patch });
  const saveDetail = () => { if (detail) update(detail.id, detail); setDetail(null); };
  const delDetail = () => { if (detail) remove(detail.id); setDetail(null); };

  // Deep link (/projects/<id>) opens the record's pop-up over the list.
  React.useEffect(() => {
    if (!initialOpenId) return;
    const r = [...projects, ...tasks].find((x) => x.id === initialOpenId);
    if (r) { if (tasks.some((t) => t.id === r.id)) setTab("tasks"); setDetail({ ...r }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenId]);

  const visible = rows.filter((r) =>
    (filter === "all" || r.status === filter) && r.title.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const stats = {
    records: rows.length,
    planning: rows.filter((r) => r.status === "planning").length,
    inProgress: rows.filter((r) => r.status === "in_progress").length,
  };

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = visible.length > 0 && visible.every((r) => sel.has(r.id));
  const toggleAll = () => setSel((s) => { const n = new Set(s); allOn ? visible.forEach((r) => n.delete(r.id)) : visible.forEach((r) => n.add(r.id)); return n; });

  function exportCsv() {
    const head = ["Title", "Owner", "Progress %", "Status"];
    const body = visible.map((r) => [r.title, r.owner, r.progress, STATUS_META[r.status].label].join(","));
    const csv = [head.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${tab}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", owner: OWNERS[0], status: "planning" as PStatus, progress: 0 });
  function create() {
    if (!form.title.trim()) return;
    add(tab === "projects" ? "project" : "task", { id: "n" + Math.random().toString(36).slice(2, 7), title: form.title.trim(), owner: form.owner, progress: Number(form.progress) || 0, status: form.status });
    setAddOpen(false);
    setForm({ title: "", owner: OWNERS[0], status: "planning", progress: 0 });
  }

  return (
    <>
      <PageHeader eyebrow="Operations" title="Project Management" description="Projects and tasks with progress tracking." />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Records" value={stats.records} icon={ClipboardList} tone="navy" />
        <StatCard label="Planning" value={stats.planning} icon={CheckCircle2} tone="green" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} tone="amber" />
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl options={[{ id: "projects", label: "Projects" }, { id: "tasks", label: "Tasks" }]} value={tab} onChange={(t) => { setTab(t as "projects" | "tasks"); setSel(new Set()); }} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="!w-44 !pl-8" />
            </div>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as "all" | PStatus)} className="!w-36">
              <option value="all">All statuses</option>
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </Select>
            <Button variant="outline" icon={Download} onClick={exportCsv}>CSV</Button>
            <Button variant="outline" icon={FileText} onClick={() => window.print()}>PDF</Button>
            <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>New {noun}</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle/50 text-2xs font-bold uppercase tracking-wide text-ink-3">
                <th className="w-10 px-3 py-2"><input type="checkbox" checked={allOn} onChange={toggleAll} className="accent-orange" /></th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Owner</th>
                <th className="px-3 py-2 text-left">Progress %</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-subtle/40">
                  <td className="px-3 py-2"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} className="accent-orange" /></td>
                  <td className="px-3 py-2"><button onClick={() => setDetail({ ...r })} className="font-semibold text-navy hover:text-orange">{r.title}</button></td>
                  <td className="px-3 py-2 text-ink-2">{r.owner}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.progress} tone={r.progress >= 100 ? "green" : "blue"} className="w-28" />
                      <span className="w-9 font-mono text-2xs font-semibold text-ink-2">{r.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Select value={r.status} onChange={(e) => update(r.id, { status: e.target.value as PStatus })} className="!w-32 !py-1 !text-xs">
                      {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-xs font-semibold text-navy hover:text-orange" onClick={() => setDetail({ ...r })}>Open</button>
                    <button className="ml-3 text-xs font-semibold text-coral hover:opacity-80" onClick={() => remove(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-ink-3">No {tab} match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`New ${noun.toLowerCase()}`} size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={create}>Add {noun.toLowerCase()}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title" required className="col-span-2"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={`${noun} name`} /></Field>
          <Field label="Owner"><Select value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}>{OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}</Select></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PStatus }))}>{STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}</Select></Field>
          <Field label="Progress %" className="col-span-2"><Input type="number" value={String(form.progress)} onChange={(e) => setForm((f) => ({ ...f, progress: Math.max(0, Math.min(100, Number(e.target.value))) }))} /></Field>
        </div>
      </Modal>

      {/* Detail / edit pop-up */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} description={`${noun} details`} size="lg"
        footer={<div className="flex w-full items-center justify-between">
          <Button variant="outline" icon={Trash2} onClick={delDetail}>Delete</Button>
          <div className="flex items-center gap-2"><Button variant="ghost" onClick={() => setDetail(null)}>Cancel</Button><Button variant="primary" onClick={saveDetail}>Save changes</Button></div>
        </div>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag tone={STATUS_META[detail.status].tone}>{STATUS_META[detail.status].label}</Tag>
              <span className="font-mono text-2xs text-ink-3">{detail.id.toUpperCase()}</span>
            </div>
            <div className="rounded-md border border-line bg-subtle/40 p-3">
              <div className="mb-1.5 flex items-center justify-between text-2xs font-semibold text-ink-3"><span>Progress</span><span className="font-mono text-navy">{detail.progress}%</span></div>
              <ProgressBar value={detail.progress} tone={detail.progress >= 100 ? "green" : "blue"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title" className="col-span-2"><Input value={detail.title} onChange={(e) => setD({ title: e.target.value })} /></Field>
              <Field label="Owner"><Select value={detail.owner} onChange={(e) => setD({ owner: e.target.value })}>{OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}</Select></Field>
              <Field label="Status"><Select value={detail.status} onChange={(e) => setD({ status: e.target.value as PStatus })}>{STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}</Select></Field>
              <Field label="Progress %" className="col-span-2"><Input type="number" value={String(detail.progress)} onChange={(e) => setD({ progress: Math.max(0, Math.min(100, Number(e.target.value))) })} /></Field>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-4 text-sm">
              <DetailRow label="Workspace" value="Operations" />
              <DetailRow label="Created" value="Jun 2, 2026" />
              <DetailRow label="Target date" value="Jul 15, 2026" />
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}
