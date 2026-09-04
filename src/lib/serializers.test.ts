import { describe, expect, it } from "vitest";
import { serializeUser, type UserWithProfile } from "@/lib/serializers";

function buildUser(overrides: Partial<UserWithProfile> = {}): UserWithProfile {
  return {
    id: "user_1",
    phone: "09123456789",
    role: "member",
    membershipStatus: "none",
    displayName: "مریم",
    province: "خراسان رضوی",
    city: "سبزوار",
    workYears: "3-5",
    bio: "سلام",
    visibility: "members",
    onboardingCompleted: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    skills: [{ skill: { name: "بهداشت خانواده" } }],
    interests: [{ interest: { name: "تجربه‌نگاری" } }],
    ...overrides,
  };
}

describe("serializeUser", () => {
  it("flattens skills and interests to names", () => {
    const result = serializeUser(buildUser());
    expect(result.skills).toEqual(["بهداشت خانواده"]);
    expect(result.interests).toEqual(["تجربه‌نگاری"]);
  });

  it("serializes the creation date to ISO", () => {
    const result = serializeUser(buildUser());
    expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("handles missing relations", () => {
    const result = serializeUser(
      buildUser({ skills: undefined, interests: undefined }),
    );
    expect(result.skills).toEqual([]);
    expect(result.interests).toEqual([]);
  });
});
