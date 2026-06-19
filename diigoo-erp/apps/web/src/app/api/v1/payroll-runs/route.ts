import { ok } from "@/lib/http";
import { listPayrollRuns } from "@/modules/hrm/repo";

export const dynamic = "force-dynamic";

/** GET /api/v1/payroll-runs — payroll run history with totals. */
export function GET() {
  const runs = listPayrollRuns().map(({ lines, ...summary }) => summary);
  return ok(runs, { total: runs.length });
}
