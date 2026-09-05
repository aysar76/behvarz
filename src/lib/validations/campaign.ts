import { z } from "zod";
import {
  MAX_CAMPAIGN_DESCRIPTION_LENGTH,
  MAX_CAMPAIGN_TITLE_LENGTH,
} from "@/lib/constants/campaign";

export const campaignCreateSchema = z.object({
  family: z.enum([
    "learning",
    "cooperation",
    "network",
    "innovation",
    "growth",
    "mission",
  ]),
  title: z
    .string()
    .trim()
    .min(3, "عنوان کمپین باید حداقل ۳ کاراکتر باشد")
    .max(
      MAX_CAMPAIGN_TITLE_LENGTH,
      `عنوان حداکثر ${MAX_CAMPAIGN_TITLE_LENGTH} کاراکتر`,
    ),
  description: z
    .string()
    .trim()
    .min(10, "شرح کمپین باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_CAMPAIGN_DESCRIPTION_LENGTH,
      `شرح حداکثر ${MAX_CAMPAIGN_DESCRIPTION_LENGTH} کاراکتر`,
    ),
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isOptional: z.boolean().optional(),
});

export const campaignUpdateSchema = z.object({
  family: z
    .enum([
      "learning",
      "cooperation",
      "network",
      "innovation",
      "growth",
      "mission",
    ])
    .optional(),
  title: z
    .string()
    .trim()
    .min(3, "عنوان کمپین باید حداقل ۳ کاراکتر باشد")
    .max(
      MAX_CAMPAIGN_TITLE_LENGTH,
      `عنوان حداکثر ${MAX_CAMPAIGN_TITLE_LENGTH} کاراکتر`,
    )
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "شرح کمپین باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_CAMPAIGN_DESCRIPTION_LENGTH,
      `شرح حداکثر ${MAX_CAMPAIGN_DESCRIPTION_LENGTH} کاراکتر`,
    )
    .optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isOptional: z.boolean().optional(),
});

export const dataContributionSchema = z.object({
  allowDataContribution: z.boolean(),
});