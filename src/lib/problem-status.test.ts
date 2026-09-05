import { describe, expect, it } from "vitest";
import { canTransition, nextStatusAfterAnswer } from "@/lib/problem-status";

describe("canTransition", () => {
  it("allows open → discussing/solved/archived", () => {
    expect(canTransition("open", "discussing")).toBe(true);
    expect(canTransition("open", "solved")).toBe(true);
    expect(canTransition("open", "archived")).toBe(true);
  });

  it("allows discussing → solved/archived", () => {
    expect(canTransition("discussing", "solved")).toBe(true);
    expect(canTransition("discussing", "archived")).toBe(true);
  });

  it("allows solved → archived only", () => {
    expect(canTransition("solved", "archived")).toBe(true);
    expect(canTransition("solved", "open")).toBe(false);
  });

  it("disallows invalid transitions", () => {
    expect(canTransition("open", "open")).toBe(false);
    expect(canTransition("archived", "solved")).toBe(false);
    expect(canTransition("archived", "open")).toBe(false);
  });
});

describe("nextStatusAfterAnswer", () => {
  it("moves open to discussing on first answer", () => {
    expect(nextStatusAfterAnswer("open")).toBe("discussing");
  });

  it("keeps discussing unchanged", () => {
    expect(nextStatusAfterAnswer("discussing")).toBe("discussing");
    expect(nextStatusAfterAnswer("solved")).toBe("solved");
  });
});
