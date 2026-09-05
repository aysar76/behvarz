import { prisma } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/client";

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  title: string;
  body?: string | null;
  targetType?: "problem" | "answer" | "experience" | "circle" | "cooperation" | "appeal";
  targetId?: string | null;
}

/**
 * ایجاد اعلان برای یک کاربر، مشروط به فعال‌بودن نوع آن در تنظیمات کاربر.
 * کاربر به محتوای خودش اعلان نمی‌گیرد (actorId === userId نادیده گرفته می‌شود).
 * در MVP فقط اعلان درون‌برنامه‌ای است؛ Provider های SMS/Push/Email بعداً افزوده می‌شوند.
 */
export async function notifyUser(
  input: NotificationInput,
): Promise<boolean> {
  if (input.actorId && input.actorId === input.userId) return false;

  const preference = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId: input.userId, type: input.type } },
  });
  if (preference && !preference.enabled) return false;

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      actorId: input.actorId ?? null,
      title: input.title,
      body: input.body ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
    },
  });
  return true;
}

/** آیا نوع اعلان به‌صورت پیش‌فرض فعال است؟ (برای UI تنظیمات) */
export function isNotificationTypeEnabledByDefault(): boolean {
  return true;
}
