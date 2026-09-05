import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import {
  serializeModerationUser,
  type ModerationUserRow,
} from "@/lib/moderation";

const STATUS_FILTERS = ["active", "warned", "restricted", "suspended"] as const;

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "moderation:users");

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("pageSize")) || 20),
    );

    const where: Record<string, unknown> = {};
    if (status && (STATUS_FILTERS as readonly string[]).includes(status)) {
      where.accountStatus = status;
    }
    if (q) {
      where.OR = [
        { displayName: { contains: q } },
        { phone: { contains: q } },
        { province: { contains: q } },
        { city: { contains: q } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          phone: true,
          role: true,
          membershipStatus: true,
          accountStatus: true,
          accountStatusReason: true,
          accountStatusAt: true,
          province: true,
          city: true,
          createdAt: true,
          _count: {
            select: { problems: true, experiences: true, problemReports: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    await auditLog({
      actorId: user.id,
      action: "admin.users.list",
      entityType: "User",
      ip,
    });

    return jsonOk({
      users: (rows as unknown as ModerationUserRow[]).map(
        serializeModerationUser,
      ),
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    return jsonError(error);
  }
}