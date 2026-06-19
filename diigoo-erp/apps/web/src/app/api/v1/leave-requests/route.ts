import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { coreEnabled, proxyCore } from "@/lib/coreClient";
import { listLeave } from "@/modules/hrm/repo";
import type { LeaveRequest } from "@/modules/hrm/types";

export const dynamic = "force-dynamic";

/** GET /api/v1/leave-requests?status= */
export function GET(req: NextRequest) {
  if (coreEnabled()) return proxyCore(`/api/v1/leave-requests?${req.nextUrl.searchParams.toString()}`);
  const status = req.nextUrl.searchParams.get("status") as LeaveRequest["status"] | null;
  const rows = listLeave(status ?? undefined);
  return ok(rows, { total: rows.length });
}

/** POST /api/v1/leave-requests — submit a request (persists via the core). */
export async function POST(req: NextRequest) {
  if (coreEnabled()) {
    const bodyText = await req.text();
    return proxyCore("/api/v1/leave-requests", { method: "POST", body: bodyText });
  }
  let body: Partial<LeaveRequest>;
  try {
    body = await req.json();
  } catch {
    return fail("VALIDATION_ERROR", "Invalid JSON body", 422);
  }
  if (!body.startDate || !body.endDate) {
    return fail("VALIDATION_ERROR", "startDate and endDate are required", 422);
  }
  const created: LeaveRequest = {
    id: "lr_" + Math.random().toString(36).slice(2, 8),
    employeeId: body.employeeId ?? "e_1021",
    policyId: body.policyId ?? "lp_pto",
    policyName: body.policyName ?? "Paid Time Off",
    startDate: body.startDate,
    endDate: body.endDate,
    days: body.days ?? 1,
    reason: body.reason,
    status: "pending",
    requestedAt: new Date().toISOString(),
    approvalStep: 1,
  };
  // In mock mode this is not persisted across requests; the UI updates locally.
  return ok(created, {}, 201);
}
