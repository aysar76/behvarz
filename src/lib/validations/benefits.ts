import { z } from "zod";
import {
  MAX_BENEFIT_CONTACT_NOTE_LENGTH,
  MAX_BENEFIT_PROVIDER_DESCRIPTION_LENGTH,
  MAX_BENEFIT_PROVIDER_NAME_LENGTH,
  MAX_BENEFIT_REPORT_NOTE_LENGTH,
  MAX_BENEFIT_TERMS_LENGTH,
  MAX_BENEFIT_USAGE_NOTE_LENGTH,
  MAX_BENEFIT_WEBSITE_LENGTH,
  MAX_BUDGET_AMOUNT_LENGTH,
  MAX_BUDGET_IMPLEMENTATION_SUMMARY_LENGTH,
  MAX_BUDGET_PROPOSAL_DESCRIPTION_LENGTH,
  MAX_BUDGET_PROPOSAL_TITLE_LENGTH,
} from "@/lib/constants/benefits";

const idSchema = z.string().trim().min(1).max(64);

export const benefitProviderCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "نام ارائه‌دهنده باید حداقل ۳ کاراکتر باشد")
    .max(
      MAX_BENEFIT_PROVIDER_NAME_LENGTH,
      `نام حداکثر ${MAX_BENEFIT_PROVIDER_NAME_LENGTH} کاراکتر`,
    ),
  category: z.enum([
    "health",
    "education",
    "equipment",
    "insurance",
    "transport",
    "telecom",
    "retail",
    "other",
  ]),
  description: z
    .string()
    .trim()
    .min(10, "توضیح ارائه‌دهنده باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_BENEFIT_PROVIDER_DESCRIPTION_LENGTH,
      `توضیح حداکثر ${MAX_BENEFIT_PROVIDER_DESCRIPTION_LENGTH} کاراکتر`,
    ),
  terms: z
    .string()
    .trim()
    .min(10, "شرایط استفاده باید حداقل ۱۰ کاراکتر باشد")
    .max(MAX_BENEFIT_TERMS_LENGTH, `شرایط حداکثر ${MAX_BENEFIT_TERMS_LENGTH} کاراکتر`),
  website: z
    .string()
    .trim()
    .max(MAX_BENEFIT_WEBSITE_LENGTH, `وب‌سایت حداکثر ${MAX_BENEFIT_WEBSITE_LENGTH} کاراکتر`)
    .optional(),
  contactNote: z
    .string()
    .trim()
    .max(
      MAX_BENEFIT_CONTACT_NOTE_LENGTH,
      `نکته تماس حداکثر ${MAX_BENEFIT_CONTACT_NOTE_LENGTH} کاراکتر`,
    )
    .optional(),
  logoEmoji: z.string().trim().max(8).optional(),
  isSponsored: z.boolean().optional(),
  status: z.enum(["draft", "approved", "archived"]).optional(),
});

export const benefitProviderUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "نام ارائه‌دهنده باید حداقل ۳ کاراکتر باشد")
    .max(
      MAX_BENEFIT_PROVIDER_NAME_LENGTH,
      `نام حداکثر ${MAX_BENEFIT_PROVIDER_NAME_LENGTH} کاراکتر`,
    )
    .optional(),
  category: z
    .enum([
      "health",
      "education",
      "equipment",
      "insurance",
      "transport",
      "telecom",
      "retail",
      "other",
    ])
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "توضیح ارائه‌دهنده باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_BENEFIT_PROVIDER_DESCRIPTION_LENGTH,
      `توضیح حداکثر ${MAX_BENEFIT_PROVIDER_DESCRIPTION_LENGTH} کاراکتر`,
    )
    .optional(),
  terms: z
    .string()
    .trim()
    .min(10, "شرایط استفاده باید حداقل ۱۰ کاراکتر باشد")
    .max(MAX_BENEFIT_TERMS_LENGTH, `شرایط حداکثر ${MAX_BENEFIT_TERMS_LENGTH} کاراکتر`)
    .optional(),
  website: z
    .string()
    .trim()
    .max(MAX_BENEFIT_WEBSITE_LENGTH, `وب‌سایت حداکثر ${MAX_BENEFIT_WEBSITE_LENGTH} کاراکتر`)
    .optional(),
  contactNote: z
    .string()
    .trim()
    .max(
      MAX_BENEFIT_CONTACT_NOTE_LENGTH,
      `نکته تماس حداکثر ${MAX_BENEFIT_CONTACT_NOTE_LENGTH} کاراکتر`,
    )
    .optional(),
  logoEmoji: z.string().trim().max(8).optional(),
  isSponsored: z.boolean().optional(),
  status: z.enum(["draft", "approved", "archived"]).optional(),
});

