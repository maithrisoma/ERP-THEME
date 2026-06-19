"use client";
import * as React from "react";
import { type LucideIcon } from "@/components/icon/lucide";
import { PageHeader, Card, Tag, SectionLabel } from "@/components/ui/primitives";

export function ModuleScaffold({
  icon: Icon,
  eyebrow,
  title,
  description,
  points,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-subtle px-6 py-12 text-center">
          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-navy/[.06] text-navy">
            <Icon size={30} strokeWidth={1.7} />
          </span>
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <p className="mt-1.5 max-w-md text-sm text-ink-3">{description}</p>

          {points.length > 0 && (
            <div className="mt-6 w-full max-w-lg">
              <SectionLabel>What this module will include</SectionLabel>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {points.map((p) => (
                  <Tag key={p} tone="navy">{p}</Tag>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 max-w-md text-2xs text-ink-3">
            This module shares the same shell, RBAC, packaging and API framework as HRM.
          </p>
        </div>
      </Card>
    </>
  );
}
