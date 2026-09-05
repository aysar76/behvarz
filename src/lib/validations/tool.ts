import { z } from "zod";
import {
  MAX_TOOL_BODY_LENGTH,
  MAX_TOOL_SUMMARY_LENGTH,
  MAX_TOOL_TAGS,
  MAX_TOOL_TAG_LENGTH,
  MAX_TOOL_TITLE_LENGTH,
} from "@/lib/constants/tool";

export const toolCreateSchema = z.object({
  kind: z.enum(["guide", "checklist", "intervention", "content_item"]),
  title: z
    .string()
    .trim()
    .min(3, "عنوان ابزار باید حداقل ۳ کاراکتر باشد")
    .max(MAX_TOOL_TITLE_LENGTH, `عنوان حداکثر ${MAX_TOOL_TITLE_LENGTH} کاراکتر`),
  summary: z
    .string()
    .trim()
    .min(10, "خلاصه باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_TOOL_SUMMARY_LENGTH,
      `خلاصه حداکثر ${MAX_TOOL_SUMMARY_LENGTH} کاراکتر`,
    ),
  body: z
    .string()
    .trim()
    .min(20, "محتوا باید حداقل ۲۰ کاراکتر باشد")
    .max(MAX_TOOL_BODY_LENGTH, `محتوا حداکثر ${MAX_TOOL_BODY_LENGTH} کاراکتر`),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(MAX_TOOL_TAG_LENGTH, `هر برچسب حداکثر ${MAX_TOOL_TAG_LENGTH} کاراکتر`),
    )
    .max(MAX_TOOL_TAGS, `حداکثر ${MAX_TOOL_TAGS} برچسب`)
    .optional(),
});

export const toolUpdateSchema = z.object({
  kind: z.enum(["guide", "checklist", "intervention", "content_item"]).optional(),
  title: z
    .string()
    .trim()
    .min(3, "عنوان ابزار باید حداقل ۳ کاراکتر باشد")
    .max(MAX_TOOL_TITLE_LENGTH, `عنوان حداکثر ${MAX_TOOL_TITLE_LENGTH} کاراکتر`)
    .optional(),
  summary: z
    .string()
    .trim()
    .min(10, "خلاصه باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_TOOL_SUMMARY_LENGTH,
      `خلاصه حداکثر ${MAX_TOOL_SUMMARY_LENGTH} کاراکتر`,
    )
    .optional(),
  body: z
    .string()
    .trim()
    .min(20, "محتوا باید حداقل ۲۰ کاراکتر باشد")
    .max(MAX_TOOL_BODY_LENGTH, `محتوا حداکثر ${MAX_TOOL_BODY_LENGTH} کاراکتر`)
    .optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(MAX_TOOL_TAG_LENGTH, `هر برچسب حداکثر ${MAX_TOOL_TAG_LENGTH} کاراکتر`),
    )
    .max(MAX_TOOL_TAGS, `حداکثر ${MAX_TOOL_TAGS} برچسب`)
    .optional(),
});