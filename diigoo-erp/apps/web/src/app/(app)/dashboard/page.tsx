"use client";
import * as React from "react";
import {
  DollarSign, TrendingUp, ShoppingCart, FileText, Users, Package, Truck, UserCheck,
  Building2, Boxes, CheckCircle2, AlertTriangle, Receipt, PieChart, Layers, Zap, type LucideIcon,
} from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { PageHeader, Tag, ProgressBar, DetailRow, useToneColor, type Tone } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { Donut, BarChart, AreaChart } from "@/components/ui/charts";
import { SegmentedControl } from "@/components/ui/tabs";

// ── formatters ────────────────────────────────────────────────────────────────
const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const kfmt = (n: number) => (Math.abs(n) >= 1000 ? "$" + Math.round(n / 1000) + "k" : "$" + Math.round(n));
const pct = (n: number, total: number) => `${Math.round((n / total) * 100)}%`;

const MONTHS8 = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// ── curated demo data (mirrors the live command-center figures) ───────────────
const REVENUE_SERIES = [2400, 3100, 2700, 4200, 38000, 72000, 75000, 52000];
const PROFIT_SERIES = [1400, 1800, 1500, 2300, 14000, 26000, 27000, 18000];
const GROWTH_SERIES = [12000, 18000, 24000, 31000, 95000, 150000, 168000, 150000];
const EXPENSE_SERIES = [1000, 1200, 1100, 1300, 3000, 4200, 5000, 6000];
const DAILY = [12000, 16500, 11000, 9000, 15000, 24000, 17000, 14000, 16000, 12000, 10000, 9500, 9200, 9300];
const DAILY_LABELS = Array.from({ length: 14 }, (_, i) => `${i + 6}`);
const WEEKLY = [22000, 38000, 24000, 30000, 36000, 26000];

