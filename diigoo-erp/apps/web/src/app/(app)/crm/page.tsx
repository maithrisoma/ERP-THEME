"use client";
import * as React from "react";
import Link from "next/link";
import { DollarSign, Target, Trophy, Percent, Contact as ContactIcon, Megaphone, ArrowUpRight, TrendingUp, Package, Boxes, AlertTriangle, ArrowRight } from "@/components/icon/lucide";
import { formatMoney, type Money } from "@/platform/types";
import { Card, CardHeader, PageHeader, Button, Tag, SectionLabel, Avatar, useToneColor, type Tone } from "@/components/ui/primitives";
import { BarChart, Donut, KpiCard, AreaChart } from "@/components/ui/charts";
import { SegmentedControl } from "@/components/ui/tabs";
import { deals, contacts, campaigns, products, sum } from "@/modules/crm/data";
import { STAGE_TONE, STAGE_LABEL, ADVANCEABLE, CHANNEL_TONE, CHANNEL_LABEL } from "@/modules/crm/ui";

const usd = (amount: number): Money => ({ amount, currency: "USD" });

// Period-scoped performance series (values in $k).
const TREND: Record<string, { labels: string[]; pipeline: number[]; won: number[] }> = {
  daily: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], pipeline: [310, 325, 318, 340, 352, 348, 365], won: [40, 55, 48, 62, 58, 70, 75] },
  weekly: { labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"], pipeline: [280, 295, 310, 300, 325, 340, 355, 382], won: [30, 42, 38, 55, 60, 58, 72, 80] },
  monthly: { labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"], pipeline: [220, 245, 260, 255, 280, 300, 315, 330, 350, 360, 372, 382], won: [90, 110, 130, 120, 150, 170, 190, 210, 230, 250, 265, 290] },
};
const PERIOD_LABEL: Record<string, string> = { daily: "Last 7 days", weekly: "Last 8 weeks", monthly: "Last 12 months" };

export default function CrmDashboard() {
  const tc = useToneColor();
  const [period, setPeriod] = React.useState("monthly");
  const tr = TREND[period];

  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const pipelineValue = sum(open.map((d) => d.value.amount));
  const wonValue = sum(won.map((d) => d.value.amount));
  const winRate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;

  const byStage = ADVANCEABLE.map((s) => ({ label: STAGE_LABEL[s], value: Math.round(sum(deals.filter((d) => d.stage === s).map((d) => d.value.amount)) / 100) }));
  const channels = ["email", "sms", "social", "whatsapp"] as const;
  const channelMix = channels
    .map((c) => ({ label: CHANNEL_LABEL[c], value: sum(campaigns.filter((m) => m.channel === c).map((m) => m.sent)), tone: CHANNEL_TONE[c] }))
    .filter((x) => x.value > 0);

  const topDeals = [...deals].sort((a, b) => b.value.amount - a.value.amount).slice(0, 6);

  // ── Inventory (catalog) aggregations ──
  const LOW = 25;
  const finite = products.filter((p) => p.stock < 9999);
  const lowStock = finite.filter((p) => p.stock <= LOW).sort((a, b) => a.stock - b.stock);
  const invValue = finite.reduce((s, p) => s + p.price.amount * p.stock, 0);
  const cats = Array.from(new Set(products.map((p) => p.category)));
  const stockByCat = cats.map((c) => ({ label: c, value: finite.filter((p) => p.category === c).reduce((s, p) => s + p.stock, 0) }));

  return (
    <>
      <PageHeader
        eyebrow="Sales & CRM"
        title="Sales Dashboard"
        description="Pipeline health, relationships, campaigns and catalog across your accounts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl value={period} onChange={setPeriod} options={[{ id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" }]} />
            <Link href="/crm/pipeline"><Button variant="primary" iconRight={ArrowUpRight}>Open pipeline</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Pipeline value" value={formatMoney(usd(pipelineValue)).replace(".00", "")} icon={DollarSign} tone="navy" hint="open deals" delta="+12%" up spark={[42, 46, 44, 50, 53, 55, 58]} />
        <KpiCard label="Open deals" value={open.length} icon={Target} tone="orange" hint="in progress" spark={[9, 11, 10, 12, 11, 13, 14]} />
        <KpiCard label="Won" value={formatMoney(usd(wonValue)).replace(".00", "")} icon={Trophy} tone="teal" hint={`${won.length} deals`} delta="+9%" up spark={[12, 14, 15, 16, 18, 19, 21]} />
        <KpiCard label="Win rate" value={`${winRate}%`} icon={Percent} tone="blue" delta="+6%" up spark={[48, 52, 50, 55, 58, 60, 63]} />
        <KpiCard label="Contacts" value={contacts.length} icon={ContactIcon} tone="purple" hint="total" spark={[60, 66, 70, 72, 75, 78, 82]} />
        <KpiCard label="Campaigns" value={campaigns.filter((c) => c.status === "active").length} icon={Megaphone} tone="green" hint="active" spark={[2, 3, 3, 4, 4, 5, 5]} />
      </div>

      {/* ── Performance trend (period-aware) ── */}
      <Card className="mt-4">
        <CardHeader
          title="Performance trend"
          description={`Pipeline & won value · ${PERIOD_LABEL[period]}`}
          icon={TrendingUp}
          action={<SegmentedControl value={period} onChange={setPeriod} options={[{ id: "daily", label: "Day" }, { id: "weekly", label: "Week" }, { id: "monthly", label: "Month" }]} />}
        />
        <AreaChart
          series={[{ name: "Pipeline", tone: "navy", data: tr.pipeline }, { name: "Won", tone: "green", data: tr.won }]}
          labels={tr.labels}
          height={220}
          valueFmt={(v) => `$${Math.round(v)}k`}
        />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Pipeline by stage" description="Open deal value in each stage" />
          <BarChart data={byStage} height={180} valueFmt={(v) => `$${(v / 1000).toFixed(0)}k`} />
        </Card>
        <Card>
          <CardHeader title="Campaign reach" description="Messages sent by channel" />
          <Donut segments={channelMix} centerValue={`${Math.round(sum(channelMix.map((c) => c.value)) / 1000)}k`} centerLabel="sent" />
        </Card>
      </div>

      {/* ── Inventory ── */}
      <SectionLabel>Inventory</SectionLabel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Catalog & stock" description={`${products.length} products · ${cats.length} categories`} icon={Package} action={<Link href="/crm/products" className="text-xs font-semibold text-orange hover:underline">Products →</Link>} />
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InvStat label="Products" value={products.length} tone="navy" tc={tc} />
            <InvStat label="Active" value={products.filter((p) => p.active).length} tone="green" tc={tc} />
            <InvStat label="Low stock" value={lowStock.length} tone={lowStock.length ? "coral" : "green"} tc={tc} />
            <InvStat label="Stock value" value={formatMoney(usd(invValue)).replace(".00", "")} tone="orange" tc={tc} />
          </div>
          <BarChart data={stockByCat} height={150} valueFmt={(v) => `${v}`} />
        </Card>
        <Card>
          <CardHeader title="Low stock" description={`${lowStock.length} need restock`} icon={AlertTriangle} />
          {lowStock.length === 0 ? (
            <div className="rounded-md bg-subtle py-8 text-center text-sm text-ink-3">Everything well stocked.</div>
          ) : (
            <div className="divide-y divide-line">
              {lowStock.slice(0, 6).map((p) => (
                <Link key={p.id} href={`/crm/products/${p.id}`} className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-subtle">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-coral/12 text-coral"><Boxes size={14} /></span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-medium text-navy">{p.name}</div>
                    <div className="truncate font-mono text-2xs text-ink-3">{p.sku} · {p.category}</div>
                  </div>
                  <Tag tone={p.stock === 0 ? "coral" : "amber"}>{p.stock === 0 ? "Out" : `${p.stock} left`}</Tag>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <SectionLabel>Top deals</SectionLabel>
        <div className="divide-y divide-line">
          {topDeals.map((d) => (
            <Link key={d.id} href="/crm/pipeline" className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-subtle">
              <Avatar name={d.company} tone={STAGE_TONE[d.stage]} size={32} square />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-navy">{d.name}</div>
                <div className="truncate text-2xs text-ink-3">{d.owner} · closes {d.closeDate}</div>
              </div>
              <Tag tone={STAGE_TONE[d.stage]}>{STAGE_LABEL[d.stage]}</Tag>
              <div className="w-28 text-right font-mono text-sm font-semibold text-navy">{formatMoney(d.value).replace(".00", "")}</div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}

function InvStat({ label, value, tone, tc }: { label: string; value: React.ReactNode; tone: Tone; tc: (t: Tone) => string }) {
  return (
    <div className="rounded-md border border-line bg-subtle px-3 py-2">
      <div className="font-mono text-lg font-bold leading-none" style={{ color: tc(tone) }}>{value}</div>
      <div className="mt-1 text-2xs text-ink-3">{label}</div>
    </div>
  );
}
