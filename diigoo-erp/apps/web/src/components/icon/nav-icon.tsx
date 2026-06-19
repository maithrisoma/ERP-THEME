"use client";
import * as React from "react";
import { Icon, addCollection } from "@iconify/react";
import type { LucideIcon } from "@/components/icon/lucide";
import navData from "./freehand-nav.json";

// Monochrome Streamline Freehand subset for the sidebar nav rows. Mono (not the
// color set) because these sit on the dark navy sidebar and must inherit the
// current text color — silver normally, white when the row is active.
addCollection(navData as never);

/** Sidebar nav-item id → Streamline Freehand (mono) icon name. Unmapped ids
 *  fall back to their original clean glyph. */
const NAV_ICON: Record<string, string> = {
  dashboard: "dashboard-layout", "crm-dashboard": "dashboard-layout",
  leads: "face-id-user", contacts: "phone-book", accounts: "office-building-outdoors",
  pipeline: "filter", quotes: "accounting-invoice", activities: "task-list-clipboard-clock",
  tasks: "task-list-pen", meetings: "meeting-co-working-2", calls: "phone-ring",
  products: "archive-box", campaigns: "share-megaphone", cases: "help-headphones-customer-support",
  employees: "programming-team-chat", org: "hierarchy", attendance: "form-edition-clipboard-check",
  timesheets: "time-stopwatch", scheduling: "calendar-date", payroll: "money-wallet",
  leave: "locker-room-suitcase-umbrella", benefits: "donation-charity-donate-heart-flower",
  performance: "iris-scan-target", recruitment: "job-choose-candidate", onboarding: "product-launch-laptop",
  documents: "office-file-text", compliance: "apps-laptop-shield", reports: "analytics-graph-pie",
  settings: "settings-cog", config: "settings-cog", overview: "grid-ruler", schedule: "calendar-date",
  integrations: "power-supply-plug", packages: "mask-diamond", access: "lock-key-1",
};

export function NavIcon({ navId, size = 16, className, fallback: Fallback }: {
  navId?: string; size?: number; className?: string; fallback: LucideIcon;
}) {
  const name = navId ? NAV_ICON[navId] : undefined;
  if (!name) return <Fallback size={size} strokeWidth={2} className={className} />;
  return <Icon icon={`streamline-freehand:${name}`} width={size} height={size} className={className} />;
}