const CHANNELS: { label: string; value: number; tone: Tone }[] = [
  { label: "Mobile App", value: 96863.48, tone: "navy" },
  { label: "Lottery", value: 69570.79, tone: "teal" },
  { label: "In-Store", value: 66734.72, tone: "blue" },
  { label: "Online", value: 65403.12, tone: "amber" },
  { label: "Drive-Thru", value: 59524.6, tone: "purple" },
  { label: "Fuel", value: 48774.31, tone: "coral" },
];
const CATEGORIES: { label: string; value: number; tone: Tone }[] = [
  { label: "Stationery", value: 3929, tone: "blue" },
  { label: "Dairy", value: 3563, tone: "teal" },
  { label: "Snacks", value: 2904, tone: "navy" },
  { label: "Bakery", value: 2487, tone: "amber" },
  { label: "Grocery", value: 2252, tone: "purple" },
  { label: "Beverages", value: 2111, tone: "coral" },
  { label: "Confectionery", value: 2085, tone: "green" },
];
const INVENTORY: { label: string; value: number; tone: Tone }[] = [
  { label: "In Stock", value: 46, tone: "green" },
  { label: "Low Stock", value: 9, tone: "amber" },
  { label: "Out Of Stock", value: 5, tone: "coral" },
];
const TOP_PRODUCTS = [
  { label: "Frozen — Harbor Case", value: 407804.8 },
  { label: "Confectionery — Vertex Box", value: 312983.44 },
  { label: "Automotive — Harbor Unit", value: 311233.52 },
  { label: "Household — Crestline 500ml", value: 264532.73 },
  { label: "Personal Care — Summit Combo", value: 251033.9 },
  { label: "Beverages — Bluewave Pack", value: 224627.55 },
];
const TOP_CUSTOMERS = [
  { label: "Loyalty Member", value: 111798.28 },
  { label: "Corporate Account", value: 107446.51 },
  { label: "Wayne Enterprises", value: 1919.54 },
  { label: "Vandelay Imports", value: 1610.62 },
  { label: "Umbrella Co", value: 1455.03 },
  { label: "Hooli Inc", value: 1314.49 },
];
const TOP_STORES = [
  { label: "Airport Kiosk", value: 93076.42 },
  { label: "Highway 7", value: 92733.47 },
  { label: "Mall Outlet", value: 90011.57 },
  { label: "Downtown Flagship", value: 70438.28 },
  { label: "Westside", value: 65725.38 },
  { label: "Westfield Mall", value: 3700.41 },
  { label: "Suburban Plaza", value: 3184.45 },
];
const STOCK_MOVERS = [
  { label: "Frozen — Harbor Case", value: 1040 },
  { label: "Personal Care — Summit Combo", value: 962 },
  { label: "Confectionery — Vertex Box", value: 868 },
  { label: "Automotive — Harbor Unit", value: 808 },
  { label: "Beverages — Bluewave Pack", value: 721 },
  { label: "Household — Crestline 500ml", value: 683 },
];
const TRANSACTIONS = [
  { ref: "MKS-10004", party: "Walk-in Customer", store: "Airport Kiosk", amount: 1383.56, status: "Completed" },
  { ref: "MKS-10124", party: "Loyalty Member", store: "Westside", amount: 945.28, status: "Completed" },
  { ref: "MKS-10037", party: "Corporate Account", store: "Mall Outlet", amount: 1200.45, status: "Completed" },
  { ref: "MKS-10085", party: "Loyalty Member", store: "Mall Outlet", amount: 2528.29, status: "Completed" },
  { ref: "SALE-10000", party: "Walk-in Customer", store: "Downtown Flagship", amount: 13.21, status: "Refunded" },
  { ref: "MKS-10048", party: "Loyalty Member", store: "Westside", amount: 864.72, status: "Completed" },
];
const ORDERS = [
  { party: "Granite Wholesale", amount: 17313.01, status: "Pending" },
  { party: "Silverline Wholesale", amount: 50473.82, status: "Pending" },
  { party: "Pioneer Industries", amount: 56968.32, status: "Pending" },
  { party: "Trident Supplies", amount: 92598.23, status: "Pending" },
  { party: "Horizon Wholesale", amount: 20055.83, status: "Pending" },
  { party: "Crestline Wholesale", amount: 107601.26, status: "Pending" },
];
const ACTIVITY = [
  { kind: "Sale", title: "Sale #10004 · Walk-in Customer", status: "Completed", tone: "green" as Tone, when: "Jun 16, 11:01 PM" },
  { kind: "Sale", title: "Sale #10124 · Loyalty Member", status: "Completed", tone: "green" as Tone, when: "Jun 16, 07:47 PM" },
  { kind: "Sale", title: "Sale #10037 · Corporate Account", status: "Completed", tone: "green" as Tone, when: "Jun 16, 05:55 PM" },
  { kind: "Invoice", title: "INV-8609 — Cedar Mart · Brightway Mart", status: "Overdue", tone: "coral" as Tone, when: "Jun 16, 03:53 PM" },
  { kind: "Invoice", title: "INV-7532 — Brightway Mart · Evergreen Foods", status: "Overdue", tone: "coral" as Tone, when: "Jun 16, 03:53 PM" },
  { kind: "Invoice", title: "INV-1741 — Bluewave Retail · Evergreen Logistics", status: "Overdue", tone: "coral" as Tone, when: "Jun 16, 03:53 PM" },
];

const PERIODS = [
  { id: "30d", label: "30 days" }, { id: "90d", label: "90 days" },
  { id: "6m", label: "6 months" }, { id: "all", label: "All time" }, { id: "custom", label: "Custom" },
];

