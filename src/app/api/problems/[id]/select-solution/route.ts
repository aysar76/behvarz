import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { selectSolutionSchema } from "@/lib/validations/problem";
import { getProblemRow, ANSWER_DETAIL_INCLUDE } from "@/lib/problems";
import { serializeProblem, type ProblemRow } from "@/lib/serializers/problem";
import { notifyUser } from "@/lib/notifications";
import type { z } from "zod";

type SelectSolutionInput = z.infer<typeof selectSolutionSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    const { id } = await params;

    const problem = await getProblemRow(id);
    if (!problem) {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }
    if (problem.authorId !== user.id) {
      throw new AppError(
        "FORBIDDEN",
        "فقط نویسنده مسئله می‌تواند راهکار را انتخاب کند",
      );
    }
    if (problem.status === "archived") {
      throw new AppError("CONFLICT", "مسئله بایگانی‌شده است");
    }
    if (problem.status === "solved") {
      throw new AppError("CONFLICT", "این مسئله قبلاً حل‌شده اعلام شده است");
    }

    const input = validateInput(
      selectSolutionSchema,
      await readJsonBody<SelectSolutionInput>(request),
    );

    const answer = await prisma.problemAnswer.findFirst({
      where: { id: input.answerId, problemId: problem.id },
    });
    if (!answer || answer.moderation !== "visible") {
      throw new AppError("NOT_FOUND", "پاسخ انتخابی یافت نشد");
    }

    await prisma.$transaction([
      prisma.problemAnswer.updateMany({
        where: { problemId: problem.id },
        data: { isSelectedSolution: false },
      }),
      prisma.problemAnswer.update({
        where: { id: answer.id },
        data: { isSelectedSolution: true },
      }),
      prisma.problem.update({
        where: { id: problem.id },
        data: {
          status: "solved",
          selectedAnswerId: answer.id,
          conclusion: input.conclusion,
          solvedAt: new Date(),
        },
      }),
      prisma.problemStatusChange.create({
        data: {
          problemId: problem.id,
          from: problem.status,
          to: "solved",
          changedBy: user.id,
          note: "راهکار انتخاب و جمع‌بندی ثبت شد",
        },
      }),
    ]);

    await auditLog({
      actorId: user.id,
      action: "problem.solution",
      entityType: "Problem",
      entityId: problem.id,
      details: { answerId: answer.id },
      ip,
    });

    await notifyUser({
      userId: answer.authorId,
      type: "solution_selected",
      actorId: user.id,
      title: "پاسخ شما به‌عنوان راهکار انتخاب شد",
      body: problem.title,
      targetType: "problem",
      targetId: problem.id,
    });

    const updated = await prisma.problem.findUnique({
      where: { id: problem.id },
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

    return jsonOk({
      problem: serializeProblem(updated as unknown as ProblemRow, {
        currentUserId: user.id,
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
