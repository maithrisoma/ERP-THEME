import { ok, fail } from "@/lib/http";
import { coreEnabled, proxyCore } from "@/lib/coreClient";
import { getEmployee, directReports, leaveBalancesFor, payslipsFor } from "@/modules/hrm/repo";

export const dynamic = "force-dynamic";

/** GET /api/v1/employees/{id} — full profile incl. reports, balances, payslips. */
export function GET(_req: Request, { params }: { params: { id: string } }) {
  if (coreEnabled()) return proxyCore(`/api/v1/employees/${params.id}`);
  const employee = getEmployee(params.id);
  if (!employee) return fail("NOT_FOUND", `No employee with id ${params.id}`, 404);
  return ok({
    employee,
    directReports: directReports(employee.id),
    leaveBalances: leaveBalancesFor(employee.id),
    payslips: payslipsFor(employee.id),
  });
}
