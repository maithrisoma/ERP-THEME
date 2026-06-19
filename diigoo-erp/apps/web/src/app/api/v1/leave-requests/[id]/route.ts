import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { coreEnabled, proxyCore } from "@/lib/coreClient";

export const dynamic = "force-dynamic";

/** PATCH /api/v1/leave-requests/{id} — approve or reject (persists via the core). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (coreEnabled()) {
    const bodyText = await req.text();
    return proxyCore(`/api/v1/leave-requests/${params.id}`, { method: "PATCH", body: bodyText });
  }
  const body = await req.json().catch(() => null);
  if (!body?.decision || (body.decision !== "approved" && body.decision !== "rejected")) {
    return fail("VALIDATION_ERROR", "decision must be 'approved' or 'rejected'", 422);
  }
  return ok({ id: params.id, status: body.decision });
}
