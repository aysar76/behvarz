import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { scanSensitiveContent } from "@/lib/content-safety";
import { problemUpdateSchema } from "@/lib/validations/problem";
import {
  getProblemRow,
  syncProblemTags,
  ANSWER_DETAIL_INCLUDE,
} from "@/lib/problems";
import {
  serializeProblem,
  type ProblemRow,
  type SerializedProblem,
} from "@/lib/serializers/problem";
import type { z } from "zod";

type UpdateProblemInput = z.infer<typeof problemUpdateSchema>;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
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

    const isModerator = await canModerate(user.id);
    if (problem.moderation !== "visible" && !isModerator) {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }

    let related: SerializedProblem[] = [];
    const tagNames = problem.tags.map((item) => item.tag.name);
    if (tagNames.length > 0) {
      const relatedRows = await prisma.problem.findMany({
        where: {
          id: { not: problem.id },
          isDraft: false,
          publishedAt: { not: null },
          moderation: "visible",
          tags: { some: { tag: { name: { in: tagNames } } } },
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
          _count: { select: { answers: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      related = (relatedRows as unknown as ProblemRow[]).map((row) =>
        serializeProblem(row),
      );
    }

    return jsonOk({
      problem: serializeProblem(problem as unknown as ProblemRow, {
        currentUserId: user.id,
        revealAuthor: isModerator,
      }),
      related,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "problems:update:own");
    const { id } = await params;

    const problem = await getProblemRow(id);
    if (!problem) {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }
    if (problem.authorId !== user.id) {
      throw new AppError(
        "FORBIDDEN",
        "فقط نویسنده می‌تواند مسئله را ویرایش کند",
      );
    }
    if (problem.moderation === "removed") {
      throw new AppError(
        "CONFLICT",
        "این مسئله حذف شده است و قابل ویرایش نیست",
      );
    }
    if (problem.status === "archived") {
      throw new AppError("CONFLICT", "مسئله بایگانی‌شده قابل ویرایش نیست");
    }

    const input = validateInput(
      problemUpdateSchema,
      await readJsonBody<UpdateProblemInput>(request),
    );

    const sensitiveFields: string[] = [];
    for (const field of [
      "title",
      "description",
      "context",
      "actionsTaken",
      "expectedOutcome",
    ] as const) {
      if (input[field]) sensitiveFields.push(input[field] as string);
    }
    const sensitive = scanSensitiveContent(...sensitiveFields);

    if (input.isDraft === true && problem.isDraft === false) {
      throw new AppError(
        "CONFLICT",
        "مسئله منتشرشده را نمی‌توان به پیش‌نویس برگرداند",
      );
    }

    const publishing = input.isDraft === false && problem.isDraft === true;
    let needsReview = problem.needsReview;
    if (sensitive.length > 0) {
      if (input.sensitiveAcknowledged !== true) {
        throw new AppError(
          "VALIDATION",
          "محتوا شامل اطلاعات قابل شناسایی (بیمار یا شخص) است. لطفاً آن را ناشناس‌سازی کنید یا تأیید کنید.",
          { details: { sensitiveMatches: sensitive } },
        );
      }
      needsReview = true;
    }

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.context !== undefined) data.context = input.context || null;
    if (input.barrierType !== undefined) data.barrierType = input.barrierType;
    if (input.actionsTaken !== undefined)
      data.actionsTaken = input.actionsTaken || null;
    if (input.expectedOutcome !== undefined)
      data.expectedOutcome = input.expectedOutcome || null;
    if (input.urgency !== undefined) data.urgency = input.urgency;
    if (input.isAnonymous !== undefined) data.isAnonymous = input.isAnonymous;
    if (input.isDraft !== undefined) data.isDraft = input.isDraft;
    if (publishing) {
      data.publishedAt = problem.publishedAt ?? new Date();
      data.needsReview = needsReview;
    }

    await prisma.problem.update({
      where: { id },
      data,
    });

    if (input.tags !== undefined) {
      await syncProblemTags(id, input.tags);
    }

    await auditLog({
      actorId: user.id,
      action: "problem.update",
      entityType: "Problem",
      entityId: id,
      details: { publishing, needsReview },
      ip,
    });

    const updated = await prisma.problem.findUnique({
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

    return jsonOk({
      problem: serializeProblem(updated as unknown as ProblemRow, {
        currentUserId: user.id,
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}

async function canModerate(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  try {
    assertPermission(user, "content:moderate");
    return true;
  } catch {
    return false;
  }
}
