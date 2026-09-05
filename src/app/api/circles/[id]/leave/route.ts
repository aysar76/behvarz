import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { getActiveMembership } from "@/lib/circles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:join");
    const { id } = await params;

    const membership = await getActiveMembership(id, user.id);
    if (!membership || membership.status !== "active") {
      throw new AppError("NOT_FOUND", "عضو این حلقه نیستید");
    }

    if (membership.role === "facilitator") {
      const otherMembers = await prisma.circleMembership.count({
        where: { circleId: id, status: "active", userId: { not: user.id } },
      });
      if (otherMembers > 0) {
        throw new AppError(
          "CONFLICT",
          "راهبر باید ابتدا راهبری را به عضو دیگری منتقل کند یا حلقه را بایگانی کند",
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.circleMembership.update({
        where: { id: membership.id },
        data: { status: "left", leftAt: new Date() },
      });

      const remaining = await tx.circleMembership.count({
        where: { circleId: id, status: "active" },
      });
      if (remaining === 0) {
        await tx.circle.update({
          where: { id },
          data: { status: "archived" },
        });
      }
    });

    await auditLog({
      actorId: user.id,
      action: "circle.leave",
      entityType: "Circle",
      entityId: id,
      ip,
    });

    return jsonOk({ left: true });
  } catch (error) {
    return jsonError(error);
  }
}