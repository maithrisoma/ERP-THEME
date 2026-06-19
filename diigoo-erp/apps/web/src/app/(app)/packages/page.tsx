"use client";
import * as React from "react";
import { Check, Minus, Crown, Zap, Shield, Clock, CheckCircle2, X, CreditCard, Lock, type LucideIcon } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { useSession } from "@/platform/session";
import { PageHeader, Card, Button, Tag } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { Field, Input } from "@/components/ui/form";
import { TIERS, TIER_ORDER, hasFeature, type FeatureKey, type TierId } from "@/platform/packages";

const COMPARE: { group: string; rows: { key: FeatureKey; label: string }[] }[] = [
  { group: "Core HR", rows: [
    { key: "hr.core", label: "Employee records & org chart" },
    { key: "hr.attendance", label: "Attendance & timesheets" },
    { key: "hr.leave", label: "Leave management" },
    { key: "hr.documents", label: "Document vault" },
  ] },
  { group: "Pay & talent", rows: [
    { key: "hr.payroll", label: "Payroll runs & payslips" },
    { key: "hr.scheduling", label: "Shift scheduling" },
    { key: "hr.advanced_scheduling_ai", label: "AI scheduling forecasts" },
    { key: "hr.benefits", label: "Benefits administration" },
    { key: "hr.performance", label: "Performance reviews & goals" },
    { key: "hr.recruitment", label: "Recruitment pipeline (ATS)" },
  ] },
  { group: "Platform", rows: [
    { key: "platform.multi_location", label: "Multi-location" },
    { key: "platform.sso", label: "SSO / SAML" },
    { key: "platform.api_outbound", label: "Outbound API connectors" },
    { key: "platform.webhooks", label: "Webhooks" },
    { key: "platform.oauth_clients", label: "OAuth API clients" },
    { key: "platform.dedicated_models", label: "Dedicated AI models" },
  ] },
];

const ACCENT_RING: Record<TierId, string> = {
  starter: "border-line", growth: "border-blue/40", business: "border-orange ring-1 ring-orange", enterprise: "border-navy bg-navy text-white",
};

