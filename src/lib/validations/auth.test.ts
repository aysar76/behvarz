import { describe, expect, it } from "vitest";
import {
  membershipRequestSchema,
  profileSchema,
  requestOtpSchema,
  reviewMembershipSchema,
  verifyOtpSchema,
} from "@/lib/validations/auth";

describe("requestOtpSchema", () => {
  it("accepts a valid phone", () => {
    expect(requestOtpSchema.parse({ phone: "09123456789" })).toEqual({
      phone: "09123456789",
    });
  });

  it("rejects invalid phones", () => {
    expect(() => requestOtpSchema.parse({ phone: "123" })).toThrow();
    expect(() => requestOtpSchema.parse({ phone: "02112345678" })).toThrow();
  });
});

describe("verifyOtpSchema", () => {
  it("accepts valid phone and code", () => {
    expect(
      verifyOtpSchema.parse({ phone: "09123456789", code: "123456" }),
    ).toEqual({ phone: "09123456789", code: "123456" });
  });

  it("rejects a non-6-digit code", () => {
    expect(() =>
      verifyOtpSchema.parse({ phone: "09123456789", code: "123" }),
    ).toThrow();
  });
});

describe("profileSchema", () => {
  const valid = {
    displayName: "مریم",
    province: "خراسان رضوی",
    city: "سبزوار",
    workYears: "3-5",
    skills: ["بهداشت خانواده"],
    interests: [],
    bio: "تجربه کاری در روستا",
    visibility: "members",
  };

  it("accepts a valid profile", () => {
    expect(() => profileSchema.parse(valid)).not.toThrow();
  });

  it("rejects missing province", () => {
    expect(() => profileSchema.parse({ ...valid, province: "" })).toThrow();
  });

  it("rejects invalid workYears bucket", () => {
    expect(() => profileSchema.parse({ ...valid, workYears: "99" })).toThrow();
  });

  it("rejects more than 10 skills", () => {
    const manySkills = Array.from({ length: 11 }, (_, i) => `مهارت ${i}`);
    expect(() =>
      profileSchema.parse({ ...valid, skills: manySkills }),
    ).toThrow();
  });

  it("allows optional bio", () => {
    const { bio, ...withoutBio } = valid;
    expect(() => profileSchema.parse(withoutBio)).not.toThrow();
    expect(bio).toBeDefined();
  });
});

describe("membershipRequestSchema", () => {
  it("accepts an empty body", () => {
    expect(() => membershipRequestSchema.parse({})).not.toThrow();
  });

  it("rejects a too-long note", () => {
    expect(() =>
      membershipRequestSchema.parse({ note: "x".repeat(301) }),
    ).toThrow();
  });
});

describe("reviewMembershipSchema", () => {
  it("accepts approve/reject actions", () => {
    expect(reviewMembershipSchema.parse({ action: "approve" }).action).toBe(
      "approve",
    );
    expect(reviewMembershipSchema.parse({ action: "reject" }).action).toBe(
      "reject",
    );
  });

  it("rejects unknown actions", () => {
    expect(() => reviewMembershipSchema.parse({ action: "ignore" })).toThrow();
  });
});
