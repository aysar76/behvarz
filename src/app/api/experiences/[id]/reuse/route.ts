import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { experienceReuseSchema } from "@/lib/validations/experience";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import type { z } from "zod";

type ReuseInput = z.infer<typeof experienceReuseSchema>;

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "experiences:reuse");
    const { id } = await params;

    if (isRateLimited(`experiences:reuse:${user.id}`, 10, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد ثبت اجرای مجدد در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience || experience.moderation !== "visible") {
      throw new AppError("NOT_FOUND", "تجربه یافت نشد");
    }
    if (experience.isDraft) {
      throw new AppError("CONFLICT", "این تجربه هنوز منتشر نشده است");
    }
    if (experience.status === "archived") {
      throw new AppError("CONFLICT", "تجربه بایگانی‌شده است");
    }

    const input = validateInput(
      experienceReuseSchema,
      await readJsonBody<ReuseInput>(request),
    );

    await prisma.experienceReuse.upsert({
      where: {
        experienceId_userId: {
          experienceId: experience.id,
          userId: user.id,
        },
      },
      update: {
        outcome: input.outcome,
        summary: input.summary,
      },
      create: {
        experienceId: experience.id,
        userId: user.id,
        outcome: input.outcome,
        summary: input.summary,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "experience.reuse",
      entityType: "Experience",
      entityId: experience.id,
      details: { outcome: input.outcome },
      ip,
    });

    const updated = await prisma.experience.findUnique({
      where: { id: experience.id },
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