"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { homePathFor } from "@/platform/home";
import { EmptyState, Button } from "@/components/ui/primitives";

/** Gate every /hrm page on HR module access — a clean message instead of a raw 403. */
export default function HrmLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();

  if (session.status === "authed" && !session.can("read", "hr")) {
    const home = homePathFor(session.principal.primaryRole, session.tenant.enabledModules);
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={ShieldAlert}
          title="Human Resources isn't part of your access"
          description="Your role doesn't include the HR module. Head back to your workspace to continue."
          action={<Button variant="primary" iconRight={ArrowRight} onClick={() => router.replace(home)}>Go to my workspace</Button>}
        />
      </div>
    );
  }
  return <>{children}</>;
}
