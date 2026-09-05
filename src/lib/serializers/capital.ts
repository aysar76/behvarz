import type {
  ExperienceStatus,
  ProblemStatus,
  Visibility,
} from "@/generated/prisma/client";

export interface CapitalBadge {
  id: string;
  label: string;
  description: string;
  tone: "brand" | "success" | "info" | "warning" | "neutral";
}

export interface CapitalExperienceItem {
  id: string;
  slug: string;
  title: string;
  status: ExperienceStatus;
  referenceCount: number;
  reuseCount: number;
  reuseSuccessCount: number;
  thanksCount: number;
  featured: boolean;
}

export interface CapitalProblemItem {
  id: string;
  title: string;
  status: ProblemStatus;
  conclusion: string | null;
  solvedAt: string | null;
}

export interface CapitalProfile {
  user: {
    id: string;
    displayName: string | null;
    province: string | null;
    city: string | null;
    bio: string | null;
    workYears: string | null;
    role: string;
    isVerified: boolean;
    visibility: Visibility;
  };
  stats: {
    publishedExperiences: number;
    solvedProblems: number;
    validReferences: number;
    successfulReusesByOthers: number;
    thanksReceived: number;
  };
  badges: CapitalBadge[];
  experiences: CapitalExperienceItem[];
  solvedProblems: CapitalProblemItem[];
}

export interface CapitalUserRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  bio: string | null;
  workYears: string | null;
  role: string;
  membershipStatus: string;
  visibility: Visibility;
}

export interface CapitalExperienceRow {
  id: string;
  slug: string;
  title: string;
  status: ExperienceStatus;
  thanksCount: number;
  _count?: { references: number; reuses: number };
  reuses?: { outcome: string }[];
  references?: unknown[];
}

export interface CapitalProblemRow {
  id: string;
  title: string;
  status: ProblemStatus;
  conclusion: string | null;
  solvedAt: Date | null;
}

export interface CapitalThanksRow {
  _count: { receivedBy: number };
}

export function computeBadges(input: {
  publishedExperiences: number;
  featuredExperiences: number;
  solvedProblems: number;
  validReferences: number;
  successfulReusesByOthers: number;
  thanksReceived: number;
  helpfulAnswers?: number;
  activeCircles?: number;
  isVerified: boolean;
}): CapitalBadge[] {
  const badges: CapitalBadge[] = [];

  if (input.publishedExperiences >= 1) {
    badges.push({
      id: "first-experience",
      label: "اولین تجربه",
      description: "نخستین تجربه میدانی خود را به اشتراک گذاشته است.",
      tone: "brand",
    });
  }
  if (input.publishedExperiences >= 5) {
    badges.push({
      id: "experienced",
      label: "تجربه‌نگار",
      description: "۵ تجربه میدانی منتشر کرده است.",
      tone: "info",
    });
  }
  if (input.featuredExperiences >= 1) {
    badges.push({
      id: "featured",
      label: "برگزیده",
      description: "یک تجربه‌اش توسط ناظران برگزیده شده است.",
      tone: "success",
    });
  }
  if (input.solvedProblems >= 1) {
    badges.push({
      id: "problem-solver",
      label: "مسئله‌یاب",
      description: "دست‌کم یک مسئله را به جمع‌بندی و راهکار رسانده است.",
      tone: "info",
    });
  }
  if ((input.helpfulAnswers ?? 0) >= 1) {
    badges.push({
      id: "helpful-answer",
      label: "پاسخ‌گوی مفید",
      description: "پاسخی از او برای دیگران «مفید بود» بوده است.",
      tone: "brand",
    });
  }
  if ((input.activeCircles ?? 0) >= 1) {
    badges.push({
      id: "circle-member",
      label: "همیار حلقه",
      description: "عضو فعال یک حلقه همیار است.",
      tone: "info",
    });
  }
  if (input.validReferences >= 1) {
    badges.push({
      id: "referenced",
      label: "مرجعِ همکاران",
      description: "تجربه‌هایش در مسائل واقعی دیگران ارجاع شده است.",
      tone: "success",
    });
  }
  if (input.successfulReusesByOthers >= 1) {
    badges.push({
      id: "reused",
      label: "اثرگذار",
      description: "دیگران تجربه‌اش را اجرا کرده و نتیجه موفق ثبت کرده‌اند.",
      tone: "success",
    });
  }
  if (input.thanksReceived >= 5) {
    badges.push({
      id: "appreciated",
      label: "قدردان‌شدنی",
      description: "بیش از ۵ تشکر حرفه‌ای دریافت کرده است.",
      tone: "warning",
    });
  }
  if (input.isVerified) {
    badges.push({
      id: "verified-member",
      label: "عضو تأییدشده",
      description: "هویت حرفه‌ای‌اش توسط مدیران تأیید شده است.",
      tone: "neutral",
    });
  }

  return badges;
}

export function serializeCapitalProfile(input: {
  user: CapitalUserRow;
  experiences: CapitalExperienceRow[];
  solvedProblems: CapitalProblemRow[];
  successfulReuseCount: number;
  thanksReceivedCount: number;
  helpfulAnswers?: number;
  activeCircles?: number;
}): CapitalProfile {
  const publishedExperiences = input.experiences.length;
  const featuredExperiences = input.experiences.filter(
    (experience) => experience.status === "featured",
  ).length;
  const validReferences = input.experiences.reduce(
    (sum, experience) => sum + (experience._count?.references ?? 0),
    0,
  );
  const successfulReusesByOthers = input.successfulReuseCount;

  const stats = {
    publishedExperiences,
    solvedProblems: input.solvedProblems.length,
    validReferences,
    successfulReusesByOthers,
    thanksReceived: input.thanksReceivedCount,
  };

  const badges = computeBadges({
    publishedExperiences,
    featuredExperiences,
    solvedProblems: stats.solvedProblems,
    validReferences,
    successfulReusesByOthers,
    thanksReceived: stats.thanksReceived,
    helpfulAnswers: input.helpfulAnswers,
    activeCircles: input.activeCircles,
    isVerified: input.user.membershipStatus === "verified",
  });

  return {
    user: {
      id: input.user.id,
      displayName: input.user.displayName,
      province: input.user.province,
      city: input.user.city,
      bio: input.user.bio,
      workYears: input.user.workYears,
      role: input.user.role,
      isVerified: input.user.membershipStatus === "verified",
      visibility: input.user.visibility,
    },
    stats,
    badges,
    experiences: input.experiences.map((experience) => ({
      id: experience.id,
      slug: experience.slug,
      title: experience.title,
      status: experience.status,
      referenceCount: experience._count?.references ?? 0,
      reuseCount: experience._count?.reuses ?? experience.reuses?.length ?? 0,
      reuseSuccessCount:
        experience.reuses?.filter((reuse) => reuse.outcome === "successful")
          .length ?? 0,
      thanksCount: experience.thanksCount,
      featured: experience.status === "featured",
    })),
    solvedProblems: input.solvedProblems.map((problem) => ({
      id: problem.id,
      title: problem.title,
      status: problem.status,
      conclusion: problem.conclusion,
      solvedAt: problem.solvedAt?.toISOString() ?? null,
    })),
  };
}