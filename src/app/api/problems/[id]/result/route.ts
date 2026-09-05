import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { resultSchema } from "@/lib/validations/problem";
import { getProblemRow, ANSWER_DETAIL_INCLUDE } from "@/lib/problems";
import { serializeProblem, type ProblemRow } from "@/lib/serializers/problem";
import type { z } from "zod";

type ResultInput = z.infer<typeof resultSchema>;

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
        "فقط نویسنده مسئله می‌تواند نتیجه اجرا را ثبت کند",
      );
    }
    if (problem.status !== "solved") {
      throw new AppError(
        "CONFLICT",
        "ثبت نتیجه اجرا فقط برای مسائل حل‌شده امکان‌پذیر است",
      );
    }

    const input = validateInput(
      resultSchema,
      await readJsonBody<ResultInput>(request),
    );

    await prisma.problem.update({
      where: { id: problem.id },
      data: {
        resultOutcome: input.resultOutcome,
        resultSummary: input.resultSummary,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "problem.result",
      entityType: "Problem",
      entityId: problem.id,
      details: { resultOutcome: input.resultOutcome },
      ip,
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
