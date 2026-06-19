"use client";
import * as React from "react";
import { Lock, ShieldAlert, Sparkles } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { type FeatureKey, requiredTier, TIERS } from "@/platform/packages";
import { type Action, type ModuleKey } from "@/platform/rbac";
import { Button } from "./primitives";

/** Renders children only when the tenant's package unlocks `feature`. */
export function FeatureGate({ feature, children, soft }: { feature: FeatureKey; children: React.ReactNode; soft?: boolean }) {
  const has = useSession((s) => s.feature(feature));
  if (has) return <>{children}</>;
  if (soft) return null;
  const tier = requiredTier(feature);
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-orange/40 bg-[#fff8f4] px-6 py-12 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange/12 text-orange-dark">
        <Sparkles size={22} />
      </span>
      <h3 className="text-md font-bold text-navy">Available on the {TIERS[tier].name} plan</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-3">This capability is part of a higher package tier. Upgrade to unlock it for your organization.</p>
      <Button variant="primary" icon={Lock} className="mt-4" onClick={() => (window.location.href = "/packages")}>
        View plans
      </Button>
    </div>
  );
}

/** Inline lock chip for individual controls. */
export function FeatureLock({ feature }: { feature: FeatureKey }) {
  const tier = requiredTier(feature);
  return (
    <span className="inline-flex items-center gap-1 rounded bg-orange/10 px-1.5 py-0.5 text-2xs font-semibold text-orange-dark">
      <Lock size={10} /> {TIERS[tier].name}
    </span>
  );
}

/** Renders children only when the role can perform `action` on `module`. */
export function RoleGate({ module, action = "read", children, fallback }: { module: ModuleKey; action?: Action; children: React.ReactNode; fallback?: React.ReactNode }) {
  const allowed = useSession((s) => s.can(action, module));
  if (allowed) return <>{children}</>;
  return (
    <>
      {fallback ?? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-subtle px-6 py-12 text-center">
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
            <ShieldAlert size={22} />
          </span>
          <h3 className="text-md font-bold text-navy">Access restricted</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-3">Your role doesn&apos;t have permission to view this. Switch roles from the top bar to explore the RBAC model.</p>
        </div>
      )}
    </>
  );
}
