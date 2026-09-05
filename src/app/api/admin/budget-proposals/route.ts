import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { serializeBudgetProposal, type BudgetProposalRow } from "@/lib/benefits";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");

    const proposals = await prisma.budgetProposal.findMany({
      include: {
        author: { select: { id: true, displayName: true } },
        _count: { select: { votes: true } },
        implementations: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      proposals: (proposals as unknown as BudgetProposalRow[]).map((proposal) =>
        serializeBudgetProposal(proposal),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}