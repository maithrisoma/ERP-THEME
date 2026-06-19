"use client";
import * as React from "react";
import { Megaphone, Plus, Mail, MessageSquare, Share2, Send, Play, Pause } from "@/components/icon/lucide";
import { PageHeader, Card, CardHeader, StatCard, Button, Tag, ProgressBar, DetailRow, type Tone } from "@/components/ui/primitives";
import { Modal, DetailModal } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/form";
import { campaigns as seed, sum, type Campaign, type Channel, type CampaignStatus } from "@/modules/crm/data";
import { CAMPAIGN_TONE, CHANNEL_LABEL } from "@/modules/crm/ui";
import type { LucideIcon } from "@/components/icon/lucide";

const CHANNEL_ICON: Record<Channel, LucideIcon> = { email: Mail, sms: MessageSquare, social: Share2, whatsapp: Send };
const STATUS_LABEL: Record<CampaignStatus, string> = { draft: "Draft", active: "Active", completed: "Completed", paused: "Paused" };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default function CrmCampaignsPage() {
  const [list, setList] = React.useState<Campaign[]>(() => seed);
  const [addOpen, setAddOpen] = React.useState(false);
  const [selCampaign, setSelCampaign] = React.useState<Campaign | null>(null);
  const [form, setForm] = React.useState({ name: "", channel: "email" as Channel, audience: 1000 });

  const totalSent = sum(list.map((c) => c.sent));
  const totalOpened = sum(list.map((c) => c.opened));
  const totalConverted = sum(list.map((c) => c.converted));

  function toggle(id: string) {
    setList((cs) => cs.map((c) => (c.id === id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c)));
  }
  function addCampaign() {
    if (!form.name.trim()) return;
    const c: Campaign = { id: "cm_" + Math.random().toString(36).slice(2, 6), name: form.name.trim(), channel: form.channel, status: "draft", audience: Number(form.audience) || 0, sent: 0, opened: 0, clicked: 0, converted: 0, startDate: new Date().toISOString().slice(0, 10) };
    setList((l) => [c, ...l]);
    setAddOpen(false);
    setForm({ name: "", channel: "email", audience: 1000 });
  }

  return (
    <>
      <PageHeader
        eyebrow="Sales & CRM"
        title="Campaigns"
        description="Plan multi-channel campaigns and measure reach, engagement and conversion."
        actions={<Button icon={Plus} variant="primary" onClick={() => setAddOpen(true)}>New campaign</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active campaigns" value={list.filter((c) => c.status === "active").length} icon={Megaphone} tone="purple" />
        <StatCard label="Messages sent" value={totalSent.toLocaleString()} icon={Send} tone="navy" />
        <StatCard label="Open rate" value={`${pct(totalOpened, totalSent)}%`} icon={Mail} tone="blue" />
        <StatCard label="Conversions" value={totalConverted.toLocaleString()} icon={Megaphone} tone="green" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.map((c) => {
          const Icon = CHANNEL_ICON[c.channel];
          return (
            <Card key={c.id}>
              <CardHeader
                title={c.name}
                icon={Icon}
                description={`${CHANNEL_LABEL[c.channel]} · ${c.audience.toLocaleString()} audience · started ${c.startDate}`}
                action={
                  <div className="flex items-center gap-2">
                    <Tag tone={CAMPAIGN_TONE[c.status]}>{STATUS_LABEL[c.status]}</Tag>
                    {(c.status === "active" || c.status === "paused") && (
                      <Button size="sm" variant="outline" icon={c.status === "active" ? Pause : Play} onClick={() => toggle(c.id)}>{c.status === "active" ? "Pause" : "Resume"}</Button>
                    )}
                  </div>
                }
              />
              <button onClick={() => setSelCampaign(c)} className="block w-full">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Funnel label="Sent" value={c.sent} total={c.audience} tone="navy" />
                  <Funnel label="Opened" value={c.opened} total={c.sent} tone="blue" />
                  <Funnel label="Converted" value={c.converted} total={c.opened} tone="green" />
                </div>
                <div className="mt-2 text-center text-2xs font-semibold text-orange">View details →</div>
              </button>
            </Card>
          );
        })}
      </div>

      <DetailModal open={!!selCampaign} onClose={() => setSelCampaign(null)} eyebrow={selCampaign ? CHANNEL_LABEL[selCampaign.channel] : undefined} title={selCampaign?.name}>
        {selCampaign && (() => {
          const c = selCampaign;
          return (
            <>
              <div className="flex items-center gap-1.5">
                <Tag tone={CAMPAIGN_TONE[c.status]}>{STATUS_LABEL[c.status]}</Tag>
                <Tag tone="gray">{CHANNEL_LABEL[c.channel]}</Tag>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Funnel label="Sent" value={c.sent} total={c.audience} tone="navy" />
                <Funnel label="Opened" value={c.opened} total={c.sent} tone="blue" />
                <Funnel label="Converted" value={c.converted} total={c.opened} tone="green" />
              </div>
              <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <DetailRow label="Audience" value={c.audience.toLocaleString()} />
                <DetailRow label="Sent" value={c.sent.toLocaleString()} />
                <DetailRow label="Opened" value={`${c.opened.toLocaleString()} (${pct(c.opened, c.sent)}%)`} />
                <DetailRow label="Clicked" value={`${c.clicked.toLocaleString()} (${pct(c.clicked, c.sent)}%)`} />
                <DetailRow label="Converted" value={`${c.converted.toLocaleString()} (${pct(c.converted, c.sent)}%)`} />
                <DetailRow label="Started" value={c.startDate} />
              </dl>
              {(c.status === "active" || c.status === "paused") && (
                <Button variant="outline" icon={c.status === "active" ? Pause : Play} className="mt-5" onClick={() => { toggle(c.id); setSelCampaign(null); }}>{c.status === "active" ? "Pause campaign" : "Resume campaign"}</Button>
              )}
            </>
          );
        })()}
      </DetailModal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New campaign" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="primary" icon={Plus} onClick={addCampaign}>Create campaign</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Campaign name" required className="col-span-2"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Summer loyalty push" /></Field>
          <Field label="Channel"><Select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as Channel }))}><option value="email">Email</option><option value="sms">SMS</option><option value="social">Social</option><option value="whatsapp">WhatsApp</option></Select></Field>
          <Field label="Audience size"><Input type="number" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: Number(e.target.value) }))} /></Field>
        </div>
      </Modal>
    </>
  );
}

function Funnel({ label, value, total, tone }: { label: string; value: number; total: number; tone: Tone }) {
  return (
    <div className="rounded-md border border-line bg-subtle p-2.5">
      <div className="font-mono text-lg font-bold text-navy">{value.toLocaleString()}</div>
      <div className="text-2xs uppercase tracking-wide text-ink-3">{label}</div>
      <ProgressBar value={total ? Math.round((value / total) * 100) : 0} tone={tone} className="mt-1.5" />
    </div>
  );
}
