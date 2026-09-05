import { z } from "zod";
import {
  MAX_EXPERIENCE_FIELD_LENGTH,
  MAX_EXPERIENCE_OPTIONAL_LENGTH,
  MAX_EXPERIENCE_REUSE_SUMMARY_LENGTH,
  MAX_EXPERIENCE_TAGS,
  MAX_EXPERIENCE_TITLE_LENGTH,
} from "@/lib/constants/experience";

const idSchema = z.string().trim().min(1).max(64);

const experienceCommonFields = {
  title: z
    .string()
    .trim()
    .min(5, "عنوان باید حداقل ۵ کاراکتر باشد")
    .max(
      MAX_EXPERIENCE_TITLE_LENGTH,
      `عنوان حداکثر ${MAX_EXPERIENCE_TITLE_LENGTH} کاراکتر`,
    ),
  situation: z
    .string()
    .trim()
    .min(10, "مسئله/موقعیت باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_EXPERIENCE_FIELD_LENGTH,
      `این بخش حداکثر ${MAX_EXPERIENCE_FIELD_LENGTH} کاراکتر`,
    ),
  conditions: z
    .string()
    .trim()
    .max(MAX_EXPERIENCE_OPTIONAL_LENGTH, `حداکثر ${MAX_EXPERIENCE_OPTIONAL_LENGTH} کاراکتر`)
    .optional(),
  action: z
    .string()
    .trim()
    .min(10, "اقدام باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_EXPERIENCE_FIELD_LENGTH,
      `این بخش حداکثر ${MAX_EXPERIENCE_FIELD_LENGTH} کاراکتر`,
    ),
  resources: z
    .string()
    .trim()
    .max(MAX_EXPERIENCE_OPTIONAL_LENGTH, `حداکثر ${MAX_EXPERIENCE_OPTIONAL_LENGTH} کاراکتر`)
    .optional(),
  challenges: z
    .string()
    .trim()
    .max(MAX_EXPERIENCE_OPTIONAL_LENGTH, `حداکثر ${MAX_EXPERIENCE_OPTIONAL_LENGTH} کاراکتر`)
    .optional(),
  result: z
    .string()
    .trim()
    .min(5, "نتیجه باید حداقل ۵ کاراکتر باشد")
    .max(
      MAX_EXPERIENCE_FIELD_LENGTH,
      `این بخش حداکثر ${MAX_EXPERIENCE_FIELD_LENGTH} کاراکتر`,
    ),
  lessons: z
    .string()
    .trim()
    .max(MAX_EXPERIENCE_OPTIONAL_LENGTH, `حداکثر ${MAX_EXPERIENCE_OPTIONAL_LENGTH} کاراکتر`)
    .optional(),
  suggestion: z
    .string()
    .trim()
    .max(MAX_EXPERIENCE_OPTIONAL_LENGTH, `حداکثر ${MAX_EXPERIENCE_OPTIONAL_LENGTH} کاراکتر`)
    .optional(),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(MAX_EXPERIENCE_TAGS, `حداکثر ${MAX_EXPERIENCE_TAGS} برچسب`)
    .optional(),
} as const;

export const experienceCreateSchema = z.object({
  ...experienceCommonFields,
  isDraft: z.boolean().optional(),
  sensitiveAcknowledged: z.boolean().optional(),
});

export const experienceUpdateSchema = z.object({
  title: experienceCommonFields.title.optional(),
  situation: experienceCommonFields.situation.optional(),
  conditions: experienceCommonFields.conditions,
  action: experienceCommonFields.action.optional(),
  resources: experienceCommonFields.resources,
  challenges: experienceCommonFields.challenges,
  result: experienceCommonFields.result.optional(),
  lessons: experienceCommonFields.lessons,
  suggestion: experienceCommonFields.suggestion,
  tags: experienceCommonFields.tags,
  isDraft: z.boolean().optional(),
  sensitiveAcknowledged: z.boolean().optional(),
});

export const experienceReuseSchema = z.object({
  outcome: z.enum(["successful", "partial", "unsuccessful"]),
  summary: z
    .string()
    .trim()
    .min(5, "خلاصه نتیجه باید حداقل ۵ کاراکتر باشد")
    .max(
      MAX_EXPERIENCE_REUSE_SUMMARY_LENGTH,
      `خلاصه حداکثر ${MAX_EXPERIENCE_REUSE_SUMMARY_LENGTH} کاراکتر`,
    ),
});

export const experienceReviewSchema = z.object({
  action: z.enum(["approve", "feature", "unfeature", "unarchive"]),
  note: z.string().trim().max(300).optional(),
});

export const experienceModerationSchema = z.object({
  action: z.enum(["hide", "unhide", "remove", "restore"]),
  note: z.string().trim().max(300).optional(),
});

export const experienceIdListSchema = z.object({
  experienceIds: z.array(idSchema).max(3, "حداکثر ۳ تجربه می‌توانید ارجاع دهید"),
});