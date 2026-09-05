import { describe, expect, it } from "vitest";
import {
  serializeBenefitProvider,
  serializeBudgetProposal,
} from "@/lib/benefits";

const baseProvider = {
  id: "p1",
  name: "بیمه سلامت",
  category: "insurance" as const,
  description: "توضیح",
  terms: "شرایط",
  website: "https://example.com",
  contactNote: null,
  logoEmoji: "🛡️",
  isSponsored: true,
  status: "approved",
  createdById: "u1",
  publishedAt: new Date("2026-01-01T00:00:00Z"),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("serializeBenefitProvider", () => {
  it("serializes with counts and my usage", () => {
    const result = serializeBenefitProvider(
      { ...baseProvider, _count: { usages: 5 } },
      {
        averageSatisfaction: 4.5,
        myUsage: {
          id: "usage1",
          satisfaction: 5,
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      },
    );

    expect(result.usageCount).toBe(5);
    expect(result.averageSatisfaction).toBe(4.5);
    expect(result.myUsage?.satisfaction).toBe(5);
    expect(result.isSponsored).toBe(true);
    expect(result.publishedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("defaults my usage and satisfaction to null", () => {
    const result = serializeBenefitProvider(baseProvider);
    expect(result.myUsage).toBeNull();
    expect(result.averageSatisfaction).toBeNull();
    expect(result.usageCount).toBe(0);
  });
});

describe("serializeBudgetProposal", () => {
  const proposal = {
    id: "b1",
    title: "پیشنهاد",
    description: "شرح",
    category: "training",
    amountEstimate: "۵۰ میلیون",
    status: "voting" as const,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    implementedAt: null,
    author: { id: "u1", displayName: "علی" },
    _count: { votes: 3 },
    implementations: [{ summary: "گزارش", createdAt: new Date() }],
  };

  it("serializes with votes and my vote", () => {
    const result = serializeBudgetProposal(proposal, { myVote: true });
    expect(result.voteCount).toBe(3);
    expect(result.myVote).toBe(true);
    expect(result.status).toBe("voting");
    expect(result.author?.displayName).toBe("علی");
  });

  it("serializes without options", () => {
    const result = serializeBudgetProposal(proposal);
    expect(result.myVote).toBe(false);
  });
});