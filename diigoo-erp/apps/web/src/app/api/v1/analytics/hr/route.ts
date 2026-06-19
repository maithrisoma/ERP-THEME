import { ok } from "@/lib/http";
import { coreEnabled, proxyCore } from "@/lib/coreClient";
import { hrAnalytics } from "@/modules/hrm/repo";

export const dynamic = "force-dynamic";

/** GET /api/v1/analytics/hr — headline HR metrics for the dashboard. */
export function GET() {
  if (coreEnabled()) return proxyCore("/api/v1/analytics/hr");
  return ok(hrAnalytics());
}
