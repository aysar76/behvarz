import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { followSchema } from "@/lib/validations/interaction";
import type { z } from "zod";

type FollowInput = z.infer<typeof followSchema>;

async function resolveTarget(
  input: FollowInput,
): Promise<{ label: string; visible: boolean }> {
  switch (input.targetType) {
    case "tag": {
      const tag = await prisma.tag.findUnique({
        where: { name: input.targetId },
        select: { name: true },
      });
      if (!tag) {
        throw new AppError("NOT_FOUND", "موضوع یافت نشد");
      }
      return { label: tag.name, visible: true };
    }
    case "problem": {
      const problem = await prisma.problem.findUnique({
        where: { id: input.targetId },
        select: {
          id: true,
          title: true,
          isDraft: true,
          moderation: true,
          publishedAt: true,
        },
      });
      if (
        !problem ||
        problem.isDraft ||
        problem.moderation !== "visible" ||
        problem.publishedAt === null
      ) {
        throw new AppError("NOT_FOUND", "مسئله یافت نشد");
      }
      return { label: problem.title, visible: true };
    }
    case "experience": {
      const experience = await prisma.experience.findUnique({
        where: { id: input.targetId },
        select: {
          id: true,
          title: true,
          isDraft: true,
          moderation: true,
          publishedAt: true,
          status: true,
        },
      });
      if (
        !experience ||
        experience.isDraft ||
        experience.moderation !== "visible" ||
        experience.publishedAt === null ||
        experience.status === "archived"
      ) {
        throw new AppError("NOT_FOUND", "تجربه یافت نشد");
      }
      return { label: experience.title, visible: true };
    }
    case "user": {
      const user = await prisma.user.findUnique({
        where: { id: input.targetId },
        select: {
          id: true,
          displayName: true,
          visibility: true,
          onboardingCompleted: true,
        },
      });
      if (!user || !user.onboardingCompleted) {
        throw new AppError("NOT_FOUND", "عضو یافت نشد");
      }
      if (user.visibility === "private") {
        return {
          label: user.displayName ?? "عضو",
          visible: false,
        };
      }
      return { label: user.displayName ?? "عضو", visible: true };
    }
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "interactions:follow");

    const input = validateInput(
      followSchema,
      await readJsonBody<FollowInput>(request),
    );

    const target = await resolveTarget(input);
    if (!target.visible) {
      throw new AppError(
        "FORBIDDEN",
        "این عضو پروفایل خود را خصوصی کرده است و قابل دنبال‌کردن نیست",
      );
    }
    if (input.targetType === "user" && input.targetId === user.id) {
      throw new AppError("VALIDATION", "نمی‌توانید خودتان را دنبال کنید");
    }

    const existing = await prisma.follow.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      },
    });
    if (existing) {
      throw new AppError("CONFLICT", "این مورد را قبلاً دنبال کرده‌اید");
    }

    await prisma.follow.create({
      data: {
        userId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "interaction.follow",
      entityType: `Follow:${input.targetType}`,
      entityId: input.targetId,
      details: { label: target.label },
      ip,
    });

    return jsonOk({ following: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "interactions:follow");

    const input = validateInput(
      followSchema,
      await readJsonBody<FollowInput>(request),
    );

    const deleted = await prisma.follow.deleteMany({
      where: {
        userId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });

    if (deleted.count === 0) {
      throw new AppError("NOT_FOUND", "این مورد را دنبال نکرده‌اید");
    }

    await auditLog({
      actorId: user.id,
      action: "interaction.unfollow",
      entityType: `Follow:${input.targetType}`,
      entityId: input.targetId,
      ip,
    });

    return jsonOk({ following: false });
  } catch (error) {
    return jsonError(error);
  }
}