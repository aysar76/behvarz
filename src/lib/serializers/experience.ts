import type {
  ExperienceReuseOutcome,
  ExperienceStatus,
  ModerationState,
} from "@/generated/prisma/client";

export interface ExperienceAuthorRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  membershipStatus: string;
  role: string;
}

export interface ExperienceTagRow {
  tag: { id: string; name: string };
}

export interface ExperienceReuseRow {
  id: string;
  experienceId: string;
  userId: string;
  outcome: ExperienceReuseOutcome;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; displayName: string | null };
}

export interface ExperienceReferenceRow {
  id: string;
  answerId: string;
  answer?: {
    id: string;
    problem: { id: string; title: string };
  };
}

export interface ExperienceRow {
  id: string;
  authorId: string;
  slug: string;
  title: string;
  situation: string;
  conditions: string | null;
  action: string;
  resources: string | null;
  challenges: string | null;
  result: string;
  lessons: string | null;
  suggestion: string | null;
  status: ExperienceStatus;
  isDraft: boolean;
  needsReview: boolean;
  moderation: ModerationState;
  moderationNote: string | null;
  sourceProblemId: string | null;
  publishedAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: ExperienceAuthorRow | null;
  tags: ExperienceTagRow[];
  sourceProblem?: { id: string; title: string } | null;
  reuses?: ExperienceReuseRow[];
  references?: ExperienceReferenceRow[];
  _count?: { references: number; reuses: number };
}

export interface SerializedExperienceAuthor {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  isVerified: boolean;
}

export interface SerializedExperienceReuse {
  id: string;
  outcome: ExperienceReuseOutcome;
  summary: string;
  createdAt: string;
  user: { id: string; displayName: string | null };
}

export interface SerializedExperience {
  id: string;
  slug: string;
  title: string;
  situation: string;
  conditions: string | null;
  action: string;
  resources: string | null;
  challenges: string | null;
  result: string;
  lessons: string | null;
  suggestion: string | null;
  status: ExperienceStatus;
  isDraft: boolean;
  needsReview: boolean;
  moderation: ModerationState;
  moderationNote: string | null;
  sourceProblemId: string | null;
  sourceProblemTitle: string | null;
  publishedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: SerializedExperienceAuthor | null;
  tags: string[];
  referenceCount: number;
  reuseCount: number;
  reuseSuccessCount: number;
  isReusedByMe: boolean;
  myReuse: SerializedExperienceReuse | null;
  reuses: SerializedExperienceReuse[];
}

function serializeAuthor(
  author: ExperienceAuthorRow | null,
): SerializedExperienceAuthor | null {
  if (!author) return null;
  return {
    id: author.id,
    displayName: author.displayName,
    province: author.province,
    city: author.city,
    isVerified: author.membershipStatus === "verified",
  };
}

function serializeReuse(reuse: ExperienceReuseRow): SerializedExperienceReuse {
  return {
    id: reuse.id,
    outcome: reuse.outcome,
    summary: reuse.summary,
    createdAt: reuse.createdAt.toISOString(),
    user: {
      id: reuse.user?.id ?? reuse.userId,
      displayName: reuse.user?.displayName ?? null,
    },
  };
}

export interface SerializeExperienceOptions {
  currentUserId?: string;
}

export function serializeExperience(
  experience: ExperienceRow,
  options: SerializeExperienceOptions = {},
): SerializedExperience {
  const reuses = experience.reuses ?? [];
  const referenceCount =
    experience._count?.references ?? experience.references?.length ?? 0;
  const reuseCount = experience._count?.reuses ?? reuses.length;
  const reuseSuccessCount = reuses.filter(
    (reuse) => reuse.outcome === "successful",
  ).length;

  const myReuse =
    options.currentUserId !== undefined
      ? reuses.find((reuse) => reuse.userId === options.currentUserId) ?? null
      : null;

  return {
    id: experience.id,
    slug: experience.slug,
    title: experience.title,
    situation: experience.situation,
    conditions: experience.conditions,
    action: experience.action,
    resources: experience.resources,
    challenges: experience.challenges,
    result: experience.result,
    lessons: experience.lessons,
    suggestion: experience.suggestion,
    status: experience.status,
    isDraft: experience.isDraft,
    needsReview: experience.needsReview,
    moderation: experience.moderation,
    moderationNote: experience.moderationNote,
    sourceProblemId: experience.sourceProblemId,
    sourceProblemTitle: experience.sourceProblem?.title ?? null,
    publishedAt: experience.publishedAt?.toISOString() ?? null,
    reviewedAt: experience.reviewedAt?.toISOString() ?? null,
    createdAt: experience.createdAt.toISOString(),
    updatedAt: experience.updatedAt.toISOString(),
    author: serializeAuthor(experience.author),
    tags: experience.tags.map((item) => item.tag.name),
    referenceCount,
    reuseCount,
    reuseSuccessCount,
    isReusedByMe: myReuse !== null,
    myReuse: myReuse ? serializeReuse(myReuse) : null,
    reuses: reuses.map(serializeReuse),
  };
}

export interface SerializedExperienceReuseRef {
  id: string;
  title: string;
}

export interface SerializedExperienceReport {
  id: string;
  title: string;
}

export function serializeExperienceReportTarget(
  experience: { id: string; title: string },
): SerializedExperienceReport {
  return { id: experience.id, title: experience.title };
}