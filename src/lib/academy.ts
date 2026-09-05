import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CourseLevel,
  FieldApplication,
  LessonContentType,
} from "@/generated/prisma/client";

const COURSE_AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export const COURSE_DETAIL_INCLUDE = {
  owner: { select: COURSE_AUTHOR_SELECT },
  tags: { include: { tag: { select: { id: true, name: true } } } },
  relatedProblem: { select: { id: true, title: true } },
  relatedExperience: { select: { id: true, slug: true, title: true } },
} as const;

export const COURSE_LIST_INCLUDE = {
  owner: { select: COURSE_AUTHOR_SELECT },
  tags: { include: { tag: { select: { id: true, name: true } } } },
  _count: { select: { lessons: true, enrollments: true } },
} as const;

export interface CourseRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  status: string;
  ownerId: string;
  version: number;
  reviewedAt: Date | null;
  emoji: string | null;
  isPaid: boolean;
  relatedProblemId: string | null;
  relatedExperienceId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    displayName: string | null;
    province: string | null;
    city: string | null;
    membershipStatus: string;
    role: string;
  } | null;
  tags?: { tag: { id: string; name: string } }[];
  relatedProblem?: { id: string; title: string } | null;
  relatedExperience?: { id: string; slug: string; title: string } | null;
  lessons?: LessonRow[];
  _count?: { lessons: number; enrollments: number };
}

export interface LessonRow {
  id: string;
  courseId: string;
  title: string;
  summary: string | null;
  body: string;
  contentType: string;
  mediaUrl: string | null;
  durationMinutes: number | null;
  order: number;
  isOptional: boolean;
  createdAt: Date;
  updatedAt: Date;
  quizQuestions?: QuizQuestionRow[];
  progress?: { status: string; quizPassed: boolean }[];
  applications?: FieldApplication[];
}

export interface QuizQuestionRow {
  id: string;
  lessonId: string;
  question: string;
  options: unknown;
  correctIndex: number;
  explanation: string | null;
  order: number;
}

export interface SerializedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  status: string;
  version: number;
  reviewedAt: string | null;
  emoji: string | null;
  isPaid: boolean;
  relatedProblemId: string | null;
  relatedProblemTitle: string | null;
  relatedExperienceId: string | null;
  relatedExperienceTitle: string | null;
  relatedExperienceSlug: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    displayName: string | null;
    isVerified: boolean;
  } | null;
  tags: string[];
  lessonCount: number;
  enrollmentCount: number;
  isEnrolled: boolean;
  completedAt: string | null;
  lessonsCompleted: number;
  lessonsTotal: number;
}

export interface SerializedLesson {
  id: string;
  courseId: string;
  title: string;
  summary: string | null;
  body: string;
  contentType: string;
  mediaUrl: string | null;
  durationMinutes: number | null;
  order: number;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
  progressStatus: string;
  quizPassed: boolean;
  quizQuestions: {
    id: string;
    question: string;
    options: string[];
    order: number;
  }[];
  fieldApplications: number;
  myFieldApplication: {
    id: string;
    summary: string;
    outcome: string;
    createdAt: string;
  } | null;
}

export function serializeCourse(
  course: CourseRow,
  options: {
    isEnrolled?: boolean;
    completedAt?: Date | null;
    lessonsCompleted?: number;
    lessonsTotal?: number;
  } = {},
): SerializedCourse {
  const total =
    options.lessonsTotal ?? course._count?.lessons ?? course.lessons?.length ?? 0;
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    level: course.level,
    status: course.status,
    version: course.version,
    reviewedAt: course.reviewedAt?.toISOString() ?? null,
    emoji: course.emoji,
    isPaid: course.isPaid,
    relatedProblemId: course.relatedProblemId,
    relatedProblemTitle: course.relatedProblem?.title ?? null,
    relatedExperienceId: course.relatedExperienceId,
    relatedExperienceTitle: course.relatedExperience?.title ?? null,
    relatedExperienceSlug: course.relatedExperience?.slug ?? null,
    publishedAt: course.publishedAt?.toISOString() ?? null,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    owner: course.owner
      ? {
          id: course.owner.id,
          displayName: course.owner.displayName,
          isVerified: course.owner.membershipStatus === "verified",
        }
      : null,
    tags: (course.tags ?? []).map((item) => item.tag.name),
    lessonCount: total,
    enrollmentCount: course._count?.enrollments ?? 0,
    isEnrolled: options.isEnrolled ?? false,
    completedAt: options.completedAt?.toISOString() ?? null,
    lessonsCompleted: options.lessonsCompleted ?? 0,
    lessonsTotal: total,
  };
}

