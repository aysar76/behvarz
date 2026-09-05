import { z } from "zod";
import {
  CIRCLE_MAX_AGENDA_LENGTH,
  CIRCLE_MAX_CAPACITY,
  CIRCLE_MAX_DESCRIPTION_LENGTH,
  CIRCLE_MAX_MEETING_SUMMARY_LENGTH,
  CIRCLE_MAX_MEETING_TITLE_LENGTH,
  CIRCLE_MAX_NAME_LENGTH,
  CIRCLE_MAX_TOPIC_LENGTH,
  CIRCLE_MIN_CAPACITY,
} from "@/lib/constants/circle";

const idSchema = z.string().trim().min(1).max(64);

export const circleCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "نام حلقه حداقل ۳ کاراکتر باشد")
    .max(CIRCLE_MAX_NAME_LENGTH, `نام حلقه حداکثر ${CIRCLE_MAX_NAME_LENGTH} کاراکتر`),
  description: z
    .string()
    .trim()
    .min(10, "توضیح حلقه حداقل ۱۰ کاراکتر باشد")
    .max(
      CIRCLE_MAX_DESCRIPTION_LENGTH,
      `توضیح حداکثر ${CIRCLE_MAX_DESCRIPTION_LENGTH} کاراکتر`,
    ),
  topic: z.string().trim().max(CIRCLE_MAX_TOPIC_LENGTH).optional(),
  province: z.string().trim().max(50).optional(),
  capacity: z
    .number()
    .int()
    .min(CIRCLE_MIN_CAPACITY)
    .max(CIRCLE_MAX_CAPACITY)
    .optional(),
});

export const circleJoinSchema = z.object({
  message: z.string().trim().max(300, "پیام حداکثر ۳۰۰ کاراکتر").optional(),
});

export const circleJoinReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const circleInviteSchema = z.object({
  userId: idSchema,
  message: z.string().trim().max(300).optional(),
});

export const circleInviteRespondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export const circleMeetingCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "عنوان جلسه حداقل ۳ کاراکتر باشد")
    .max(
      CIRCLE_MAX_MEETING_TITLE_LENGTH,
      `عنوان حداکثر ${CIRCLE_MAX_MEETING_TITLE_LENGTH} کاراکتر`,
    ),
  agenda: z.string().trim().max(CIRCLE_MAX_AGENDA_LENGTH).optional(),
  scheduledAt: z.string().trim().optional().nullable(),
  summary: z
    .string()
    .trim()
    .max(CIRCLE_MAX_MEETING_SUMMARY_LENGTH)
    .optional(),
});

export const circleMeetingUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3)
    .max(CIRCLE_MAX_MEETING_TITLE_LENGTH)
    .optional(),
  agenda: z.string().trim().max(CIRCLE_MAX_AGENDA_LENGTH).optional(),
  scheduledAt: z.string().trim().optional().nullable(),
  summary: z
    .string()
    .trim()
    .max(CIRCLE_MAX_MEETING_SUMMARY_LENGTH)
    .optional(),
});

export const circleTransferSchema = z.object({
  memberId: idSchema,
});