"use client";
import * as React from "react";
import type { LucideIcon } from "@/components/icon/lucide";
import { cn } from "@/lib/cn";
import { useTheme } from "@/platform/theme";

// ─── Tone system (maps to the ported chip-* classes) ─────────────────────────
export type Tone = "navy" | "teal" | "blue" | "purple" | "green" | "amber" | "coral" | "gray" | "orange";

const TONE_CHIP: Record<Tone, string> = {
  navy: "chip-navy", teal: "chip-teal", blue: "chip-blue", purple: "chip-purple",
  green: "chip-green", amber: "chip-amber", coral: "chip-coral", gray: "chip-gray", orange: "chip-orange",
};

const TONE_SOLID: Record<Tone, string> = {
  navy: "bg-navy", teal: "bg-teal", blue: "bg-blue", purple: "bg-purple",
  green: "bg-green", amber: "bg-amber", coral: "bg-coral", gray: "bg-ink-3", orange: "bg-orange",
};

// Visualization hues (used by charts/sparklines/accents — NOT chips/tags, which
// use the chip-* CSS classes). navy + orange lead; teal/steel/plum/slate are
// muted so multi-series charts stay distinct yet harmonized, never neon.
const TONE_HEX: Record<Tone, string> = {
  navy: "#334155", teal: "#2E7D74", blue: "#3B6CA8", purple: "#6E5A99",
  green: "#16A34A", amber: "#D97706", coral: "#DC2626", gray: "#64748B", orange: "#004680",
};
export const toneHex = (t: Tone) => TONE_HEX[t] ?? TONE_HEX.navy;

/** Mix a hex colour toward white by `amt` (0..1). */
export function lighten(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (v: number) => Math.round(v + (255 - v) * amt);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Theme-aware tone for foreground (text/icon/bar) use. In dark mode the very
 * dark navy is swapped for a light slate, and the other hues are brightened a
 * touch so they read on dark surfaces. Returns a plain hex (safe for opacity
 * suffixes and lighten()).
 */
export function toneColor(t: Tone, dark: boolean): string {
  const hex = TONE_HEX[t] ?? TONE_HEX.navy;
  if (!dark) return hex;
  return t === "navy" ? "#9FB3D9" : lighten(hex, 0.16);
}

/** Hook form — reads the current theme so callers don't each wire it up. */
export function useToneColor() {
  const dark = useTheme((s) => s.theme === "dark");
  return React.useCallback((t: Tone) => toneColor(t, dark), [dark]);
}

// ─── Tag / chip ───────────────────────────────────────────────────────────────
export function Tag({ tone = "gray", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("chip", TONE_CHIP[tone], className)}>{children}</span>;
}

export function StatusDot({ tone = "gray", pulse }: { tone?: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", TONE_SOLID[tone])} />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", TONE_SOLID[tone])} />
    </span>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_BG: Record<Tone, string> = {
  navy: "bg-navy/10 text-navy", teal: "bg-teal/12 text-teal", blue: "bg-blue/10 text-blue",
  purple: "bg-purple/12 text-purple", green: "bg-green/12 text-green", amber: "bg-amber/12 text-amber",
  coral: "bg-coral/12 text-coral", gray: "bg-ink-3/12 text-ink-2", orange: "bg-orange/12 text-orange-dark",
};

export function Avatar({ name, tone = "navy", size = 32, square }: { name: string; tone?: Tone; size?: number; square?: boolean }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center font-semibold leading-none", AVATAR_BG[tone], square ? "rounded-md" : "rounded-full")}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "navy" | "outline" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md";

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-orange text-white hover:opacity-90 border border-transparent",
  navy: "bg-navy text-white hover:bg-navy-800 border border-transparent",
  outline: "bg-surface text-ink-2 border border-line hover:bg-subtle hover:border-ink-3/40",
  ghost: "bg-transparent text-ink-2 hover:bg-black/5 border border-transparent",
  danger: "bg-coral text-white hover:opacity-90 border border-transparent",
  subtle: "bg-navy/[.06] text-navy hover:bg-navy/10 border border-transparent",
};
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "outline", size = "md", icon: Icon, iconRight: IconRight, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        BTN_VARIANT[variant], BTN_SIZE[size], className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 13 : 15} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={size === "sm" ? 13 : 15} strokeWidth={2.2} />}
    </button>
  ),
);
Button.displayName = "Button";

export function IconButton({ icon: Icon, className, label, ...props }: { icon: LucideIcon; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button aria-label={label} title={label} className={cn("focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-black/5 hover:text-navy", className)} {...props}>
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
export function Card({ className, children, padded = true }: { className?: string; children: React.ReactNode; padded?: boolean }) {
  return <div className={cn("rounded-lg border border-line bg-surface shadow-card", padded && "p-5", className)}>{children}</div>;
}

export function CardHeader({ title, description, action, icon: Icon }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-navy/[.06] text-navy">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
        <div>
          <h3 className="text-md font-bold text-navy">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, delta, deltaTone = "green", icon: Icon, tone = "navy", hint }: {
  label: string; value: React.ReactNode; delta?: string; deltaTone?: Tone; icon?: LucideIcon; tone?: Tone; hint?: string;
}) {
  const dark = useTheme((s) => s.theme === "dark");
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</span>
        {Icon && (
          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md", AVATAR_BG[tone])}>
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-2 font-mono text-2xl font-bold" style={{ color: toneColor(tone, dark) }}>{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {delta && <span className={cn("text-xs font-semibold", deltaTone === "coral" ? "text-coral" : deltaTone === "amber" ? "text-amber" : "text-green")}>{delta}</span>}
        {hint && <span className="text-xs text-ink-3">{hint}</span>}
      </div>
    </div>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export function ProgressBar({ value, tone = "navy", className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}>
      <div className={cn("h-full rounded-full transition-all", TONE_SOLID[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ─── Page header — doc-style navy band with orange accent (echoes .sec-header) ─
export function PageHeader({ title, description, actions, eyebrow, icon: Icon }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      {/* soft accent glow, like the document cover */}
      <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,70,128,.07),transparent_70%)]" />
      <div className="relative flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon ? (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange text-white">
              <Icon size={20} strokeWidth={2} />
            </span>
          ) : (
            <span className="mt-1 h-9 w-1.5 shrink-0 rounded-full bg-orange" />
          )}
          <div>
            {eyebrow && <div className="mb-1 text-2xs font-bold uppercase tracking-[2px] text-orange">{eyebrow}</div>}
            <h1 className="text-xl font-bold leading-tight text-navy">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-ink-3">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// ─── Empty / locked states ──────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-subtle px-6 py-12 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-navy/[.06] text-navy">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <h3 className="text-md font-bold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Detail row (label/value line for detail drawers) ───────────────────────
export function DetailRow({ icon: Icon, label, value }: { icon?: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
      <dt className="flex items-center gap-1.5 text-xs text-ink-3">{Icon && <Icon size={13} />}{label}</dt>
      <dd className="text-right font-medium text-ink-2">{value}</dd>
    </div>
  );
}

// ─── Section label (echoes .arch-label from the doc) ─────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[1.5px] text-orange">
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
