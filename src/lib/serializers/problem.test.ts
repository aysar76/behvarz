import { describe, expect, it } from "vitest";
import { serializeProblem, type ProblemRow } from "@/lib/serializers/problem";

function buildProblem(overrides: Partial<ProblemRow> = {}): ProblemRow {
  return {
    id: "p1",
    authorId: "user_1",
    title: "مسئله واکسیناسیون",
    description: "پوشش واکسیناسیون در روستا کاهش یافته است.",
    context: null,
    barrierType: "knowledge",
    actionsTaken: null,
    expectedOutcome: null,
    urgency: "medium",
    status: "open",
    isAnonymous: false,
    isDraft: false,
    needsReview: false,
    moderation: "visible",
    moderationNote: null,
    conclusion: null,
    selectedAnswerId: null,
    resultSummary: null,
    resultOutcome: null,
    publishedAt: new Date("2026-01-01T00:00:00Z"),
    solvedAt: null,
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
    answers: [
      {
        id: "a1",
        body: "پاسخ مفید",
        isClarificationRequest: false,
        isSelectedSolution: false,
        moderation: "visible",
        moderationNote: null,
        helpfulCount: 1,
        thanksCount: 2,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
        author: {
          id: "user_2",
          displayName: "علی",
          province: null,
          city: null,
          membershipStatus: "verified",
          role: "member",
        },
        helpfulMarks: [{ userId: "me" }],
        thanks: [{ userId: "me", targetId: "a1" }],
        references: [],
      },
    ],
    statusHistory: [],
    _count: { answers: 1 },
    ...overrides,
  };
}

describe("serializeProblem interactions", () => {
  it("exposes save/follow state for the current user", () => {
    const savedSet = new Set(["p1"]);
    const followedSet = new Set(["p1"]);
    const result = serializeProblem(buildProblem(), {
      currentUserId: "me",
      savedSet,
      followedSet,
    });
    expect(result.isSavedByMe).toBe(true);
    expect(result.isFollowedByMe).toBe(true);
  });

  it("defaults interaction state to false without options", () => {
    const result = serializeProblem(buildProblem());
    expect(result.isSavedByMe).toBe(false);
    expect(result.isFollowedByMe).toBe(false);
  });

  it("serializes professional thanks on answers", () => {
    const result = serializeProblem(buildProblem(), {
      currentUserId: "me",
    });
    const answer = result.answers[0];
    expect(answer.thanksCount).toBe(2);
    expect(answer.isThankedByMe).toBe(true);
  });
});