import { describe, expect, it } from "vitest";
import {
  canTransition,
  initialPublishedStatus,
} from "@/lib/experience-status";

describe("canTransition", () => {
  it("allows publishing drafts into reviewed or featured", () => {
    expect(canTransition("user_generated", "reviewed")).toBe(true);
    expect(canTransition("user_generated", "featured")).toBe(true);
  });

  it("allows archiving from any active status", () => {
    expect(canTransition("user_generated", "archived")).toBe(true);
    expect(canTransition("under_review", "archived")).toBe(true);
    expect(canTransition("reviewed", "archived")).toBe(true);
    expect(canTransition("featured", "archived")).toBe(true);
  });

  it("allows moving under_review to reviewed/featured", () => {
    expect(canTransition("under_review", "reviewed")).toBe(true);
    expect(canTransition("under_review", "featured")).toBe(true);
  });

  it("allows unfeature from featured", () => {
    expect(canTransition("featured", "reviewed")).toBe(true);
  });

  it("denies invalid transitions", () => {
    expect(canTransition("reviewed", "under_review")).toBe(true);
    expect(canTransition("archived", "featured")).toBe(false);
    expect(canTransition("user_generated", "under_review")).toBe(true);
  });

  it("denies any transition from archived except unarchive", () => {
    expect(canTransition("archived", "reviewed")).toBe(true);
    expect(canTransition("archived", "user_generated")).toBe(true);
    expect(canTransition("archived", "under_review")).toBe(false);
  });
});

describe("initialPublishedStatus", () => {
  it("flags sensitive content for review", () => {
    expect(initialPublishedStatus(true)).toBe("under_review");
  });

  it("defaults to user_generated otherwise", () => {
    expect(initialPublishedStatus(false)).toBe("user_generated");
  });
});