import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { budgetProposalReviewSchema } from "@/lib/validations/benefits";
import { reviewBudgetProposal } from "@/lib/benefits-admin";
import type { z } from "zod";

type ReviewInput = z.infer<typeof budgetProposalReviewSchema>;

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
      budgetProposalReviewSchema,
      await readJsonBody<ReviewInput>(request),
    );

    if (!["under_review", "approved", "rejected", "voting"].includes(input.status)) {
      throw new AppError("VALIDATION", "وضعیت نامعتبر است");
    }

    await reviewBudgetProposal(id, input.status, user.id, ip);

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}