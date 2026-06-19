"use client";
import * as React from "react";
import type { LucideIcon } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export function Tabs({ tabs, value, onChange, className }: { tabs: TabDef[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "focus-ring -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "border-orange text-navy" : "border-transparent text-ink-3 hover:text-navy",
            )}
          >
            {Icon && <Icon size={14} strokeWidth={2} />}
            {t.label}
            {typeof t.count === "number" && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-2xs font-bold", active ? "bg-orange/12 text-orange-dark" : "bg-line text-ink-3")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Pill-style segmented control for filters. */
export function SegmentedControl({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-subtle p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "focus-ring rounded px-2.5 py-1 text-xs font-semibold transition-colors",
            value === o.id ? "bg-surface text-navy shadow-sm" : "text-ink-3 hover:text-navy",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
