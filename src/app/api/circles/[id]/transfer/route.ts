import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { circleTransferSchema } from "@/lib/validations/circle";
import { assertCircleFacilitator } from "@/lib/circles";
import type { z } from "zod";

type CircleTransferInput = z.infer<typeof circleTransferSchema>;

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
      circleTransferSchema,
      await readJsonBody<CircleTransferInput>(request),
    );

    await assertCircleFacilitator(id, user.id);
    if (input.memberId === user.id) {
      throw new AppError("VALIDATION", "راهبری به خودتان قابل انتقال نیست");
    }

    const targetMembership = await prisma.circleMembership.findUnique({
      where: {
        circleId_userId: { circleId: id, userId: input.memberId },
      },
    });
    if (!targetMembership || targetMembership.status !== "active") {
      throw new AppError("NOT_FOUND", "عضو فعالی با این مشخصات در حلقه نیست");
    }

    await prisma.$transaction(async (tx) => {
      await tx.circleMembership.update({
        where: { id: targetMembership.id },
        data: { role: "facilitator" },
      });
      await tx.circleMembership.update({
        where: { circleId_userId: { circleId: id, userId: user.id } },
        data: { role: "member" },
      });
      await tx.circle.update({
        where: { id },
        data: { facilitatorId: input.memberId },
      });
    });

    await auditLog({
      actorId: user.id,
      action: "circle.transfer",
      entityType: "Circle",
      entityId: id,
      details: { newFacilitatorId: input.memberId },
      ip,
    });

    return jsonOk({ transferred: true });
  } catch (error) {
    return jsonError(error);
  }
}