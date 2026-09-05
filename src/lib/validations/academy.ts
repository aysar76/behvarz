import { z } from "zod";
import {
  MAX_COURSE_DESCRIPTION_LENGTH,
  MAX_COURSE_TAGS,
  MAX_COURSE_TITLE_LENGTH,
  MAX_FIELD_APPLICATION_LENGTH,
  MAX_LESSON_BODY_LENGTH,
  MAX_LESSON_SUMMARY_LENGTH,
  MAX_LESSON_TITLE_LENGTH,
  MAX_MEDIA_URL_LENGTH,
  MAX_QUIZ_EXPLANATION_LENGTH,
  MAX_QUIZ_OPTIONS,
  MAX_QUIZ_OPTION_LENGTH,
  MAX_QUIZ_QUESTIONS,
  MAX_QUIZ_QUESTION_LENGTH,
} from "@/lib/constants/academy";

const idSchema = z.string().trim().min(1).max(64);
const slugSchema = z
  .string()
  .trim()
  .min(3, "شناسه دوره باید حداقل ۳ کاراکتر باشد")
  .max(64, "شناسه دوره حداکثر ۶۴ کاراکتر")
  .regex(
    /^[a-z0-9-]+$/,
    "شناسه دوره فقط شامل حروف کوچک انگلیسی، عدد و خط تیره است",
  );

const quizOptionSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "گزینه نمی‌تواند خالی باشد")
    .max(MAX_QUIZ_OPTION_LENGTH, `گزینه حداکثر ${MAX_QUIZ_OPTION_LENGTH} کاراکتر`),
});

export const quizQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "پرسش آزمونک باید حداقل ۳ کاراکتر باشد")
    .max(
      MAX_QUIZ_QUESTION_LENGTH,
      `پرسش حداکثر ${MAX_QUIZ_QUESTION_LENGTH} کاراکتر`,
    ),
  options: z
    .array(quizOptionSchema)
    .min(2, "هر پرسش حداقل ۲ گزینه دارد")
    .max(MAX_QUIZ_OPTIONS, `هر پرسش حداکثر ${MAX_QUIZ_OPTIONS} گزینه دارد`),
  correctIndex: z
    .number()
    .int()
    .min(0)
    .max(MAX_QUIZ_OPTIONS - 1, "گزینه صحیح نامعتبر است"),
  explanation: z
    .string()
    .trim()
    .max(MAX_QUIZ_EXPLANATION_LENGTH, `توضیح حداکثر ${MAX_QUIZ_EXPLANATION_LENGTH} کاراکتر`)
    .optional(),
});

const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "عنوان درس باید حداقل ۳ کاراکتر باشد")
    .max(MAX_LESSON_TITLE_LENGTH, `عنوان حداکثر ${MAX_LESSON_TITLE_LENGTH} کاراکتر`),
  summary: z
    .string()
    .trim()
    .max(MAX_LESSON_SUMMARY_LENGTH, `خلاصه حداکثر ${MAX_LESSON_SUMMARY_LENGTH} کاراکتر`)
    .optional(),
  body: z
    .string()
    .trim()
    .min(10, "محتوای درس باید حداقل ۱۰ کاراکتر باشد")
    .max(MAX_LESSON_BODY_LENGTH, `محتوای درس حداکثر ${MAX_LESSON_BODY_LENGTH} کاراکتر`),
  contentType: z.enum(["text", "audio", "video"]),
  mediaUrl: z
    .string()
    .trim()
    .max(MAX_MEDIA_URL_LENGTH, `آدرس رسانه حداکثر ${MAX_MEDIA_URL_LENGTH} کاراکتر`)
    .optional(),
  durationMinutes: z.number().int().min(0).max(600).optional(),
  order: z.number().int().min(0).optional(),
  isOptional: z.boolean().optional(),
  quizQuestions: z.array(quizQuestionSchema).max(MAX_QUIZ_QUESTIONS).optional(),
});

