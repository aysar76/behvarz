import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { PEER_SUGGESTED_HELPERS_LIMIT } from "@/lib/constants/peer";
import type { PeerHelpRequestRow, PeerUserRow } from "@/lib/serializers/peer";

const USER_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
} as const;

export const PEER_USER_SELECT = USER_SELECT;

export const PEER_HELP_REQUEST_LIST_INCLUDE = {
  requester: { select: USER_SELECT },
  _count: { select: { offers: true } },
} as const;

export const PEER_HELP_REQUEST_DETAIL_INCLUDE = {
  requester: { select: USER_SELECT },
  offers: {
    include: { helper: { select: USER_SELECT } },
    orderBy: { createdAt: "asc" as const },
  },
  cooperations: {
    include: {
      requester: { select: USER_SELECT },
      helper: { select: USER_SELECT },
    },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { offers: true } },
} as const;

export async function getPeerHelpRequestRow(
  id: string,
): Promise<PeerHelpRequestRow | null> {
  return (await prisma.peerHelpRequest.findUnique({
    where: { id },
    include: PEER_HELP_REQUEST_DETAIL_INCLUDE,
  })) as unknown as PeerHelpRequestRow | null;
}

export async function requireOpenHelpRequest(id: string) {
  const request = await getPeerHelpRequestRow(id);
  if (!request) {
    throw new AppError("NOT_FOUND", "درخواست همیار یافت نشد");
  }
  if (request.status !== "open") {
    throw new AppError(
      "CONFLICT",
      "این درخواست دیگر پذیرای پیشنهاد همیار نیست",
    );
  }
  return request;
}

export const PEER_COOPERATION_DETAIL_INCLUDE = {
  requester: { select: USER_SELECT },
  helper: { select: USER_SELECT },
  messages: {
    include: { sender: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function getCooperationRow(id: string) {
  return prisma.peerCooperation.findUnique({
    where: { id },
    include: PEER_COOPERATION_DETAIL_INCLUDE,
  });
}

export async function requireCooperationParticipant(
  id: string,
  userId: string,
) {
  const cooperation = await getCooperationRow(id);
  if (!cooperation) {
    throw new AppError("NOT_FOUND", "همکاری یافت نشد");
  }
  if (cooperation.requesterId !== userId && cooperation.helperId !== userId) {
    throw new AppError("FORBIDDEN", "شما در این همکاری شرکت ندارید");
  }
  return cooperation;
}

export interface SuggestedHelper {
  user: PeerUserRow;
  score: number;
  reasons: string[];
}

interface CandidateRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  membershipStatus: string;
  skills: { skill: { name: string } }[];
  interests: { interest: { name: string } }[];
  experiences: { tags: { tag: { name: string } }[] }[];
}

/**
 * جفت‌سازی ساده و قابل توضیح بر اساس: تمایل به همیاری، حوزه تجربه (برچسب‌ها)،
 * مهارت/علاقه مرتبط، استان همسان و کیفیت همکاری‌های قبلی. بدون Popularity.
 */
export async function suggestHelpers(input: {
  barrierType: string;
  tags: string[];
  province?: string | null;
  excludeUserId: string;
}): Promise<SuggestedHelper[]> {
  const candidates = (await prisma.user.findMany({
    where: {
      onboardingCompleted: true,
      willingToHelp: true,
      visibility: { not: "private" },
      id: { not: input.excludeUserId },
    },
    select: {
      id: true,
      displayName: true,
      province: true,
      city: true,
      membershipStatus: true,
      skills: { select: { skill: { select: { name: true } } } },
      interests: { select: { interest: { select: { name: true } } } },
      experiences: {
        where: {
          isDraft: false,
          moderation: "visible",
          publishedAt: { not: null },
          status: { in: ["user_generated", "under_review", "reviewed", "featured"] },
        },
        select: { tags: { select: { tag: { select: { name: true } } } } },
        take: 30,
      },
    },
  })) as unknown as CandidateRow[];

  const candidateIds = candidates.map((candidate) => candidate.id);

  const goodHelpers = await prisma.peerCooperation.findMany({
    where: {
      helperId: { in: candidateIds },
      status: "completed",
      requesterRating: { gte: 4 },
    },
    select: { helperId: true },
  });
  const goodHelperIds = new Set(goodHelpers.map((item) => item.helperId));

  const requestTagSet = new Set(
    input.tags.map((tag) => tag.trim()).filter(Boolean),
  );

  const scored = candidates.map((candidate) => {
    let score = 0;
    const reasons: string[] = [];

    const experienceTags = new Set(
      candidate.experiences.flatMap((experience) =>
        experience.tags.map((tag) => tag.tag.name),
      ),
    );
    const hasExperience = candidate.experiences.length > 0;
    if (hasExperience) {
      score += 2;
      reasons.push("دارای تجربه میدانی منتشرشده");
    }

    const tagOverlap = [...requestTagSet].filter((tag) =>
      experienceTags.has(tag),
    );
    if (tagOverlap.length > 0) {
      score += 2;
      reasons.push("تجربه در موضوعِ هم‌تراز با نیاز شما");
    }

    const profileTags = new Set([
      ...candidate.skills.map((item) => item.skill.name),
      ...candidate.interests.map((item) => item.interest.name),
    ]);
    const profileOverlap = [...requestTagSet].filter((tag) =>
      profileTags.has(tag),
    );
    if (profileOverlap.length > 0) {
      score += 2;
      reasons.push("مهارت/علاقه مرتبط با نیاز شما");
    }

    if (
      input.province &&
      candidate.province &&
      candidate.province === input.province
    ) {
      score += 2;
      reasons.push("هم‌استان با شما");
    }

    if (goodHelperIds.has(candidate.id)) {
      score += 3;
      reasons.push("همکاری‌های قبلی موفق");
    }

    if (candidate.membershipStatus === "verified") {
      score += 1;
      reasons.push("عضو تأییدشده");
    }

    return {
      user: {
        id: candidate.id,
        displayName: candidate.displayName,
        province: candidate.province,
        city: candidate.city,
        membershipStatus: candidate.membershipStatus,
      },
      score,
      reasons,
    };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (a.user.displayName ?? "").localeCompare(b.user.displayName ?? ""),
  );

  return scored.slice(0, PEER_SUGGESTED_HELPERS_LIMIT);
}