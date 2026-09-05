import type {
  ProblemBarrierType,
  ProblemResultOutcome,
  ProblemStatus,
  ProblemUrgency,
  ReportStatus,
} from "@/generated/prisma/client";

export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  open: "باز",
  discussing: "در حال بررسی",
  solved: "حل‌شده",
  archived: "بایگانی‌شده",
};

export const PROBLEM_URGENCIES: { value: ProblemUrgency; label: string }[] = [
  { value: "low", label: "کم" },
  { value: "medium", label: "متوسط" },
  { value: "high", label: "زیاد" },
  { value: "critical", label: "بحرانی" },
];

export const PROBLEM_URGENCY_LABELS: Record<ProblemUrgency, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  critical: "بحرانی",
};

export const PROBLEM_BARRIER_TYPES: {
  value: ProblemBarrierType;
  label: string;
}[] = [
  { value: "resources", label: "کمبود منابع و امکانات" },
  { value: "knowledge", label: "نیاز به دانش یا مهارت" },
  { value: "process", label: "فرایند و هماهنگی اداری" },
  { value: "community", label: "مسئله با جامعه و خانواده‌ها" },
  { value: "equipment", label: "تجهیزات و ابزار" },
  { value: "other", label: "سایر" },
];

export const PROBLEM_BARRIER_LABELS: Record<ProblemBarrierType, string> = {
  resources: "کمبود منابع و امکانات",
  knowledge: "نیاز به دانش یا مهارت",
  process: "فرایند و هماهنگی اداری",
  community: "مسئله با جامعه و خانواده‌ها",
  equipment: "تجهیزات و ابزار",
  other: "سایر",
};

export const PROBLEM_RESULT_OUTCOMES: {
  value: ProblemResultOutcome;
  label: string;
}[] = [
  { value: "successful", label: "موفق بود" },
  { value: "partial", label: "تا حدی موفق بود" },
  { value: "unsuccessful", label: "موفق نبود" },
];

export const PROBLEM_RESULT_OUTCOME_LABELS: Record<
  ProblemResultOutcome,
  string
> = {
  successful: "موفق بود",
  partial: "تا حدی موفق بود",
  unsuccessful: "موفق نبود",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "در انتظار",
  reviewing: "در حال بررسی",
  resolved: "بررسی‌شده",
  rejected: "رد شده",
};

export const PROBLEM_TAGS: string[] = [
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

export const MAX_PROBLEM_TAGS = 5;
export const MAX_ANSWER_LENGTH = 2000;
export const MAX_PROBLEM_TITLE_LENGTH = 120;
export const MAX_PROBLEM_DESCRIPTION_LENGTH = 2000;

export const PROBLEM_REPORT_REASONS: { value: string; label: string }[] = [
  { value: "sensitive_info", label: "شامل اطلاعات قابل شناسایی بیمار" },
  { value: "medical_advice", label: "محتوای پزشکی گمراه‌کننده" },
  { value: "offensive", label: "رفتار توهین‌آمیز یا نامناسب" },
  { value: "spam", label: "اسپم یا تبلیغ" },
  { value: "other", label: "سایر" },
];
