import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  notifyUser,
  isNotificationTypeEnabledByDefault,
} from "@/lib/notifications";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    notificationPreference: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

describe("notifyUser", () => {
  beforeEach(() => {
    mockPrisma.notificationPreference.findUnique.mockReset();
    mockPrisma.notification.create.mockReset();
  });

  it("does not notify a user about their own action", async () => {
    const result = await notifyUser({
      userId: "u1",
      type: "problem_answer",
      actorId: "u1",
      title: "پاسخ جدید",
    });
    expect(result).toBe(false);
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("skips notification when the user has disabled that type", async () => {
    mockPrisma.notificationPreference.findUnique.mockResolvedValue({
      userId: "u2",
      type: "problem_answer",
      enabled: false,
    });

    const result = await notifyUser({
      userId: "u2",
      type: "problem_answer",
      actorId: "u1",
      title: "پاسخ جدید",
    });

    expect(result).toBe(false);
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("creates a notification when no preference exists", async () => {
    mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
    mockPrisma.notification.create.mockResolvedValue({ id: "n1" });

    const result = await notifyUser({
      userId: "u2",
      type: "problem_answer",
      actorId: "u1",
      title: "پاسخ جدید",
      body: "به مسئله شما پاسخ داده شد",
      targetType: "problem",
      targetId: "p1",
    });

    expect(result).toBe(true);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "u2",
        type: "problem_answer",
        actorId: "u1",
        title: "پاسخ جدید",
        body: "به مسئله شما پاسخ داده شد",
        targetType: "problem",
        targetId: "p1",
      },
    });
  });

  it("creates a notification when the type is enabled in preferences", async () => {
    mockPrisma.notificationPreference.findUnique.mockResolvedValue({
      userId: "u2",
      type: "cooperation_message",
      enabled: true,
    });
    mockPrisma.notification.create.mockResolvedValue({ id: "n2" });

    const result = await notifyUser({
      userId: "u2",
      type: "cooperation_message",
      actorId: "u1",
      title: "پیام جدید",
    });

    expect(result).toBe(true);
  });
});

describe("isNotificationTypeEnabledByDefault", () => {
  it("returns true as the default for all notification types", () => {
    expect(isNotificationTypeEnabledByDefault()).toBe(true);
  });
});
