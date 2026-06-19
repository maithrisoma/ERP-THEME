import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * BFF data adapter. Serves seed data when DATA_ADAPTER=mock (default), or
 * proxies to the Rust core when DATA_ADAPTER=core — forwarding the session
 * JWT (httpOnly cookie) as `Authorization: Bearer`, so the core enforces RBAC
 * and tenant RLS. The core returns the identical envelope, passed straight back.
 */
export function coreEnabled(): boolean {
  return process.env.DATA_ADAPTER === "core";
}

export async function proxyCore(path: string, init?: { method?: string; body?: string }) {
  const base = process.env.CORE_API_URL ?? "http://localhost:8080";
  const token = cookies().get("diigoo_token")?.value;
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (init?.body) headers["content-type"] = "application/json";
  try {
    const res = await fetch(`${base}${path}`, {
      method: init?.method ?? "GET",
      headers,
      body: init?.body,
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ status: "error", error: { code: "CORE_BAD_RESPONSE", message: "Rust core returned a non-JSON response" }, meta: { request_id: "proxy" } }, { status: 502 });
    }
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { status: "error", error: { code: "CORE_UNAVAILABLE", message: `Cannot reach the Rust core at ${base}. Is the core container running?` }, meta: { request_id: "proxy" } },
      { status: 502 },
    );
  }
}
