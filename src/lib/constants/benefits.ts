import type {
  BenefitProviderCategory,
  BenefitProviderStatus,
  BenefitReportReason,
  BenefitReportStatus,
  BudgetProposalCategory,
  BudgetProposalStatus,
} from "@/generated/prisma/client";

export const BENEFIT_PROVIDER_CATEGORIES: {
  value: BenefitProviderCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "health", label: "سلامت و درمان", emoji: "🏥" },
  { value: "education", label: "آموزش", emoji: "🎓" },
  { value: "equipment", label: "تجهیزات", emoji: "🧰" },
  { value: "insurance", label: "بیمه", emoji: "🛡️" },
  { value: "transport", label: "حمل‌ونقل", emoji: "🚌" },
  { value: "telecom", label: "ارتباطات", emoji: "📶" },
  { value: "retail", label: "فروش و خدمات", emoji: "🛍️" },
  { value: "other", label: "سایر", emoji: "✨" },
];

export const BENEFIT_PROVIDER_CATEGORY_LABELS: Record<
  BenefitProviderCategory,
  string
> = Object.fromEntries(
  BENEFIT_PROVIDER_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<BenefitProviderCategory, string>;

export const BENEFIT_PROVIDER_CATEGORY_EMOJIS: Record<
  BenefitProviderCategory,
  string
> = Object.fromEntries(
  BENEFIT_PROVIDER_CATEGORIES.map((c) => [c.value, c.emoji]),
) as Record<BenefitProviderCategory, string>;

export const BENEFIT_PROVIDER_STATUSES: {
  value: BenefitProviderStatus;
  label: string;
}[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "approved", label: "تأییدشده" },
  { value: "archived", label: "بایگانی‌شده" },
];

export const BENEFIT_PROVIDER_STATUS_LABELS: Record<
  BenefitProviderStatus,
  string
> = {
  draft: "پیش‌نویس",
  approved: "تأییدشده",
  archived: "بایگانی‌شده",
};

export const BENEFIT_PROVIDER_STATUS_TONES: Record<
  BenefitProviderStatus,
  "neutral" | "success" | "warning" | "info" | "danger"
> = {
  draft: "warning",
  approved: "success",
  archived: "neutral",
};

export const BENEFIT_REPORT_REASONS: {
  value: BenefitReportReason;
  label: string;
}[] = [
  { value: "issue_service", label: "مشکل در ارائه خدمت" },
  { value: "misleading", label: "اطلاعات گمراه‌کننده" },
  { value: "sensitive_info", label: "افشای اطلاعات حساس" },
  { value: "complaint", label: "شکایت از ارائه‌دهنده" },
  { value: "other", label: "سایر" },
];

export const BENEFIT_REPORT_REASON_LABELS: Record<
  BenefitReportReason,
  string
> = Object.fromEntries(
  BENEFIT_REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<BenefitReportReason, string>;

export const BENEFIT_REPORT_STATUS_LABELS: Record<BenefitReportStatus, string> = {
  pending: "در انتظار",
  resolved: "بررسی‌شده",
  rejected: "رد شده",
};

export const BENEFIT_REPORT_STATUS_TONES: Record<
  BenefitReportStatus,
  "neutral" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  resolved: "success",
  rejected: "neutral",
};

export const BUDGET_PROPOSAL_STATUSES: {
  value: BudgetProposalStatus;
  label: string;
}[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "under_review", label: "در حال بررسی صلاحیت" },
  { value: "approved", label: "تأییدشده برای رأی‌گیری" },
  { value: "rejected", label: "رد شده" },
  { value: "voting", label: "در حال رأی‌گیری" },
  { value: "implemented", label: "اجرا شده" },
  { value: "closed", label: "بسته شده" },
];

export const BUDGET_PROPOSAL_STATUS_LABELS: Record<
  BudgetProposalStatus,
  string
> = {
  draft: "پیش‌نویس",
  under_review: "در حال بررسی صلاحیت",
  approved: "تأییدشده برای رأی‌گیری",
  rejected: "رد شده",
  voting: "در حال رأی‌گیری",
  implemented: "اجرا شده",
  closed: "بسته شده",
};

export const BUDGET_PROPOSAL_STATUS_TONES: Record<
  BudgetProposalStatus,
  "neutral" | "success" | "warning" | "info" | "danger" | "brand"
> = {
  draft: "neutral",
  under_review: "info",
  approved: "brand",
  rejected: "danger",
  voting: "warning",
  implemented: "success",
  closed: "neutral",
};

export const BUDGET_PROPOSAL_CATEGORIES: {
  value: BudgetProposalCategory;
  label: string;
}[] = [
  { value: "equipment", label: "تجهیزات" },
  { value: "training", label: "آموزش" },
  { value: "community", label: "فعالیت جامعه" },
  { value: "infrastructure", label: "زیرساخت" },
  { value: "other", label: "سایر" },
];

export const BUDGET_PROPOSAL_CATEGORY_LABELS: Record<
  BudgetProposalCategory,
  string
> = Object.fromEntries(
  BUDGET_PROPOSAL_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<BudgetProposalCategory, string>;

export const BENEFIT_SATISFACTION_LABELS: Record<number, string> = {
  1: "خیلی ناراضی",
  2: "ناراضی",
  3: "معمولی",
  4: "راضی",
  5: "خیلی راضی",
};

export const MAX_BENEFIT_PROVIDER_NAME_LENGTH = 120;
export const MAX_BENEFIT_PROVIDER_DESCRIPTION_LENGTH = 2000;
export const MAX_BENEFIT_TERMS_LENGTH = 4000;
export const MAX_BENEFIT_WEBSITE_LENGTH = 300;
export const MAX_BENEFIT_CONTACT_NOTE_LENGTH = 500;
export const MAX_BENEFIT_USAGE_NOTE_LENGTH = 800;
export const MAX_BENEFIT_REPORT_NOTE_LENGTH = 1000;
export const MAX_BUDGET_PROPOSAL_TITLE_LENGTH = 150;
export const MAX_BUDGET_PROPOSAL_DESCRIPTION_LENGTH = 3000;
export const MAX_BUDGET_AMOUNT_LENGTH = 200;
export const MAX_BUDGET_IMPLEMENTATION_SUMMARY_LENGTH = 2000;