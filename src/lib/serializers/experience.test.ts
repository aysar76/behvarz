import { describe, expect, it } from "vitest";
import { serializeExperience, type ExperienceRow } from "@/lib/serializers/experience";

function buildExperience(overrides: Partial<ExperienceRow> = {}): ExperienceRow {
  return {
    id: "exp_1",
    authorId: "user_1",
    slug: "tajrobe-abcdefgh",
    title: "تجربه موفق واکسیناسیون",
    situation: "پوشش واکسیناسیون کاهش یافته بود.",
    conditions: "روستای ۲۰۰ خانواری",
    action: "دعوت حضوری خانواده‌ها",
    resources: null,
    challenges: null,
    result: "پوشش بازگشت",
    lessons: null,
    suggestion: null,
    status: "user_generated",
    isDraft: false,
    needsReview: false,
    moderation: "visible",
    moderationNote: null,
    sourceProblemId: null,
    publishedAt: new Date("2026-01-01T00:00:00Z"),
    reviewedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    author: {
      id: "user_1",
      displayName: "مریم",
      province: "خراسان رضوی",
      city: "سبزوار",
      membershipStatus: "verified",
      role: "member",
    },
    tags: [{ tag: { id: "tag_1", name: "واکسیناسیون" } }],
    sourceProblem: null,
    reuses: [],
    references: [],
    ...overrides,
  };
}

describe("serializeExperience", () => {
  it("serializes core fields and flattens tags", () => {
    const result = serializeExperience(buildExperience());
    expect(result.slug).toBe("tajrobe-abcdefgh");
    expect(result.tags).toEqual(["واکسیناسیون"]);
    expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("always reveals the author (recognition-based, no anonymity)", () => {
    const result = serializeExperience(buildExperience());
    expect(result.author?.displayName).toBe("مریم");
  });

  it("counts reuses and successful reuses without likes", () => {
    const row = buildExperience({
      reuses: [
        {
          id: "r1",
          experienceId: "exp_1",
          userId: "u2",
          outcome: "successful",
          summary: "کار کرد",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: "u2", displayName: "علی" },
        },
        {
          id: "r2",
          experienceId: "exp_1",
          userId: "u3",
          outcome: "partial",
          summary: "تا حدی",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: "u3", displayName: null },
        },
      ],
    });
    const result = serializeExperience(row, { currentUserId: "u3" });
    expect(result.reuseCount).toBe(2);
    expect(result.reuseSuccessCount).toBe(1);
    expect(result.isReusedByMe).toBe(true);
    expect(result.myReuse?.outcome).toBe("partial");
  });

  it("counts references from answers", () => {
    const result = serializeExperience(
      buildExperience({
        references: [
          {
            id: "ref1",
            answerId: "a1",
            answer: { id: "a1", problem: { id: "p1", title: "مسئله" } },
          },
        ],
      }),
    );
    expect(result.referenceCount).toBe(1);
  });

  it("exposes source problem title when present", () => {
    const result = serializeExperience(
      buildExperience({
        sourceProblemId: "p1",
        sourceProblem: { id: "p1", title: "مسئله مبدا" },
      }),
    );
    expect(result.sourceProblemTitle).toBe("مسئله مبدا");
  });
});