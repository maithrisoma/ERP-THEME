"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icon/lucide";
import { homePathFor } from "@/platform/home";
import { DEMO_TENANT } from "@/data/tenant";

/** Root: send each user to the landing page appropriate for their role. */
export default function Home() {
  const router = useRouter();
  React.useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!active) return;
        if (!r.ok) return router.replace("/login");
        const b = await r.json().catch(() => null);
        if (b?.status === "success") {
          router.replace(homePathFor(b.data.user.role, DEMO_TENANT.enabledModules));
        } else {
          router.replace("/login");
        }
      })
      .catch(() => active && router.replace("/login"));
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <div className="flex items-center gap-2 text-sm text-ink-3">
        <Loader2 size={16} className="animate-spin text-orange" /> Loading your workspace…
      </div>
    </div>
  );
}
