import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { assertAccountCanCreate } from "@/lib/moderation";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { budgetProposalCreateSchema } from "@/lib/validations/benefits";
import { createBudgetProposal, listVisibleProposals } from "@/lib/benefits";
import type { z } from "zod";

type CreateInput = z.infer<typeof budgetProposalCreateSchema>;

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:read");

    const proposals = await listVisibleProposals(user.id);

    return jsonOk({ proposals });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:propose");
    assertAccountCanCreate(user);

    const input = validateInput(
      budgetProposalCreateSchema,
      await readJsonBody<CreateInput>(request),
    );

    const proposal = await createBudgetProposal(input, user.id);

    await auditLog({
      actorId: user.id,
      action: "benefits.budgetProposalCreate",
      entityType: "BudgetProposal",
      entityId: proposal.id,
      ip,
    });

    return jsonOk({ proposal }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}