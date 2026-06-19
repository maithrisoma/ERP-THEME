import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  const r = NextResponse.json({ status: "success", data: { ok: true }, meta: { request_id: "logout" } });
  r.cookies.set("diigoo_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return r;
}
