import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { moderationSchema } from "@/lib/validations/problem";
import { serializeProblem, type ProblemRow } from "@/lib/serializers/problem";
import { ANSWER_DETAIL_INCLUDE } from "@/lib/problems";
import type { z } from "zod";

type ModerationInput = z.infer<typeof moderationSchema>;

const ACTION_STATE: Record<string, "hidden" | "visible" | "removed"> = {
  hide: "hidden",
  unhide: "visible",
  remove: "removed",
  restore: "visible",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "content:moderate");
    const { id } = await params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
            role: true,
          },
        },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        answers: {
          include: ANSWER_DETAIL_INCLUDE,
          orderBy: { createdAt: "asc" },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        _count: { select: { answers: true } },
      },
    });
    if (!problem) {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }

    const input = validateInput(
      moderationSchema,
      await readJsonBody<ModerationInput>(request),
    );

    const updated = await prisma.problem.update({
      where: { id },
      data: {
        moderation: ACTION_STATE[input.action],
        moderationNote: input.note ?? null,
        needsReview: false,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
            role: true,
          },
        },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        answers: {
          include: ANSWER_DETAIL_INCLUDE,
          orderBy: { createdAt: "asc" },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        _count: { select: { answers: true } },
      },
    });

    await auditLog({
      actorId: user.id,
      action: `moderation.problem.${input.action}`,
      entityType: "Problem",
      entityId: id,
      details: { note: input.note },
      ip,
    });

    return jsonOk({
      problem: serializeProblem(updated as unknown as ProblemRow, {
        revealAuthor: true,
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
