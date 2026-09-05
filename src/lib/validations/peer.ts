import { z } from "zod";
import {
  PEER_COOP_MAX_GOAL_LENGTH,
  PEER_COOP_MAX_OUTCOME_LENGTH,
  PEER_HELP_MAX_DESCRIPTION_LENGTH,
  PEER_HELP_MAX_TAGS,
  PEER_HELP_MAX_TITLE_LENGTH,
  PEER_MESSAGE_MAX_LENGTH,
  PEER_OFFER_MAX_MESSAGE_LENGTH,
  PEER_RATING_MAX,
  PEER_REPORT_MAX_NOTE_LENGTH,
} from "@/lib/constants/peer";

const idSchema = z.string().trim().min(1).max(64);

const barrierTypes = [
  "resources",
  "knowledge",
  "process",
  "community",
  "equipment",
  "other",
] as const;

export const peerHelpRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "عنوان حداقل ۵ کاراکتر باشد")
    .max(PEER_HELP_MAX_TITLE_LENGTH, `عنوان حداکثر ${PEER_HELP_MAX_TITLE_LENGTH} کاراکتر`),
  description: z
    .string()
    .trim()
    .min(10, "شرح نیاز حداقل ۱۰ کاراکتر باشد")
    .max(
      PEER_HELP_MAX_DESCRIPTION_LENGTH,
      `شرح حداکثر ${PEER_HELP_MAX_DESCRIPTION_LENGTH} کاراکتر`,
    ),
  barrierType: z.enum(barrierTypes).default("other"),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(PEER_HELP_MAX_TAGS, `حداکثر ${PEER_HELP_MAX_TAGS} برچسب`)
    .optional(),
  province: z.string().trim().max(50).optional(),
  sensitiveAcknowledged: z.boolean().optional(),
});

export const peerHelpRequestStatusSchema = z.object({
  action: z.enum(["cancel"]),
});

export const peerOfferCreateSchema = z.object({
  helpRequestId: idSchema,
  helperId: idSchema.optional(),
  message: z
    .string()
    .trim()
    .max(PEER_OFFER_MAX_MESSAGE_LENGTH, "پیام حداکثر ۶۰۰ کاراکتر")
    .optional(),
});

export const peerOfferRespondSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export const peerCooperationGoalSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(5, "هدف حداقل ۵ کاراکتر باشد")
    .max(PEER_COOP_MAX_GOAL_LENGTH, `هدف حداکثر ${PEER_COOP_MAX_GOAL_LENGTH} کاراکتر`),
});

export const peerMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "پیام نمی‌تواند خالی باشد")
    .max(PEER_MESSAGE_MAX_LENGTH, `پیام حداکثر ${PEER_MESSAGE_MAX_LENGTH} کاراکتر`),
});

export const peerCooperationCompleteSchema = z.object({
  outcomeSummary: z
    .string()
    .trim()
    .min(5, "خلاصه نتیجه حداقل ۵ کاراکتر باشد")
    .max(
      PEER_COOP_MAX_OUTCOME_LENGTH,
      `خلاصه حداکثر ${PEER_COOP_MAX_OUTCOME_LENGTH} کاراکتر`,
    ),
  requesterRating: z.number().int().min(1).max(PEER_RATING_MAX).optional(),
  helperRating: z.number().int().min(1).max(PEER_RATING_MAX).optional(),
});

export const peerCooperationReportSchema = z.object({
  reason: z.enum([
    "abusive",
    "harassment",
    "off_topic",
    "sensitive_info",
    "other",
  ]),
  note: z.string().trim().max(PEER_REPORT_MAX_NOTE_LENGTH).optional(),
});