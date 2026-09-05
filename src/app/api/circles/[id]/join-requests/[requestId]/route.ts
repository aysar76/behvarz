import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { circleJoinReviewSchema } from "@/lib/validations/circle";
import { assertCircleFacilitator, countActiveMembers } from "@/lib/circles";
import type { z } from "zod";

type CircleJoinReviewInput = z.infer<typeof circleJoinReviewSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:manage");
    const { id, requestId } = await params;

    const input = validateInput(
      circleJoinReviewSchema,
      await readJsonBody<CircleJoinReviewInput>(request),
    );

    await assertCircleFacilitator(id, user.id);

    const joinRequest = await prisma.circleJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!joinRequest || joinRequest.circleId !== id) {
      throw new AppError("NOT_FOUND", "درخواست عضویت یافت نشد");
    }
    if (joinRequest.status !== "pending") {
      throw new AppError("CONFLICT", "این درخواست قبلاً بررسی شده است");
    }

    if (input.action === "approve") {
      const activeCount = await countActiveMembers(id);
      const circle = await prisma.circle.findUnique({ where: { id } });
      if (!circle || activeCount >= circle.capacity) {
        throw new AppError("CONFLICT", "ظرفیت حلقه تکمیل شده است");
      }

      const existingMembership = await prisma.circleMembership.findUnique({
        where: { circleId_userId: { circleId: id, userId: joinRequest.userId } },
      });

      await prisma.$transaction(async (tx) => {
        if (existingMembership) {
          await tx.circleMembership.update({
            where: { id: existingMembership.id },
            data: { status: "active", leftAt: null },
          });
        } else {
          await tx.circleMembership.create({
            data: { circleId: id, userId: joinRequest.userId },
          });
        }
        await tx.circleJoinRequest.update({
          where: { id: requestId },
          data: { status: "approved", reviewedAt: new Date() },
        });
      });
    } else {
      await prisma.circleJoinRequest.update({
        where: { id: requestId },
        data: { status: "rejected", reviewedAt: new Date() },
      });
    }

    await auditLog({
      actorId: user.id,
      action: `circle.join-request.${input.action}`,
      entityType: "Circle",
      entityId: id,
      details: { requestId, userId: joinRequest.userId },
      ip,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:join");
    const { id, requestId } = await params;

    const joinRequest = await prisma.circleJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!joinRequest || joinRequest.circleId !== id) {
      throw new AppError("NOT_FOUND", "درخواست عضویت یافت نشد");
    }
    if (joinRequest.userId !== user.id) {
      throw new AppError("FORBIDDEN", "فقط خود درخواست‌دهنده می‌تواند درخواست را لغو کند");
    }
    if (joinRequest.status !== "pending") {
      throw new AppError("CONFLICT", "این درخواست قابل لغو نیست");
    }

    await prisma.circleJoinRequest.update({
      where: { id: requestId },
      data: { status: "canceled", reviewedAt: new Date() },
    });

    await auditLog({
      actorId: user.id,
      action: "circle.join-request.cancel",
      entityType: "Circle",
      entityId: id,
      ip,
    });

    return jsonOk({ canceled: true });
  } catch (error) {
    return jsonError(error);
  }
}