export default function PackagesPage() {
  const tenant = useSession((s) => s.tenant);
  const setTier = useSession((s) => s.setTier);
  const [justSwitched, setJustSwitched] = React.useState<TierId | null>(null);
  const [checkout, setCheckout] = React.useState<TierId | null>(null);

  function switchTo(id: TierId) {
    setTier(id);
    setJustSwitched(id);
  }

  // Free plan switches instantly; paid plans require checkout / sales contact.
  function choose(id: TierId) {
    if (id === "starter") switchTo(id);
    else setCheckout(id);
  }
  function completePurchase() {
    if (checkout) switchTo(checkout);
    setCheckout(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform · Billing"
        title="Packages & Plans"
        description="Every feature is gated by package tier. Switch a plan to see modules and capabilities unlock across the app in real time."
      />

      {justSwitched && (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-green/30 bg-green/[.08] px-3.5 py-2.5 text-sm text-ink-2">
          <CheckCircle2 size={16} className="shrink-0 text-green" />
          <span>
            Now on <strong className="text-navy">{TIERS[justSwitched].name}</strong> — <strong className="text-navy">{TIERS[justSwitched].features.length}</strong> capabilities unlocked. Module nav and feature gates updated across the app.
          </span>
          <button onClick={() => setJustSwitched(null)} className="ml-auto shrink-0 rounded p-1 text-ink-3 hover:text-navy" aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {/* Tier cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TIER_ORDER.map((id) => {
          const t = TIERS[id];
          const current = tenant.tier === id;
          const dark = id === "enterprise";
          return (
            <Card key={id} className={cn("relative flex flex-col border-2", ACCENT_RING[id])}>
              {id === "business" && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-orange px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-white">Popular</span>}
              <div className="flex items-center justify-between">
                <h3 className={cn("text-md font-bold", dark ? "text-white" : "text-navy")}>{t.name}</h3>
                {current && <Tag tone={dark ? "orange" : "green"}>Current</Tag>}
              </div>
              <div className={cn("mt-2 font-mono text-xl font-bold", dark ? "text-white" : "text-navy")}>{t.price}</div>
              <p className={cn("mt-1 text-xs", dark ? "text-silver" : "text-ink-3")}>{t.blurb}</p>

              <div className={cn("mt-3 space-y-1.5 border-t py-3 text-xs", dark ? "border-white/15 text-silver" : "border-line text-ink-2")}>
                <SlaRow icon={Zap} label="Uptime SLA" value={t.sla} dark={dark} />
                <SlaRow icon={Clock} label="RTO / RPO" value={`${t.rto} / ${t.rpo}`} dark={dark} />
                <SlaRow icon={Shield} label="Support" value={t.support} dark={dark} />
              </div>

              <Button
                variant={current ? "outline" : dark ? "primary" : "navy"}
                className={cn("mt-auto w-full", current && dark && "border-white/30 bg-white/10 text-white hover:bg-white/20")}
                icon={current ? Check : id === "starter" ? Check : id === "enterprise" ? Crown : CreditCard}
                disabled={current}
                onClick={() => choose(id)}
              >
                {current ? "Active plan" : id === "starter" ? "Switch to Free" : id === "enterprise" ? "Contact sales" : "Upgrade"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Comparison matrix */}
      <Card className="mt-6" padded={false}>
        <div className="border-b border-line px-5 py-4"><h3 className="text-md font-bold text-navy">Feature comparison</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-ink-3">Capability</th>
                {TIER_ORDER.map((id) => (
                  <th key={id} className={cn("px-3 py-2.5 text-center text-xs font-bold", tenant.tier === id ? "text-orange" : "text-navy")}>{TIERS[id].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((grp) => (
                <React.Fragment key={grp.group}>
                  <tr className="bg-subtle"><td colSpan={5} className="px-5 py-1.5 text-2xs font-bold uppercase tracking-wide text-ink-3">{grp.group}</td></tr>
                  {grp.rows.map((row) => (
                    <tr key={row.key} className="border-b border-line last:border-0">
                      <td className="px-5 py-2 text-ink-2">{row.label}</td>
                      {TIER_ORDER.map((id) => (
                        <td key={id} className="px-3 py-2 text-center">
                          {hasFeature(id, row.key)
                            ? <Check size={15} className="mx-auto text-green" />
                            : <Minus size={15} className="mx-auto text-line" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Checkout / purchase */}
      <Modal
        open={!!checkout}
        onClose={() => setCheckout(null)}
        title={checkout === "enterprise" ? "Talk to sales" : checkout ? `Upgrade to ${TIERS[checkout].name}` : ""}
        description={checkout === "enterprise" ? "Enterprise is custom-priced for your scale." : "Secure checkout — this is a demo, no real charge is made."}
        size="md"
        footer={
          checkout ? (
            <>
              <Button variant="ghost" onClick={() => setCheckout(null)}>Cancel</Button>
              <Button variant="primary" icon={checkout === "enterprise" ? Crown : Lock} onClick={completePurchase}>
                {checkout === "enterprise" ? "Request & activate" : `Pay ${TIERS[checkout].price} · activate`}
              </Button>
            </>
          ) : undefined
        }
      >
        {checkout && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-line bg-subtle px-4 py-3">
              <div>
                <div className="text-2xs uppercase tracking-wide text-ink-3">Plan</div>
                <div className="text-md font-bold text-navy">{TIERS[checkout].name}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-navy">{TIERS[checkout].price}</div>
                <div className="text-2xs text-ink-3">{TIERS[checkout].features.length} capabilities</div>
              </div>
            </div>

            {checkout === "enterprise" ? (
              <div className="space-y-3">
                <Field label="Work email" required><Input type="email" placeholder="you@company.com" /></Field>
                <Field label="Company size"><Input placeholder="e.g. 500 employees across 12 stores" /></Field>
                <p className="text-2xs text-ink-3">Our team tailors Enterprise pricing to your scale. In this demo, requesting access activates the plan immediately.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Card number" required className="col-span-2"><Input placeholder="4242 4242 4242 4242" /></Field>
                <Field label="Expiry" required><Input placeholder="MM / YY" /></Field>
                <Field label="CVC" required><Input placeholder="123" /></Field>
                <Field label="Name on card" required className="col-span-2"><Input placeholder="Eleanor Vance" /></Field>
                <p className="col-span-2 flex items-center gap-1.5 text-2xs text-ink-3"><Lock size={11} /> Payments are simulated — no card is charged in this demo.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function SlaRow({ icon: Icon, label, value, dark }: { icon: LucideIcon; label: string; value: string; dark: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5"><Icon size={12} className={dark ? "text-orange" : "text-ink-3"} />{label}</span>
      <span className={cn("font-semibold", dark ? "text-white" : "text-navy")}>{value}</span>
    </div>
  );
}
