import { describe, expect, it } from "vitest";
import { serializeCampaign } from "@/lib/campaigns";

const baseCampaign = {
  id: "c1",
  family: "learning" as const,
  title: "مأموریت یادگیری",
  description: "شرح کمپین",
  status: "active" as const,
  startsAt: null,
  endsAt: null,
  isOptional: true,
  createdById: "u1",
  publishedAt: new Date("2026-01-01T00:00:00Z"),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("serializeCampaign", () => {
  it("serializes with participation count", () => {
    const result = serializeCampaign(
      { ...baseCampaign, _count: { participations: 4 } },
      { isParticipating: true },
    );
    expect(result.participationCount).toBe(4);
    expect(result.isParticipating).toBe(true);
    expect(result.family).toBe("learning");
    expect(result.publishedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("defaults participation flags", () => {
    const result = serializeCampaign(baseCampaign);
    expect(result.participationCount).toBe(0);
    expect(result.isParticipating).toBe(false);
  });
});

describe("campaign create schema", () => {
  it("accepts a valid campaign", async () => {
    const { campaignCreateSchema } = await import("@/lib/validations/campaign");
    const result = campaignCreateSchema.safeParse({
      family: "mission",
      title: "مأموریت یک‌ماهه",
      description: "شرح مفصل و کافی برای کمپین",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short title", async () => {
    const { campaignCreateSchema } = await import("@/lib/validations/campaign");
    const result = campaignCreateSchema.safeParse({
      family: "mission",
      title: "اب",
      description: "شرح مفصل و کافی برای کمپین",
    });
    expect(result.success).toBe(false);
  });
});

describe("data contribution schema", () => {
  it("accepts a boolean", async () => {
    const { dataContributionSchema } = await import("@/lib/validations/campaign");
    expect(dataContributionSchema.safeParse({ allowDataContribution: true }).success).toBe(true);
    expect(dataContributionSchema.safeParse({ allowDataContribution: false }).success).toBe(true);
  });

  it("rejects non-boolean", async () => {
    const { dataContributionSchema } = await import("@/lib/validations/campaign");
    expect(dataContributionSchema.safeParse({ allowDataContribution: "yes" }).success).toBe(false);
  });
});