import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { dataContributionSchema } from "@/lib/validations/campaign";
import { updateDataContribution } from "@/lib/insights";
import type { z } from "zod";

type Input = z.infer<typeof dataContributionSchema>;

export async function PATCH(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "insights:read");

    const input = validateInput(
      dataContributionSchema,
      await readJsonBody<Input>(request),
    );

    await updateDataContribution(user.id, input.allowDataContribution);

    await auditLog({
      actorId: user.id,
      action: "insights.dataContributionUpdate",
      entityType: "User",
      entityId: user.id,
      details: { allowDataContribution: input.allowDataContribution },
      ip,
    });

    return jsonOk({ allowDataContribution: input.allowDataContribution });
  } catch (error) {
    return jsonError(error);
  }
}