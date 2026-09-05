import { z } from "zod";
import {
  MAX_ANSWER_LENGTH,
  MAX_PROBLEM_DESCRIPTION_LENGTH,
  MAX_PROBLEM_TAGS,
  MAX_PROBLEM_TITLE_LENGTH,
} from "@/lib/constants/problem";

const idSchema = z.string().trim().min(1).max(64);

const problemCommonFields = {
  title: z
    .string()
    .trim()
    .min(5, "عنوان باید حداقل ۵ کاراکتر باشد")
    .max(
      MAX_PROBLEM_TITLE_LENGTH,
      `عنوان حداکثر ${MAX_PROBLEM_TITLE_LENGTH} کاراکتر`,
    ),
  description: z
    .string()
    .trim()
    .min(10, "شرح مسئله باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_PROBLEM_DESCRIPTION_LENGTH,
      `شرح حداکثر ${MAX_PROBLEM_DESCRIPTION_LENGTH} کاراکتر`,
    ),
  context: z.string().trim().max(600).optional(),
  barrierType: z.enum([
    "resources",
    "knowledge",
    "process",
    "community",
    "equipment",
    "other",
  ]),
  actionsTaken: z.string().trim().max(600).optional(),
  expectedOutcome: z.string().trim().max(600).optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  isAnonymous: z.boolean().optional(),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(MAX_PROBLEM_TAGS, `حداکثر ${MAX_PROBLEM_TAGS} برچسب`)
    .optional(),
} as const;

export const problemCreateSchema = z.object({
  ...problemCommonFields,
  isDraft: z.boolean().optional(),
  sensitiveAcknowledged: z.boolean().optional(),
});

export const problemUpdateSchema = z.object({
  title: problemCommonFields.title.optional(),
  description: problemCommonFields.description.optional(),
  context: problemCommonFields.context,
  barrierType: problemCommonFields.barrierType.optional(),
  actionsTaken: problemCommonFields.actionsTaken,
  expectedOutcome: problemCommonFields.expectedOutcome,
  urgency: problemCommonFields.urgency.optional(),
  isAnonymous: problemCommonFields.isAnonymous,
  isDraft: z.boolean().optional(),
  tags: problemCommonFields.tags,
  sensitiveAcknowledged: z.boolean().optional(),
});

export const answerSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, "پاسخ باید حداقل ۱۰ کاراکتر باشد")
    .max(MAX_ANSWER_LENGTH, `پاسخ حداکثر ${MAX_ANSWER_LENGTH} کاراکتر`),
  isClarificationRequest: z.boolean().optional(),
  sensitiveAcknowledged: z.boolean().optional(),
});

export const selectSolutionSchema = z.object({
  answerId: idSchema,
  conclusion: z
    .string()
    .trim()
    .min(5, "جمع‌بندی باید حداقل ۵ کاراکتر باشد")
    .max(800, "جمع‌بندی حداکثر ۸۰۰ کاراکتر"),
});

export const resultSchema = z.object({
  resultOutcome: z.enum(["successful", "partial", "unsuccessful"]),
  resultSummary: z
    .string()
    .trim()
    .min(5, "خلاصه نتیجه باید حداقل ۵ کاراکتر باشد")
    .max(800, "خلاصه نتیجه حداکثر ۸۰۰ کاراکتر"),
});

export const statusUpdateSchema = z.object({
  to: z.enum(["open", "discussing", "solved", "archived"]),
  note: z.string().trim().max(300).optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["problem", "answer"]),
  targetId: idSchema,
  reason: z.enum([
    "sensitive_info",
    "medical_advice",
    "offensive",
    "spam",
    "other",
  ]),
  note: z.string().trim().max(500).optional(),
});

export const moderationSchema = z.object({
  action: z.enum(["hide", "unhide", "remove", "restore"]),
  note: z.string().trim().max(300).optional(),
});
