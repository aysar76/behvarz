import { describe, expect, it } from "vitest";
import { z } from "zod";
import { safeValidate, validateInput } from "@/lib/validation";

const profileSchema = z.object({
  displayName: z.string().min(2),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
});

describe("validateInput", () => {
  it("returns typed data on success", () => {
    const data = validateInput(profileSchema, {
      displayName: "مریم",
      phone: "09121234567",
    });
    expect(data.phone).toBe("09121234567");
  });

  it("throws on invalid input", () => {
    expect(() =>
      validateInput(profileSchema, { displayName: "م", phone: "123" }),
    ).toThrow();
  });
});

describe("safeValidate", () => {
  it("returns success with data", () => {
    const result = safeValidate(profileSchema, {
      displayName: "مریم",
      phone: "09121234567",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("مریم");
    }
  });

  it("groups validation errors by field", () => {
    const result = safeValidate(profileSchema, {
      displayName: "م",
      phone: "123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.displayName).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    }
  });
});
