import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { coreEnabled } from "@/lib/coreClient";
import { mockDecode, MOCK_TENANT } from "@/lib/authMock";

export const dynamic = "force-dynamic";

const unauth = () =>
  NextResponse.json({ status: "error", error: { code: "UNAUTHENTICATED", message: "Not signed in" }, meta: { request_id: "me" } }, { status: 401 });

/** GET /api/auth/me — resolves the current session from the cookie. */
export async function GET() {
  const token = cookies().get("diigoo_token")?.value;
  if (!token) return unauth();

  if (coreEnabled()) {
    const base = process.env.CORE_API_URL ?? "http://localhost:8080";
    try {
      const res = await fetch(`${base}/api/v1/auth/me`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.status !== "success") return unauth();
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ status: "error", error: { code: "CORE_UNAVAILABLE", message: "Auth service unreachable" }, meta: { request_id: "me" } }, { status: 502 });
    }
  }

  const s = mockDecode(token);
  if (!s) return unauth();
  return NextResponse.json({
    status: "success",
    data: {
      user: { id: s.id, name: s.name, email: s.email, role: s.role, employeeId: s.employeeId, tenantId: s.tenantId },
      tenant: MOCK_TENANT,
    },
    meta: { request_id: "me" },
  });
}
