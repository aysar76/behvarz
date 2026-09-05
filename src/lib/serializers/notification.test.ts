import { describe, expect, it } from "vitest";
import {
  serializeNotification,
  type NotificationRow,
} from "@/lib/serializers/notification";

function buildRow(
  overrides: Partial<NotificationRow> = {},
): NotificationRow {
  return {
    id: "n1",
    type: "problem_answer",
    actorId: "a1",
    title: "پاسخ جدید به مسئله شما",
    body: "مسئله واکسیناسیون",
    targetType: "problem",
    targetId: "p1",
    read: false,
    readAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    actor: {
      id: "a1",
      displayName: "مریم",
      province: "خراسان رضوی",
      city: "سبزوار",
      membershipStatus: "verified",
      role: "member",
    },
    ...overrides,
  };
}

describe("serializeNotification", () => {
  it("serializes a notification with actor label", () => {
    const result = serializeNotification(buildRow());
    expect(result.id).toBe("n1");
    expect(result.type).toBe("problem_answer");
    expect(result.actorLabel).toBe("مریم");
    expect(result.targetType).toBe("problem");
    expect(result.targetId).toBe("p1");
    expect(result.read).toBe(false);
    expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("returns null actor label when actor is missing", () => {
    const result = serializeNotification(buildRow({ actor: null }));
    expect(result.actorLabel).toBeNull();
  });

  it("returns null actor label for blank display name", () => {
    const result = serializeNotification(
      buildRow({
        actor: {
          id: "a1",
          displayName: "   ",
          province: null,
          city: null,
          membershipStatus: "none",
          role: "member",
        },
      }),
    );
    expect(result.actorLabel).toBeNull();
  });

  it("serializes read state", () => {
    const result = serializeNotification(
      buildRow({ read: true, readAt: new Date("2026-01-02T00:00:00Z") }),
    );
    expect(result.read).toBe(true);
  });
});