export const benefitUsageSchema = z.object({
  providerId: idSchema,
  note: z
    .string()
    .trim()
    .max(
      MAX_BENEFIT_USAGE_NOTE_LENGTH,
      `یادداشت حداکثر ${MAX_BENEFIT_USAGE_NOTE_LENGTH} کاراکتر`,
    )
    .optional(),
  satisfaction: z.number().int().min(1).max(5),
});

export const benefitReportSchema = z.object({
  providerId: idSchema,
  reason: z.enum([
    "issue_service",
    "misleading",
    "sensitive_info",
    "complaint",
    "other",
  ]),
  note: z
    .string()
    .trim()
    .max(
      MAX_BENEFIT_REPORT_NOTE_LENGTH,
      `توضیح حداکثر ${MAX_BENEFIT_REPORT_NOTE_LENGTH} کاراکتر`,
    )
    .optional(),
});

export const benefitReportReviewSchema = z.object({
  status: z.enum(["pending", "resolved", "rejected"]),
  moderatorNote: z
    .string()
    .trim()
    .max(
      MAX_BENEFIT_REPORT_NOTE_LENGTH,
      `یادداشت ناظر حداکثر ${MAX_BENEFIT_REPORT_NOTE_LENGTH} کاراکتر`,
    )
    .optional(),
});

export const budgetProposalCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "عنوان پیشنهاد باید حداقل ۵ کاراکتر باشد")
    .max(
      MAX_BUDGET_PROPOSAL_TITLE_LENGTH,
      `عنوان حداکثر ${MAX_BUDGET_PROPOSAL_TITLE_LENGTH} کاراکتر`,
    ),
  description: z
    .string()
    .trim()
    .min(20, "شرح پیشنهاد باید حداقل ۲۰ کاراکتر باشد")
    .max(
      MAX_BUDGET_PROPOSAL_DESCRIPTION_LENGTH,
      `شرح حداکثر ${MAX_BUDGET_PROPOSAL_DESCRIPTION_LENGTH} کاراکتر`,
    ),
  category: z.enum(["equipment", "training", "community", "infrastructure", "other"]),
  amountEstimate: z
    .string()
    .trim()
    .max(MAX_BUDGET_AMOUNT_LENGTH, `برآورد هزینه حداکثر ${MAX_BUDGET_AMOUNT_LENGTH} کاراکتر`)
    .optional(),
});

export const budgetProposalUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "عنوان پیشنهاد باید حداقل ۵ کاراکتر باشد")
    .max(
      MAX_BUDGET_PROPOSAL_TITLE_LENGTH,
      `عنوان حداکثر ${MAX_BUDGET_PROPOSAL_TITLE_LENGTH} کاراکتر`,
    )
    .optional(),
  description: z
    .string()
    .trim()
    .min(20, "شرح پیشنهاد باید حداقل ۲۰ کاراکتر باشد")
    .max(
      MAX_BUDGET_PROPOSAL_DESCRIPTION_LENGTH,
      `شرح حداکثر ${MAX_BUDGET_PROPOSAL_DESCRIPTION_LENGTH} کاراکتر`,
    )
    .optional(),
  category: z
    .enum(["equipment", "training", "community", "infrastructure", "other"])
    .optional(),
  amountEstimate: z
    .string()
    .trim()
    .max(MAX_BUDGET_AMOUNT_LENGTH, `برآورد هزینه حداکثر ${MAX_BUDGET_AMOUNT_LENGTH} کاراکتر`)
    .optional(),
});

export const budgetProposalReviewSchema = z.object({
  status: z.enum(["under_review", "approved", "rejected", "voting"]),
  reviewedBy: idSchema.optional(),
  reviewedAt: z.string().optional(),
});

export const budgetImplementationSchema = z.object({
  proposalId: idSchema,
  summary: z
    .string()
    .trim()
    .min(10, "گزارش اجرا باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_BUDGET_IMPLEMENTATION_SUMMARY_LENGTH,
      `گزارش حداکثر ${MAX_BUDGET_IMPLEMENTATION_SUMMARY_LENGTH} کاراکتر`,
    ),
  expenses: z
    .array(
      z.object({
        item: z.string().trim().min(1, "عنوان هزینه لازم است").max(120),
        amount: z.string().trim().min(1, "مبلغ هزینه لازم است").max(120),
      }),
    )
    .max(20, "حداکثر ۲۰ ردیف هزینه")
    .optional(),
});