import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { circleInviteRespondSchema } from "@/lib/validations/circle";
import { countActiveMembers } from "@/lib/circles";
import type { z } from "zod";

type CircleInviteRespondInput = z.infer<typeof circleInviteRespondSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:join");
    const { id, inviteId } = await params;

    const input = validateInput(
      circleInviteRespondSchema,
      await readJsonBody<CircleInviteRespondInput>(request),
    );

    const invite = await prisma.circleInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.circleId !== id) {
      throw new AppError("NOT_FOUND", "دعوت‌نامه یافت نشد");
    }
    if (invite.userId !== user.id) {
      throw new AppError("FORBIDDEN", "این دعوت‌نامه برای شما نیست");
    }
    if (invite.status !== "pending") {
      throw new AppError("CONFLICT", "این دعوت‌نامه قبلاً پاسخ داده شده است");
    }

    if (input.action === "accept") {
      const circle = await prisma.circle.findUnique({ where: { id } });
      if (!circle || circle.status !== "active") {
        throw new AppError("NOT_FOUND", "حلقه یافت نشد");
      }
      const activeCount = await countActiveMembers(id);
      if (activeCount >= circle.capacity) {
        throw new AppError("CONFLICT", "ظرفیت حلقه تکمیل شده است");
      }

      const existingMembership = await prisma.circleMembership.findUnique({
        where: { circleId_userId: { circleId: id, userId: user.id } },
      });

      await prisma.$transaction(async (tx) => {
        if (existingMembership) {
          await tx.circleMembership.update({
            where: { id: existingMembership.id },
            data: { status: "active", leftAt: null },
          });
        } else {
          await tx.circleMembership.create({
            data: { circleId: id, userId: user.id },
          });
        }
        await tx.circleInvite.update({
          where: { id: inviteId },
          data: { status: "accepted", respondedAt: new Date() },
        });
        await tx.circleJoinRequest.updateMany({
          where: { circleId: id, userId: user.id, status: "pending" },
          data: { status: "approved", reviewedAt: new Date() },
        });
      });
    } else {
      await prisma.circleInvite.update({
        where: { id: inviteId },
        data: { status: "declined", respondedAt: new Date() },
      });
    }

    await auditLog({
      actorId: user.id,
      action: `circle.invite.${input.action}`,
      entityType: "Circle",
      entityId: id,
      ip,
    });

    return jsonOk({ responded: true });
  } catch (error) {
    return jsonError(error);
  }
}