import type {
  ModerationState,
  ProblemBarrierType,
  ProblemResultOutcome,
  ProblemStatus,
  ProblemUrgency,
  ReportStatus,
} from "@/generated/prisma/client";

export interface ProblemAuthorRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  membershipStatus: string;
  role: string;
}

export interface ProblemTagRow {
  tag: { id: string; name: string };
}

export interface AnswerRow {
  id: string;
  body: string;
  isClarificationRequest: boolean;
  isSelectedSolution: boolean;
  moderation: ModerationState;
  moderationNote: string | null;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: ProblemAuthorRow;
  helpfulMarks?: { userId: string }[];
  references?: ExperienceReferenceRow[];
}

export interface ExperienceReferenceRow {
  id: string;
  experience: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
}

export interface StatusHistoryRow {
  id: string;
  from: ProblemStatus | null;
  to: ProblemStatus;
  note: string | null;
  changedBy: string;
  createdAt: Date;
}

export interface ProblemRow {
  id: string;
  authorId: string;
  title: string;
  description: string;
  context: string | null;
  barrierType: ProblemBarrierType;
  actionsTaken: string | null;
  expectedOutcome: string | null;
  urgency: ProblemUrgency;
  status: ProblemStatus;
  isAnonymous: boolean;
  isDraft: boolean;
  needsReview: boolean;
  moderation: ModerationState;
  moderationNote: string | null;
  conclusion: string | null;
  selectedAnswerId: string | null;
  resultSummary: string | null;
  resultOutcome: ProblemResultOutcome | null;
  publishedAt: Date | null;
  solvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: ProblemAuthorRow | null;
  tags: ProblemTagRow[];
  _count?: { answers: number };
  answers?: AnswerRow[];
  statusHistory?: StatusHistoryRow[];
}

export interface SerializedProblemAuthor {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  isVerified: boolean;
}

export interface SerializedAnswer {
  id: string;
  body: string;
  isClarificationRequest: boolean;
  isSelectedSolution: boolean;
  helpfulCount: number;
  isHelpfulByMe: boolean;
  createdAt: string;
  author: SerializedProblemAuthor;
  references: SerializedExperienceRef[];
}

export interface SerializedExperienceRef {
  id: string;
  slug: string;
  title: string;
  status: string;
}

export interface SerializedStatusChange {
  id: string;
  from: ProblemStatus | null;
  to: ProblemStatus;
  note: string | null;
  createdAt: string;
}

export interface SerializedProblem {
  id: string;
  title: string;
  description: string;
  context: string | null;
  barrierType: ProblemBarrierType;
  actionsTaken: string | null;
  expectedOutcome: string | null;
  urgency: ProblemUrgency;
  status: ProblemStatus;
  isAnonymous: boolean;
  isDraft: boolean;
  needsReview: boolean;
  moderation: ModerationState;
  moderationNote: string | null;
  conclusion: string | null;
  selectedAnswerId: string | null;
  resultSummary: string | null;
  resultOutcome: ProblemResultOutcome | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  solvedAt: string | null;
  author: SerializedProblemAuthor | null;
  tags: string[];
  answerCount: number;
  answers: SerializedAnswer[];
  statusHistory: SerializedStatusChange[];
}

function serializeAuthor(
  author: ProblemAuthorRow | null,
): SerializedProblemAuthor | null {
  if (!author) return null;
  return {
    id: author.id,
    displayName: author.displayName,
    province: author.province,
    city: author.city,
    isVerified: author.membershipStatus === "verified",
  };
}

export interface SerializeProblemOptions {
  revealAuthor?: boolean;
  currentUserId?: string;
}

