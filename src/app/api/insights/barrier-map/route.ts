import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getBarrierMapReport, getDataContributionStatus } from "@/lib/insights";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "insights:read");

    const [report, allowDataContribution] = await Promise.all([
      getBarrierMapReport(),
      getDataContributionStatus(user.id),
    ]);

    return jsonOk({ report, allowDataContribution });
  } catch (error) {
    return jsonError(error);
  }
}