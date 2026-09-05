import { describe, expect, it } from "vitest";
import { computeNextStep, type GrowthStats } from "@/lib/growth";

function buildStats(overrides: Partial<GrowthStats> = {}): GrowthStats {
  return {
    publishedExperiences: 0,
    featuredExperiences: 0,
    solvedProblems: 0,
    helpfulAnswers: 0,
    activeCircles: 0,
    thanksReceived: 0,
    successfulReusesByOthers: 0,
    validReferences: 0,
    isVerified: false,
    ...overrides,
  };
}

describe("computeNextStep", () => {
  it("suggests continuing a draft first", () => {
    const step = computeNextStep({
      hasUnfinishedDraft: true,
      hasOpenProblem: false,
      hasInterests: true,
      hasSkills: true,
      stats: buildStats(),
    });
    expect(step?.id).toBe("continue-draft");
    expect(step?.href).toBe("/discover");
  });

  it("suggests first experience when none published", () => {
    const step = computeNextStep({
      hasUnfinishedDraft: false,
      hasOpenProblem: false,
      hasInterests: true,
      hasSkills: true,
      stats: buildStats(),
    });
    expect(step?.id).toBe("first-experience");
    expect(step?.href).toBe("/experiences/new");
  });

  it("suggests following up when an open problem exists", () => {
    const step = computeNextStep({
      hasUnfinishedDraft: false,
      hasOpenProblem: true,
      hasInterests: true,
      hasSkills: true,
      stats: buildStats({ publishedExperiences: 2 }),
    });
    expect(step?.id).toBe("follow-up-problem");
  });

  it("suggests sharing experience before circles when no reuse yet", () => {
    const step = computeNextStep({
      hasUnfinishedDraft: false,
      hasOpenProblem: false,
      hasInterests: true,
      hasSkills: true,
      stats: buildStats({
        publishedExperiences: 1,
        successfulReusesByOthers: 0,
      }),
    });
    expect(step?.id).toBe("share-experience");
  });

  it("suggests joining a circle when active in none", () => {
    const step = computeNextStep({
      hasUnfinishedDraft: false,
      hasOpenProblem: false,
      hasInterests: true,
      hasSkills: true,
      stats: buildStats({
        publishedExperiences: 1,
        successfulReusesByOthers: 1,
      }),
    });
    expect(step?.id).toBe("join-circle");
  });

  it("suggests completing profile when interests missing", () => {
    const step = computeNextStep({
      hasUnfinishedDraft: false,
      hasOpenProblem: false,
      hasInterests: false,
      hasSkills: true,
      stats: buildStats({
        publishedExperiences: 1,
        successfulReusesByOthers: 1,
        activeCircles: 1,
      }),
    });
    expect(step?.id).toBe("complete-profile");
  });

  it("falls back to discovering knowledge", () => {
    const step = computeNextStep({
      hasUnfinishedDraft: false,
      hasOpenProblem: false,
      hasInterests: true,
      hasSkills: true,
      stats: buildStats({
        publishedExperiences: 1,
        successfulReusesByOthers: 1,
        activeCircles: 1,
      }),
    });
    expect(step?.id).toBe("discover-knowledge");
    expect(step?.href).toBe("/discover");
  });
});