import type { AccountStatus } from "@/generated/prisma/client";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "فعال",
  warned: "اخطار",
  restricted: "محدود",
  suspended: "معلق",
};

export const ACCOUNT_STATUS_TONES: Record<
  AccountStatus,
  "neutral" | "brand" | "success" | "warning" | "danger" | "info"
> = {
  active: "success",
  warned: "warning",
  restricted: "warning",
  suspended: "danger",
};

export const ACCOUNT_STATUS_MESSAGES: Record<AccountStatus, string | null> = {
  active: null,
  warned: "حساب شما اخطار گرفته است. لطفاً قواعد انتشار محتوا را رعایت کنید.",
  restricted:
    "حساب شما به‌طور موقت محدود شده و اجازه انتشار محتوای جدید را ندارد.",
  suspended:
    "حساب شما معلق است. برای اعتراض به این تصمیم از مسیر «اعتراض به تصمیم» استفاده کنید.",
};

export const MODERATION_ACTION_LABELS: Record<string, string> = {
  warn: "اخطار",
  restrict: "محدودسازی",
  suspend: "تعلیق",
  lift: "رفع محدودیت",
  hide_content: "مخفی‌سازی محتوا",
  unhide_content: "نمایش دوباره",
  remove_content: "حذف محتوا",
  restore_content: "بازیابی محتوا",
};

export const MODERATION_TARGET_LABELS: Record<string, string> = {
  problem: "مسئله",
  answer: "پاسخ",
  experience: "تجربه",
  user: "کاربر",
};