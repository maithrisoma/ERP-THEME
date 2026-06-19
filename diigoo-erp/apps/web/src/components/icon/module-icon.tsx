"use client";
import * as React from "react";
import { Icon, addCollection } from "@iconify/react";
import type { LucideIcon } from "@/components/icon/lucide";
import type { ModuleKey } from "@/platform/rbac";
import freehandModules from "./freehand-modules.json";

// Register the bundled Streamline Freehand Color subset once — offline, so the
// icons render synchronously with no API call or load flash.
addCollection(freehandModules as never);

/** Module key → Streamline Freehand Color icon name. Modules without a good
 *  hand-drawn match fall back to their original clean glyph. */
const MODULE_ICON: Partial<Record<ModuleKey, string>> = {
  hr: "business-management-team-up",
  sales_crm: "business-deal-handshake",
  pos: "receipt-cash-register-print",
  inventory: "module-three-boxes",
  purchasing: "shopping-cart-trolley-full",
  finance: "accounting-invoice",
  lottery: "board-game-dice-pawn",
  comms: "send-email-paper-plane-1",
  payments: "credit-card-1",
  ai_analytics: "analytics-graph-bar-horizontal",
  system_admin: "server-2",
  loyalty: "coupon-cut",
  shipping: "archive-box",
  delivery: "mobilephone-action-navigation-map",
  gas_station: "power-supply-battery-charge",
};

export function ModuleIcon({ moduleKey, size = 22, className, fallback: Fallback }: {
  moduleKey: ModuleKey; size?: number; className?: string; fallback: LucideIcon;
}) {
  const name = MODULE_ICON[moduleKey];
  if (!name) return <Fallback size={size} className={className} />;
  return <Icon icon={`streamline-freehand-color:${name}`} width={size} height={size} className={className} />;
}