export function serializeLesson(
  lesson: LessonRow,
  options: {
    progressStatus?: string;
    quizPassed?: boolean;
    myFieldApplication?: { id: string; summary: string; outcome: string; createdAt: Date } | null;
    fieldApplications?: number;
  } = {},
): SerializedLesson {
  const questions = lesson.quizQuestions ?? [];
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    summary: lesson.summary,
    body: lesson.body,
    contentType: lesson.contentType,
    mediaUrl: lesson.mediaUrl,
    durationMinutes: lesson.durationMinutes,
    order: lesson.order,
    isOptional: lesson.isOptional,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    progressStatus: options.progressStatus ?? "not_started",
    quizPassed: options.quizPassed ?? false,
    quizQuestions: questions
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        question: q.question,
        options: (q.options as { text: string }[]).map((o) => o.text),
        order: q.order,
      })),
    fieldApplications: options.fieldApplications ?? 0,
    myFieldApplication: options.myFieldApplication
      ? {
          id: options.myFieldApplication.id,
          summary: options.myFieldApplication.summary,
          outcome: options.myFieldApplication.outcome,
          createdAt: options.myFieldApplication.createdAt.toISOString(),
        }
      : null,
  };
}

/**
 * گرفتن دوره‌های منتشرشده به‌همراه وضعیت ثبت‌نام/پیشرفت کاربر واردشده.
 */
export async function listPublishedCourses(
  userId: string,
): Promise<SerializedCourse[]> {
  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({
      where: { status: "published", publishedAt: { not: null } },
      include: COURSE_LIST_INCLUDE,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.courseEnrollment.findMany({
      where: { userId },
      select: { courseId: true, completedAt: true },
    }),
  ]);

  const enrollMap = new Map(
    enrollments.map((e) => [e.courseId, e.completedAt]),
  );

  return (courses as unknown as CourseRow[]).map((course) =>
    serializeCourse(course, {
      isEnrolled: enrollMap.has(course.id),
      completedAt: enrollMap.get(course.id) ?? null,
    }),
  );
}

/**
 * گرفتن جزئیات یک دوره برای نمایش/یادگیری کاربر.
 * پرسش‌های آزمونک بدون گزینه‌های صحیح به کلاینت فرستاده می‌شوند
 * (گزینه صحیح فقط هنگام تصحیح روی سرور استفاده می‌شود).
 */
export async function getCourseDetail(
  slug: string,
  userId: string,
): Promise<{
  course: SerializedCourse;
  lessons: SerializedLesson[];
}> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      ...COURSE_DETAIL_INCLUDE,
      lessons: {
        include: {
          quizQuestions: { orderBy: { order: "asc" } },
          progress: { where: { userId } },
          applications: {
            where: { userId },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { order: "asc" },
      },
      enrollments: { where: { userId } },
    },
  });

  if (!course) {
    throw new AppError("NOT_FOUND", "دوره یافت نشد");
  }
  if (course.status !== "published" || !course.publishedAt) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isManager =
      user?.role === "admin" || user?.role === "super_admin" || user?.role === "mentor";
    if (!isManager && course.ownerId !== userId) {
      throw new AppError("NOT_FOUND", "دوره یافت نشد");
    }
  }

  const enrollment = course.enrollments[0] ?? null;

  const lessons = (course.lessons as unknown as LessonRow[]).map((lesson) => {
    const progress = lesson.progress?.[0];
    const app = lesson.applications?.[0];
    return serializeLesson(lesson, {
      progressStatus: progress?.status ?? "not_started",
      quizPassed: progress?.quizPassed ?? false,
      fieldApplications: lesson.applications?.length ?? 0,
      myFieldApplication: app
        ? {
            id: app.id,
            summary: app.summary,
            outcome: app.outcome,
            createdAt: app.createdAt,
          }
        : null,
    });
  });

  const lessonsTotal = lessons.length;
  const lessonsCompleted = lessons.filter(
    (l) => l.progressStatus === "completed",
  ).length;

  const serializedCourse = serializeCourse(course as unknown as CourseRow, {
    isEnrolled: enrollment !== null,
    completedAt: enrollment?.completedAt ?? null,
    lessonsCompleted,
    lessonsTotal,
  });

  return { course: serializedCourse, lessons };
}

/**
 * ثبت‌نام در دوره.
 */
export async function enrollInCourse(
  courseId: string,
  userId: string,
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true, publishedAt: true },
  });
  if (!course || course.status !== "published" || !course.publishedAt) {
    throw new AppError("NOT_FOUND", "دوره یافت نشد");
  }

  await prisma.courseEnrollment.upsert({
    where: { courseId_userId: { courseId, userId } },
    update: {},
    create: { courseId, userId },
  });
}

