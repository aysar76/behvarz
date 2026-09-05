import { prisma } from "@/lib/db";

/**
 * مرکز فرماندهی — تصویر زنده وضعیت شبکه، الگوها، هشدارها و پیشنهادهای حمایت.
 * فقط داده‌های تجمیعی و ناشناس؛ برای تیم عامل/شورا، نه نظارت تنبیهی.
 * (رجوع به docs/phase-reports/phase-14-ecosystem.md)
 */

export interface CommandCenterOverview {
  members: number;
  verifiedMembers: number;
  activeCampaigns: number;
  openProblems: number;
  solvedProblems: number;
  publishedExperiences: number;
  experienceReuses: number;
  activeCircles: number;
  activeCooperations: number;
  totalReportsPending: number;
}

export interface CommandCenterAlert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
  count: number;
  href?: string;
}

export interface PatternBucket {
  label: string;
  count: number;
}

export interface CommandCenterPatterns {
  barrierTypes: PatternBucket[];
  problemStatuses: PatternBucket[];
  topProvinces: PatternBucket[];
  topTags: PatternBucket[];
}

export interface TrendBucket {
  label: string;
  current: number;
  previous: number;
  changePercent: number | null;
}

export interface CoachingSuggestion {
  id: string;
  title: string;
  description: string;
  count: number;
  href?: string;
}

export interface CommandCenterReport {
  overview: CommandCenterOverview;
  alerts: CommandCenterAlert[];
  patterns: CommandCenterPatterns;
  trends: TrendBucket[];
  coaching: CoachingSuggestion[];
  generatedAt: string;
}

const HOURS_48 = 48 * 60 * 60 * 1000;
const DAYS_7 = 7 * 24 * 60 * 60 * 1000;
const DAYS_14 = 14 * 24 * 60 * 60 * 1000;

/**
 * محاسبه گزارش مرکز فرماندهی از رویدادهای واقعی (تجمیعی و ناشناس).
 */
