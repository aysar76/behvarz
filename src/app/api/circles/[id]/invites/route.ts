import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { circleInviteSchema } from "@/lib/validations/circle";
import { assertCircleFacilitator, countActiveMembers } from "@/lib/circles";
import { notifyUser } from "@/lib/notifications";
import type { z } from "zod";

type CircleInviteInput = z.infer<typeof circleInviteSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:manage");
    const { id } = await params;

    const input = validateInput(
      circleInviteSchema,
      await readJsonBody<CircleInviteInput>(request),
    );

    await assertCircleFacilitator(id, user.id);

    const circle = await prisma.circle.findUnique({ where: { id } });
    if (!circle || circle.status !== "active") {
      throw new AppError("NOT_FOUND", "حلقه یافت نشد");
    }
    if (input.userId === user.id) {
      throw new AppError("VALIDATION", "نمی‌توانید خودتان را دعوت کنید");
    }

    const invitee = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, onboardingCompleted: true },
    });
    if (!invitee || !invitee.onboardingCompleted) {
      throw new AppError("NOT_FOUND", "عضو یافت نشد");
    }

    const existingMembership = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId: id, userId: input.userId } },
    });
    if (existingMembership?.status === "active") {
      throw new AppError("CONFLICT", "این عضو در حلقه حضور دارد");
    }

    const existingInvite = await prisma.circleInvite.findUnique({
      where: { circleId_userId: { circleId: id, userId: input.userId } },
    });
    if (existingInvite?.status === "pending") {
      throw new AppError("CONFLICT", "این عضو قبلاً دعوت شده است");
    }

    const activeCount = await countActiveMembers(id);
    if (activeCount >= circle.capacity) {
      throw new AppError("CONFLICT", "ظرفیت حلقه تکمیل شده است");
    }

    if (existingInvite) {
      await prisma.circleInvite.update({
        where: { id: existingInvite.id },
        data: { status: "pending", message: input.message ?? null, respondedAt: null },
      });
    } else {
      await prisma.circleInvite.create({
        data: {
          circleId: id,
          userId: input.userId,
          invitedById: user.id,
          message: input.message ?? null,
        },
      });
    }

    await auditLog({
      actorId: user.id,
      action: "circle.invite",
      entityType: "Circle",
      entityId: id,
      details: { userId: input.userId },
      ip,
    });

    await notifyUser({
      userId: input.userId,
      type: "circle_invite",
      actorId: user.id,
      title: `شما به حلقه «${circle.name}» دعوت شدید`,
      targetType: "circle",
      targetId: id,
    });

    return jsonOk({ invited: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}