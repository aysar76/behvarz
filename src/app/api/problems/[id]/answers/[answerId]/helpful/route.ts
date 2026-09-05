import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; answerId: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "problems:mark-helpful");
    const { id, answerId } = await params;

    const answer = await prisma.problemAnswer.findFirst({
      where: { id: answerId, problemId: id },
    });
    if (!answer) {
      throw new AppError("NOT_FOUND", "پاسخ یافت نشد");
    }
    if (answer.moderation !== "visible") {
      throw new AppError("NOT_FOUND", "پاسخ یافت نشد");
    }

    const existing = await prisma.problemAnswerHelpful.findUnique({
      where: { answerId_userId: { answerId, userId: user.id } },
    });

    let helpfulCount = answer.helpfulCount;
    if (existing) {
      await prisma.$transaction([
        prisma.problemAnswerHelpful.delete({
          where: { answerId_userId: { answerId, userId: user.id } },
        }),
        prisma.problemAnswer.update({
          where: { id: answerId },
          data: { helpfulCount: Math.max(0, answer.helpfulCount - 1) },
        }),
      ]);
      helpfulCount = Math.max(0, answer.helpfulCount - 1);
      await auditLog({
        actorId: user.id,
        action: "problem.answer.unhelpful",
        entityType: "ProblemAnswer",
        entityId: answerId,
        details: { problemId: id },
        ip,
      });
    } else {
      await prisma.$transaction([
        prisma.problemAnswerHelpful.create({
          data: { answerId, userId: user.id },
        }),
        prisma.problemAnswer.update({
          where: { id: answerId },
          data: { helpfulCount: answer.helpfulCount + 1 },
        }),
      ]);
      helpfulCount = answer.helpfulCount + 1;
      await auditLog({
        actorId: user.id,
        action: "problem.answer.helpful",
        entityType: "ProblemAnswer",
        entityId: answerId,
        details: { problemId: id },
        ip,
      });
    }

    return jsonOk({ helpfulCount, isHelpfulByMe: !existing });
  } catch (error) {
    return jsonError(error);
  }
}
