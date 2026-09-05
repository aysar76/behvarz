import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { scanSensitiveContent } from "@/lib/content-safety";
import { answerSchema } from "@/lib/validations/problem";
import { nextStatusAfterAnswer } from "@/lib/problem-status";
import { ANSWER_DETAIL_INCLUDE } from "@/lib/problems";
import { serializeAnswer, type AnswerRow } from "@/lib/serializers/problem";
import type { z } from "zod";

type AnswerInput = z.infer<typeof answerSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "problems:answer");

    if (isRateLimited(`problems:answer:${user.id}`, 20, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد پاسخ‌های شما در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const { id } = await params;
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }
    if (problem.moderation !== "visible") {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }
    if (problem.isDraft) {
      throw new AppError("CONFLICT", "این مسئله هنوز منتشر نشده است");
    }
    if (problem.status === "archived") {
      throw new AppError("CONFLICT", "مسئله بایگانی‌شده است و پاسخ نمی‌پذیرد");
    }

    const input = validateInput(
      answerSchema,
      await readJsonBody<AnswerInput>(request),
    );

    const sensitive = scanSensitiveContent(input.body);
    if (sensitive.length > 0) {
      if (input.sensitiveAcknowledged !== true) {
        throw new AppError(
          "VALIDATION",
          "پاسخ شما شامل اطلاعات قابل شناسایی (بیمار یا شخص) است. لطفاً آن را ناشناس‌سازی کنید یا تأیید کنید.",
          { details: { sensitiveMatches: sensitive } },
        );
      }
    }

    const nextStatus = nextStatusAfterAnswer(problem.status);

    const result = await prisma.$transaction(async (tx) => {
      const answer = await tx.problemAnswer.create({
        data: {
          problemId: problem.id,
          authorId: user.id,
          body: input.body,
          isClarificationRequest: input.isClarificationRequest ?? false,
          needsReview: sensitive.length > 0,
        },
        include: ANSWER_DETAIL_INCLUDE,
      });

      if (nextStatus !== problem.status) {
        await tx.problem.update({
          where: { id: problem.id },
          data: { status: nextStatus },
        });
        await tx.problemStatusChange.create({
          data: {
            problemId: problem.id,
            from: problem.status,
            to: nextStatus,
            changedBy: user.id,
            note: "اولین پاسخ ثبت شد",
          },
        });
      }

      return answer;
    });

    await auditLog({
      actorId: user.id,
      action: "problem.answer",
      entityType: "ProblemAnswer",
      entityId: result.id,
      details: { problemId: problem.id, needsReview: sensitive.length > 0 },
      ip,
    });

    return jsonOk(
      {
        answer: serializeAnswer(result as unknown as AnswerRow, user.id),
        problemStatus: nextStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
