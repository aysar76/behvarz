import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { assertAccountCanCreate, scanContentForModeration } from "@/lib/moderation";
import { problemUpdateSchema } from "@/lib/validations/problem";
import {
  getProblemRow,
  syncProblemTags,
  ANSWER_DETAIL_INCLUDE,
} from "@/lib/problems";
import { getInteractionState } from "@/lib/interactions";
import {
  serializeProblem,
  type ProblemRow,
  type SerializedProblem,
} from "@/lib/serializers/problem";
import type { z } from "zod";

type UpdateProblemInput = z.infer<typeof problemUpdateSchema>;

async function serializeWithState(
  id: string,
  currentUserId: string,
): Promise<{ problem: SerializedProblem; related: SerializedProblem[] }> {
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

  const isModerator = await canModerate(currentUserId);
  if (problem.moderation !== "visible" && !isModerator) {
    throw new AppError("NOT_FOUND", "مسئله یافت نشد");
  }

  const state = await getInteractionState(currentUserId);

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
      serializeProblem(row, {
        currentUserId,
        savedSet: state.savedSet,
        followedSet: state.followedProblems,
        followedTags: state.followedTags,
      }),
    );
  }

  const problemData = serializeProblem(problem as unknown as ProblemRow, {
    currentUserId,
    revealAuthor: isModerator,
    savedSet: state.savedSet,
    followedSet: state.followedProblems,
    followedTags: state.followedTags,
  });

  return { problem: problemData, related };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const { problem, related } = await serializeWithState(id, user.id);
    return jsonOk({ problem, related });
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

    const current = await getProblemRow(id);
    if (!current) {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }
    if (current.authorId !== user.id) {
      throw new AppError(
        "FORBIDDEN",
        "فقط نویسنده می‌تواند مسئله را ویرایش کند",
      );
    }
    if (current.moderation === "removed") {
      throw new AppError(
        "CONFLICT",
        "این مسئله حذف شده است و قابل ویرایش نیست",
      );
    }
    if (current.status === "archived") {
      throw new AppError("CONFLICT", "مسئله بایگانی‌شده قابل ویرایش نیست");
    }

    const input = validateInput(
      problemUpdateSchema,
      await readJsonBody<UpdateProblemInput>(request),
    );

    assertAccountCanCreate(user);

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
    const sensitive = await scanContentForModeration(...sensitiveFields);

    if (input.isDraft === true && current.isDraft === false) {
      throw new AppError(
        "CONFLICT",
        "مسئله منتشرشده را نمی‌توان به پیش‌نویس برگرداند",
      );
    }

    const publishing = input.isDraft === false && current.isDraft === true;
    let needsReview = current.needsReview;
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
      data.publishedAt = current.publishedAt ?? new Date();
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

    const { problem } = await serializeWithState(id, user.id);
    return jsonOk({ problem });
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
