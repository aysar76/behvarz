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
import { experienceCreateSchema } from "@/lib/validations/experience";
import { EXPERIENCE_STATUSES } from "@/lib/experience-status";
import {
  syncExperienceTags,
  EXPERIENCE_LIST_INCLUDE,
} from "@/lib/experiences";
import { generateExperienceSlug } from "@/lib/slug";
import {
  serializeExperience,
  type ExperienceRow,
  type SerializedExperience,
} from "@/lib/serializers/experience";
import type { z } from "zod";

type CreateExperienceInput = z.infer<typeof experienceCreateSchema>;

function sensitiveTexts(input: {
  title?: string;
  situation?: string;
  conditions?: string;
  action?: string;
  resources?: string;
  challenges?: string;
  result?: string;
  lessons?: string;
  suggestion?: string;
}): string[] {
  return [
    input.title,
    input.situation,
    input.conditions,
    input.action,
    input.resources,
    input.challenges,
    input.result,
    input.lessons,
    input.suggestion,
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
          status: { not: "archived" },
        };

    if (status && (EXPERIENCE_STATUSES as string[]).includes(status)) {
      where.status = status;
    }
    if (tag && tag.trim()) {
      where.tags = { some: { tag: { name: tag.trim() } } };
    }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { situation: { contains: q } },
        { action: { contains: q } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        include: EXPERIENCE_LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.experience.count({ where }),
    ]);

    const experiences: SerializedExperience[] = (
      rows as unknown as ExperienceRow[]
    ).map((row) => serializeExperience(row));

    return jsonOk({
      experiences,
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
    assertPermission(user, "experiences:create");

    if (
      isRateLimited(`experiences:create:${user.id}`, 10, 60 * 60 * 1000)
    ) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد ثبت تجربه در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      experienceCreateSchema,
      await readJsonBody<CreateExperienceInput>(request),
    );

    const sensitive = scanSensitiveContent(...sensitiveTexts(input));
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

    let slug = generateExperienceSlug();
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await prisma.experience.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) break;
      slug = generateExperienceSlug();
    }

    const experience = await prisma.experience.create({
      data: {
        authorId: user.id,
        slug,
        title: input.title,
        situation: input.situation,
        conditions: input.conditions ?? null,
        action: input.action,
        resources: input.resources ?? null,
        challenges: input.challenges ?? null,
        result: input.result,
        lessons: input.lessons ?? null,
        suggestion: input.suggestion ?? null,
        isDraft: input.isDraft ?? false,
        needsReview,
        status: isPublishing
          ? needsReview
            ? "under_review"
            : "user_generated"
          : "user_generated",
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
        sourceProblem: { select: { id: true, title: true } },
      },
    });

    if (input.tags && input.tags.length > 0) {
      await syncExperienceTags(experience.id, input.tags);
    }

    const created = await prisma.experience.findUnique({
      where: { id: experience.id },
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
        sourceProblem: { select: { id: true, title: true } },
        _count: { select: { references: true, reuses: true } },
      },
    });

    await auditLog({
      actorId: user.id,
      action: isPublishing ? "experience.create" : "experience.draft",
      entityType: "Experience",
      entityId: experience.id,
      details: { needsReview },
      ip,
    });

    return jsonOk(
      {
        experience: serializeExperience(created as unknown as ExperienceRow, {
          currentUserId: user.id,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}