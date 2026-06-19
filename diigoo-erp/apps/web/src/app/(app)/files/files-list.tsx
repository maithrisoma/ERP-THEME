"use client";
import * as React from "react";
import { FileText, CheckCircle2, Clock, Plus, Search, Download, Trash2 } from "@/components/icon/lucide";
import { PageHeader, Card, Button, Tag, StatCard, DetailRow } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/form";
import { useFiles, STATUS_META, STATUS_OPTS, TYPES, DEPTS, type Doc, type DStatus } from "./store";

export function FilesList({ initialOpenId }: { initialOpenId?: string }) {
  const docs = useFiles((s) => s.docs);
  const add = useFiles((s) => s.add);
  const update = useFiles((s) => s.update);
  const remove = useFiles((s) => s.remove);

  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | DStatus>("all");
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const [detail, setDetail] = React.useState<Doc | null>(null); // detail/edit pop-up
  const setD = (patch: Partial<Doc>) => setDetail((d) => d && { ...d, ...patch });
  const saveDetail = () => { if (detail) update(detail.id, detail); setDetail(null); };
  const delDetail = () => { if (detail) remove(detail.id); setDetail(null); };

  // Deep link (/files/<id>) opens the document's pop-up over the list.
  React.useEffect(() => {
    if (!initialOpenId) return;
    const r = docs.find((x) => x.id === initialOpenId);
    if (r) setDetail({ ...r });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenId]);

  const visible = docs.filter((r) =>
    (filter === "all" || r.status === filter) && (r.title.toLowerCase().includes(q.trim().toLowerCase()) || r.owner.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const stats = {
    records: docs.length,
    draft: docs.filter((r) => r.status === "draft").length,
    review: docs.filter((r) => r.status === "review").length,
  };

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = visible.length > 0 && visible.every((r) => sel.has(r.id));
  const toggleAll = () => setSel((s) => { const n = new Set(s); allOn ? visible.forEach((r) => n.delete(r.id)) : visible.forEach((r) => n.add(r.id)); return n; });

  function exportCsv() {
    const head = ["Title", "Owner", "Status"];
    const body = visible.map((r) => [r.title, r.owner, STATUS_META[r.status].label].join(","));
    const csv = [head.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "documents.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ type: TYPES[0], dept: DEPTS[0], owner: "Carla Estevez", status: "draft" as DStatus });
  function create() {
    add({ id: "n" + Math.random().toString(36).slice(2, 7), title: `${form.type} — ${form.dept}`, owner: form.owner, status: form.status });
    setAddOpen(false);
  }

  return (
    <>
      <PageHeader eyebrow="Operations" title="Document Management" description="Controlled documents with review and publish workflow." />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Records" value={stats.records} icon={FileText} tone="navy" />
        <StatCard label="Draft" value={stats.draft} icon={CheckCircle2} tone="green" />
        <StatCard label="Review" value={stats.review} icon={Clock} tone="amber" />
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="!w-44 !pl-8" />
            </div>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as "all" | DStatus)} className="!w-36">
              <option value="all">All statuses</option>
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </Select>
            <Button variant="outline" icon={Download} onClick={exportCsv}>CSV</Button>
            <Button variant="outline" icon={FileText} onClick={() => window.print()}>PDF</Button>
            <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>New Document</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle/50 text-2xs font-bold uppercase tracking-wide text-ink-3">
                <th className="w-10 px-3 py-2"><input type="checkbox" checked={allOn} onChange={toggleAll} className="accent-orange" /></th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Owner</th>
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
                    <Select value={r.status} onChange={(e) => update(r.id, { status: e.target.value as DStatus })} className="!w-32 !py-1 !text-xs">
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
                <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-ink-3">No documents match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New document" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={create}>Add document</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
          <Field label="Department"><Select value={form.dept} onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}>{DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></Field>
          <Field label="Owner"><Input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DStatus }))}>{STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}</Select></Field>
        </div>
      </Modal>

      {/* Detail / edit pop-up */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} description="Document details" size="lg"
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title" className="col-span-2"><Input value={detail.title} onChange={(e) => setD({ title: e.target.value })} /></Field>
              <Field label="Owner"><Input value={detail.owner} onChange={(e) => setD({ owner: e.target.value })} /></Field>
              <Field label="Status"><Select value={detail.status} onChange={(e) => setD({ status: e.target.value as DStatus })}>{STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}</Select></Field>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-4 text-sm">
              <DetailRow label="Version" value="v1.0" />
              <DetailRow label="Last modified" value="Jun 14, 2026" />
              <DetailRow label="Workspace" value="Operations" />
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}
