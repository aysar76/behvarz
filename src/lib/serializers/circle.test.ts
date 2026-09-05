import { describe, expect, it } from "vitest";
import { serializeCircle, type CircleRow } from "@/lib/serializers/circle";

function buildCircle(overrides: Partial<CircleRow> = {}): CircleRow {
  return {
    id: "c1",
    name: "حلقه بهورزان خراسان",
    description: "حلقه هم‌افزایی برای بهبود آموزش سلامت",
    topic: "آموزش سلامت",
    province: "خراسان رضوی",
    capacity: 12,
    status: "active",
    facilitatorId: "u1",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    facilitator: {
      id: "u1",
      displayName: "مریم",
      province: "خراسان رضوی",
      city: "سبزوار",
      membershipStatus: "verified",
    },
    memberships: [
      {
        id: "m1",
        userId: "u1",
        role: "facilitator",
        status: "active",
        joinedAt: new Date("2026-01-01T00:00:00Z"),
        user: {
          id: "u1",
          displayName: "مریم",
          province: "خراسان رضوی",
          city: "سبزوار",
          membershipStatus: "verified",
        },
      },
      {
        id: "m2",
        userId: "u2",
        role: "member",
        status: "active",
        joinedAt: new Date("2026-01-02T00:00:00Z"),
        user: {
          id: "u2",
          displayName: "علی",
          province: "خراسان رضوی",
          city: "مشهد",
          membershipStatus: "none",
        },
      },
    ],
    joinRequests: [],
    invites: [],
    meetings: [],
    _count: { memberships: 2 },
    ...overrides,
  };
}

describe("serializeCircle", () => {
  it("marks the viewer as a facilitator when leading the circle", () => {
    const result = serializeCircle(buildCircle(), { currentUserId: "u1" });
    expect(result.isMember).toBe(true);
    expect(result.isFacilitator).toBe(true);
    expect(result.memberCount).toBe(2);
  });

  it("marks a non-member viewer correctly", () => {
    const result = serializeCircle(buildCircle(), { currentUserId: "u9" });
    expect(result.isMember).toBe(false);
    expect(result.isFacilitator).toBe(false);
    expect(result.members).toHaveLength(2);
  });

  it("excludes left memberships from the member list", () => {
    const circle = buildCircle();
    circle.memberships = [
      ...circle.memberships!,
      {
        id: "m3",
        userId: "u3",
        role: "member",
        status: "left",
        joinedAt: new Date("2026-01-03T00:00:00Z"),
        user: {
          id: "u3",
          displayName: "سارا",
          province: "تهران",
          city: "تهران",
          membershipStatus: "none",
        },
      },
    ];
    circle._count = { memberships: 3 };
    const result = serializeCircle(circle, { currentUserId: "u9" });
    expect(result.members).toHaveLength(2);
    expect(result.memberCount).toBe(3);
  });

  it("exposes my pending join request status", () => {
    const circle = buildCircle();
    circle.joinRequests = [
      {
        id: "jr1",
        userId: "u9",
        message: "من به این حلقه علاقه دارم",
        status: "pending",
        createdAt: new Date("2026-01-04T00:00:00Z"),
        user: {
          id: "u9",
          displayName: "حسن",
          province: null,
          city: null,
          membershipStatus: "none",
        },
      },
    ];
    const result = serializeCircle(circle, { currentUserId: "u9" });
    expect(result.myJoinRequest).toBe("pending");
  });

  it("serializes meeting outputs with ISO dates", () => {
    const circle = buildCircle();
    circle.meetings = [
      {
        id: "mt1",
        title: "جلسه اول",
        agenda: "برنامه ماهانه",
        scheduledAt: null,
        summary: "خروجی جلسه: نقشه اقدام",
        createdById: "u1",
        createdAt: new Date("2026-01-05T00:00:00Z"),
        updatedAt: new Date("2026-01-05T00:00:00Z"),
        createdBy: { id: "u1", displayName: "مریم" },
      },
    ];
    const result = serializeCircle(circle, { currentUserId: "u1" });
    expect(result.meetings[0].summary).toBe("خروجی جلسه: نقشه اقدام");
    expect(result.meetings[0].createdAt).toBe("2026-01-05T00:00:00.000Z");
    expect(result.meetings[0].isMine).toBe(true);
  });
});