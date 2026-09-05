import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conditional class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("merges tailwind class conflicts with twMerge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-brand-500", "text-red-500")).toBe("text-red-500");
  });

  it("handles clsx object/array inputs", () => {
    expect(cn({ active: true, hidden: false }, ["x", "y"])).toBe("active x y");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});
