import type { CampaignFamily, CampaignStatus } from "@/generated/prisma/client";

export const CAMPAIGN_FAMILIES: {
  value: CampaignFamily;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "learning",
    label: "یادگیری",
    emoji: "📚",
    description: "یادگیری کوتاه و کاربردی متصل به مسائل واقعی",
  },
  {
    value: "cooperation",
    label: "همکاری",
    emoji: "🤝",
    description: "همیاری و همکاری دونفره یا در حلقه‌های کوچک",
  },
  {
    value: "network",
    label: "شبکه",
    emoji: "🌐",
    description: "اتصال، معرفی و شبکه‌سازی حرفه‌ای",
  },
  {
    value: "innovation",
    label: "نوآوری",
    emoji: "💡",
    description: "ایده‌ها و راهکارهای نو برای مسائل میدانی",
  },
  {
    value: "growth",
    label: "رشد",
    emoji: "🌱",
    description: "رشد حرفه‌ای و دیده‌شدن مبتنی بر شواهد",
  },
  {
    value: "mission",
    label: "مأموریت",
    emoji: "🎯",
    description: "مأموریت‌های سبک و اختیاری برای مشارکت",
  },
];

export const CAMPAIGN_FAMILY_LABELS: Record<CampaignFamily, string> =
  Object.fromEntries(
    CAMPAIGN_FAMILIES.map((item) => [item.value, item.label]),
  ) as Record<CampaignFamily, string>;

export const CAMPAIGN_FAMILY_EMOJIS: Record<CampaignFamily, string> =
  Object.fromEntries(
    CAMPAIGN_FAMILIES.map((item) => [item.value, item.emoji]),
  ) as Record<CampaignFamily, string>;

export const CAMPAIGN_STATUSES: {
  value: CampaignStatus;
  label: string;
}[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "active", label: "فعال" },
  { value: "completed", label: "تکمیل‌شده" },
  { value: "archived", label: "بایگانی‌شده" },
];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  completed: "تکمیل‌شده",
  archived: "بایگانی‌شده",
};

export const CAMPAIGN_STATUS_TONES: Record<
  CampaignStatus,
  "neutral" | "success" | "warning" | "info" | "danger" | "brand"
> = {
  draft: "neutral",
  active: "success",
  completed: "info",
  archived: "neutral",
};

export const MAX_CAMPAIGN_TITLE_LENGTH = 120;
export const MAX_CAMPAIGN_DESCRIPTION_LENGTH = 3000;