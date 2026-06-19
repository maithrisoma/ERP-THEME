import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { coreEnabled, proxyCore } from "@/lib/coreClient";
import { listEmployees } from "@/modules/hrm/repo";

export const dynamic = "force-dynamic";

/** GET /api/v1/employees — filterable, paginated employee list. */
export function GET(req: NextRequest) {
  if (coreEnabled()) return proxyCore(`/api/v1/employees?${req.nextUrl.searchParams.toString()}`);
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(sp.get("per_page") ?? 20)));
  const rows = listEmployees({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    departmentId: sp.get("department_id") ?? undefined,
    locationId: sp.get("location_id") ?? undefined,
    employmentType: sp.get("employment_type") ?? undefined,
  });
  const start = (page - 1) * perPage;
  return ok(rows.slice(start, start + perPage), { page, per_page: perPage, total: rows.length });
}

/** POST /api/v1/employees — create (persists via the Rust core in core mode). */
export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  if (coreEnabled()) return proxyCore("/api/v1/employees", { method: "POST", body: bodyText });
  const body = bodyText ? JSON.parse(bodyText) : {};
  if (!body.firstName || !body.lastName || !body.email) {
    return fail("VALIDATION_ERROR", "firstName, lastName and email are required", 422);
  }
  return ok({ id: "e_new_" + Math.random().toString(36).slice(2, 8), employeeNo: "EMP-NEW", status: "active", customFields: {}, tags: [], ...body }, {}, 201);
}
