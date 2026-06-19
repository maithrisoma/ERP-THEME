"use client";
import * as React from "react";
import type { LucideIcon } from "@/components/icon/lucide";
import { toneHex, toneColor, lighten, type Tone } from "./primitives";
import { useTheme } from "@/platform/theme";

const pale = (tone: Tone, amt = 0.45) => lighten(toneHex(tone), amt);

/** Donut chart — pure SVG, no dependency. Click a segment (or its legend row)
 *  to select it: the slice pops, the others dim, and the center + legend show
 *  that segment's value and share. Click again to clear. */
export function Donut({ segments, size = 132, thickness = 16, centerLabel, centerValue }: {
  segments: { value: number; tone: Tone; label: string }[];
  size?: number; thickness?: number; centerLabel?: string; centerValue?: React.ReactNode;
}) {
  const dark = useTheme((s) => s.theme === "dark");
  const [active, setActive] = React.useState<number | null>(null);
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2 - 2; // 2px headroom so the active slice's +3 stroke never clips
  const c = 2 * Math.PI * r;
  let offset = 0;
  const sel = active !== null ? segments[active] : null;
  const pct = sel ? Math.round((sel.value / total) * 100) : null;
  const toggle = (i: number) => setActive((a) => (a === i ? null : i));
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const on = active === i;
          const dim = active !== null && !on;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={on ? toneColor(s.tone, dark) : pale(s.tone, dark ? 0.1 : 0.4)}
              strokeWidth={on ? thickness + 3 : thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="butt"
              opacity={dim ? 0.45 : 1} onClick={() => toggle(i)}
              className="cursor-pointer transition-all duration-200" role="button" aria-label={`${s.label}: ${s.value}`} />
          );
          offset += len;
          return el;
        })}
        {(sel || centerValue || centerLabel) && (
          <g className="rotate-90" style={{ transformOrigin: "center" }}>
            <text x="50%" y="47%" textAnchor="middle" className="fill-navy font-mono text-lg font-bold">{sel ? sel.value : centerValue}</text>
            <text x="50%" y="60%" textAnchor="middle" className="fill-ink-3 text-[9px]">{sel ? `${pct}% · ${sel.label}` : centerLabel}</text>
          </g>
        )}
      </svg>
      <ul className="space-y-1">
        {segments.map((s, i) => {
          const on = active === i;
          return (
            <li key={i}>
              <button type="button" onClick={() => toggle(i)}
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-subtle ${on ? "bg-subtle" : ""} ${active !== null && !on ? "opacity-50" : ""}`}>
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: toneColor(s.tone, dark) }} />
                <span className={`font-medium ${on ? "text-navy" : "text-ink-2"}`}>{s.label}</span>
                <span className="ml-auto font-mono font-semibold text-navy">{s.value}</span>
                <span className="w-9 text-right font-mono text-2xs text-ink-3">{Math.round((s.value / total) * 100)}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Harmonized categorical chart palette — muted, on-brand hues so every bar is a
 *  distinct colour without clashing. navy + orange lead; teal/steel/plum/slate
 *  fill. Resolves through toneColor, so bars, the donut and KPIs share one set. */
const CHART_TONES: Tone[] = ["navy", "orange", "teal", "blue", "purple", "gray", "amber", "coral"];

/** Vertical bar chart — multi-colour by default. Pass `colors` to override, or
 *  a single `tone` to force monochrome. Click a bar to pin a tooltip showing its
 *  label, value and share of total; click again (or another bar) to move it. */
export function BarChart({ data, height = 140, tone, colors, valueFmt }: {
  data: { label: string; value: number }[]; height?: number; tone?: Tone; colors?: Tone[]; valueFmt?: (v: number) => string;
}) {
  const dark = useTheme((s) => s.theme === "dark");
  const [active, setActive] = React.useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const fmt = (v: number) => (valueFmt ? valueFmt(v) : `${v}`);
  const barColor = (i: number) =>
    toneColor(colors ? colors[i % colors.length] : tone ? tone : CHART_TONES[i % CHART_TONES.length], dark);
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {data.map((d, i) => {
        const c = barColor(i);
        const on = active === i;
        const dim = active !== null && !on;
        return (
          <button
            key={i}
            type="button"
            onClick={() => setActive(on ? null : i)}
            aria-label={`${d.label}: ${fmt(d.value)}`}
            className="group relative flex flex-1 cursor-pointer flex-col items-center justify-end gap-1.5 focus:outline-none"
          >
            <span className="relative text-2xs font-bold transition-opacity" style={{ color: c, opacity: dim ? 0.45 : 1 }}>
              {fmt(d.value)}
              {on && (
                <span className="absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-center shadow-pop">
                  <span className="block text-2xs font-semibold text-navy">{d.label}</span>
                  <span className="mt-0.5 block font-mono text-sm font-bold" style={{ color: c }}>{fmt(d.value)}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-ink-3">{Math.round((d.value / total) * 100)}% of total</span>
                  <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-surface" />
                </span>
              )}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-200 group-hover:brightness-[.97]"
              style={{
                height: `${(d.value / max) * (height - 36)}px`,
                background: on
                  ? `linear-gradient(180deg, ${c}, ${c}cc)`
                  : dark
                    ? `linear-gradient(180deg, ${c}dd, ${c}99)`
                    : `linear-gradient(180deg, ${lighten(c, 0.3)}, ${lighten(c, 0.58)})`,
                boxShadow: on ? `0 0 0 2px rgb(var(--surface)), 0 0 0 3px ${c}` : `inset 0 0 0 1px ${c}33`,
                opacity: dim ? 0.5 : 1,
              }}
            />
            <span className="block w-full truncate text-2xs text-ink-3 transition-opacity" style={{ opacity: dim ? 0.45 : 1 }} title={d.label}>{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Sparkline with a gradient area fill + end dot. */
export function Sparkline({ data, width = 120, height = 36, tone = "teal" }: { data: number[]; width?: number; height?: number; tone?: Tone }) {
  const dark = useTheme((s) => s.theme === "dark");
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - ((v - min) / span) * (height - 4) - 2] as [number, number]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const color = toneColor(tone, dark);
  const gid = `sparkgrad-${tone}-${dark ? "d" : "l"}`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={color} />
    </svg>
  );
}

/** Premium KPI card — tone accent bar, tinted icon chip, prominent mono value,
 *  optional up/down delta and a trend sparkline. Shared across all dashboards so
 *  every role's overview reads the same. */
export function KpiCard({ label, value, delta, up, hint, icon: Icon, tone = "navy", spark, plain }: {
  label: string; value: React.ReactNode; delta?: string; up?: boolean; hint?: string; icon?: LucideIcon; tone?: Tone; spark?: number[]; plain?: boolean;
}) {
  const dark = useTheme((s) => s.theme === "dark");
  const c = toneColor(tone, dark);
  return (
    <div className="group relative overflow-hidden rounded-lg border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      {!plain && <span className="absolute inset-x-0 top-0 h-1" style={{ background: c }} />}
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</div>
        {Icon && (
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${plain ? "bg-navy/[.06] text-navy" : ""}`}
            style={plain ? undefined : { background: `${c}1f`, color: c }}
          >
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-3 font-mono text-3xl font-bold leading-none text-navy">{value}</div>
      <div className="mt-2.5 flex items-end justify-between">
        <div className="flex items-center gap-1.5 text-2xs">
          {delta && <span className={up ? "font-semibold text-green" : "font-semibold text-coral"}>{up ? "▲" : "▼"} {delta}</span>}
          {hint && <span className="text-ink-3">{hint}</span>}
        </div>
        {spark && <Sparkline data={spark} width={68} height={24} tone={plain ? "gray" : tone} />}
      </div>
    </div>
  );
}

/** Multi-series area/line trend chart — gradient fills, grid, y-ticks, x-labels
 *  and an interactive hover crosshair + tooltip. Width is measured so lines stay
 *  crisp (no SVG scaling distortion). The marquee visual for dashboards. */
export function AreaChart({ series, labels, height = 200, valueFmt, yTicks = 4 }: {
  series: { name: string; tone: Tone; data: number[] }[];
  labels: string[]; height?: number; valueFmt?: (v: number) => string; yTicks?: number;
}) {
  const dark = useTheme((s) => s.theme === "dark");
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(640);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    setW(el.clientWidth || 640);
    return () => ro.disconnect();
  }, []);
  const [hover, setHover] = React.useState<number | null>(null);
  const fmt = (v: number) => (valueFmt ? valueFmt(v) : `${Math.round(v)}`);
  const padL = 6, padR = 6, padT = 12, padB = 24;
  const innerW = Math.max(1, w - padL - padR);
  const innerH = Math.max(1, height - padT - padB);
  const all = series.flatMap((s) => s.data);
  const rawMax = Math.max(...all, 1);
  const rawMin = Math.min(...all, 0);
  const max = rawMax + (rawMax - rawMin) * 0.12;
  const min = rawMin;
  const span = max - min || 1;
  const n = labels.length;
  const X = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const Y = (v: number) => padT + innerH - ((v - min) / span) * innerH;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (span * i) / yTicks);
  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{ height }}
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const el = wrapRef.current; if (!el) return;
        const px = e.clientX - el.getBoundingClientRect().left - padL;
        const idx = Math.round((px / innerW) * (n - 1));
        setHover(Math.max(0, Math.min(n - 1, idx)));
      }}
    >
      <svg width={w} height={height} className="overflow-visible">
        <defs>
          {series.map((s) => {
            const col = toneColor(s.tone, dark);
            return (
              <linearGradient key={s.name} id={`area-${s.name}-${dark ? "d" : "l"}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity="0.34" />
                <stop offset="100%" stopColor={col} stopOpacity="0.02" />
              </linearGradient>
            );
          })}
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={Y(t)} x2={w - padR} y2={Y(t)} stroke="rgb(var(--line))" strokeWidth={1} strokeDasharray="3 3" opacity={0.55} />
            <text x={padL} y={Y(t) - 3} className="fill-ink-3 text-[9px]">{fmt(t)}</text>
          </g>
        ))}
        {series.map((s) => {
          const col = toneColor(s.tone, dark);
          const pts = s.data.map((v, i) => [X(i), Y(v)] as [number, number]);
          const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
          const area = `${line} L${X(n - 1).toFixed(1)},${padT + innerH} L${X(0).toFixed(1)},${padT + innerH} Z`;
          return (
            <g key={s.name}>
              <path d={area} fill={`url(#area-${s.name}-${dark ? "d" : "l"})`} />
              <path d={line} fill="none" stroke={col} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {hover !== null && (
          <>
            <line x1={X(hover)} y1={padT} x2={X(hover)} y2={padT + innerH} stroke="rgb(var(--ink-3))" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
            {series.map((s) => <circle key={s.name} cx={X(hover)} cy={Y(s.data[hover])} r={3.5} fill={toneColor(s.tone, dark)} stroke="rgb(var(--surface))" strokeWidth={2} />)}
          </>
        )}
        {labels.map((l, i) => ((n <= 12 || i % 2 === 0) ? <text key={i} x={X(i)} y={height - 6} textAnchor="middle" className="fill-ink-3 text-[9px]">{l}</text> : null))}
      </svg>
      {series.length > 1 && (
        <div className="absolute right-1 top-0 flex gap-2.5">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1 text-2xs text-ink-3">
              <span className="h-2 w-2 rounded-sm" style={{ background: toneColor(s.tone, dark) }} />{s.name}
            </span>
          ))}
        </div>
      )}
      {hover !== null && (
        <div className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 shadow-pop"
          style={{ left: Math.min(Math.max(X(hover), 64), w - 64), top: 18 }}>
          <div className="text-2xs font-semibold text-navy">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} className="mt-0.5 flex items-center gap-1.5 text-2xs">
              <span className="h-2 w-2 rounded-sm" style={{ background: toneColor(s.tone, dark) }} />
              <span className="text-ink-3">{s.name}</span>
              <span className="ml-auto pl-3 font-mono font-semibold text-navy">{fmt(s.data[hover])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Circular progress ring with a centered percent. */
export function RingProgress({ value, size = 64, thickness = 7, tone = "green" }: { value: number; size?: number; thickness?: number; tone?: Tone }) {
  const dark = useTheme((s) => s.theme === "dark");
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const len = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={thickness} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? toneColor(tone, dark) : pale(tone, 0.2)} strokeWidth={thickness}
        strokeDasharray={`${len} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" className="fill-navy font-mono text-xs font-bold">{Math.round(value)}%</text>
    </svg>
  );
}