export default function DashboardPage() {
  const session = useSession();
  const tc = useToneColor();
  const first = session.principal.name.split(" ")[0] || "there";
  const [period, setPeriod] = React.useState("90d");
  const [detail, setDetail] = React.useState<{ title: string; rows: [string, React.ReactNode][] } | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Retail Command Center"
        description={`Welcome back, ${first} · live business intelligence across every module`}
        actions={<SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />}
      />

      <div className="space-y-2.5">
        {/* Hero KPIs */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <HeroCard label="Total Revenue" value={usd(418869.98)} icon={DollarSign} tone="blue" caption="Revenue trend · 8 months" series={REVENUE_SERIES} tc={tc}
            badge={<span className="inline-flex items-center gap-1.5"><span className="rounded bg-coral/10 px-1.5 py-0.5 text-2xs font-bold text-coral">▼ 47%</span><span className="text-2xs text-ink-3">vs last month</span></span>} />
          <HeroCard label="Gross Profit" value={usd(144912.74)} icon={TrendingUp} tone="teal" caption="Profit trend · 8 months" series={PROFIT_SERIES} tc={tc}
            badge={<span className="rounded bg-green/10 px-1.5 py-0.5 text-2xs font-bold text-green">REV − COST − EXPENSE</span>} />
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Total Sales" value="201" icon={Receipt} tone="blue" hint="transactions" />
          <Stat label="Total Orders" value="201" icon={ShoppingCart} tone="amber" delta="3 PENDING" deltaTone="amber" />
          <Stat label="Total Invoices" value="46" icon={FileText} tone="purple" hint="finance" />
          <Stat label="Customers" value="42" icon={Users} tone="teal" hint="accounts" />
          <Stat label="Products" value="60" icon={Package} tone="green" hint="catalog" />
          <Stat label="Suppliers" value="22" icon={Truck} tone="navy" hint="vendors" />
          <Stat label="Employees" value="90" icon={UserCheck} tone="coral" hint="headcount" />
          <Stat label="Stores" value="7" icon={Building2} tone="green" hint="locations" />
          <Stat label="Completed Orders" value="190" icon={CheckCircle2} tone="blue" hint="fulfilled" />
          <Stat label="Low Stock" value="14" icon={AlertTriangle} tone="coral" delta="REORDER" deltaTone="coral" hint="below point" />
        </div>

        {/* Trend charts */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel><PanelHead title="Monthly Revenue Trend" desc="Completed sales, last 8 months" /><BarChart data={MONTHS8.map((m, i) => ({ label: m, value: REVENUE_SERIES[i] }))} tone="blue" height={108} valueFmt={kfmt} /></Panel>
          <Panel><PanelHead title="Revenue Growth" desc="Cumulative trajectory" /><AreaChart series={[{ name: "Revenue", tone: "teal", data: GROWTH_SERIES }]} labels={MONTHS8} height={108} valueFmt={kfmt} /></Panel>
        </div>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel><PanelHead title="Daily Sales (last 14 days)" desc="Revenue per day" /><AreaChart series={[{ name: "Sales", tone: "blue", data: DAILY }]} labels={DAILY_LABELS} height={108} valueFmt={kfmt} /></Panel>
          <Panel><PanelHead title="Weekly Performance" desc="Revenue per week (6 weeks)" /><BarChart data={WEEKLY.map((v, i) => ({ label: `W${i + 1}`, value: v }))} tone="purple" height={108} valueFmt={kfmt} /></Panel>
        </div>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel><PanelHead title="Profit vs Expense" desc="Monthly comparison" /><AreaChart series={[{ name: "Revenue", tone: "blue", data: REVENUE_SERIES }, { name: "Expense", tone: "coral", data: EXPENSE_SERIES }]} labels={MONTHS8} height={108} valueFmt={kfmt} /></Panel>
          <Panel><PanelHead title="Customer Growth" desc="Cumulative accounts" /><AreaChart series={[{ name: "Customers", tone: "coral", data: [30, 32, 34, 35, 36, 37, 38, 42] }]} labels={MONTHS8} height={108} valueFmt={(v) => `${Math.round(v)}`} /></Panel>
        </div>

        {/* Distribution donuts */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          <Panel><PanelHead title="Sales by Channel" desc="Where revenue comes from" icon={PieChart} /><DistList rows={CHANNELS} center={usd0(CHANNELS.reduce((a, c) => a + c.value, 0))} fmt={usd} tc={tc} /></Panel>
          <Panel><PanelHead title="Top Product Categories" desc="By units sold" icon={Layers} /><DistList rows={CATEGORIES} center={CATEGORIES.reduce((a, c) => a + c.value, 0).toLocaleString()} fmt={(v) => v.toLocaleString()} tc={tc} /></Panel>
          <Panel><PanelHead title="Inventory Status" desc="Stock health across catalog" icon={Boxes} /><DistList rows={INVENTORY} center={String(INVENTORY.reduce((a, c) => a + c.value, 0))} fmt={(v) => String(v)} tc={tc} /></Panel>
        </div>

        {/* Ranked lists */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Panel><PanelHead title="Top-Selling Products" desc="By sales value" /><Ranked rows={TOP_PRODUCTS} tone="blue" fmt={usd} /></Panel>
          <Panel><PanelHead title="Top Customers" desc="By revenue" /><Ranked rows={TOP_CUSTOMERS} tone="green" fmt={usd} /></Panel>
          <Panel><PanelHead title="Best Performing Stores" desc="By revenue" /><Ranked rows={TOP_STORES} tone="blue" fmt={usd} /></Panel>
          <Panel><PanelHead title="Stock — Top Movers" desc="Units sold by product" /><Ranked rows={STOCK_MOVERS} tone="amber" fmt={(v) => v.toLocaleString()} /></Panel>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <Panel pad={false}>
            <div className="px-3 pt-3"><PanelHead title="Recent Transactions" desc="Latest POS sales" /></div>
            <Table head={["Ref", "Party", "Store", "Amount", "Status"]} align={["", "", "", "right", ""]}
              onRowClick={(i) => { const t = TRANSACTIONS[i]; setDetail({ title: t.ref, rows: [["Party", t.party], ["Store", t.store], ["Amount", usd(t.amount)], ["Status", <Tag tone={t.status === "Completed" ? "green" : "coral"}>{t.status}</Tag>], ["Type", "POS sale"]] }); }}
              rows={TRANSACTIONS.map((t) => [t.ref, t.party, t.store, usd(t.amount), <Tag key="s" tone={t.status === "Completed" ? "green" : "coral"}>{t.status}</Tag>])} />
          </Panel>
          <Panel pad={false}>
            <div className="px-3 pt-3"><PanelHead title="Recent Orders" desc="Latest purchase orders" /></div>
            <Table head={["Ref", "Party", "Amount", "Status"]} align={["", "", "right", ""]}
              onRowClick={(i) => { const o = ORDERS[i]; setDetail({ title: o.party, rows: [["Reference", "—"], ["Party", o.party], ["Amount", usd(o.amount)], ["Status", <Tag tone="amber">{o.status}</Tag>], ["Type", "Purchase order"]] }); }}
              rows={ORDERS.map((o) => ["—", o.party, usd(o.amount), <Tag key="s" tone="amber">{o.status}</Tag>])} />
          </Panel>
        </div>

        {/* Activity */}
        <Panel>
          <PanelHead title="Recent Activity" desc="Across all modules" icon={Zap} />
          <div className="divide-y divide-line">
            {ACTIVITY.map((a, i) => (
              <button key={i} onClick={() => setDetail({ title: a.title, rows: [["Type", a.kind], ["Status", <Tag tone={a.tone}>{a.status}</Tag>], ["When", a.when]] })} className="flex w-full items-center gap-3 py-1.5 text-left transition-colors hover:bg-subtle/40">
                <span className="w-14 shrink-0 text-2xs font-bold uppercase tracking-wide text-ink-3">{a.kind}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-ink-2">{a.title}</span>
                <Tag tone={a.tone}>{a.status}</Tag>
                <span className="w-24 shrink-0 text-right font-mono text-2xs text-ink-3">{a.when}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* Record detail pop-up */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} description="Record details" size="md">
        {detail && (
          <dl className="space-y-2.5 text-sm">
            {detail.rows.map(([label, value]) => <DetailRow key={label} label={label} value={value} />)}
          </dl>
        )}
      </Modal>
    </>
  );
}

// ── compact panel primitives ──────────────────────────────────────────────────
function Panel({ children, pad = true, className }: { children: React.ReactNode; pad?: boolean; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface shadow-card ${pad ? "p-3" : ""} ${className ?? ""}`}>{children}</div>;
}
function PanelHead({ title, desc, icon: Icon }: { title: string; desc?: string; icon?: LucideIcon }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      {Icon && <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy/[.06] text-navy"><Icon size={14} /></span>}
      <div className="min-w-0 leading-tight">
        <h3 className="truncate text-sm font-bold text-navy">{title}</h3>
        {desc && <p className="truncate text-[11px] text-ink-3">{desc}</p>}
      </div>
    </div>
  );
}

// ── widgets ───────────────────────────────────────────────────────────────────
function HeroCard({ label, value, icon: Icon, tone, caption, series, badge, tc }: {
  label: string; value: string; icon: LucideIcon; tone: Tone; caption: string; series: number[]; badge: React.ReactNode; tc: (t: Tone) => string;
}) {
  const c = tc(tone);
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface p-3 shadow-card">
      <div className="flex items-start justify-between">
        <div className="text-2xs font-bold uppercase tracking-wide text-ink-3">{label}</div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md" style={{ background: `${c}1f`, color: c }}><Icon size={16} /></span>
      </div>
      <div className="mt-1 font-mono text-2xl font-bold leading-none text-navy">{value}</div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {badge}
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-ink-3">{caption}</span>
      </div>
      <AreaChart series={[{ name: label, tone, data: series }]} labels={MONTHS8} height={62} valueFmt={kfmt} yTicks={2} />
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone, delta, deltaTone, hint }: {
  label: string; value: string; icon: LucideIcon; tone: Tone; delta?: string; deltaTone?: Tone; hint?: string;
}) {
  const tc = useToneColor();
  const c = tc(tone);
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5 shadow-card">
      <div className="flex items-start justify-between">
        <span className="truncate text-2xs font-medium uppercase tracking-wide text-ink-3">{label}</span>
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${c}1f`, color: c }}><Icon size={13} /></span>
      </div>
      <div className="mt-1 font-mono text-xl font-bold text-navy">{value}</div>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        {delta && <span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase" style={{ background: `${tc(deltaTone ?? "navy")}1a`, color: tc(deltaTone ?? "navy") }}>{delta}</span>}
        {hint && <span className="text-2xs text-ink-3">{hint}</span>}
      </div>
    </div>
  );
}

function Ranked({ rows, tone, fmt }: { rows: { label: string; value: number }[]; tone: Tone; fmt: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-subtle font-mono text-[9px] font-bold text-ink-3">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-navy">{r.label}</span>
            <span className="shrink-0 font-mono text-2xs font-semibold text-navy">{fmt(r.value)}</span>
          </div>
          <ProgressBar value={(r.value / max) * 100} tone={tone} className="mt-1" />
        </div>
      ))}
    </div>
  );
}

function DistList({ rows, center, fmt, tc }: { rows: { label: string; value: number; tone: Tone }[]; center: string; fmt: (v: number) => string; tc: (t: Tone) => string }) {
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <div className="flex items-center gap-3">
      <Donut segments={rows} size={104} thickness={13} centerLabel="total" centerValue={center} />
      <ul className="min-w-0 flex-1 space-y-0.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5 text-2xs">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: tc(r.tone) }} />
            <span className="min-w-0 flex-1 truncate text-ink-2">{r.label}</span>
            <span className="shrink-0 font-mono font-semibold text-navy">{fmt(r.value)}</span>
            <span className="w-7 shrink-0 text-right font-mono text-ink-3">{pct(r.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Table({ head, rows, align, onRowClick }: { head: string[]; rows: React.ReactNode[][]; align: string[]; onRowClick?: (i: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-line bg-subtle/50">
            {head.map((h, i) => <th key={h} className={`px-3 py-1.5 text-2xs font-bold uppercase tracking-wide text-ink-3 ${align[i] === "right" ? "text-right" : "text-left"}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, ri) => (
            <tr key={ri} onClick={() => onRowClick?.(ri)} className={`hover:bg-subtle/40 ${onRowClick ? "cursor-pointer" : ""}`}>
              {r.map((cell, ci) => (
                <td key={ci} className={`px-3 py-1.5 text-xs ${align[ci] === "right" ? "text-right font-mono font-semibold text-navy" : "text-ink-2"} ${ci === 0 ? "font-mono text-2xs text-ink-3" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