export function serializeAnswer(
  answer: AnswerRow,
  currentUserId?: string,
): SerializedAnswer {
  return {
    id: answer.id,
    body: answer.body,
    isClarificationRequest: answer.isClarificationRequest,
    isSelectedSolution: answer.isSelectedSolution,
    helpfulCount: answer.helpfulCount,
    isHelpfulByMe:
      (answer.helpfulMarks?.some((mark) => mark.userId === currentUserId) ??
        false) &&
      currentUserId !== undefined,
    createdAt: answer.createdAt.toISOString(),
    author: serializeAuthor(answer.author) ?? {
      id: "",
      displayName: null,
      province: null,
      city: null,
      isVerified: false,
    },
    references:
      answer.references
        ?.filter((ref) => ref.experience.status !== "archived")
        .map((ref) => ({
          id: ref.experience.id,
          slug: ref.experience.slug,
          title: ref.experience.title,
          status: ref.experience.status,
        })) ?? [],
  };
}

export function serializeProblem(
  problem: ProblemRow,
  options: SerializeProblemOptions = {},
): SerializedProblem {
  const revealAuthor =
    options.revealAuthor === true || problem.isAnonymous === false;

  return {
    id: problem.id,
    title: problem.title,
    description: problem.description,
    context: problem.context,
    barrierType: problem.barrierType,
    actionsTaken: problem.actionsTaken,
    expectedOutcome: problem.expectedOutcome,
    urgency: problem.urgency,
    status: problem.status,
    isAnonymous: problem.isAnonymous,
    isDraft: problem.isDraft,
    needsReview: problem.needsReview,
    moderation: problem.moderation,
    moderationNote: problem.moderationNote,
    conclusion: problem.conclusion,
    selectedAnswerId: problem.selectedAnswerId,
    resultSummary: problem.resultSummary,
    resultOutcome: problem.resultOutcome,
    createdAt: problem.createdAt.toISOString(),
    updatedAt: problem.updatedAt.toISOString(),
    publishedAt: problem.publishedAt?.toISOString() ?? null,
    solvedAt: problem.solvedAt?.toISOString() ?? null,
    author: revealAuthor ? serializeAuthor(problem.author) : null,
    tags: problem.tags.map((item) => item.tag.name),
    answerCount: problem._count?.answers ?? problem.answers?.length ?? 0,
    answers:
      problem.answers
        ?.filter((answer) => answer.moderation === "visible")
        .map((answer) => serializeAnswer(answer, options.currentUserId)) ?? [],
    statusHistory:
      problem.statusHistory?.map((change) => ({
        id: change.id,
        from: change.from,
        to: change.to,
        note: change.note,
        createdAt: change.createdAt.toISOString(),
      })) ?? [],
  };
}

export interface ReportProblemRow {
  id: string;
  title: string;
}

export interface ReportAnswerRow {
  id: string;
  body: string;
  problem: ReportProblemRow;
}

export interface ReportRow {
  id: string;
  reason: string;
  note: string | null;
  status: ReportStatus;
  moderatorNote: string | null;
  createdAt: Date;
  reporter: { id: string; displayName: string | null };
  problem: ReportProblemRow | null;
  answer: ReportAnswerRow | null;
  experience: ReportExperienceRow | null;
}

export interface ReportExperienceRow {
  id: string;
  title: string;
}

export interface SerializedReport {
  id: string;
  reason: string;
  note: string | null;
  status: ReportStatus;
  moderatorNote: string | null;
  createdAt: string;
  reporterLabel: string;
  targetLabel: string;
}

export function serializeReport(report: ReportRow): SerializedReport {
  const targetLabel = report.answer
    ? `پاسخ در مسئله «${report.answer.problem.title}»`
    : report.problem
      ? `مسئله «${report.problem.title}»`
      : report.experience
        ? `تجربه «${report.experience.title}»`
        : "هدف نامشخص";

  return {
    id: report.id,
    reason: report.reason,
    note: report.note,
    status: report.status,
    moderatorNote: report.moderatorNote,
    createdAt: report.createdAt.toISOString(),
    reporterLabel: report.reporter.displayName ?? "بی‌نام",
    targetLabel,
  };
}
