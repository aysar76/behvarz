import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { benefitReportReviewSchema } from "@/lib/validations/benefits";
import { reviewBenefitReport } from "@/lib/benefits-admin";
import type { z } from "zod";

type ReviewInput = z.infer<typeof benefitReportReviewSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");
    const { id } = await params;

    const input = validateInput(
      benefitReportReviewSchema,
      await readJsonBody<ReviewInput>(request),
    );

    await reviewBenefitReport(
      id,
      input.status,
      input.moderatorNote ?? null,
      user.id,
      ip,
    );

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}