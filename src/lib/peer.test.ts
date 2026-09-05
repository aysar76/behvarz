import { describe, expect, it, vi, beforeEach } from "vitest";
import { suggestHelpers, requireOpenHelpRequest } from "@/lib/peer";
import { AppError } from "@/lib/errors";
import { PEER_SUGGESTED_HELPERS_LIMIT } from "@/lib/constants/peer";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findMany: vi.fn(),
    },
    peerCooperation: {
      findMany: vi.fn(),
    },
    peerHelpRequest: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

const candidates = [
  {
    id: "h1",
    displayName: "مریم",
    province: "تهران",
    city: "شهرری",
    membershipStatus: "verified",
    skills: [{ skill: { name: "واکسیناسیون" } }],
    interests: [{ interest: { name: "بهداشت کودک" } }],
    experiences: [
      { tags: [{ tag: { name: "دیابت" } }, { tag: { name: "واکسیناسیون" } }] },
    ],
  },
  {
    id: "h2",
    displayName: "علی",
    province: "اصفهان",
    city: null,
    membershipStatus: "none",
    skills: [],
    interests: [],
    experiences: [],
  },
];

describe("suggestHelpers", () => {
  beforeEach(() => {
    mockPrisma.user.findMany.mockReset();
    mockPrisma.peerCooperation.findMany.mockReset();
  });

  it("scores and ranks candidates by relevance", async () => {
    mockPrisma.user.findMany.mockResolvedValue(candidates);
    mockPrisma.peerCooperation.findMany.mockResolvedValue([
      { helperId: "h1", status: "completed", requesterRating: 5 },
    ]);

    const result = await suggestHelpers({
      barrierType: "educational",
      tags: ["واکسیناسیون"],
      province: "تهران",
      excludeUserId: "me",
    });

    expect(result.length).toBe(2);
    expect(result[0].user.id).toBe("h1");
    expect(result[0].score).toBeGreaterThan(result[1].score);
    expect(result[0].reasons).toContain("تجربه در موضوعِ هم‌تراز با نیاز شما");
    expect(result[0].reasons).toContain("هم‌استان با شما");
    expect(result[0].reasons).toContain("عضو تأییدشده");
    expect(result[0].reasons).toContain("همکاری‌های قبلی موفق");
  });

  it("applies the suggested helpers limit", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: `h${i}`,
      displayName: `همیار ${i}`,
      province: null,
      city: null,
      membershipStatus: "none",
      skills: [],
      interests: [],
      experiences: [],
    }));
    mockPrisma.user.findMany.mockResolvedValue(many);
    mockPrisma.peerCooperation.findMany.mockResolvedValue([]);

    const result = await suggestHelpers({
      barrierType: "educational",
      tags: [],
      province: null,
      excludeUserId: "me",
    });

    expect(result.length).toBeLessThanOrEqual(PEER_SUGGESTED_HELPERS_LIMIT);
  });

  it("sorts ties by display name", async () => {
    const ties = [
      {
        id: "a",
        displayName: "بابک",
        province: null,
        city: null,
        membershipStatus: "none",
        skills: [],
        interests: [],
        experiences: [],
      },
      {
        id: "b",
        displayName: "آرش",
        province: null,
        city: null,
        membershipStatus: "none",
        skills: [],
        interests: [],
        experiences: [],
      },
    ];
    mockPrisma.user.findMany.mockResolvedValue(ties);
    mockPrisma.peerCooperation.findMany.mockResolvedValue([]);

    const result = await suggestHelpers({
      barrierType: "educational",
      tags: [],
      province: null,
      excludeUserId: "me",
    });

    expect(result[0].user.id).toBe("b");
    expect(result[1].user.id).toBe("a");
  });
});

describe("requireOpenHelpRequest", () => {
  it("throws NOT_FOUND when the request does not exist", async () => {
    mockPrisma.peerHelpRequest.findUnique.mockResolvedValue(null);
    await expect(requireOpenHelpRequest("missing")).rejects.toThrow(AppError);
  });

  it("throws CONFLICT when the request is not open", async () => {
    mockPrisma.peerHelpRequest.findUnique.mockResolvedValue({
      id: "r1",
      status: "closed",
      requester: null,
      offers: [],
      cooperations: [],
      _count: { offers: 0 },
    });
    await expect(requireOpenHelpRequest("r1")).rejects.toThrow(
      expect.objectContaining({ code: "CONFLICT" }),
    );
  });

  it("returns the request when it is open", async () => {
    const row = {
      id: "r1",
      status: "open",
      requester: { id: "u1" },
      offers: [],
      cooperations: [],
      _count: { offers: 0 },
    };
    mockPrisma.peerHelpRequest.findUnique.mockResolvedValue(row);
    const result = await requireOpenHelpRequest("r1");
    expect(result.status).toBe("open");
  });
});
