import { beforeEach, describe, expect, it } from "vitest";
import { isRateLimited, resetRateLimits } from "@/lib/auth/rate-limit";

describe("isRateLimited", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests under the limit", () => {
    expect(isRateLimited("key", 3, 1000)).toBe(false);
    expect(isRateLimited("key", 3, 1000)).toBe(false);
    expect(isRateLimited("key", 3, 1000)).toBe(false);
  });

  it("blocks once the limit is reached", () => {
    for (let i = 0; i < 3; i++) {
      isRateLimited("key", 3, 1000);
    }
    expect(isRateLimited("key", 3, 1000)).toBe(true);
  });

  it("tracks keys independently", () => {
    isRateLimited("a", 1, 1000);
    expect(isRateLimited("b", 1, 1000)).toBe(false);
    expect(isRateLimited("a", 1, 1000)).toBe(true);
  });
});
