import { describe, expect, it } from "vitest";
import {
  serializePeerCooperation,
  serializePeerHelpRequest,
  type PeerHelpRequestRow,
} from "@/lib/serializers/peer";

const requester = {
  id: "u1",
  displayName: "مریم",
  province: "خراسان رضوی",
  city: "سبزوار",
  membershipStatus: "verified",
};

const helper = {
  id: "u2",
  displayName: "علی",
  province: "خراسان رضوی",
  city: "مشهد",
  membershipStatus: "none",
};

function buildRequest(overrides: Partial<PeerHelpRequestRow> = {}): PeerHelpRequestRow {
  return {
    id: "hr1",
    requesterId: "u1",
    title: "اجرای غربالگری فشار خون در روستا",
    description: "برای اجرای برنامه غربالگری به تجربه همکار نیاز دارم.",
    barrierType: "knowledge",
    tags: ["غربالگری", "فشار خون"],
    province: "خراسان رضوی",
    status: "open",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    requester,
    offers: [],
    cooperations: [],
    _count: { offers: 0 },
    ...overrides,
  };
}

describe("serializePeerHelpRequest", () => {
  it("flattens tags into an array of strings", () => {
    const result = serializePeerHelpRequest(buildRequest(), {
      currentUserId: "u1",
    });
    expect(result.tags).toEqual(["غربالگری", "فشار خون"]);
    expect(result.isRequester).toBe(true);
  });

  it("handles null tags", () => {
    const result = serializePeerHelpRequest(buildRequest({ tags: null }), {
      currentUserId: "u1",
    });
    expect(result.tags).toEqual([]);
  });

  it("marks which offers belong to the viewer", () => {
    const request = buildRequest({
      offers: [
        {
          id: "o1",
          helperId: "u2",
          initiator: "helper",
          message: "من تجربه دارم",
          status: "pending",
          createdAt: new Date("2026-01-02T00:00:00Z"),
          helper,
        },
      ],
      _count: { offers: 1 },
    });
    const asRequester = serializePeerHelpRequest(request, {
      currentUserId: "u1",
    });
    expect(asRequester.offers[0].isMine).toBe(false);

    const asHelper = serializePeerHelpRequest(request, { currentUserId: "u2" });
    expect(asHelper.offers[0].isMine).toBe(true);
  });

  it("serializes cooperation details", () => {
    const request = buildRequest({
      cooperations: [
        {
          id: "c1",
          helpRequestId: "hr1",
          requesterId: "u1",
          helperId: "u2",
          goal: "رسیدن به یک راهنمای غربالگری",
          status: "active",
          outcomeSummary: null,
          requesterRating: null,
          helperRating: null,
          completedAt: null,
          createdAt: new Date("2026-01-02T00:00:00Z"),
          requester,
          helper,
        },
      ],
    });
    const result = serializePeerHelpRequest(request, { currentUserId: "u1" });
    expect(result.cooperations[0].goal).toBe("رسیدن به یک راهنمای غربالگری");
    expect(result.cooperations[0].status).toBe("active");
  });
});

describe("serializePeerCooperation", () => {
  it("serializes dates and ratings", () => {
    const result = serializePeerCooperation({
      id: "c1",
      helpRequestId: null,
      requesterId: "u1",
      helperId: "u2",
      goal: "هدف",
      status: "completed",
      outcomeSummary: "نتیجه موفق بود",
      requesterRating: 5,
      helperRating: 4,
      completedAt: new Date("2026-01-10T00:00:00Z"),
      createdAt: new Date("2026-01-02T00:00:00Z"),
      requester,
      helper,
    });
    expect(result.outcomeSummary).toBe("نتیجه موفق بود");
    expect(result.requesterRating).toBe(5);
    expect(result.helperRating).toBe(4);
    expect(result.completedAt).toBe("2026-01-10T00:00:00.000Z");
  });
});