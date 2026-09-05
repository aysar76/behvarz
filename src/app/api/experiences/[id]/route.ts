import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { scanSensitiveContent } from "@/lib/content-safety";
import { experienceUpdateSchema } from "@/lib/validations/experience";
import { getExperienceRow, syncExperienceTags } from "@/lib/experiences";
import {
  serializeExperience,
  type ExperienceRow,
  type SerializedExperience,
} from "@/lib/serializers/experience";
import type { z } from "zod";

type UpdateExperienceInput = z.infer<typeof experienceUpdateSchema>;

const REUSE_INCLUDE = {
  user: { select: { id: true, displayName: true } },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const experience = await prisma.experience.findUnique({
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
        sourceProblem: { select: { id: true, title: true } },
        reuses: { include: REUSE_INCLUDE, orderBy: { createdAt: "desc" } },
        references: {
          select: {
            id: true,
            answer: {
              select: {
                id: true,
                problem: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { references: true, reuses: true } },
      },
    });

    if (!experience) {
      throw new AppError("NOT_FOUND", "تجربه یافت نشد");
    }

    const isModerator = await canModerate(user.id);
    if (experience.moderation !== "visible" && !isModerator) {
      throw new AppError("NOT_FOUND", "تجربه یافت نشد");
    }

    let related: SerializedExperience[] = [];
    const tagNames = experience.tags.map((item) => item.tag.name);
    if (tagNames.length > 0) {
      const relatedRows = await prisma.experience.findMany({
        where: {
          id: { not: experience.id },
          isDraft: false,
          publishedAt: { not: null },
          moderation: "visible",
          status: { not: "archived" },
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
          _count: { select: { references: true, reuses: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      related = (relatedRows as unknown as ExperienceRow[]).map((row) =>
        serializeExperience(row),
      );
    }

    return jsonOk({
      experience: serializeExperience(experience as unknown as ExperienceRow, {
        currentUserId: user.id,
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
    assertPermission(user, "experiences:update:own");
    const { id } = await params;

    const experience = await getExperienceRow(id);
    if (!experience) {
      throw new AppError("NOT_FOUND", "تجربه یافت نشد");
    }
    if (experience.authorId !== user.id) {
      throw new AppError(
        "FORBIDDEN",
        "فقط نویسنده می‌تواند تجربه را ویرایش کند",
      );
    }
    if (experience.moderation === "removed") {
      throw new AppError(
        "CONFLICT",
        "این تجربه حذف شده است و قابل ویرایش نیست",
      );
    }
    if (experience.status === "archived") {
      throw new AppError(
        "CONFLICT",
        "تجربه بایگانی‌شده قابل ویرایش نیست",
      );
    }

    const input = validateInput(
      experienceUpdateSchema,
      await readJsonBody<UpdateExperienceInput>(request),
    );

    const sensitiveFields: string[] = [];
    for (const field of [
      "title",
      "situation",
      "conditions",
      "action",
      "resources",
      "challenges",
      "result",
      "lessons",
      "suggestion",
    ] as const) {
      if (input[field]) sensitiveFields.push(input[field] as string);
    }
    const sensitive = scanSensitiveContent(...sensitiveFields);

    if (input.isDraft === true && experience.isDraft === false) {
      throw new AppError(
        "CONFLICT",
        "تجربه منتشرشده را نمی‌توان به پیش‌نویس برگرداند",
      );
    }

    const publishing = input.isDraft === false && experience.isDraft === true;
    let needsReview = experience.needsReview;
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
    if (input.situation !== undefined) data.situation = input.situation;
    if (input.conditions !== undefined)
      data.conditions = input.conditions || null;
    if (input.action !== undefined) data.action = input.action;
    if (input.resources !== undefined)
      data.resources = input.resources || null;
    if (input.challenges !== undefined)
      data.challenges = input.challenges || null;
    if (input.result !== undefined) data.result = input.result;
    if (input.lessons !== undefined) data.lessons = input.lessons || null;
    if (input.suggestion !== undefined)
      data.suggestion = input.suggestion || null;
    if (input.isDraft !== undefined) data.isDraft = input.isDraft;
    if (publishing) {
      data.publishedAt = experience.publishedAt ?? new Date();
      data.needsReview = needsReview;
      data.status = needsReview
        ? "under_review"
        : experience.status === "under_review"
          ? "user_generated"
          : experience.status;
    }

    await prisma.experience.update({
      where: { id },
      data,
    });

    if (input.tags !== undefined) {
      await syncExperienceTags(id, input.tags);
    }

    await auditLog({
      actorId: user.id,
      action: "experience.update",
      entityType: "Experience",
      entityId: id,
      details: { publishing, needsReview },
      ip,
    });

    const updated = await prisma.experience.findUnique({
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
        sourceProblem: { select: { id: true, title: true } },
        reuses: { include: REUSE_INCLUDE, orderBy: { createdAt: "desc" } },
        _count: { select: { references: true, reuses: true } },
      },
    });

    return jsonOk({
      experience: serializeExperience(updated as unknown as ExperienceRow, {
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