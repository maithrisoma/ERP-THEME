import { ok } from "@/lib/http";
import { coreEnabled, proxyCore } from "@/lib/coreClient";
import { db } from "@/modules/hrm/repo";

export const dynamic = "force-dynamic";

/** GET /api/v1/leave-balances — leave balances, role-scoped (core mode). */
export function GET() {
  if (coreEnabled()) return proxyCore("/api/v1/leave-balances");
  return ok(db.leaveBalances);
}
