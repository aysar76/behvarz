import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { moderationSchema } from "@/lib/validations/problem";
import { serializeAnswer, type AnswerRow } from "@/lib/serializers/problem";
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

    const answer = await prisma.problemAnswer.findUnique({
      where: { id },
      include: ANSWER_DETAIL_INCLUDE,
    });
    if (!answer) {
      throw new AppError("NOT_FOUND", "پاسخ یافت نشد");
    }

    const input = validateInput(
      moderationSchema,
      await readJsonBody<ModerationInput>(request),
    );

    const updated = await prisma.problemAnswer.update({
      where: { id },
      data: {
        moderation: ACTION_STATE[input.action],
        moderationNote: input.note ?? null,
        needsReview: false,
      },
      include: ANSWER_DETAIL_INCLUDE,
    });

    await auditLog({
      actorId: user.id,
      action: `moderation.answer.${input.action}`,
      entityType: "ProblemAnswer",
      entityId: id,
      details: { problemId: answer.problemId, note: input.note },
      ip,
    });

    return jsonOk({
      answer: serializeAnswer(updated as unknown as AnswerRow, user.id),
    });
  } catch (error) {
    return jsonError(error);
  }
}
