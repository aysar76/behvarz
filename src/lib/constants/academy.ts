import type {
  CourseLevel,
  CourseStatus,
  LessonContentType,
  LessonProgressStatus,
  FieldApplicationOutcome,
} from "@/generated/prisma/client";

export const COURSE_LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "مقدماتی" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "پیشرفته" },
];

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "مقدماتی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export const COURSE_STATUSES: { value: CourseStatus; label: string }[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "archived", label: "بایگانی‌شده" },
];

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "بایگانی‌شده",
};

export const COURSE_STATUS_TONES: Record<
  CourseStatus,
  "neutral" | "success" | "warning"
> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};

export const LESSON_CONTENT_TYPES: {
  value: LessonContentType;
  label: string;
}[] = [
  { value: "text", label: "متنی" },
  { value: "audio", label: "صوتی" },
  { value: "video", label: "ویدیویی" },
];

export const LESSON_CONTENT_TYPE_LABELS: Record<LessonContentType, string> = {
  text: "متنی",
  audio: "صوتی",
  video: "ویدیویی",
};

export const LESSON_PROGRESS_STATUS_LABELS: Record<
  LessonProgressStatus,
  string
> = {
  not_started: "شروع‌نشده",
  in_progress: "در حال یادگیری",
  completed: "تکمیل‌شده",
};

export const FIELD_APPLICATION_OUTCOMES: {
  value: FieldApplicationOutcome;
  label: string;
}[] = [
  { value: "successful", label: "در میدان کاربرد داشت" },
  { value: "partial", label: "تا حدی کاربرد داشت" },
  { value: "unsuccessful", label: "کاربردی نداشت" },
];

export const FIELD_APPLICATION_OUTCOME_LABELS: Record<
  FieldApplicationOutcome,
  string
> = {
  successful: "در میدان کاربرد داشت",
  partial: "تا حدی کاربرد داشت",
  unsuccessful: "کاربردی نداشت",
};

export const ACADEMY_COURSE_EMOJIS: string[] = [
  "📘",
  "📗",
  "📙",
  "📕",
  "💉",
  "🏥",
  "🍎",
  "🧠",
  "👶",
  "👵",
  "🚑",
  "🧪",
  "📊",
  "🤝",
  "📝",
];

export const MAX_COURSE_TITLE_LENGTH = 120;
export const MAX_COURSE_DESCRIPTION_LENGTH = 2000;
export const MAX_LESSON_TITLE_LENGTH = 120;
export const MAX_LESSON_SUMMARY_LENGTH = 400;
export const MAX_LESSON_BODY_LENGTH = 20000;
export const MAX_MEDIA_URL_LENGTH = 500;
export const MAX_QUIZ_QUESTION_LENGTH = 300;
export const MAX_QUIZ_OPTION_LENGTH = 200;
export const MAX_QUIZ_EXPLANATION_LENGTH = 400;
export const MAX_QUIZ_OPTIONS = 5;
export const MAX_QUIZ_QUESTIONS = 20;
export const MAX_FIELD_APPLICATION_LENGTH = 800;
export const MAX_COURSE_TAGS = 5;
