"use client";
import * as React from "react";
import { Sparkles, Palette, FileText } from "@/components/icon/lucide";
import { Card, Button, Tag, useToneColor, type Tone } from "@/components/ui/primitives";

const TABS = [
  {
    id: "vision", label: "Design Vision",
    body: "Our design philosophy strikes a deliberate balance: 30% Windows XP inspiration creates direct familiarity, tactile feedback, and crisp grid definitions, while 70% modern SaaS styling ensures visual clarity, fluid typography, and premium micro-interactions.",
    tags: ["Accents", "Double-Borders", "Soft-Gradients", "Nunito-Sans"],
  },
  {
    id: "tech", label: "Technology",
    body: "Built on Next.js 14 with the App Router, React 18, TypeScript and Tailwind CSS. State runs on Zustand, the charts are hand-rolled SVG with zero dependencies, and everything renders server-first for instant loads.",
    tags: ["Next.js 14", "React 18", "TypeScript", "Tailwind", "Zustand"],
  },
  {
    id: "project", label: "The Project",
    body: "Diigoo is a unified retail ERP — POS, inventory, finance, CRM, HR and analytics in one workspace — themed to feel both nostalgic and cutting-edge across every module.",
    tags: ["Unified ERP", "16 Modules", "Multi-tenant", "RBAC"],
  },
];

const ACCENTS: { name: string; badge: string; tone: Tone; desc: string }[] = [
  { name: "Brand Accent", badge: "Primary", tone: "navy", desc: "The brand accent leads every primary action, active state and highlight across the workspace." },
  { name: "Success Accent", badge: "Positive", tone: "teal", desc: "A calm teal signals success, confirmation and positive system status throughout the UI." },
  { name: "Neutral & Surface", badge: "Base", tone: "gray", desc: "Off-white panels, soft borders and muted ink keep every screen calm and readable." },
];

const TYPO = [
  { font: "Nunito Sans", role: "Display Headings" },
  { font: "Inter", role: "Body & Paragraphs" },
  { font: "Tahoma", role: "Small Labels & Badges" },
];

export default function AboutPage() {
  const tc = useToneColor();
  const [tab, setTab] = React.useState("vision");
  const [count, setCount] = React.useState(0);
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-navy">About Diigoo Fusion</h1>
        <p className="mt-1 text-sm text-ink-3">Blending 30% nostalgia of Windows XP with 70% premium, modern 2026 SaaS design principles.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Window + button test */}
        <div className="space-y-4 lg:col-span-2">
          <Card padded={false} className="overflow-hidden">
            {/* title bar */}
            <div className="flex items-center gap-2 bg-navy px-3 py-2 text-white">
              <Sparkles size={14} />
              <span className="font-mono text-xs">C:\Diigoo\System32\about_fusion.exe</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </span>
            </div>
            {/* menu */}
            <div className="flex gap-4 border-b border-line px-4 py-1.5 text-xs text-ink-2">
              {["File", "Edit", "View", "Help"].map((m) => <span key={m} className="cursor-default hover:text-navy">{m}</span>)}
            </div>
            {/* content */}
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange/[.12] text-orange shadow-sm"><Sparkles size={24} /></span>
                <div>
                  <h2 className="text-md font-bold text-navy">Diigoo OS v2026.1</h2>
                  <p className="text-xs text-ink-3">A Retro-Modern Fusion Workspace</p>
                </div>
              </div>

              <div className="mt-4 flex gap-1 border-b border-line">
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${tab === t.id ? "border-orange text-navy" : "border-transparent text-ink-3 hover:text-navy"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-line bg-subtle/40 p-4">
                <p className="text-sm leading-relaxed text-ink-2">{active.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {active.tags.map((t) => <Tag key={t} tone="navy">{t}</Tag>)}
                </div>
              </div>
            </div>
            {/* status bar */}
            <div className="flex items-center justify-between border-t border-line bg-subtle px-4 py-1.5 text-2xs font-medium text-ink-3">
              <span className="text-green">● Status: Connected</span>
              <span className="font-mono">System: 64-Bit</span>
            </div>
          </Card>

          <Card>
            <h3 className="text-md font-bold text-navy">Tactile Buttons Test</h3>
            <p className="mt-0.5 text-sm text-ink-3">Test the button gradient and micro-elevation transitions on hover and active click states.</p>
            <div className="mt-3 flex items-center gap-3">
              <Button variant="primary" onClick={() => setCount((c) => c + 1)}>Click Me ({count})</Button>
              <Button variant="navy" onClick={() => setCount(0)}>Reset Counter</Button>
              <span className="text-xs text-ink-3">Pressed: {count} times</span>
            </div>
          </Card>
        </div>

        {/* Accent matrix + typography */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Palette size={16} className="text-orange" />
              <h3 className="text-md font-bold text-navy">Design Accent Matrix</h3>
            </div>
            <div className="space-y-3.5">
              {ACCENTS.map((a) => (
                <div key={a.name}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: tc(a.tone) }}>{a.name}</span>
                    <Tag tone={a.tone}>{a.badge}</Tag>
                  </div>
                  <p className="mt-1 text-xs text-ink-3">{a.desc}</p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: "100%", background: tc(a.tone) }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={16} className="text-orange" />
              <h3 className="text-md font-bold text-navy">Typography Tokens</h3>
            </div>
            <ul className="divide-y divide-line">
              {TYPO.map((t) => (
                <li key={t.font} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-bold text-navy">{t.font}</span>
                  <span className="text-xs text-ink-3">{t.role}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
