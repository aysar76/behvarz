import { describe, expect, it } from "vitest";
import {
  serializeCourse,
  serializeLesson,
  type CourseRow,
  type LessonRow,
} from "@/lib/academy";

function buildCourse(overrides: Partial<CourseRow> = {}): CourseRow {
  return {
    id: "course_1",
    slug: "vaccination-communication",
    title: "ارتباط مؤثر در واکسیناسیون",
    description: "مسیر یادگیری کوتاه برای بهبود ارتباط با خانواده‌ها.",
    level: "beginner",
    status: "published",
    ownerId: "user_1",
    version: 2,
    reviewedAt: new Date("2026-01-01T00:00:00Z"),
    emoji: "💉",
    isPaid: false,
    relatedProblemId: null,
    relatedExperienceId: null,
    publishedAt: new Date("2026-01-01T00:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    owner: {
      id: "user_1",
      displayName: "مریم",
      province: "خراسان رضوی",
      city: "سبزوار",
      membershipStatus: "verified",
      role: "member",
    },
    tags: [{ tag: { id: "tag_1", name: "واکسیناسیون" } }],
    relatedProblem: null,
    relatedExperience: null,
    lessons: [],
    _count: { lessons: 3, enrollments: 10 },
    ...overrides,
  };
}

function buildLesson(overrides: Partial<LessonRow> = {}): LessonRow {
  return {
    id: "lesson_1",
    courseId: "course_1",
    title: "مقدمه",
    summary: "چرا ارتباط مهم است؟",
    body: "محتوا",
    contentType: "text",
    mediaUrl: null,
    durationMinutes: 5,
    order: 0,
    isOptional: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    quizQuestions: [
      {
        id: "q_1",
        lessonId: "lesson_1",
        question: "اولین گام چیست؟",
        options: [{ text: "گوش دادن" }, { text: "قضاوت" }],
        correctIndex: 0,
        explanation: null,
        order: 0,
      },
    ],
    ...overrides,
  };
}

describe("serializeCourse", () => {
  it("serializes core fields and flattens tags", () => {
    const result = serializeCourse(buildCourse());
    expect(result.slug).toBe("vaccination-communication");
    expect(result.tags).toEqual(["واکسیناسیون"]);
    expect(result.lessonCount).toBe(3);
    expect(result.enrollmentCount).toBe(10);
    expect(result.owner?.displayName).toBe("مریم");
    expect(result.owner?.isVerified).toBe(true);
  });

  it("reports enrollment state", () => {
    const result = serializeCourse(buildCourse(), {
      isEnrolled: true,
      completedAt: new Date("2026-02-01T00:00:00Z"),
      lessonsCompleted: 2,
      lessonsTotal: 3,
    });
    expect(result.isEnrolled).toBe(true);
    expect(result.completedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(result.lessonsCompleted).toBe(2);
    expect(result.lessonsTotal).toBe(3);
  });

  it("falls back lesson count to lessons array", () => {
    const course = buildCourse();
    course._count = undefined;
    course.lessons = [buildLesson(), buildLesson()];
    const result = serializeCourse(course);
    expect(result.lessonCount).toBe(2);
  });
});

describe("serializeLesson", () => {
  it("serializes quiz questions and strips correct answers", () => {
    const result = serializeLesson(buildLesson(), {
      progressStatus: "in_progress",
      quizPassed: false,
    });
    expect(result.progressStatus).toBe("in_progress");
    expect(result.quizQuestions).toHaveLength(1);
    expect(result.quizQuestions[0].options).toEqual(["گوش دادن", "قضاوت"]);
    expect(result.quizQuestions[0]).not.toHaveProperty("correctIndex");
  });

  it("reports field application state", () => {
    const result = serializeLesson(buildLesson(), {
      fieldApplications: 2,
      myFieldApplication: {
        id: "fa_1",
        summary: "در خانه بهداشت به کار بردم.",
        outcome: "successful",
        createdAt: new Date("2026-02-01T00:00:00Z"),
      },
    });
    expect(result.fieldApplications).toBe(2);
    expect(result.myFieldApplication?.outcome).toBe("successful");
  });
});