import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { experienceModerationSchema } from "@/lib/validations/experience";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import type { z } from "zod";
import type { ModerationState } from "@/generated/prisma/client";

type ModerationInput = z.infer<typeof experienceModerationSchema>;

const ACTION_STATE: Record<string, ModerationState> = {
  hide: "hidden",
  unhide: "visible",
  remove: "removed",
  restore: "visible",
};

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
    assertPermission(user, "content:moderate");
    const { id } = await params;

    const experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        author: { select: AUTHOR_SELECT },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        sourceProblem: { select: { id: true, title: true } },
        reuses: { include: REUSE_INCLUDE, orderBy: { createdAt: "desc" } },
        _count: { select: { references: true, reuses: true } },
      },
    });
    if (!experience) {
      throw new AppError("NOT_FOUND", "تجربه یافت نشد");
    }

    const input = validateInput(
      experienceModerationSchema,
      await readJsonBody<ModerationInput>(request),
    );

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        moderation: ACTION_STATE[input.action],
        moderationNote: input.note ?? null,
        needsReview: false,
      },
      include: {
        author: { select: AUTHOR_SELECT },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        sourceProblem: { select: { id: true, title: true } },
        reuses: { include: REUSE_INCLUDE, orderBy: { createdAt: "desc" } },
        _count: { select: { references: true, reuses: true } },
      },
    });

    await auditLog({
      actorId: user.id,
      action: `moderation.experience.${input.action}`,
      entityType: "Experience",
      entityId: id,
      details: { note: input.note },
      ip,
    });

    return jsonOk({
      experience: serializeExperience(updated as unknown as ExperienceRow),
    });
  } catch (error) {
    return jsonError(error);
  }
}