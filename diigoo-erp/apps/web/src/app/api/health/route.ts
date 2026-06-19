import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({
    service: "diigoo-web-bff",
    status: "healthy",
    adapter: process.env.DATA_ADAPTER ?? "mock",
    modules: ["hr", "sales_crm"],
    version: "2.0.0",
  });
}
