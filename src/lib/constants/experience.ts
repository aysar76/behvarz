import type { ExperienceReuseOutcome, ExperienceStatus } from "@/generated/prisma/client";

export const EXPERIENCE_STATUS_LABELS: Record<ExperienceStatus, string> = {
  user_generated: "تجربه شخصی",
  under_review: "در بررسی",
  reviewed: "بررسی‌شده",
  featured: "برگزیده",
  archived: "بایگانی‌شده",
};

export const EXPERIENCE_REUSE_OUTCOMES: {
  value: ExperienceReuseOutcome;
  label: string;
}[] = [
  { value: "successful", label: "موفق بود" },
  { value: "partial", label: "تا حدی موفق بود" },
  { value: "unsuccessful", label: "موفق نبود" },
];

export const EXPERIENCE_REUSE_OUTCOME_LABELS: Record<
  ExperienceReuseOutcome,
  string
> = {
  successful: "موفق بود",
  partial: "تا حدی موفق بود",
  unsuccessful: "موفق نبود",
};

export const EXPERIENCE_TAGS: string[] = [
  "واکسیناسیون",
  "بهداشت محیط",
  "آموزش سلامت",
  "بیماری‌های واگیر",
  "بیماری‌های غیرواگیر",
  "تغذیه",
  "سلامت مادر و کودک",
  "سلامت روان",
  "سلامت سالمندان",
  "اورژانس و کمک‌های اولیه",
  "تجهیزات",
  "نیروی انسانی",
  "فرایند اداری",
  "ارتباط با جامعه",
  "پایش و ارزشیابی",
];

export const MAX_EXPERIENCE_TAGS = 5;
export const MAX_EXPERIENCE_TITLE_LENGTH = 120;
export const MAX_EXPERIENCE_FIELD_LENGTH = 2000;
export const MAX_EXPERIENCE_OPTIONAL_LENGTH = 800;
export const MAX_EXPERIENCE_REUSE_SUMMARY_LENGTH = 800;
export const MAX_EXPERIENCE_REUSE_COUNT = 3;

export const EXPERIENCE_REPORT_REASONS: { value: string; label: string }[] = [
  { value: "sensitive_info", label: "شامل اطلاعات قابل شناسایی بیمار" },
  { value: "medical_advice", label: "محتوای پزشکی گمراه‌کننده" },
  { value: "offensive", label: "رفتار توهین‌آمیز یا نامناسب" },
  { value: "spam", label: "اسپم یا تبلیغ" },
  { value: "other", label: "سایر" },
];