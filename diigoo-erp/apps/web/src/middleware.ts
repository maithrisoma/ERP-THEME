import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route guard. Anything that isn't the login page, the auth endpoints, or a
 * static asset requires a session cookie. Pages redirect to /login; API routes
 * get a 401 envelope. Token *validity* is checked by the Rust core / BFF — the
 * middleware only checks presence (edge can't verify the JWT signature).
 */
const PUBLIC = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("diigoo_token")?.value;
  if (token) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json(
      { status: "error", error: { code: "UNAUTHENTICATED", message: "Sign in required" }, meta: { request_id: "mw" } },
      { status: 401 },
    );
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and common static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
