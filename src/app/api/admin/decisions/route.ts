import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import {
  serializeDecision,
  type DecisionRow,
} from "@/lib/moderation";

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "moderation:decisions");

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("pageSize")) || 20),
    );

    const [rows, total] = await Promise.all([
      prisma.moderationDecision.findMany({
        include: {
          moderator: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.moderationDecision.count(),
    ]);

    await auditLog({
      actorId: user.id,
      action: "admin.decisions.list",
      entityType: "ModerationDecision",
      ip,
    });

    return jsonOk({
      decisions: (rows as unknown as DecisionRow[]).map(serializeDecision),
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    return jsonError(error);
  }
}