/**
 * علامت‌گذاری یک درس به‌عنوان تکمیل‌شده (و پایان آزمونک در صورت وجود).
 * اگر همه درس‌های الزامی تکمیل شوند، دوره تکمیل می‌شود.
 */
export async function completeLesson(
  lessonId: string,
  courseId: string,
  userId: string,
): Promise<{ courseCompleted: boolean }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, isOptional: true },
  });
  if (!lesson || lesson.courseId !== courseId) {
    throw new AppError("NOT_FOUND", "درس یافت نشد");
  }

  const [questions, hasQuiz] = await Promise.all([
    prisma.courseQuizQuestion.count({ where: { lessonId } }),
    prisma.quizAttempt.findFirst({
      where: { lessonId, userId, passed: true },
      select: { id: true },
    }),
  ]);

  if (questions > 0 && !hasQuiz) {
    throw new AppError(
      "CONFLICT",
      "برای تکمیل این درس ابتدا باید آزمونک را با موفقیت بگذرانید",
    );
  }

  await prisma.lessonProgress.upsert({
    where: { lessonId_userId: { lessonId, userId } },
    update: {
      status: "completed",
      quizPassed: true,
      completedAt: new Date(),
    },
    create: {
      lessonId,
      userId,
      status: "completed",
      quizPassed: true,
      completedAt: new Date(),
    },
  });

  await prisma.courseEnrollment.upsert({
    where: { courseId_userId: { courseId, userId } },
    update: {},
    create: { courseId, userId },
  });

  const [requiredTotal, completedRequired] = await Promise.all([
    prisma.lesson.count({ where: { courseId, isOptional: false } }),
    prisma.lesson.count({
      where: {
        courseId,
        isOptional: false,
        progress: { some: { userId, status: "completed" } },
      },
    }),
  ]);

  let courseCompleted = false;
  if (requiredTotal > 0 && completedRequired >= requiredTotal) {
    await prisma.courseEnrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data: { completedAt: new Date() },
    });
    courseCompleted = true;
  }

  return { courseCompleted };
}

/**
 * تصحیح آزمونک درس روی سرور. گزینه‌های صحیح هرگز به کلاینت ارسال نمی‌شوند.
 * بازگشت: امتیاز، مجموع و وضعیت قبولی.
 */
export async function gradeQuiz(
  lessonId: string,
  userId: string,
  answers: number[],
): Promise<{ score: number; total: number; passed: boolean }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true },
  });
  if (!lesson) {
    throw new AppError("NOT_FOUND", "درس یافت نشد");
  }

  const questions = await prisma.courseQuizQuestion.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    throw new AppError("CONFLICT", "این درس آزمونک ندارد");
  }
  if (answers.length !== questions.length) {
    throw new AppError(
      "VALIDATION",
      "تعداد پاسخ‌ها با تعداد پرسش‌ها هماهنگ نیست",
    );
  }

  let score = 0;
  questions.forEach((q, index) => {
    if (answers[index] === q.correctIndex) score += 1;
  });
  const total = questions.length;
  const passed = score === total;

  await prisma.quizAttempt.create({
    data: { lessonId, userId, score, total, passed },
  });

  if (passed) {
    await prisma.lessonProgress.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      update: { quizPassed: true },
      create: {
        lessonId,
        userId,
        status: "in_progress",
        quizPassed: true,
      },
    });
  }

  return { score, total, passed };
}

/**
 * ثبت کاربرد میدانی یک درس (بستن حلقه «آموزش → سنجش → کاربرد»).
 */
export async function recordFieldApplication(
  lessonId: string,
  userId: string,
  input: { summary: string; outcome: string },
): Promise<void> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true },
  });
  if (!lesson) {
    throw new AppError("NOT_FOUND", "درس یافت نشد");
  }

  await prisma.fieldApplication.create({
    data: {
      lessonId,
      courseId: lesson.courseId,
      userId,
      summary: input.summary,
      outcome: input.outcome as "successful" | "partial" | "unsuccessful",
    },
  });
}

export interface LessonForLearning {
  id: string;
  courseId: string;
  courseSlug: string;
  title: string;
  summary: string | null;
  body: string;
  contentType: LessonContentType;
  mediaUrl: string | null;
  durationMinutes: number | null;
  order: number;
  isOptional: boolean;
  progressStatus: string;
  quizPassed: boolean;
  quizQuestions: { id: string; question: string; options: string[] }[];
}

/**
 * گرفتن یک درس برای صفحه یادگیری. پرسش‌های آزمونک بدون گزینه صحیح ارسال می‌شوند
 * (گزینه صحیح فقط روی سرور در gradeQuiz استفاده می‌شود). ورود فقط برای
 * کاربران ثبت‌نام‌شده در دوره یا مدیران/مالک مجاز است.
 */
