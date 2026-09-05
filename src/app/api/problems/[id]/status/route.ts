import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { statusUpdateSchema } from "@/lib/validations/problem";
import { canTransition } from "@/lib/problem-status";
import { getProblemRow, ANSWER_DETAIL_INCLUDE } from "@/lib/problems";
import { serializeProblem, type ProblemRow } from "@/lib/serializers/problem";
import type { z } from "zod";

type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;

export async function PATCH(
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
        "فقط نویسنده می‌تواند وضعیت مسئله را تغییر دهد",
      );
    }

    const input = validateInput(
      statusUpdateSchema,
      await readJsonBody<StatusUpdateInput>(request),
    );

    if (input.to === problem.status) {
      throw new AppError("CONFLICT", "وضعیت مسئله قبلاً به این حالت است");
    }
    if (!canTransition(problem.status, input.to)) {
      throw new AppError("CONFLICT", "این تغییر وضعیت مجاز نیست", {
        details: { from: problem.status, to: input.to },
      });
    }

    await prisma.$transaction([
      prisma.problem.update({
        where: { id: problem.id },
        data: {
          status: input.to,
          ...(input.to === "solved" ? { solvedAt: new Date() } : {}),
        },
      }),
      prisma.problemStatusChange.create({
        data: {
          problemId: problem.id,
          from: problem.status,
          to: input.to,
          changedBy: user.id,
          note: input.note ?? null,
        },
      }),
    ]);

    await auditLog({
      actorId: user.id,
      action: "problem.status",
      entityType: "Problem",
      entityId: problem.id,
      details: { from: problem.status, to: input.to },
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
