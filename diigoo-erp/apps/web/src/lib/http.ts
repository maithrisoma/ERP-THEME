import { NextResponse } from "next/server";
import type { ApiMeta } from "@/platform/types";

function requestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "req_" + Math.abs(Date.now()).toString(36);
  }
}

/** Success envelope — identical shape to the document's API design page. */
export function ok<T>(data: T, meta: Partial<ApiMeta> = {}, status = 200) {
  return NextResponse.json({ status: "success", data, meta: { request_id: requestId(), ...meta } }, { status });
}

/** Error envelope. */
export function fail(code: string, message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json({ status: "error", error: { code, message, details }, meta: { request_id: requestId() } }, { status });
}
