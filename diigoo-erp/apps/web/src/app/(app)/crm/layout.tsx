"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight } from "@/components/icon/lucide";
import { useSession } from "@/platform/session";
import { homePathFor } from "@/platform/home";
import { EmptyState, Button } from "@/components/ui/primitives";

/** Gate /crm pages on Sales & CRM access. */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  if (session.status === "authed" && !session.can("read", "sales_crm")) {
    const home = homePathFor(session.principal.primaryRole, session.tenant.enabledModules);
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={ShieldAlert}
          title="Sales & CRM isn't part of your access"
          description="Your role doesn't include the CRM module. Head back to your workspace."
          action={<Button variant="primary" iconRight={ArrowRight} onClick={() => router.replace(home)}>Go to my workspace</Button>}
        />
      </div>
    );
  }
  return <>{children}</>;
}
