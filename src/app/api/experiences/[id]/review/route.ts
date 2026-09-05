import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { experienceReviewSchema } from "@/lib/validations/experience";
import { canTransition } from "@/lib/experience-status";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import type { z } from "zod";
import type { ExperienceStatus } from "@/generated/prisma/client";

type ReviewInput = z.infer<typeof experienceReviewSchema>;

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

const REUSE_INCLUDE = {
  user: { select: { id: true, displayName: true } },
} as const;

const ACTION_STATUS: Record<string, ExperienceStatus> = {
  approve: "reviewed",
  feature: "featured",
  unfeature: "reviewed",
  unarchive: "reviewed",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "experiences:review");
    const { id } = await params;

    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience) {
      throw new AppError("NOT_FOUND", "تجربه یافت نشد");
    }
    if (experience.isDraft) {
      throw new AppError("CONFLICT", "این تجربه هنوز منتشر نشده است");
    }

    const input = validateInput(
      experienceReviewSchema,
      await readJsonBody<ReviewInput>(request),
    );

    const targetStatus = ACTION_STATUS[input.action];
    if (!canTransition(experience.status, targetStatus)) {
      throw new AppError(
        "CONFLICT",
        "انتقال وضعیت از وضعیت فعلی امکان‌پذیر نیست",
      );
    }

    await prisma.experience.update({
      where: { id },
      data: {
        status: targetStatus,
        reviewedAt: new Date(),
        needsReview: false,
        moderationNote: input.note ?? null,
      },
    });

    await auditLog({
      actorId: user.id,
      action: `experience.review.${input.action}`,
      entityType: "Experience",
      entityId: id,
      details: { from: experience.status, to: targetStatus, note: input.note },
      ip,
    });

    const updated = await prisma.experience.findUnique({
      where: { id },
      include: {
        author: { select: AUTHOR_SELECT },
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