import { describe, expect, it } from "vitest";
import {
  circleCreateSchema,
  circleJoinReviewSchema,
  circleMeetingCreateSchema,
  circleTransferSchema,
} from "@/lib/validations/circle";

describe("circleCreateSchema", () => {
  const valid = {
    name: "حلقه بهورزان خراسان شمالی",
    description: "حلقه برای یادگیری و هم‌افزایی در برنامه‌های بهداشت محیط",
  };

  it("accepts a valid circle", () => {
    expect(() => circleCreateSchema.parse(valid)).not.toThrow();
  });

  it("accepts optional topic, province and capacity", () => {
    expect(() =>
      circleCreateSchema.parse({
        ...valid,
        topic: "بهداشت محیط",
        province: "خراسان شمالی",
        capacity: 8,
      }),
    ).not.toThrow();
  });

  it("rejects a too-short name", () => {
    expect(() =>
      circleCreateSchema.parse({ ...valid, name: "حل" }),
    ).toThrow();
  });

  it("rejects a too-short description", () => {
    expect(() =>
      circleCreateSchema.parse({ ...valid, description: "کوتاه" }),
    ).toThrow();
  });

  it("rejects capacity out of the 5-12 range", () => {
    expect(() =>
      circleCreateSchema.parse({ ...valid, capacity: 3 }),
    ).toThrow();
    expect(() =>
      circleCreateSchema.parse({ ...valid, capacity: 20 }),
    ).toThrow();
  });
});

describe("circleJoinReviewSchema", () => {
  it("accepts approve and reject actions", () => {
    for (const action of ["approve", "reject"]) {
      expect(() => circleJoinReviewSchema.parse({ action })).not.toThrow();
    }
  });

  it("rejects an unknown action", () => {
    expect(() => circleJoinReviewSchema.parse({ action: "maybe" })).toThrow();
  });
});

describe("circleMeetingCreateSchema", () => {
  it("accepts a valid meeting", () => {
    expect(() =>
      circleMeetingCreateSchema.parse({ title: "جلسه برنامه ماهانه" }),
    ).not.toThrow();
  });

  it("accepts agenda and summary", () => {
    expect(() =>
      circleMeetingCreateSchema.parse({
        title: "جلسه برنامه ماهانه",
        agenda: "بررسی نتایج غربالگری",
        summary: "تصمیم گرفتیم کمپین آگاهی‌رسانی برگزار کنیم",
      }),
    ).not.toThrow();
  });

  it("rejects a too-short meeting title", () => {
    expect(() =>
      circleMeetingCreateSchema.parse({ title: "ج" }),
    ).toThrow();
  });
});

describe("circleTransferSchema", () => {
  it("accepts a memberId", () => {
    expect(() =>
      circleTransferSchema.parse({ memberId: "u2" }),
    ).not.toThrow();
  });

  it("rejects a missing memberId", () => {
    expect(() => circleTransferSchema.parse({})).toThrow();
  });
});