import { describe, expect, it } from "vitest";
import { randomDigits, randomToken, safeEqual, sha256 } from "@/lib/crypto";

describe("sha256", () => {
  it("produces a 64-char hex digest", () => {
    expect(sha256("hello")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    expect(sha256("hello")).toBe(sha256("hello"));
  });
});

describe("randomToken", () => {
  it("produces unique base64url tokens of expected length", () => {
    const a = randomToken(32);
    const b = randomToken(32);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThan(32);
  });
});

describe("randomDigits", () => {
  it("produces a 6-digit numeric string by default", () => {
    expect(randomDigits()).toMatch(/^\d{6}$/);
  });

  it("respects a custom length", () => {
    expect(randomDigits(4)).toMatch(/^\d{4}$/);
  });
});

describe("safeEqual", () => {
  it("returns true for identical strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(safeEqual("abc", "abd")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
