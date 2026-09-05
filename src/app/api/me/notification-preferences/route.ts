import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { AppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/auth/session";
import { notificationPreferencesSchema } from "@/lib/validations/notification";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification";
import type { z } from "zod";

type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;

export async function GET() {
  try {
    const user = await requireUser();

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: user.id },
    });
    const byType = new Map(preferences.map((item) => [item.type, item.enabled]));

    return jsonOk({
      preferences: NOTIFICATION_TYPES.map((type) => ({
        type,
        enabled: byType.get(type) ?? true,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();

    const input = validateInput(
      notificationPreferencesSchema,
      await readJsonBody<NotificationPreferencesInput>(request),
    );

    const validTypes = new Set<string>(NOTIFICATION_TYPES);
    for (const item of input.preferences) {
      if (!validTypes.has(item.type)) {
        throw new AppError("VALIDATION", "نوع اعلان نامعتبر است");
      }
    }

    await prisma.$transaction(
      input.preferences.map((item) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_type: { userId: user.id, type: item.type },
          },
          create: { userId: user.id, type: item.type, enabled: item.enabled },
          update: { enabled: item.enabled },
        }),
      ),
    );

    await auditLog({
      actorId: user.id,
      action: "notification.preferences.update",
      entityType: "NotificationPreference",
      entityId: user.id,
      details: { count: input.preferences.length },
      ip,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}