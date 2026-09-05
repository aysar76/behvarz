import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { courseCreateSchema } from "@/lib/validations/academy";
import { serializeCourse, type CourseRow } from "@/lib/academy";
import { syncCourseTags } from "@/lib/academy-admin";
import type { z } from "zod";

type CreateCourseInput = z.infer<typeof courseCreateSchema>;

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");

    const courses = await prisma.course.findMany({
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
            role: true,
          },
        },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      courses: (courses as unknown as CourseRow[]).map((course) =>
        serializeCourse(course),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");

    const input = validateInput(
      courseCreateSchema,
      await readJsonBody<CreateCourseInput>(request),
    );

    const existing = await prisma.course.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing) {
      throw new AppError("CONFLICT", "این شناسه دوره از قبل استفاده شده است");
    }

    const publishing = input.status === "published";

    const course = await prisma.course.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        level: input.level,
        status: input.status,
        emoji: input.emoji ?? null,
        relatedProblemId: input.relatedProblemId ?? null,
        relatedExperienceId: input.relatedExperienceId ?? null,
        ownerId: user.id,
        reviewedAt: new Date(),
        publishedAt: publishing ? new Date() : null,
        lessons:
          input.lessons && input.lessons.length > 0
            ? {
                create: input.lessons.map((lesson, index) => ({
                  title: lesson.title,
                  summary: lesson.summary ?? null,
                  body: lesson.body,
                  contentType: lesson.contentType,
                  mediaUrl: lesson.mediaUrl ?? null,
                  durationMinutes: lesson.durationMinutes ?? null,
                  order: lesson.order ?? index,
                  isOptional: lesson.isOptional ?? false,
                  quizQuestions:
                    lesson.quizQuestions && lesson.quizQuestions.length > 0
                      ? {
                          create: lesson.quizQuestions.map((q, qIndex) => ({
                            question: q.question,
                            options: q.options,
                            correctIndex: q.correctIndex,
                            explanation: q.explanation ?? null,
                            order: qIndex,
                          })),
                        }
                      : undefined,
                })),
              }
            : undefined,
      },
    });

    if (input.tags && input.tags.length > 0) {
      await syncCourseTags(course.id, input.tags);
    }

    await auditLog({
      actorId: user.id,
      action: "academy.courseCreate",
      entityType: "Course",
      entityId: course.id,
      details: { publishing },
      ip,
    });

    return jsonOk({ course: { id: course.id, slug: course.slug } }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
