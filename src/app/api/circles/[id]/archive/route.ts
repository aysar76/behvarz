import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { assertCircleFacilitator } from "@/lib/circles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:manage");
    const { id } = await params;

    const isAdmin =
      user.role === "admin" || user.role === "super_admin";
    if (!isAdmin) {
      await assertCircleFacilitator(id, user.id);
    }

    const circle = await prisma.circle.findUnique({ where: { id } });
    if (!circle) {
      throw new AppError("NOT_FOUND", "حلقه یافت نشد");
    }
    if (circle.status === "archived") {
      throw new AppError("CONFLICT", "این حلقه قبلاً بایگانی شده است");
    }

    await prisma.circle.update({
      where: { id },
      data: { status: "archived" },
    });

    await auditLog({
      actorId: user.id,
      action: "circle.archive",
      entityType: "Circle",
      entityId: id,
      ip,
    });

    return jsonOk({ archived: true });
  } catch (error) {
    return jsonError(error);
  }
}