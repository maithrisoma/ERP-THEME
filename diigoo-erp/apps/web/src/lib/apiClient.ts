"use client";
import * as React from "react";

/**
 * Client-side access to the BFF (`/api/v1/...`). Auth rides on the httpOnly
 * session cookie (sent automatically same-origin); in `core` mode the BFF
 * forwards it to the Rust service as a Bearer JWT. A 401 bounces to /login.
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function toLogin() {
  if (typeof window !== "undefined") window.location.href = "/login";
}

export function useApi<T>(path: string | null): ApiState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState<boolean>(!!path);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(path, { credentials: "same-origin" })
      .then(async (res) => {
        if (res.status === 401) {
          toLogin();
          return;
        }
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (body && body.status === "success") setData(body.data as T);
        else setError(body?.error?.message ?? `Request failed (${res.status})`);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}

/** POST/PATCH helper for mutations. Returns the created/updated entity. */
export async function apiWrite<T>(path: string, body: unknown, method: "POST" | "PATCH" = "POST"): Promise<{ ok: boolean; data?: T; error?: string }> {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  if (res.status === 401) {
    toLogin();
    return { ok: false, error: "unauthenticated" };
  }
  const b = await res.json().catch(() => null);
  if (b?.status === "success") return { ok: true, data: b.data as T };
  return { ok: false, error: b?.error?.message ?? `Request failed (${res.status})` };
}
