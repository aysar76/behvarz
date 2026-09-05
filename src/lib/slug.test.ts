import { describe, expect, it } from "vitest";
import {
  generateExperienceSlug,
  generateShortToken,
  isExperienceSlug,
} from "@/lib/slug";

describe("generateShortToken", () => {
  it("generates a token of the requested length", () => {
    expect(generateShortToken(8)).toHaveLength(8);
    expect(generateShortToken(12)).toHaveLength(12);
  });

  it("produces distinct tokens", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateShortToken()));
    expect(tokens.size).toBe(20);
  });
});

describe("generateExperienceSlug / isExperienceSlug", () => {
  it("generates a shareable slug with the tajrobe- prefix", () => {
    const slug = generateExperienceSlug();
    expect(isExperienceSlug(slug)).toBe(true);
  });

  it("rejects malformed slugs", () => {
    expect(isExperienceSlug("tajrobe-abc")).toBe(false);
    expect(isExperienceSlug("other-abcdefgh")).toBe(false);
    expect(isExperienceSlug("")).toBe(false);
  });
});