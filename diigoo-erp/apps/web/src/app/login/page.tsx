"use client";
import * as React from "react";
import { Mail, Lock, User, ChevronRight } from "@/components/icon/lucide";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/platform/accounts";
import { ROLES } from "@/platform/rbac";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function signIn(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    const payload = creds ?? { email, password };
    if (!payload.email || !payload.password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (data?.status === "success") {
        window.location.href = "/"; // root routes to the role-appropriate home
      } else {
        setError(data?.error?.message ?? "Sign in failed");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server. Is it running?");
      setLoading(false);
    }
  }

  function demoSignIn(id: string) {
    const a = DEMO_ACCOUNTS.find((x) => x.id === id);
    if (!a) return;
    setEmail(a.email);
    setPassword(a.password);
    signIn(undefined, { email: a.email, password: a.password });
  }

  return (
    <div className="flex min-h-screen bg-[#eef1f4] font-sans">
      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="relative hidden w-[44%] flex-col justify-center overflow-hidden px-16 lg:flex">
        {/* decorative pills — top-left (orange) */}
        <span className="absolute -top-20 left-10 h-60 w-28 rounded-full bg-orange" />
        <span className="absolute -top-10 left-[9.5rem] h-44 w-14 rounded-full bg-orange/55" />
        {/* decorative pills — bottom (navy) */}
        <span className="absolute -bottom-16 left-[36%] h-64 w-28 rounded-full bg-navy" />
        <span className="absolute -bottom-6 left-[51%] h-44 w-14 rounded-full bg-navy/70" />

        <div className="relative z-10">
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold tracking-tight text-navy">Diigoo</span>
            <span className="text-lg font-bold text-ink-3">ERP</span>
          </div>
          <h1 className="mt-10 text-4xl font-bold leading-tight text-navy">Welcome back</h1>
          <p className="mt-3 max-w-sm text-base text-ink-3">Sign in to your unified retail &amp; commerce workspace.</p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-[0_30px_80px_-20px_rgba(27,42,74,.25)] sm:p-10">
          <h2 className="text-3xl font-bold text-navy">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink-3">Your role determines what you can see.</p>

          <form onSubmit={(e) => signIn(e)} className="mt-7 space-y-3.5">
            <PillField icon={Mail} label="Email Address" htmlFor="email">
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@northwind.demo"
                className="w-full bg-transparent text-sm font-semibold text-navy outline-none placeholder:font-normal placeholder:text-ink-3"
              />
            </PillField>

            <PillField icon={Lock} label="Password" htmlFor="password">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-sm font-semibold text-navy outline-none placeholder:font-normal placeholder:text-ink-3"
              />
            </PillField>

            <label className="flex items-center gap-2 pl-1.5 pt-1 text-xs font-semibold text-navy">
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-orange" />
              Keep me signed in
            </label>

            {error && (
              <div className="rounded-2xl border border-coral/30 bg-coral/5 px-4 py-2.5 text-xs font-medium text-coral">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-full bg-orange py-3 text-sm font-bold uppercase tracking-[1.5px] text-white shadow-[0_12px_24px_-8px_rgba(0,70,128,.6)] transition-colors hover:bg-orange-dark disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* ── Demo accounts ──────────────────────────────────────── */}
          <div className="my-5 flex items-center gap-3 text-2xs font-semibold uppercase tracking-wide text-ink-3">
            <span className="h-px flex-1 bg-line" /> or use a demo account <span className="h-px flex-1 bg-line" />
          </div>

          <PillField icon={User} label="Sign in as a demo role">
            <select
              defaultValue=""
              disabled={loading}
              onChange={(e) => demoSignIn(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-sm font-semibold text-navy outline-none"
            >
              <option value="" disabled>Choose a role…</option>
              {DEMO_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>{ROLES[a.role].label} · {a.blurb}</option>
              ))}
            </select>
          </PillField>
          <p className="mt-2 flex items-center gap-1.5 pl-1.5 text-2xs text-ink-3">
            <ChevronRight size={12} className="text-orange" /> One click to log in — password for all:{" "}
            <code className="rounded bg-line/60 px-1.5 py-0.5 font-mono text-navy">{DEMO_PASSWORD}</code>
          </p>

          <p className="mt-6 text-center text-2xs text-ink-3">Terms of use · Privacy policy</p>
        </div>

        <div className="absolute bottom-4 right-6 text-2xs text-ink-3">
          Powered by <span className="font-bold text-navy">Diigoo</span>
        </div>
      </div>
    </div>
  );
}

/** Pill-shaped input row: rounded icon, inset label, and the field control. */
function PillField({ icon: Icon, label, htmlFor, children }: { icon: typeof Mail; label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-3 rounded-full border border-transparent bg-[#e7eaee] px-4 py-2.5 transition-all focus-within:border-orange focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,70,128,.12)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 text-navy shadow-sm">
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-3">{label}</span>
        {children}
      </span>
    </label>
  );
}
