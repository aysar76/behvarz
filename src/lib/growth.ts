import { prisma } from "@/lib/db";
import {
  computeBadges,
  type CapitalBadge,
} from "@/lib/serializers/capital";

const VISIBLE_EXPERIENCE_STATUSES = [
  "user_generated",
  "under_review",
  "reviewed",
  "featured",
] as const;

export interface GrowthStats {
  publishedExperiences: number;
  featuredExperiences: number;
  solvedProblems: number;
  helpfulAnswers: number;
  activeCircles: number;
  thanksReceived: number;
  successfulReusesByOthers: number;
  validReferences: number;
  isVerified: boolean;
}

export interface GrowthUnfinishedItem {
  id: string;
  title: string;
  kind: "draft_problem" | "draft_experience";
  createdAt: string;
}

export interface GrowthNextStep {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface GrowthDashboard {
  stats: GrowthStats;
  badges: CapitalBadge[];
  unfinished: GrowthUnfinishedItem[];
  nextStep: GrowthNextStep | null;
}

/**
 * محاسبه شاخص‌های رشد از رویدادهای واقعی (بدون ذخیره امتیاز).
 * نمایش عمومی فقط محتوای منتشر/قابل‌نمایش را لحاظ می‌کند؛ پیش‌نویس‌ها فقط
 * برای «قدم بعدی» کاربرِ خودش دیده می‌شوند (رجوع به docs/reputation-model.md).
 */
export async function getGrowthDashboard(
  userId: string,
): Promise<GrowthDashboard> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      membershipStatus: true,
      _count: { select: { interests: true, skills: true } },
    },
  });

  const publishedWhere = {
    authorId: userId,
    isDraft: false,
    publishedAt: { not: null },
    moderation: "visible" as const,
  };

  const [
    publishedExperiences,
    featuredExperiences,
    solvedProblems,
    helpfulAnswers,
    activeCircles,
    thanksReceived,
    successfulReusesByOthers,
    validReferences,
    openProblems,
    draftProblems,
    draftExperiences,
  ] = await Promise.all([
    prisma.experience.count({
      where: { ...publishedWhere, status: { in: [...VISIBLE_EXPERIENCE_STATUSES] } },
    }),
    prisma.experience.count({
      where: { ...publishedWhere, status: "featured" },
    }),
    prisma.problem.count({
      where: {
        authorId: userId,
        status: "solved",
        isDraft: false,
        publishedAt: { not: null },
        moderation: "visible",
      },
    }),
    prisma.problemAnswerHelpful.count({
      where: {
        answer: {
          authorId: userId,
          isClarificationRequest: false,
          moderation: "visible",
          problem: {
            isDraft: false,
            publishedAt: { not: null },
            moderation: "visible",
          },
        },
      },
    }),
    prisma.circleMembership.count({
      where: {
        userId,
        status: "active",
        circle: { status: "active" },
      },
    }),
    prisma.professionalThanks.count({ where: { receivedById: userId } }),
    prisma.experienceReuse.count({
      where: {
        experience: { authorId: userId },
        outcome: "successful",
        user: { id: { not: userId } },
      },
    }),
    prisma.experienceReference.count({
      where: { experience: { authorId: userId } },
    }),
    prisma.problem.count({
      where: {
        authorId: userId,
        status: { in: ["open", "discussing"] },
        isDraft: false,
        publishedAt: { not: null },
        moderation: "visible",
      },
    }),
    prisma.problem.findMany({
      where: { authorId: userId, isDraft: true },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.experience.findMany({
      where: { authorId: userId, isDraft: true },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const stats: GrowthStats = {
    publishedExperiences,
    featuredExperiences,
    solvedProblems,
    helpfulAnswers,
    activeCircles,
    thanksReceived,
    successfulReusesByOthers,
    validReferences,
    isVerified: user?.membershipStatus === "verified",
  };

  const badges = computeBadges({
    publishedExperiences,
    featuredExperiences,
    solvedProblems,
    validReferences,
    successfulReusesByOthers,
    thanksReceived,
    helpfulAnswers,
    activeCircles,
    isVerified: stats.isVerified,
  });

  const unfinished = [
    ...draftProblems.map((item) => ({
      id: item.id,
      title: item.title,
      kind: "draft_problem" as const,
      createdAt: item.createdAt.toISOString(),
    })),
    ...draftExperiences.map((item) => ({
      id: item.id,
      title: item.title,
      kind: "draft_experience" as const,
      createdAt: item.createdAt.toISOString(),
    })),
  ];

  const nextStep = computeNextStep({
    hasUnfinishedDraft: unfinished.length > 0,
    hasOpenProblem: openProblems > 0,
    stats,
    hasInterests: (user?._count.interests ?? 0) > 0,
    hasSkills: (user?._count.skills ?? 0) > 0,
  });

  return { stats, badges, unfinished, nextStep };
}

/**
 * منطق «قدم بعدی» — ساده، قابل توضیح، ترتیبی و غیرجبری.
 * فقط از وضعیت واقعی کاربر نتیجه می‌گیرد (رجوع به docs/reputation-model.md بخش ۳).
 */
export function computeNextStep(input: {
  hasUnfinishedDraft: boolean;
  hasOpenProblem: boolean;
  hasInterests: boolean;
  hasSkills: boolean;
  stats: GrowthStats;
}): GrowthNextStep | null {
  const { stats } = input;

  if (input.hasUnfinishedDraft) {
    return {
      id: "continue-draft",
      title: "ادامه پیش‌نویس",
      description: "پیش‌نویسی ناتمام داری؛ آن را کامل و منتشر کن.",
      href: "/discover",
    };
  }

  if (stats.publishedExperiences === 0) {
    return {
      id: "first-experience",
      title: "ثبت نخستین تجربه",
      description: "تجربه میدانی خود را به اشتراک بگذار تا دیگران از آن استفاده کنند.",
      href: "/experiences/new",
    };
  }

  if (input.hasOpenProblem) {
    return {
      id: "follow-up-problem",
      title: "پیگیری مسئله",
      description: "مسئله‌ای در جریان داری؛ پاسخ‌ها را جمع‌بندی و راهکار را انتخاب کن.",
      href: "/problems",
    };
  }

  if (stats.publishedExperiences > 0 && stats.successfulReusesByOthers === 0) {
    return {
      id: "share-experience",
      title: "به‌اشتراک‌گذاری تجربه برای همکاران",
      description: "تجربه‌ات را در مسائل مرتبط ارجاع بده تا همکارانت اجرا و نتیجه ثبت کنند.",
      href: "/problems",
    };
  }

  if (stats.activeCircles === 0) {
    return {
      id: "join-circle",
      title: "پیوستن به حلقه همیار",
      description: "با عضویت در یک حلقه کوچک، همکاری نزدیک‌تر و یادگیری بیشتری خواهی داشت.",
      href: "/circles",
    };
  }

  if (!input.hasInterests || !input.hasSkills) {
    return {
      id: "complete-profile",
      title: "تکمیل پروفایل",
      description: "با ثبت علایق و مهارت‌ها، پیشنهادهای مرتبط‌تری دریافت می‌کنی.",
      href: "/me",
    };
  }

  return {
    id: "discover-knowledge",
    title: "بررسی کشف دانش",
    description: "مسائل بی‌پاسخ و تجربه‌های برگزیده را ببین و به جامعه کمک کن.",
    href: "/discover",
  };
}