import { NextResponse } from "next/server";
import { coreEnabled } from "@/lib/coreClient";
import { mockLogin, mockEncode } from "@/lib/authMock";

export const dynamic = "force-dynamic";
const COOKIE = "diigoo_token";
const cookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 8 };

const unauthorized = () =>
  NextResponse.json({ status: "error", error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, meta: { request_id: "login" } }, { status: 401 });
const success = (user: unknown) =>
  NextResponse.json({ status: "success", data: { user }, meta: { request_id: "login" } });

/** POST /api/auth/login — verifies credentials (Rust core in `core` mode, else
 *  the seeded demo accounts) and sets an httpOnly session cookie. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ status: "error", error: { code: "VALIDATION_ERROR", message: "Email and password are required" }, meta: { request_id: "login" } }, { status: 422 });
  }

  if (coreEnabled()) {
    const base = process.env.CORE_API_URL ?? "http://localhost:8080";
    try {
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: body.email, password: body.password }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.status !== "success") return unauthorized();
      const r = success(data.data.user);
      r.cookies.set(COOKIE, data.data.token, cookieOpts);
      return r;
    } catch {
      return NextResponse.json({ status: "error", error: { code: "CORE_UNAVAILABLE", message: "Cannot reach the auth service. Is the core container running?" }, meta: { request_id: "login" } }, { status: 502 });
    }
  }

  // mock mode
  const s = mockLogin(body.email, body.password);
  if (!s) return unauthorized();
  const r = success({ id: s.id, name: s.name, email: s.email, role: s.role, employeeId: s.employeeId, tenantId: s.tenantId });
  r.cookies.set(COOKIE, mockEncode(s), cookieOpts);
  return r;
}