export async function getLessonForLearning(
  lessonId: string,
  userId: string,
): Promise<{
  lesson: LessonForLearning;
  course: { id: string; slug: string; title: string; status: string; publishedAt: Date | null };
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
}> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { select: { id: true, slug: true, title: true, status: true, publishedAt: true } },
      quizQuestions: { orderBy: { order: "asc" } },
    },
  });
  if (!lesson) {
    throw new AppError("NOT_FOUND", "درس یافت نشد");
  }

  const course = lesson.course;
  const isPublished = course.status === "published" && course.publishedAt !== null;

  if (!isPublished) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isManager =
      user?.role === "admin" || user?.role === "super_admin" || user?.role === "mentor";
    if (!isManager) {
      throw new AppError("NOT_FOUND", "درس یافت نشد");
    }
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_userId: { courseId: course.id, userId } },
    select: { id: true },
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isManager =
    user?.role === "admin" || user?.role === "super_admin" || user?.role === "mentor";
  if (!enrollment && !isManager) {
    throw new AppError(
      "FORBIDDEN",
      "برای مشاهده درس‌ها ابتدا در دوره ثبت‌نام کنید",
    );
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: { lessonId_userId: { lessonId, userId } },
    select: { status: true, quizPassed: true },
  });

  const siblings = await prisma.lesson.findMany({
    where: { courseId: course.id },
    select: { id: true, title: true, order: true },
    orderBy: { order: "asc" },
  });

  let prevLesson: { id: string; title: string } | null = null;
  let nextLesson: { id: string; title: string } | null = null;
  for (let i = 0; i < siblings.length; i++) {
    if (siblings[i].id === lessonId) {
      prevLesson = siblings[i - 1] ?? null;
      nextLesson = siblings[i + 1] ?? null;
      break;
    }
  }

  return {
    lesson: {
      id: lesson.id,
      courseId: course.id,
      courseSlug: course.slug,
      title: lesson.title,
      summary: lesson.summary,
      body: lesson.body,
      contentType: lesson.contentType,
      mediaUrl: lesson.mediaUrl,
      durationMinutes: lesson.durationMinutes,
      order: lesson.order,
      isOptional: lesson.isOptional,
      progressStatus: progress?.status ?? "not_started",
      quizPassed: progress?.quizPassed ?? false,
      quizQuestions: (lesson.quizQuestions as unknown as QuizQuestionRow[])
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          id: q.id,
          question: q.question,
          options: (q.options as { text: string }[]).map((o) => o.text),
        })),
    },
    course,
    prevLesson,
    nextLesson,
  };
}

/**
 * پیشنهاد دوره‌ها بر اساس علایق/مهارت‌ها و برچسب‌های مسائل/تجربه‌های کاربر.
 * منطق ساده، قابل توضیح و بدون وابستگی به محبوبیت.
 */
export async function recommendCourses(
  userId: string,
): Promise<SerializedCourse[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      interests: { include: { interest: true } },
      skills: { include: { skill: true } },
    },
  });

  const interestNames = (user?.interests ?? []).map((i) => i.interest.name);
  const skillNames = (user?.skills ?? []).map((s) => s.skill.name);
  const profileTags = [...new Set([...interestNames, ...skillNames])];

  const [problemTags, experienceTags] = await Promise.all([
    prisma.problemTag.findMany({
      where: {
        problem: {
          authorId: userId,
          isDraft: false,
          moderation: "visible",
          publishedAt: { not: null },
        },
      },
      select: { tag: { select: { name: true } } },
    }),
    prisma.experienceTag.findMany({
      where: {
        experience: {
          authorId: userId,
          isDraft: false,
          moderation: "visible",
          publishedAt: { not: null },
        },
      },
      select: { tag: { select: { name: true } } },
    }),
  ]);

  const contentTags = [
    ...new Set([
      ...problemTags.map((t) => t.tag.name),
      ...experienceTags.map((t) => t.tag.name),
    ]),
  ];
  const allTags = [...new Set([...profileTags, ...contentTags])];

  const courses = await prisma.course.findMany({
    where: {
      status: "published",
      publishedAt: { not: null },
      tags: { some: { tag: { name: { in: allTags } } } },
    },
    include: COURSE_LIST_INCLUDE,
    orderBy: { publishedAt: "desc" },
    take: 6,
  });

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId },
    select: { courseId: true, completedAt: true },
  });
  const enrollMap = new Map(
    enrollments.map((e) => [e.courseId, e.completedAt]),
  );

  return (courses as unknown as CourseRow[]).map((course) =>
    serializeCourse(course, {
      isEnrolled: enrollMap.has(course.id),
      completedAt: enrollMap.get(course.id) ?? null,
    }),
  );
}
