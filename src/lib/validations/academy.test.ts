import { describe, expect, it } from "vitest";
import {
  courseCreateSchema,
  courseUpdateSchema,
  fieldApplicationSchema,
  quizQuestionSchema,
  quizSubmitSchema,
  lessonCreateSchema,
} from "@/lib/validations/academy";

describe("courseCreateSchema", () => {
  it("accepts a valid course", () => {
    const result = courseCreateSchema.parse({
      slug: "vaccination-communication",
      title: "ارتباط مؤثر در واکسیناسیون",
      description: "مسیر یادگیری کوتاه برای بهبود ارتباط با خانواده‌ها.",
      level: "beginner",
      status: "draft",
      emoji: "💉",
      tags: ["واکسیناسیون"],
    });
    expect(result.slug).toBe("vaccination-communication");
    expect(result.level).toBe("beginner");
  });

  it("rejects invalid slug characters", () => {
    expect(() =>
      courseCreateSchema.parse({
        slug: "Vaccination ارتباط",
        title: "دوره تست",
        description: "توضیح کافی برای دوره تست.",
        level: "beginner",
        status: "draft",
      }),
    ).toThrow();
  });

  it("rejects too-short title", () => {
    expect(() =>
      courseCreateSchema.parse({
        slug: "test-course",
        title: "ab",
        description: "توضیح کافی برای دوره تست.",
        level: "beginner",
        status: "draft",
      }),
    ).toThrow();
  });
});

describe("courseUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = courseUpdateSchema.parse({ title: "عنوان جدید" });
    expect(result.title).toBe("عنوان جدید");
  });

  it("rejects empty body update", () => {
    expect(() =>
      courseUpdateSchema.parse({ description: "کوتاه" }),
    ).toThrow();
  });
});

describe("quizQuestionSchema", () => {
  it("accepts a valid question", () => {
    const result = quizQuestionSchema.parse({
      question: "اولین گام چیست؟",
      options: [{ text: "گوش دادن" }, { text: "قضاوت" }],
      correctIndex: 0,
      explanation: "گوش دادن اولین گام است.",
    });
    expect(result.correctIndex).toBe(0);
  });

  it("rejects fewer than two options", () => {
    expect(() =>
      quizQuestionSchema.parse({
        question: "سؤال؟",
        options: [{ text: "فقط یک" }],
        correctIndex: 0,
      }),
    ).toThrow();
  });

  it("rejects out-of-range correctIndex", () => {
    expect(() =>
      quizQuestionSchema.parse({
        question: "سؤال؟",
        options: [{ text: "الف" }, { text: "ب" }],
        correctIndex: 5,
      }),
    ).toThrow();
  });
});

describe("lessonCreateSchema", () => {
  it("accepts a valid lesson with quiz", () => {
    const result = lessonCreateSchema.parse({
      courseId: "course_1",
      lesson: {
        title: "مقدمه",
        body: "محتوای کامل درس برای یادگیری.",
        contentType: "text",
        quizQuestions: [
          {
            question: "اولین گام چیست؟",
            options: [{ text: "گوش دادن" }, { text: "قضاوت" }],
            correctIndex: 0,
          },
        ],
      },
    });
    expect(result.lesson.quizQuestions).toHaveLength(1);
  });

  it("rejects too-short lesson body", () => {
    expect(() =>
      lessonCreateSchema.parse({
        courseId: "course_1",
        lesson: { title: "مقدمه", body: "کوتاه", contentType: "text" },
      }),
    ).toThrow();
  });
});

describe("quizSubmitSchema", () => {
  it("accepts an array of answers", () => {
    const result = quizSubmitSchema.parse({ answers: [0, 1, 0] });
    expect(result.answers).toEqual([0, 1, 0]);
  });

  it("rejects negative answers", () => {
    expect(() => quizSubmitSchema.parse({ answers: [-1] })).toThrow();
  });
});

describe("fieldApplicationSchema", () => {
  it("accepts a valid field application", () => {
    const result = fieldApplicationSchema.parse({
      courseId: "course_1",
      summary: "در خانه بهداشت این آموزش را به کار بردم و نتیجه مثبت بود.",
      outcome: "successful",
    });
    expect(result.outcome).toBe("successful");
  });

  it("rejects too-short summary", () => {
    expect(() =>
      fieldApplicationSchema.parse({
        courseId: "course_1",
        summary: "کوتا",
        outcome: "successful",
      }),
    ).toThrow();
  });
});