export const courseCreateSchema = z.object({
  slug: slugSchema,
  title: z
    .string()
    .trim()
    .min(3, "عنوان دوره باید حداقل ۳ کاراکتر باشد")
    .max(MAX_COURSE_TITLE_LENGTH, `عنوان حداکثر ${MAX_COURSE_TITLE_LENGTH} کاراکتر`),
  description: z
    .string()
    .trim()
    .min(10, "توضیح دوره باید حداقل ۱۰ کاراکتر باشد")
    .max(
      MAX_COURSE_DESCRIPTION_LENGTH,
      `توضیح حداکثر ${MAX_COURSE_DESCRIPTION_LENGTH} کاراکتر`,
    ),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  status: z.enum(["draft", "published", "archived"]),
  emoji: z.string().trim().max(8).optional(),
  relatedProblemId: idSchema.optional(),
  relatedExperienceId: idSchema.optional(),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(MAX_COURSE_TAGS, `حداکثر ${MAX_COURSE_TAGS} برچسب`)
    .optional(),
  lessons: z.array(lessonSchema).optional(),
});

export const courseUpdateSchema = z.object({
  slug: slugSchema.optional(),
  title: z
    .string()
    .trim()
    .min(3, "عنوان دوره باید حداقل ۳ کاراکتر باشد")
    .max(MAX_COURSE_TITLE_LENGTH, `عنوان حداکثر ${MAX_COURSE_TITLE_LENGTH} کاراکتر`)
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "توضیح دوره باید حداقل ۱۰ کاراکتر باشد")
    .max(MAX_COURSE_DESCRIPTION_LENGTH, `توضیح حداکثر ${MAX_COURSE_DESCRIPTION_LENGTH} کاراکتر`)
    .optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  emoji: z.string().trim().max(8).optional(),
  relatedProblemId: idSchema.optional(),
  relatedExperienceId: idSchema.optional(),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(MAX_COURSE_TAGS, `حداکثر ${MAX_COURSE_TAGS} برچسب`)
    .optional(),
});

export const lessonCreateSchema = z.object({
  courseId: idSchema,
  lesson: lessonSchema,
});

export const lessonUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "عنوان درس باید حداقل ۳ کاراکتر باشد")
    .max(MAX_LESSON_TITLE_LENGTH, `عنوان حداکثر ${MAX_LESSON_TITLE_LENGTH} کاراکتر`)
    .optional(),
  summary: z
    .string()
    .trim()
    .max(MAX_LESSON_SUMMARY_LENGTH, `خلاصه حداکثر ${MAX_LESSON_SUMMARY_LENGTH} کاراکتر`)
    .optional(),
  body: z
    .string()
    .trim()
    .min(10, "محتوای درس باید حداقل ۱۰ کاراکتر باشد")
    .max(MAX_LESSON_BODY_LENGTH, `محتوای درس حداکثر ${MAX_LESSON_BODY_LENGTH} کاراکتر`)
    .optional(),
  contentType: z.enum(["text", "audio", "video"]).optional(),
  mediaUrl: z
    .string()
    .trim()
    .max(MAX_MEDIA_URL_LENGTH, `آدرس رسانه حداکثر ${MAX_MEDIA_URL_LENGTH} کاراکتر`)
    .optional(),
  durationMinutes: z.number().int().min(0).max(600).optional(),
  order: z.number().int().min(0).optional(),
  isOptional: z.boolean().optional(),
});

export const lessonDeleteSchema = z.object({
  courseId: idSchema,
});

export const quizSubmitSchema = z.object({
  answers: z
    .array(z.number().int().min(0))
    .max(MAX_QUIZ_QUESTIONS, "تعداد پاسخ‌ها نامعتبر است"),
});

export const lessonCompleteSchema = z.object({
  courseId: idSchema,
});

export const courseCompleteSchema = z.object({
  courseId: idSchema,
});

export const enrollSchema = z.object({
  courseId: idSchema,
});

export const fieldApplicationSchema = z.object({
  courseId: idSchema,
  summary: z
    .string()
    .trim()
    .min(5, "خلاصه کاربرد میدانی باید حداقل ۵ کاراکتر باشد")
    .max(
      MAX_FIELD_APPLICATION_LENGTH,
      `خلاصه حداکثر ${MAX_FIELD_APPLICATION_LENGTH} کاراکتر`,
    ),
  outcome: z.enum(["successful", "partial", "unsuccessful"]),
});
