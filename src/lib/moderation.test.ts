import { describe, expect, it, vi } from "vitest";
import {
  assertAccountCanCreate,
  serializeDecision,
  serializeModerationUser,
  type DecisionRow,
  type ModerationUserRow,
} from "@/lib/moderation";
import { AppError } from "@/lib/errors";
import type { User } from "@/generated/prisma/client";

function makeUser(
  overrides: Partial<User> = {},
): User {
  return {
    id: "user-1",
    phone: "09120000000",
    role: "member",
    membershipStatus: "none",
    displayName: "مریم",
    province: null,
    city: null,
    workYears: null,
    bio: null,
    visibility: "members",
    onboardingCompleted: true,
    willingToHelp: false,
    accountStatus: "active",
    accountStatusReason: null,
    accountStatusAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

describe("assertAccountCanCreate", () => {
  it("allows active users to create content", () => {
    expect(() => assertAccountCanCreate(makeUser())).not.toThrow();
  });

  it("allows warned users to create content", () => {
    expect(() =>
      assertAccountCanCreate(makeUser({ accountStatus: "warned" })),
    ).not.toThrow();
  });

  it("blocks restricted users", () => {
    expect(() =>
      assertAccountCanCreate(makeUser({ accountStatus: "restricted" })),
    ).toThrow(AppError);
  });

  it("blocks suspended users", () => {
    expect(() =>
      assertAccountCanCreate(makeUser({ accountStatus: "suspended" })),
    ).toThrow(AppError);
  });
});

describe("serializeModerationUser", () => {
  it("serializes a moderation user row", () => {
    const row: ModerationUserRow = {
      id: "u1",
      displayName: "علی",
      phone: "0912",
      role: "member",
      membershipStatus: "verified",
      accountStatus: "warned",
      accountStatusReason: "محتوا",
      accountStatusAt: new Date("2026-01-01"),
      province: "تهران",
      city: "شهرری",
      createdAt: new Date("2026-01-01"),
      _count: { problems: 2, experiences: 3, problemReports: 1 },
    };
    const result = serializeModerationUser(row);
    expect(result.accountStatus).toBe("warned");
    expect(result.problemCount).toBe(2);
    expect(result.reportCount).toBe(1);
    expect(result.accountStatusAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("serializeDecision", () => {
  it("serializes a moderation decision", () => {
    const row: DecisionRow = {
      id: "d1",
      moderatorId: "m1",
      targetType: "problem",
      targetId: "p1",
      action: "hide_content",
      reason: "اطلاعات بیمار",
      note: null,
      createdAt: new Date("2026-01-01"),
      moderator: { id: "m1", displayName: "ناظر" },
    };
    const result = serializeDecision(row);
    expect(result.moderatorLabel).toBe("ناظر");
    expect(result.action).toBe("hide_content");
    expect(result.targetType).toBe("problem");
  });
});

vi.mock("@/lib/db", () => ({
  prisma: {},
}));