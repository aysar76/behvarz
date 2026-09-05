import { describe, expect, it } from "vitest";
import { notificationPreferencesSchema } from "@/lib/validations/notification";

describe("notificationPreferencesSchema", () => {
  it("accepts valid preferences", () => {
    const result = notificationPreferencesSchema.safeParse({
      preferences: [
        { type: "problem_answer", enabled: true },
        { type: "cooperation_message", enabled: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty preferences array", () => {
    const result = notificationPreferencesSchema.safeParse({ preferences: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown notification type", () => {
    const result = notificationPreferencesSchema.safeParse({
      preferences: [{ type: "unknown_type", enabled: true }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean enabled flag", () => {
    const result = notificationPreferencesSchema.safeParse({
      preferences: [{ type: "problem_answer", enabled: "yes" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 preference entries", () => {
    const preferences = Array.from({ length: 51 }, () => ({
      type: "problem_answer",
      enabled: true,
    }));
    const result = notificationPreferencesSchema.safeParse({ preferences });
    expect(result.success).toBe(false);
  });
});
