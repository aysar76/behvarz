import { describe, expect, it } from "vitest";
import { serializeTool, generateToolSlug } from "@/lib/tools";

const baseTool = {
  id: "t1",
  slug: "abzar-test",
  kind: "guide" as const,
  title: "راهنمای واکسیناسیون",
  summary: "خلاصه کاربردی راهنما",
  body: "محتوا",
  status: "published" as const,
  version: 2,
  reviewedAt: new Date("2026-01-01T00:00:00Z"),
  tags: ["واکسیناسیون", "  "],
  createdById: "u1",
  publishedAt: new Date("2026-01-01T00:00:00Z"),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  createdBy: { id: "u1", displayName: "علی", membershipStatus: "verified", role: "mentor" },
};

describe("serializeTool", () => {
  it("serializes and filters blank tags", () => {
    const result = serializeTool(baseTool);
    expect(result.slug).toBe("abzar-test");
    expect(result.version).toBe(2);
    expect(result.tags).toEqual(["واکسیناسیون"]);
    expect(result.kind).toBe("guide");
    expect(result.createdBy?.displayName).toBe("علی");
  });

  it("handles non-array tags", () => {
    const result = serializeTool({ ...baseTool, tags: null });
    expect(result.tags).toEqual([]);
  });
});

describe("generateToolSlug", () => {
  it("produces a shareable slug with prefix", () => {
    const slug = generateToolSlug();
    expect(slug.startsWith("abzar-")).toBe(true);
    expect(slug.length).toBeGreaterThan("abzar-".length);
  });
});

describe("tool create schema", () => {
  it("accepts a valid tool", async () => {
    const { toolCreateSchema } = await import("@/lib/validations/tool");
    const result = toolCreateSchema.safeParse({
      kind: "checklist",
      title: "چک‌لیست آمادگی",
      summary: "خلاصه کوتاه و مفید",
      body: "محتوا به‌اندازه کافی برای یک ابزار اجرایی",
      tags: ["آمادگی", "تجهیزات"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects too many tags", async () => {
    const { toolCreateSchema } = await import("@/lib/validations/tool");
    const result = toolCreateSchema.safeParse({
      kind: "checklist",
      title: "چک‌لیست",
      summary: "خلاصه کوتاه و مفید",
      body: "محتوا به‌اندازه کافی برای یک ابزار اجرایی",
      tags: Array.from({ length: 9 }, (_, index) => `برچسب ${index}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects short body", async () => {
    const { toolCreateSchema } = await import("@/lib/validations/tool");
    const result = toolCreateSchema.safeParse({
      kind: "guide",
      title: "راهنما",
      summary: "خلاصه کوتاه و مفید",
      body: "کوتاه",
    });
    expect(result.success).toBe(false);
  });
});