import { describe, expect, it } from "vitest";
import {
  benefitProviderCreateSchema,
  benefitProviderUpdateSchema,
  benefitReportSchema,
  benefitUsageSchema,
  budgetImplementationSchema,
  budgetProposalCreateSchema,
  budgetProposalReviewSchema,
} from "@/lib/validations/benefits";

describe("benefitProviderCreateSchema", () => {
  it("accepts a valid provider", () => {
    const result = benefitProviderCreateSchema.parse({
      name: "بیمه سلامت ایرانیان",
      category: "insurance",
      description: "ارائه خدمات بیمه تکمیلی برای اعضای شبکه.",
      terms: "استفاده با ارائه معرفی‌نامه از پلتفرم امکان‌پذیر است.",
      website: "https://example.com",
      isSponsored: true,
      status: "approved",
    });
    expect(result.name).toBe("بیمه سلامت ایرانیان");
    expect(result.category).toBe("insurance");
    expect(result.isSponsored).toBe(true);
  });

  it("rejects too-short name", () => {
    expect(() =>
      benefitProviderCreateSchema.parse({
        name: "ب",
        category: "health",
        description: "توضیح کافی برای ارائه‌دهنده.",
        terms: "شرایط استفاده برای مزیت ثبت‌شده.",
      }),
    ).toThrow();
  });

  it("rejects invalid category", () => {
    expect(() =>
      benefitProviderCreateSchema.parse({
        name: "ارائه‌دهنده",
        category: "unknown",
        description: "توضیح کافی برای ارائه‌دهنده.",
        terms: "شرایط استفاده برای مزیت ثبت‌شده.",
      }),
    ).toThrow();
  });
});

describe("benefitProviderUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = benefitProviderUpdateSchema.parse({ isSponsored: true });
    expect(result.isSponsored).toBe(true);
  });
});

describe("benefitUsageSchema", () => {
  it("accepts a valid usage", () => {
    const result = benefitUsageSchema.parse({
      providerId: "provider-1",
      satisfaction: 5,
      note: "خدمات عالی بود",
    });
    expect(result.satisfaction).toBe(5);
  });

  it("rejects satisfaction out of range", () => {
    expect(() =>
      benefitUsageSchema.parse({
        providerId: "provider-1",
        satisfaction: 7,
      }),
    ).toThrow();
  });
});

describe("benefitReportSchema", () => {
  it("accepts a valid report", () => {
    const result = benefitReportSchema.parse({
      providerId: "provider-1",
      reason: "misleading",
    });
    expect(result.reason).toBe("misleading");
  });

  it("rejects invalid reason", () => {
    expect(() =>
      benefitReportSchema.parse({
        providerId: "provider-1",
        reason: "whatever",
      }),
    ).toThrow();
  });
});

describe("budgetProposalCreateSchema", () => {
  it("accepts a valid proposal", () => {
    const result = budgetProposalCreateSchema.parse({
      title: "آموزش کمک‌های اولیه",
      description: "برگزاری کارگاه آموزش کمک‌های اولیه برای بهورزان مناطق محروم.",
      category: "training",
      amountEstimate: "حدود ۵۰ میلیون",
    });
    expect(result.category).toBe("training");
  });

  it("rejects too-short description", () => {
    expect(() =>
      budgetProposalCreateSchema.parse({
        title: "آموزش کمک‌های اولیه",
        description: "کوتاه",
        category: "training",
      }),
    ).toThrow();
  });
});

describe("budgetProposalReviewSchema", () => {
  it("accepts a valid review status", () => {
    const result = budgetProposalReviewSchema.parse({ status: "voting" });
    expect(result.status).toBe("voting");
  });

  it("rejects invalid status", () => {
    expect(() => budgetProposalReviewSchema.parse({ status: "draft" })).toThrow();
  });
});

describe("budgetImplementationSchema", () => {
  it("accepts a valid implementation report", () => {
    const result = budgetImplementationSchema.parse({
      proposalId: "proposal-1",
      summary: "کارگاه با حضور ۳۰ بهورز برگزار شد.",
      expenses: [
        { item: "محل برگزاری", amount: "۱۰ میلیون" },
        { item: "مربی", amount: "۲۰ میلیون" },
      ],
    });
    expect(result.expenses?.length).toBe(2);
  });

  it("accepts implementation without expenses", () => {
    const result = budgetImplementationSchema.parse({
      proposalId: "proposal-1",
      summary: "کارگاه برگزار شد.",
    });
    expect(result.expenses).toBeUndefined();
  });
});