import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "moderation:appeals");

    const appeals = await prisma.appeal.findMany({
      where: { status: "pending" },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            accountStatus: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    await auditLog({
      actorId: user.id,
      action: "admin.appeals.list",
      entityType: "Appeal",
      ip,
    });

    return jsonOk({ appeals });
  } catch (error) {
    return jsonError(error);
  }
}