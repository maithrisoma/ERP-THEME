"use client";
import * as React from "react";
import { Plus, ChevronRight, X, DollarSign, Target, Trophy } from "@/components/icon/lucide";
import { formatMoney, money, type Money } from "@/platform/types";
import { useSession } from "@/platform/session";
import { PageHeader, Card, StatCard, Button, Tag, Avatar } from "@/components/ui/primitives";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { DealBody } from "@/components/crm-detail";
import { Field, Input } from "@/components/ui/form";
import { deals as seed, sum, type Deal, type DealStage } from "@/modules/crm/data";
import { DEAL_STAGES, ADVANCEABLE, STAGE_LABEL, STAGE_TONE } from "@/modules/crm/ui";

const usd = (amount: number): Money => ({ amount, currency: "USD" });

export default function CrmPipelinePage() {
  const session = useSession();
  const [list, setList] = React.useState<Deal[]>(() => seed);
  const [sel, setSel] = React.useState<Deal | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", company: "", value: 25000, closeDate: "2026-08-15" });

  const grouped = React.useMemo(() => {
    const g = Object.fromEntries(DEAL_STAGES.map((s) => [s, [] as Deal[]])) as Record<DealStage, Deal[]>;
    list.forEach((d) => g[d.stage].push(d));
    return g;
  }, [list]);

  const open = list.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const pipelineValue = sum(open.map((d) => d.value.amount));
  const wonValue = sum(list.filter((d) => d.stage === "won").map((d) => d.value.amount));

  function move(id: string, stage: DealStage) {
    setList((ds) => ds.map((d) => (d.id === id ? { ...d, stage } : d)));
  }
  function advance(d: Deal) {
    const i = ADVANCEABLE.indexOf(d.stage);
    if (i >= 0 && i < ADVANCEABLE.length - 1) move(d.id, ADVANCEABLE[i + 1]);
  }
  function addDeal() {
    if (!form.name.trim()) return;
    const d: Deal = {
      id: "dl_" + Math.random().toString(36).slice(2, 7),
      name: form.name.trim(), company: form.company.trim() || form.name.trim(), stage: "lead",
      value: money(Number(form.value) || 0), owner: session.principal.name, closeDate: form.closeDate, probability: 20,
    };
    setList((l) => [d, ...l]);
    setAddOpen(false);
    setForm({ name: "", company: "", value: 25000, closeDate: "2026-08-15" });
  }

  return (
    <>
      <PageHeader
        eyebrow="Sales & CRM"
        title="Pipeline"
        description="Every open deal by stage. Advance, win or lose deals as they progress."
        actions={<Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New deal</Button>}
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pipeline value" value={formatMoney(usd(pipelineValue)).replace(".00", "")} icon={DollarSign} tone="navy" hint="open deals" />
        <StatCard label="Open deals" value={open.length} icon={Target} tone="teal" />
        <StatCard label="Won" value={formatMoney(usd(wonValue)).replace(".00", "")} icon={Trophy} tone="green" />
      </div>

      <Card className="mt-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {DEAL_STAGES.map((stage) => {
            const dealsIn = grouped[stage];
            const stageValue = sum(dealsIn.map((d) => d.value.amount));
            return (
              <div key={stage} className="flex w-[250px] shrink-0 flex-col">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-2">{STAGE_LABEL[stage]}</span>
                  <span className="font-mono text-2xs font-semibold text-ink-3">{formatMoney(usd(stageValue)).replace(".00", "")}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 rounded-md bg-subtle p-2">
                  {dealsIn.length === 0 ? (
                    <div className="rounded-md border border-dashed border-line py-6 text-center text-2xs text-ink-3">No deals</div>
                  ) : (
                    dealsIn.map((d) => (
                      <div key={d.id} className="rounded-md border border-line bg-surface p-2.5 shadow-card transition-colors hover:border-orange/40">
                        <button onClick={() => setSel(d)} className="block w-full text-left">
                          <div className="flex items-start gap-2.5">
                            <Avatar name={d.company} tone={STAGE_TONE[stage]} size={28} square />
                            <div className="min-w-0 flex-1 leading-tight">
                              <div className="truncate text-sm font-semibold text-navy">{d.name}</div>
                              <div className="truncate text-2xs text-ink-3">{d.owner} · {d.closeDate}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-mono text-sm font-semibold text-navy">{formatMoney(d.value).replace(".00", "")}</span>
                            <Tag tone={STAGE_TONE[stage]}>{d.probability}%</Tag>
                          </div>
                        </button>
                        {stage !== "won" && stage !== "lost" && (
                          <div className="mt-2 flex gap-1">
                            <Button size="sm" variant="subtle" iconRight={ChevronRight} className="flex-1" onClick={() => advance(d)}>{stage === "negotiation" ? "Win" : "Advance"}</Button>
                            <Button size="sm" variant="ghost" icon={X} aria-label="Mark lost" onClick={() => move(d.id, "lost")} />
                          </div>
                        )}
                        {stage === "lost" && <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => move(d.id, "lead")}>Reopen</Button>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New deal" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={addDeal}>Create deal</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Deal name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme — annual supply" /></Field>
          <Field label="Company"><Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Acme Retail" /></Field>
          <Field label="Value (USD)"><Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} /></Field>
          <Field label="Expected close"><Input type="date" value={form.closeDate} onChange={(e) => setForm((f) => ({ ...f, closeDate: e.target.value }))} /></Field>
        </div>
      </Modal>

      <DetailModal open={!!sel} onClose={() => setSel(null)} eyebrow="Deal" title={sel?.name}>
        {sel && <DealBody deal={sel} />}
      </DetailModal>
    </>
  );
}
