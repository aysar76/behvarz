import { describe, expect, it } from "vitest";
import {
  peerCooperationCompleteSchema,
  peerHelpRequestSchema,
  peerMessageSchema,
  peerOfferCreateSchema,
  peerOfferRespondSchema,
} from "@/lib/validations/peer";

describe("peerHelpRequestSchema", () => {
  const valid = {
    title: "اجرای برنامه غربالگری فشار خون",
    description:
      "برای اجرای برنامه غربالگری در روستای محل خدمت به تجربه یک همکار نیاز دارم.",
    barrierType: "knowledge",
  };

  it("accepts a valid help request", () => {
    expect(() => peerHelpRequestSchema.parse(valid)).not.toThrow();
  });

  it("accepts tags and province", () => {
    expect(() =>
      peerHelpRequestSchema.parse({
        ...valid,
        tags: ["غربالگری", "فشار خون"],
        province: "خراسان رضوی",
      }),
    ).not.toThrow();
  });

  it("defaults barrierType to other", () => {
    const result = peerHelpRequestSchema.parse({
      title: valid.title,
      description: valid.description,
    });
    expect(result.barrierType).toBe("other");
  });

  it("rejects a too-short title", () => {
    expect(() =>
      peerHelpRequestSchema.parse({ ...valid, title: "سلام" }),
    ).toThrow();
  });

  it("rejects more than 5 tags", () => {
    const manyTags = Array.from({ length: 6 }, (_, i) => `برچسب ${i}`);
    expect(() =>
      peerHelpRequestSchema.parse({ ...valid, tags: manyTags }),
    ).toThrow();
  });
});

describe("peerOfferCreateSchema", () => {
  it("accepts helpRequestId with an optional helperId", () => {
    expect(() =>
      peerOfferCreateSchema.parse({ helpRequestId: "hr1" }),
    ).not.toThrow();
    expect(() =>
      peerOfferCreateSchema.parse({
        helpRequestId: "hr1",
        helperId: "u2",
        message: "تجربه مرتبط دارم",
      }),
    ).not.toThrow();
  });

  it("rejects a missing helpRequestId", () => {
    expect(() => peerOfferCreateSchema.parse({})).toThrow();
  });
});

describe("peerOfferRespondSchema", () => {
  it("accepts accept and reject", () => {
    for (const action of ["accept", "reject"]) {
      expect(() => peerOfferRespondSchema.parse({ action })).not.toThrow();
    }
  });

  it("rejects an unknown action", () => {
    expect(() => peerOfferRespondSchema.parse({ action: "maybe" })).toThrow();
  });
});

describe("peerMessageSchema", () => {
  it("accepts a valid message", () => {
    expect(() => peerMessageSchema.parse({ body: "سلام، تجربه من..." })).not.toThrow();
  });

  it("rejects an empty message", () => {
    expect(() => peerMessageSchema.parse({ body: "   " })).toThrow();
  });

  it("rejects an over-long message", () => {
    expect(() => peerMessageSchema.parse({ body: "x".repeat(1001) })).toThrow();
  });
});

describe("peerCooperationCompleteSchema", () => {
  it("accepts outcome with optional ratings", () => {
    expect(() =>
      peerCooperationCompleteSchema.parse({
        outcomeSummary: "راهکار اجرا شد و نتیجه موفق بود",
        requesterRating: 5,
      }),
    ).not.toThrow();
  });

  it("rejects a too-short outcome", () => {
    expect(() =>
      peerCooperationCompleteSchema.parse({ outcomeSummary: "خوب" }),
    ).toThrow();
  });

  it("rejects rating out of range", () => {
    expect(() =>
      peerCooperationCompleteSchema.parse({
        outcomeSummary: "راهکار اجرا شد و نتیجه موفق بود",
        helperRating: 6,
      }),
    ).toThrow();
  });
});