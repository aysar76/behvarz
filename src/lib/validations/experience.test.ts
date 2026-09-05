import { describe, expect, it } from "vitest";
import {
  experienceCreateSchema,
  experienceReuseSchema,
  experienceReviewSchema,
  experienceUpdateSchema,
} from "@/lib/validations/experience";

const validExperience = {
  title: "افزایش پوشش واکسیناسیون با دعوت حضوری",
  situation:
    "پوشش واکسیناسیون کودکان در روستای محل خدمت طی چند ماه کاهش یافته بود.",
  action:
    "با همکاری بهورز همکار، لیست خانواده‌های عقب‌مانده را تهیه و به‌صورت حضوری دعوت کردم.",
  result: "پوشش به سطح قبل از کاهش بازگشت و سه خانواده پیگیری شدند.",
};

describe("experienceCreateSchema", () => {
  it("accepts a valid experience", () => {
    expect(() => experienceCreateSchema.parse(validExperience)).not.toThrow();
  });

  it("accepts optional fields and tags", () => {
    const withOptions = {
      ...validExperience,
      conditions: "روستای ۲۰۰ خانواری",
      resources: "برگه دعوت نامه",
      challenges: "برخی خانواده‌ها مقاومت می‌کردند",
      lessons: "دعوت حضوری مؤثرتر از پیامک است",
      suggestion: "ابتدا با ریش سفیدان هماهنگ کنید",
      tags: ["واکسیناسیون", "ارتباط با جامعه"],
      isDraft: true,
    };
    expect(() => experienceCreateSchema.parse(withOptions)).not.toThrow();
  });

  it("rejects a too-short title", () => {
    expect(() =>
      experienceCreateSchema.parse({ ...validExperience, title: "سلام" }),
    ).toThrow();
  });

  it("rejects a too-short situation", () => {
    expect(() =>
      experienceCreateSchema.parse({ ...validExperience, situation: "کوتاه" }),
    ).toThrow();
  });

  it("rejects a too-short action", () => {
    expect(() =>
      experienceCreateSchema.parse({ ...validExperience, action: "اقدام" }),
    ).toThrow();
  });

  it("rejects a too-short result", () => {
    expect(() =>
      experienceCreateSchema.parse({ ...validExperience, result: "نت" }),
    ).toThrow();
  });

  it("rejects more than 5 tags", () => {
    const manyTags = Array.from({ length: 6 }, (_, i) => `برچسب ${i}`);
    expect(() =>
      experienceCreateSchema.parse({ ...validExperience, tags: manyTags }),
    ).toThrow();
  });
});

describe("experienceUpdateSchema", () => {
  it("accepts partial updates", () => {
    expect(() =>
      experienceUpdateSchema.parse({ title: "عنوان جدید تجربه" }),
    ).not.toThrow();
  });

  it("rejects invalid partial values", () => {
    expect(() =>
      experienceUpdateSchema.parse({ result: "خ" }),
    ).toThrow();
  });
});

describe("experienceReuseSchema", () => {
  it("accepts a valid reuse result", () => {
    expect(() =>
      experienceReuseSchema.parse({
        outcome: "successful",
        summary: "در منطقه ما نیز همین نتیجه حاصل شد",
      }),
    ).not.toThrow();
  });

  it("rejects an invalid outcome", () => {
    expect(() =>
      experienceReuseSchema.parse({
        outcome: "maybe",
        summary: "در منطقه ما نیز همین نتیجه حاصل شد",
      }),
    ).toThrow();
  });

  it("rejects a too-short summary", () => {
    expect(() =>
      experienceReuseSchema.parse({
        outcome: "successful",
        summary: "بدون",
      }),
    ).toThrow();
  });
});

describe("experienceReviewSchema", () => {
  it("accepts valid review actions", () => {
    for (const action of ["approve", "feature", "unfeature", "unarchive"]) {
      expect(() =>
        experienceReviewSchema.parse({ action }),
      ).not.toThrow();
    }
  });

  it("rejects an unknown action", () => {
    expect(() =>
      experienceReviewSchema.parse({ action: "delete" }),
    ).toThrow();
  });
});