export async function getCommandCenterReport(): Promise<CommandCenterReport> {
  const now = new Date();
  const since48h = new Date(now.getTime() - HOURS_48);
  const since7d = new Date(now.getTime() - DAYS_7);
  const since14d = new Date(now.getTime() - DAYS_14);

  const [
    members,
    verifiedMembers,
    activeCampaigns,
    openProblems,
    solvedProblems,
    publishedExperiences,
    experienceReuses,
    activeCircles,
    activeCooperations,
    totalReportsPending,
    pendingAppeals,
    pendingMemberships,
    needsReviewProblems,
    needsReviewExperiences,
    restrictedUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { accountStatus: "active" } }),
    prisma.user.count({ where: { membershipStatus: "verified" } }),
    prisma.campaign.count({ where: { status: "active" } }),
    prisma.problem.count({
      where: {
        status: { in: ["open", "discussing"] },
        isDraft: false,
        moderation: "visible",
        publishedAt: { not: null },
      },
    }),
    prisma.problem.count({
      where: {
        status: "solved",
        isDraft: false,
        moderation: "visible",
        publishedAt: { not: null },
      },
    }),
    prisma.experience.count({
      where: {
        status: { in: ["user_generated", "under_review", "reviewed", "featured"] },
        isDraft: false,
        moderation: "visible",
        publishedAt: { not: null },
      },
    }),
    prisma.experienceReuse.count(),
    prisma.circle.count({ where: { status: "active" } }),
    prisma.peerCooperation.count({ where: { status: "active" } }),
    prisma.contentReport.count({ where: { status: "pending" } }),
    prisma.appeal.count({ where: { status: "pending" } }),
    prisma.membershipRequest.count({ where: { status: "pending" } }),
    prisma.problem.count({
      where: { needsReview: true, moderation: "visible", isDraft: false },
    }),
    prisma.experience.count({
      where: { needsReview: true, moderation: "visible", isDraft: false },
    }),
    prisma.user.count({
      where: { accountStatus: { in: ["restricted", "suspended"] } },
    }),
  ]);

  // --- الگوها ---
  const [barrierTypeGroups, problemStatusGroups, provinceGroups, tagGroups] =
    await Promise.all([
      prisma.problem.groupBy({
        by: ["barrierType"],
        where: {
          isDraft: false,
          moderation: "visible",
          publishedAt: { not: null },
          status: { in: ["open", "discussing", "solved"] },
        },
        _count: { _all: true },
      }),
      prisma.problem.groupBy({
        by: ["status"],
        where: {
          isDraft: false,
          moderation: "visible",
          publishedAt: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ["province"],
        where: { accountStatus: "active", province: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { province: "desc" } },
        take: 6,
      }),
      prisma.problemTag.groupBy({
        by: ["tagId"],
        where: {
          problem: {
            isDraft: false,
            moderation: "visible",
            publishedAt: { not: null },
            status: { in: ["open", "discussing", "solved"] },
          },
        },
        _count: { _all: true },
        orderBy: { _count: { tagId: "desc" } },
        take: 6,
      }),
    ]);

  const barrierTypeLabels: Record<string, string> = {
    resources: "منابع",
    knowledge: "دانش و مهارت",
    process: "فرآیند و اداری",
    community: "مشارکت جامعه",
    equipment: "تجهیزات",
    other: "سایر",
  };

  const statusLabels: Record<string, string> = {
    open: "باز",
    discussing: "در حال گفت‌وگو",
    solved: "حل‌شده",
    archived: "بایگانی‌شده",
  };

  const tagIds = tagGroups.map((item) => item.tagId);
  const tags = tagIds.length > 0
    ? await prisma.tag.findMany({ where: { id: { in: tagIds } } })
    : [];
  const tagNameMap = new Map(tags.map((tag) => [tag.id, tag.name]));

  const patterns: CommandCenterPatterns = {
    barrierTypes: barrierTypeGroups.map((item) => ({
      label: barrierTypeLabels[item.barrierType] ?? item.barrierType,
      count: item._count._all,
    })),
    problemStatuses: problemStatusGroups.map((item) => ({
      label: statusLabels[item.status] ?? item.status,
      count: item._count._all,
    })),
    topProvinces: provinceGroups.map((item) => ({
      label: item.province ?? "نامشخص",
      count: item._count._all,
    })),
    topTags: tagGroups.map((item) => ({
      label: tagNameMap.get(item.tagId) ?? item.tagId,
      count: item._count._all,
    })),
  };

  // --- هشدارها ---
  const unansweredSince48h = await prisma.problem.count({
    where: {
      status: "open",
      isDraft: false,
      moderation: "visible",
      publishedAt: { not: null },
      createdAt: { lte: since48h },
      answers: { none: {} },
    },
  });

  const alerts: CommandCenterAlert[] = [];

  if (unansweredSince48h > 0) {
    alerts.push({
      id: "unanswered-48h",
      level: "critical",
      title: "مسائل بی‌پاسخ بیش از ۴۸ ساعت",
      description:
        "مسئله‌هایی که ۴۸ ساعت پس از ثبت هنوز هیچ پاسخی ندارند؛ برای حفظ «نرخ پاسخ ≥ ۷۰٪» نیاز به پیگیری هم‌افزا دارند.",
      count: unansweredSince48h,
      href: "/problems",
    });
  }

  if (totalReportsPending > 0) {
    alerts.push({
      id: "reports-pending",
      level: "critical",
      title: "گزارش‌های در انتظار بررسی",
      description:
        "گزارش‌های محتوای نامناسب باید طبق SLA زیر ۲۴ ساعت رسیدگی شوند.",
      count: totalReportsPending,
      href: "/admin/moderation",
    });
  }

  if (needsReviewProblems + needsReviewExperiences > 0) {
    alerts.push({
      id: "content-needs-review",
      level: "warning",
      title: "محتوای نیازمند بررسی ناظر",
      description:
        "مسائل و تجربه‌های علامت‌خورده برای بررسی ناظر در صف‌اند.",
      count: needsReviewProblems + needsReviewExperiences,
      href: "/admin/moderation",
    });
  }

  if (pendingAppeals > 0) {
    alerts.push({
      id: "appeals-pending",
      level: "warning",
      title: "اعتراض‌های در انتظار",
      description: "اعتراض کاربران به تصمیم‌های نظارتی در انتظار بررسی‌اند.",
      count: pendingAppeals,
      href: "/admin/appeals",
    });
  }

  if (pendingMemberships > 0) {
    alerts.push({
      id: "memberships-pending",
      level: "info",
      title: "درخواست‌های تأیید عضویت",
      description: "درخواست‌های تأیید عضویت حرفه‌ای در انتظار بررسی‌اند.",
      count: pendingMemberships,
      href: "/admin/memberships",
    });
  }

  if (restrictedUsers > 0) {
    alerts.push({
      id: "restricted-users",
      level: "info",
      title: "کاربران با وضعیت محدود",
      description:
        "تعداد کاربران دارای وضعیت محدود/تعلیق؛ بازبینی دوره‌ای پیشنهاد می‌شود.",
      count: restrictedUsers,
    });
  }

  // --- روندها (۷ روز جاری vs ۷ روز قبلی) ---
  const [problemsCurrent, problemsPrevious] = await Promise.all([
    prisma.problem.count({
      where: {
        isDraft: false,
        moderation: "visible",
        publishedAt: { not: null },
        createdAt: { gte: since7d },
      },
    }),
    prisma.problem.count({
      where: {
        isDraft: false,
        moderation: "visible",
        publishedAt: { not: null },
        createdAt: { gte: since14d, lt: since7d },
      },
    }),
  ]);

  const [experiencesCurrent, experiencesPrevious] = await Promise.all([
    prisma.experience.count({
      where: {
        isDraft: false,
        moderation: "visible",
        publishedAt: { not: null },
        createdAt: { gte: since7d },
      },
    }),
    prisma.experience.count({
      where: {
        isDraft: false,
        moderation: "visible",
        publishedAt: { not: null },
        createdAt: { gte: since14d, lt: since7d },
      },
    }),
  ]);

  const [reusesCurrent, reusesPrevious] = await Promise.all([
    prisma.experienceReuse.count({ where: { createdAt: { gte: since7d } } }),
    prisma.experienceReuse.count({
      where: { createdAt: { gte: since14d, lt: since7d } },
    }),
  ]);

  const [membersCurrent, membersPrevious] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since7d } } }),
    prisma.user.count({ where: { createdAt: { gte: since14d, lt: since7d } } }),
  ]);

  function buildTrend(label: string, current: number, previous: number): TrendBucket {
    const changePercent =
      previous === 0
        ? current > 0
          ? 100
          : null
        : Math.round(((current - previous) / previous) * 100);
    return { label, current, previous, changePercent };
  }

  const trends: TrendBucket[] = [
    buildTrend("مسئله ثبت‌شده", problemsCurrent, problemsPrevious),
    buildTrend("تجربه منتشرشده", experiencesCurrent, experiencesPrevious),
    buildTrend("اجرای مجدد تجربه", reusesCurrent, reusesPrevious),
    buildTrend("عضو جدید", membersCurrent, membersPrevious),
  ];

  // --- پیشنهاد حمایت/Coaching (برای تیم جامعه) ---
  const coaching: CoachingSuggestion[] = [];

  const provincesWithOpenProblems = await prisma.problem.groupBy({
    by: ["authorId"],
    where: {
      status: "open",
      isDraft: false,
      moderation: "visible",
      publishedAt: { not: null },
      createdAt: { lte: since48h },
    },
    _count: { _all: true },
  });
  const authorIds = provincesWithOpenProblems.map((item) => item.authorId);
  const authors = authorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, province: true },
      })
    : [];
  const provinceCountMap = new Map<string, number>();
  for (const author of authors) {
    const key = author.province ?? "نامشخص";
    provinceCountMap.set(key, (provinceCountMap.get(key) ?? 0) + 1);
  }
  const topUnansweredProvinces = [...provinceCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topUnansweredProvinces.length > 0) {
    coaching.push({
      id: "coaching-unanswered-provinces",
      title: "پیگیری مسائل بی‌پاسخ در استان‌ها",
      description:
        `استان‌های «${topUnansweredProvinces.map(([name, count]) => `${name} (${count})`).join("، ")}» بیشترین مسئله بی‌پاسخ ۴۸ساعته را دارند؛ فعال‌سازی سفیران و پاسخ هم‌افزا پیشنهاد می‌شود.`,
      count: topUnansweredProvinces.reduce((sum, [, count]) => sum + count, 0),
      href: "/discover",
    });
  }

  const emptyCircles = await prisma.circle.count({
    where: {
      status: "active",
      memberships: { none: {} },
    },
  });
  if (emptyCircles > 0) {
    coaching.push({
      id: "coaching-empty-circles",
      title: "حلقه‌های بدون عضو",
      description:
        "حلقه‌های فعال بدون هیچ عضو؛ دعوت/فعال‌سازی یا بایگانی پیشنهاد می‌شود.",
      count: emptyCircles,
      href: "/circles",
    });
  }

  const campaignsWithoutParticipation = await prisma.campaign.count({
    where: {
      status: "active",
      publishedAt: { not: null },
      participations: { none: {} },
    },
  });
  if (campaignsWithoutParticipation > 0) {
    coaching.push({
      id: "coaching-campaigns",
      title: "کمپین‌های بدون مشارکت",
      description:
        "کمپین‌های فعالی که هیچ عضوی در آن‌ها مشارکت نکرده است؛ معرفی در کشف دانش و اعلان پیشنهاد می‌شود.",
      count: campaignsWithoutParticipation,
      href: "/campaigns",
    });
  }

  return {
    overview: {
      members,
      verifiedMembers,
      activeCampaigns,
      openProblems,
      solvedProblems,
      publishedExperiences,
      experienceReuses,
      activeCircles,
activeCooperations,
      totalReportsPending,
    },
    alerts,
    patterns,
    trends,
    coaching,
    generatedAt: now.toISOString(),
  };
}