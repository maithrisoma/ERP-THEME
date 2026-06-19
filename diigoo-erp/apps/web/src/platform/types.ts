/**
 * Platform-wide primitives shared across every module.
 * Kept framework-agnostic so the same contract is mirrored by the Rust core.
 */

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // RFC3339

/** Minor-unit money to avoid float drift (matches the Rust core's i64 cents). */
export interface Money {
  amount: number; // in minor units (cents)
  currency: string; // ISO 4217, e.g. "USD"
}

export function money(amount: number, currency = "USD"): Money {
  return { amount: Math.round(amount * 100), currency };
}

export function formatMoney(m: Money, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: m.currency,
    maximumFractionDigits: 2,
  }).format(m.amount / 100);
}

/** Standard API envelope — identical shape to the document's API design page. */
export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  request_id: string;
}
export interface ApiSuccess<T> {
  status: "success";
  data: T;
  meta: ApiMeta;
}
export interface ApiError {
  status: "error";
  error: { code: string; message: string; details?: Record<string, unknown> };
  meta: { request_id: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  per_page: number;
};

/** Every persisted entity is tenant-scoped (Row-Level Security in Postgres). */
export interface TenantScoped {
  id: ID;
  tenant_id: ID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}
