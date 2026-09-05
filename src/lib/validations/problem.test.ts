import { describe, expect, it } from "vitest";
import {
  answerSchema,
  problemCreateSchema,
  reportSchema,
  resultSchema,
  selectSolutionSchema,
  statusUpdateSchema,
} from "@/lib/validations/problem";

describe("problemCreateSchema", () => {
  const valid = {
    title: "کاهش پوشش واکسیناسیون در روستا",
    description:
      "طی ماه گذشته پوشش واکسیناسیون کودکان در روستای محل خدمت کاهش پیدا کرده است.",
    barrierType: "community",
    urgency: "high",
  };

  it("accepts a valid problem", () => {
    expect(() => problemCreateSchema.parse(valid)).not.toThrow();
  });

  it("accepts optional fields and anonymous flag", () => {
    const withOptions = {
      ...valid,
      context: "جمعیت ۲۰۰ خانواری",
      actionsTaken: "فراخوان حضوری",
      expectedOutcome: "بازگشت پوشش به سطح قبل",
      tags: ["واکسیناسیون", "ارتباط با جامعه"],
      isAnonymous: true,
    };
    expect(() => problemCreateSchema.parse(withOptions)).not.toThrow();
  });

  it("rejects a too-short title", () => {
    expect(() =>
      problemCreateSchema.parse({ ...valid, title: "سلام" }),
    ).toThrow();
  });

  it("rejects a too-short description", () => {
    expect(() =>
      problemCreateSchema.parse({ ...valid, description: "کوتاه" }),
    ).toThrow();
  });

  it("rejects invalid barrierType", () => {
    expect(() =>
      problemCreateSchema.parse({ ...valid, barrierType: "bogus" }),
    ).toThrow();
  });

  it("rejects more than 5 tags", () => {
    const manyTags = Array.from({ length: 6 }, (_, i) => `برچسب ${i}`);
    expect(() =>
      problemCreateSchema.parse({ ...valid, tags: manyTags }),
    ).toThrow();
  });
});

describe("answerSchema", () => {
  it("accepts a valid answer", () => {
    expect(
      answerSchema.parse({ body: "تجربه من در این زمینه چنین بود..." }).body,
    ).toBeTruthy();
  });

  it("accepts experience slug references", () => {
    expect(() =>
      answerSchema.parse({
        body: "تجربه من در این زمینه چنین بود...",
        experienceSlugs: ["tajrobe-abc12345", "tajrobe-def67890"],
      }),
    ).not.toThrow();
  });

  it("rejects more than 3 experience references", () => {
    expect(() =>
      answerSchema.parse({
        body: "تجربه من در این زمینه چنین بود...",
        experienceSlugs: ["a", "b", "c", "d"],
      }),
    ).toThrow();
  });

  it("rejects a too-short answer", () => {
    expect(() => answerSchema.parse({ body: "کوتاه" })).toThrow();
  });

  it("rejects an over-long answer", () => {
    expect(() => answerSchema.parse({ body: "x".repeat(2001) })).toThrow();
  });
});

describe("selectSolutionSchema", () => {
  it("accepts answerId and conclusion", () => {
    expect(() =>
      selectSolutionSchema.parse({
        answerId: "clx123",
        conclusion: "این راهکار نتیجه داد",
      }),
    ).not.toThrow();
  });

  it("rejects a missing conclusion", () => {
    expect(() =>
      selectSolutionSchema.parse({ answerId: "clx123", conclusion: "بدون" }),
    ).toThrow();
  });
});

describe("resultSchema", () => {
  it("accepts a valid result", () => {
    expect(() =>
      resultSchema.parse({
        resultOutcome: "successful",
        resultSummary: "پوشش به سطح قبل بازگشت",
      }),
    ).not.toThrow();
  });

  it("rejects invalid outcome", () => {
    expect(() =>
      resultSchema.parse({
        resultOutcome: "maybe",
        resultSummary: "پوشش به سطح قبل بازگشت",
      }),
    ).toThrow();
  });
});

describe("statusUpdateSchema", () => {
  it("accepts valid status values", () => {
    for (const status of ["open", "discussing", "solved", "archived"]) {
      expect(() => statusUpdateSchema.parse({ to: status })).not.toThrow();
    }
  });

  it("rejects unknown status", () => {
    expect(() => statusUpdateSchema.parse({ to: "deleted" })).toThrow();
  });
});

describe("reportSchema", () => {
  it("accepts a valid problem report", () => {
    expect(() =>
      reportSchema.parse({
        targetType: "problem",
        targetId: "clx123",
        reason: "sensitive_info",
      }),
    ).not.toThrow();
  });

  it("accepts an experience report", () => {
    expect(() =>
      reportSchema.parse({
        targetType: "experience",
        targetId: "clx123",
        reason: "medical_advice",
      }),
    ).not.toThrow();
  });

  it("rejects an unknown reason", () => {
    expect(() =>
      reportSchema.parse({
        targetType: "answer",
        targetId: "clx123",
        reason: "just_because",
      }),
    ).toThrow();
  });

  it("rejects an unknown target type", () => {
    expect(() =>
      reportSchema.parse({
        targetType: "comment",
        targetId: "clx123",
        reason: "spam",
      }),
    ).toThrow();
  });
});
