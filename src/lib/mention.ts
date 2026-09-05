import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

/**
 * تشخیص کنترل‌شدهٔ Mention در متن پاسخ.
 * الگو: «@اسم‌نمایشی» (بدون فاصله بعد از @)؛ در MVP فقط یک‌بار برای هر کاربر
 * و فقط به کاربران فعال با پروفایل عمومی/اعضا اعلان داده می‌شود. این یک
 * ابزار اشارهٔ حرفه‌ای است نه پیام‌رسانی آزاد.
 */
const MENTION_PATTERN = /@([\u0600-\u06FF\w][\u0600-\u06FF\w._-]*)(?![\u0600-\u06FF\w])/g;

/** استخراج خام نام‌های Mention شده از متن (بدون DB) — برای تست پذیری جدا شده است. */
export function extractMentionNames(text: string): string[] {
  return [...new Set(text.match(MENTION_PATTERN) ?? [])].map((m) =>
    m.slice(1).trim(),
  );
}

export async function notifyMentions(
  text: string,
  actorId: string,
  context: {
    title: string;
    targetType: "problem" | "answer" | "experience";
    targetId: string;
  },
): Promise<number> {
  const mentions = extractMentionNames(text);
  if (mentions.length === 0) return 0;

  const users = await prisma.user.findMany({
    where: {
      displayName: { in: mentions },
      accountStatus: "active",
      onboardingCompleted: true,
      visibility: { not: "private" },
    },
    select: { id: true, displayName: true },
  });

  let sent = 0;
  for (const user of users) {
    const ok = await notifyUser({
      userId: user.id,
      type: "answer_mention",
      actorId,
      title: context.title,
      body: `شما در این مطلب اشاره شدید`,
      targetType: context.targetType,
      targetId: context.targetId,
    });
    if (ok) sent += 1;
  }
  return sent;
}