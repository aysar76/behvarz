import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { assertAccountCanInteract } from "@/lib/moderation";
import { thanksSchema } from "@/lib/validations/interaction";
import type { z } from "zod";

type ThanksInput = z.infer<typeof thanksSchema>;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "interactions:thanks");
    assertAccountCanInteract(user);

    const input = validateInput(
      thanksSchema,
      await readJsonBody<ThanksInput>(request),
    );

    const existing = await prisma.professionalThanks.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      },
    });
    if (existing) {
      throw new AppError("CONFLICT", "قبلاً تشکر حرفه‌ای ثبت کرده‌اید");
    }

    let receivedById: string;

    if (input.targetType === "answer") {
      const answer = await prisma.problemAnswer.findFirst({
        where: { id: input.targetId },
        select: { id: true, authorId: true, moderation: true },
      });
      if (!answer || answer.moderation !== "visible") {
        throw new AppError("NOT_FOUND", "پاسخ یافت نشد");
      }
      if (answer.authorId === user.id) {
        throw new AppError(
          "VALIDATION",
          "نمی‌توانید به پاسخ خودتان تشکر حرفه‌ای بدهید",
        );
      }
      receivedById = answer.authorId;

      await prisma.$transaction([
        prisma.professionalThanks.create({
          data: {
            userId: user.id,
            targetType: input.targetType,
            targetId: input.targetId,
            answerId: answer.id,
            receivedById,
          },
        }),
        prisma.problemAnswer.update({
          where: { id: answer.id },
          data: { thanksCount: { increment: 1 } },
        }),
      ]);
    } else {
      const experience = await prisma.experience.findUnique({
        where: { id: input.targetId },
        select: {
          id: true,
          authorId: true,
          moderation: true,
          isDraft: true,
          status: true,
        },
      });
      if (
        !experience ||
        experience.moderation !== "visible" ||
        experience.isDraft ||
        experience.status === "archived"
      ) {
        throw new AppError("NOT_FOUND", "تجربه یافت نشد");
      }
      if (experience.authorId === user.id) {
        throw new AppError(
          "VALIDATION",
          "نمی‌توانید به تجربه خودتان تشکر حرفه‌ای بدهید",
        );
      }
      receivedById = experience.authorId;

      await prisma.$transaction([
        prisma.professionalThanks.create({
          data: {
            userId: user.id,
            targetType: input.targetType,
            targetId: input.targetId,
            experienceId: experience.id,
            receivedById,
          },
        }),
        prisma.experience.update({
          where: { id: experience.id },
          data: { thanksCount: { increment: 1 } },
        }),
      ]);
    }

    await auditLog({
      actorId: user.id,
      action: "interaction.thanks",
      entityType: `ProfessionalThanks:${input.targetType}`,
      entityId: input.targetId,
      details: { receivedById },
      ip,
    });

    return jsonOk({ thanked: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "interactions:thanks");
    assertAccountCanInteract(user);

    const input = validateInput(
      thanksSchema,
      await readJsonBody<ThanksInput>(request),
    );

    const existing = await prisma.professionalThanks.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      },
    });
    if (!existing) {
      throw new AppError("NOT_FOUND", "تشکر حرفه‌ای ثبت نکرده‌اید");
    }

    if (input.targetType === "answer") {
      await prisma.$transaction([
        prisma.professionalThanks.delete({
          where: {
            userId_targetType_targetId: {
              userId: user.id,
              targetType: input.targetType,
              targetId: input.targetId,
            },
          },
        }),
        prisma.problemAnswer.update({
          where: { id: input.targetId },
          data: { thanksCount: { decrement: 1 } },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.professionalThanks.delete({
          where: {
            userId_targetType_targetId: {
              userId: user.id,
              targetType: input.targetType,
              targetId: input.targetId,
            },
          },
        }),
        prisma.experience.update({
          where: { id: input.targetId },
          data: { thanksCount: { decrement: 1 } },
        }),
      ]);
    }

    await auditLog({
      actorId: user.id,
      action: "interaction.unthanks",
      entityType: `ProfessionalThanks:${input.targetType}`,
      entityId: input.targetId,
      ip,
    });

    return jsonOk({ thanked: false });
  } catch (error) {
    return jsonError(error);
  }
}