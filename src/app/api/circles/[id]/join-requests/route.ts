import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { circleJoinSchema } from "@/lib/validations/circle";
import { countActiveMembers } from "@/lib/circles";
import type { z } from "zod";

type CircleJoinInput = z.infer<typeof circleJoinSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:join");
    const { id } = await params;

    if (isRateLimited(`circles:join:${user.id}`, 10, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد درخواست عضویت در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      circleJoinSchema,
      await readJsonBody<CircleJoinInput>(request),
    );

    const circle = await prisma.circle.findUnique({ where: { id } });
    if (!circle || circle.status !== "active") {
      throw new AppError("NOT_FOUND", "حلقه یافت نشد");
    }

    const existingMembership = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId: id, userId: user.id } },
    });
    if (existingMembership?.status === "active") {
      throw new AppError("CONFLICT", "شما عضو این حلقه هستید");
    }

    const existingRequest = await prisma.circleJoinRequest.findUnique({
      where: { circleId_userId: { circleId: id, userId: user.id } },
    });
    if (existingRequest?.status === "pending") {
      throw new AppError("CONFLICT", "درخواست شما برای این حلقه در انتظار تأیید است");
    }

    const activeCount = await countActiveMembers(id);
    if (activeCount >= circle.capacity) {
      throw new AppError("CONFLICT", "ظرفیت این حلقه تکمیل شده است");
    }

    if (existingRequest) {
      await prisma.circleJoinRequest.update({
        where: { id: existingRequest.id },
        data: { status: "pending", message: input.message ?? null, reviewedAt: null },
      });
    } else {
      await prisma.circleJoinRequest.create({
        data: {
          circleId: id,
          userId: user.id,
          message: input.message ?? null,
        },
      });
    }

    await auditLog({
      actorId: user.id,
      action: "circle.join-request",
      entityType: "Circle",
      entityId: id,
      ip,
    });

    return jsonOk({ requested: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}