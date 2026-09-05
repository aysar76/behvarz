import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { assertAccountCanCreate, scanContentForModeration } from "@/lib/moderation";
import { problemCreateSchema } from "@/lib/validations/problem";
import { syncProblemTags, PROBLEM_LIST_INCLUDE } from "@/lib/problems";
import { getInteractionState } from "@/lib/interactions";
import {
  serializeProblem,
  type ProblemRow,
  type SerializedProblem,
} from "@/lib/serializers/problem";
import type { z } from "zod";
import type { ProblemStatus } from "@/generated/prisma/client";

type CreateProblemInput = z.infer<typeof problemCreateSchema>;

const PROBLEM_STATUSES: ProblemStatus[] = [
  "open",
  "discussing",
  "solved",
  "archived",
];

function sensitiveTexts(input: {
  title?: string;
  description?: string;
  context?: string;
  actionsTaken?: string;
  expectedOutcome?: string;
}): string[] {
  return [
    input.title,
    input.description,
    input.context,
    input.actionsTaken,
    input.expectedOutcome,
  ].filter((value): value is string => Boolean(value));
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tag = url.searchParams.get("tag");
    const q = url.searchParams.get("q")?.trim() ?? "";
    const showDrafts = url.searchParams.get("drafts") === "1";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("pageSize")) || 20),
    );

    const where: Record<string, unknown> = showDrafts
      ? { isDraft: true, authorId: user.id }
      : {
          isDraft: false,
          publishedAt: { not: null },
          moderation: "visible",
        };

    if (status && (PROBLEM_STATUSES as string[]).includes(status)) {
      where.status = status;
    }
    if (tag && tag.trim()) {
      where.tags = { some: { tag: { name: tag.trim() } } };
    }
    if (q) {
      where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    }

    const [rows, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: PROBLEM_LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.problem.count({ where }),
    ]);

    const state = await getInteractionState(user.id);

    const problems: SerializedProblem[] = (rows as unknown as ProblemRow[]).map(
      (row) =>
        serializeProblem(row, {
          currentUserId: user.id,
          savedSet: state.savedSet,
          followedSet: state.followedProblems,
          followedTags: state.followedTags,
        }),
    );

    return jsonOk({
      problems,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "problems:create");

    if (isRateLimited(`problems:create:${user.id}`, 10, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد ثبت مسئله در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    assertAccountCanCreate(user);

    const input = validateInput(
      problemCreateSchema,
      await readJsonBody<CreateProblemInput>(request),
    );

    const sensitive = await scanContentForModeration(...sensitiveTexts(input));
    const isPublishing = input.isDraft !== true;
    let needsReview = false;
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

    const problem = await prisma.problem.create({
      data: {
        authorId: user.id,
        title: input.title,
        description: input.description,
        context: input.context ?? null,
        barrierType: input.barrierType,
        actionsTaken: input.actionsTaken ?? null,
        expectedOutcome: input.expectedOutcome ?? null,
        urgency: input.urgency,
        isAnonymous: input.isAnonymous ?? false,
        isDraft: input.isDraft ?? false,
        needsReview,
        publishedAt: isPublishing ? new Date() : null,
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
      },
    });

    if (input.tags && input.tags.length > 0) {
      await syncProblemTags(problem.id, input.tags);
    }

    const created = await prisma.problem.findUnique({
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
        _count: { select: { answers: true } },
      },
    });

    await auditLog({
      actorId: user.id,
      action: isPublishing ? "problem.create" : "problem.draft",
      entityType: "Problem",
      entityId: problem.id,
      details: { isAnonymous: input.isAnonymous ?? false, needsReview },
      ip,
    });

    return jsonOk(
      { problem: serializeProblem(created as unknown as ProblemRow) },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
