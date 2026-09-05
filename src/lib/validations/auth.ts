import { z } from "zod";
import { MAX_SELECTABLE, WORK_YEAR_VALUES } from "@/lib/constants/profile";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست");

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "کد باید ۶ رقم باشد");

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "نام نمایشی حداقل ۲ کاراکتر باشد")
    .max(60, "نام نمایشی حداکثر ۶۰ کاراکتر"),
  province: z.string().trim().min(1, "استان را انتخاب کنید").max(50),
  city: z.string().trim().min(1, "شهرستان را وارد کنید").max(60),
  workYears: z.enum(WORK_YEAR_VALUES as [string, ...string[]], {
    message: "بازه سابقه کاری معتبر نیست",
  }),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(MAX_SELECTABLE, `حداکثر ${MAX_SELECTABLE} مهارت`),
  interests: z
    .array(z.string().trim().min(1).max(40))
    .max(MAX_SELECTABLE, `حداکثر ${MAX_SELECTABLE} علاقه‌مندی`),
  bio: z.string().trim().max(300, "معرفی حداکثر ۳۰۰ کاراکتر").optional(),
  visibility: z.enum(["public", "members", "private"]),
  willingToHelp: z.boolean().optional(),
});

export const membershipRequestSchema = z.object({
  note: z.string().trim().max(300, "توضیح حداکثر ۳۰۰ کاراکتر").optional(),
});

export const reviewMembershipSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(300).optional(),
});
