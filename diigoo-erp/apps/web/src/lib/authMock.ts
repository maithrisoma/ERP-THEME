import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_TENANT_IDENTITY } from "@/platform/accounts";

/**
 * Mock-auth fallback for the zero-dependency demo (DATA_ADAPTER != "core").
 * Validates the seeded demo accounts and stores an opaque (base64) session in
 * the cookie. In `core` mode this file is unused — the Rust core issues real
 * signed JWTs instead.
 */
export interface MockSession {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string | null;
  tenantId: string;
}

export function mockLogin(email: string, password: string): MockSession | null {
  const acct = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!acct || password !== DEMO_PASSWORD) return null;
  return { id: acct.id, name: acct.name, email: acct.email, role: acct.role, employeeId: acct.employeeId ?? null, tenantId: DEMO_TENANT_IDENTITY.id };
}

export function mockEncode(s: MockSession): string {
  return Buffer.from(JSON.stringify(s)).toString("base64url");
}

export function mockDecode(token: string): MockSession | null {
  try {
    const o = JSON.parse(Buffer.from(token, "base64url").toString());
    return o && typeof o.id === "string" ? (o as MockSession) : null;
  } catch {
    return null;
  }
}

export const MOCK_TENANT = DEMO_TENANT_IDENTITY;
