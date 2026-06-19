"use client";
import * as React from "react";
import Link from "next/link";
import { Check, Lock, ArrowRight, Sparkles, ChevronRight } from "@/components/icon/lucide";
import { PageHeader, Card, CardHeader, EmptyState, Tag, Button, DetailRow } from "@/components/ui/primitives";
import { Drawer } from "@/components/ui/overlay";
import { useSession } from "@/platform/session";
import { getModule } from "@/modules/registry";
import { MODULE_INFO, type Capability } from "@/modules/catalog";
import { moduleAccess, ACCESS_LABEL, ROLES, type ModuleKey } from "@/platform/rbac";
import { TIERS } from "@/platform/packages";
import { ModuleIcon } from "@/components/icon/module-icon";

/**
 * Overview page shared by every catalog module. Shows the module's capabilities
 * — each clickable for a detail panel — and the signed-in role's access level.
 */
export function ModuleOverview({ moduleKey }: { moduleKey: ModuleKey }) {
  const session = useSession();
  const role = session.principal.primaryRole;
  const mod = getModule(moduleKey);
  const info = MODULE_INFO[moduleKey];
  const access = moduleAccess(role, moduleKey);
  const [sel, setSel] = React.useState<Capability | null>(null);

  if (!mod) return <EmptyState icon={Lock} title="Module not found" description="This module isn't registered." />;
  if (access === "none") {
    return <EmptyState icon={Lock} title="No access" description={`Your role (${ROLES[role].label}) doesn't have access to ${mod.name}.`} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Unified Retail ERP"
        title={mod.name}
        description={info?.description ?? mod.tagline}
        icon={mod.icon}
        actions={<Tag tone="navy">Your access: {ACCESS_LABEL[access]}</Tag>}
      />

      <Card>
        <CardHeader title="Capabilities" description="Open any capability for details" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(info?.features ?? []).map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => setSel(f)}
              className="group flex items-start gap-2.5 rounded-md border border-line bg-subtle px-3 py-2.5 text-left transition-all hover:border-orange/40 hover:bg-orange/[.03]"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange/12 text-orange">
                <Check size={13} strokeWidth={2.5} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-ink-2">{f.name}</span>
              <ChevronRight size={15} className="mt-0.5 shrink-0 text-line transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
            </button>
          ))}
        </div>
      </Card>

      {info?.links && info.links.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Admin tools" description="Jump to related configuration" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {info.links.map((l) => (
              <Link key={l.href} href={l.href} className="group flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-sm font-medium text-ink-2 transition-all hover:border-orange/40 hover:bg-orange/[.03]">
                {l.label}
                <ArrowRight size={14} className="text-line transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy/[.06] text-navy"><Sparkles size={18} /></span>
            <div>
              <h3 className="text-md font-bold text-navy">Part of your Diigoo ERP</h3>
              <p className="mt-0.5 max-w-2xl text-sm text-ink-3">
                {mod.name} is provisioned on your plan. Detailed screens are rolling out — your role has <strong className="text-ink-2">{ACCESS_LABEL[access]}</strong> access today.
              </p>
            </div>
          </div>
          <Link href="/packages"><Button variant="outline">View plan</Button></Link>
        </div>
      </Card>

      {/* Capability detail */}
      <Drawer open={!!sel} onClose={() => setSel(null)} title={mod.name} width={440}>
        {sel && (
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/[.06]"><ModuleIcon moduleKey={mod.key} size={32} fallback={mod.icon} /></span>
              <div className="min-w-0">
                <h3 className="text-md font-bold text-navy">{sel.name}</h3>
                <div className="mt-1"><Tag tone="amber">Preview</Tag></div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">{sel.detail}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <DetailRow label="Module" value={mod.name} />
              <DetailRow label="Your access" value={ACCESS_LABEL[access]} />
              <DetailRow label="Status" value="Preview workspace" />
            </dl>
            <p className="mt-4 rounded-md border border-line bg-subtle p-3 text-xs text-ink-3">
              Included on your <strong className="text-ink-2">{TIERS[session.tenant.tier].name}</strong> plan. The full {sel.name} screen is rolling out.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}
