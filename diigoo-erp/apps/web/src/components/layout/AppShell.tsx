"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const status = useSession((s) => s.status);
  const setSession = useSession((s) => s.setSession);
  const clear = useSession((s) => s.clear);
  const router = useRouter();

  // Resolve the real session from the cookie; redirect to /login if not signed in.
  React.useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!active) return;
        if (res.ok && body?.status === "success") setSession(body.data);
        else {
          clear();
          router.replace("/login");
        }
      })
      .catch(() => {
        if (active) {
          clear();
          router.replace("/login");
        }
      });
    return () => {
      active = false;
    };
  }, [setSession, clear, router]);

  if (status !== "authed") {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Loader2 size={16} className="animate-spin text-orange" /> Loading your workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar onMenu={() => setMobileOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <div className="hidden lg:flex">
          <Sidebar />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-[150] flex lg:hidden">
            <div className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
            <div className="animate-slide-in relative z-10 h-full">
              <button onClick={() => setMobileOpen(false)} className="absolute -right-10 top-3 rounded-md bg-white/10 p-1.5 text-white" aria-label="Close menu">
                <X size={18} />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto bg-canvas">
          <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
