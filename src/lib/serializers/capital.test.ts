import { describe, expect, it } from "vitest";
import {
  computeBadges,
  serializeCapitalProfile,
  type CapitalUserRow,
} from "@/lib/serializers/capital";

function buildUser(overrides: Partial<CapitalUserRow> = {}): CapitalUserRow {
  return {
    id: "u1",
    displayName: "مریم",
    province: "خراسان رضوی",
    city: "سبزوار",
    bio: null,
    workYears: "3-5",
    role: "member",
    membershipStatus: "verified",
    visibility: "members",
    ...overrides,
  };
}

describe("computeBadges", () => {
  it("returns no badges for an empty profile", () => {
    expect(
      computeBadges({
        publishedExperiences: 0,
        featuredExperiences: 0,
        solvedProblems: 0,
        validReferences: 0,
        successfulReusesByOthers: 0,
        thanksReceived: 0,
        isVerified: false,
      }),
    ).toEqual([]);
  });

  it("grants evidence-based badges", () => {
    const badges = computeBadges({
      publishedExperiences: 6,
      featuredExperiences: 1,
      solvedProblems: 2,
      validReferences: 3,
      successfulReusesByOthers: 2,
      thanksReceived: 6,
      helpfulAnswers: 1,
      activeCircles: 1,
      isVerified: true,
    });
    const ids = badges.map((badge) => badge.id);
    expect(ids).toContain("first-experience");
    expect(ids).toContain("experienced");
    expect(ids).toContain("featured");
    expect(ids).toContain("problem-solver");
    expect(ids).toContain("helpful-answer");
    expect(ids).toContain("circle-member");
    expect(ids).toContain("referenced");
    expect(ids).toContain("reused");
    expect(ids).toContain("appreciated");
    expect(ids).toContain("verified-member");
  });

  it("does not grant helpful/circle badges without evidence", () => {
    const badges = computeBadges({
      publishedExperiences: 0,
      featuredExperiences: 0,
      solvedProblems: 0,
      validReferences: 0,
      successfulReusesByOthers: 0,
      thanksReceived: 0,
      helpfulAnswers: 0,
      activeCircles: 0,
      isVerified: false,
    });
    const ids = badges.map((badge) => badge.id);
    expect(ids).not.toContain("helpful-answer");
    expect(ids).not.toContain("circle-member");
  });
});

describe("serializeCapitalProfile", () => {
  it("serializes stats and experiences without likes", () => {
    const profile = serializeCapitalProfile({
      user: buildUser(),
      experiences: [
        {
          id: "e1",
          slug: "exp-abc",
          title: "تجربه واکسیناسیون",
          status: "featured",
          thanksCount: 3,
          reuses: [
            { outcome: "successful" },
            { outcome: "partial" },
          ],
          _count: { references: 2, reuses: 2 },
        },
      ],
      solvedProblems: [
        {
          id: "p1",
          title: "مسئله اول",
          status: "solved",
          conclusion: "راهکار مفید بود",
          solvedAt: new Date("2026-01-01T00:00:00Z"),
        },
      ],
      successfulReuseCount: 1,
      thanksReceivedCount: 5,
    });

    expect(profile.stats.publishedExperiences).toBe(1);
    expect(profile.stats.solvedProblems).toBe(1);
    expect(profile.stats.validReferences).toBe(2);
    expect(profile.stats.successfulReusesByOthers).toBe(1);
    expect(profile.stats.thanksReceived).toBe(5);
    expect(profile.experiences[0].referenceCount).toBe(2);
    expect(profile.experiences[0].reuseCount).toBe(2);
    expect(profile.experiences[0].reuseSuccessCount).toBe(1);
    expect(profile.experiences[0].featured).toBe(true);
    expect(profile.solvedProblems[0].solvedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(profile.user.isVerified).toBe(true);
  });
});