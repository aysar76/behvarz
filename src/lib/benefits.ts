import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  BenefitProviderCategory,
  BenefitReportReason,
  BudgetProposalCategory,
  BudgetProposalStatus,
} from "@/generated/prisma/client";

export const BENEFIT_PROVIDER_LIST_INCLUDE = {
  createdBy: {
    select: { id: true, displayName: true, membershipStatus: true, role: true },
  },
  _count: { select: { usages: true } },
} as const;

export interface BenefitProviderRow {
  id: string;
  name: string;
  category: BenefitProviderCategory;
  description: string;
  terms: string;
  website: string | null;
  contactNote: string | null;
  logoEmoji: string | null;
  isSponsored: boolean;
  status: string;
  createdById: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    displayName: string | null;
    membershipStatus: string;
    role: string;
  } | null;
  _count?: { usages: number };
  usages?: BenefitUsageRow[];
}

export interface BenefitUsageRow {
  id: string;
  providerId: string;
  userId: string;
  note: string | null;
  satisfaction: number;
  createdAt: Date;
}

type MyUsageRow = Pick<BenefitUsageRow, "id" | "satisfaction" | "createdAt">;

export interface SerializedBenefitProvider {
  id: string;
  name: string;
  category: BenefitProviderCategory;
  description: string;
  terms: string;
  website: string | null;
  contactNote: string | null;
  logoEmoji: string | null;
  isSponsored: boolean;
  status: string;
  usageCount: number;
  averageSatisfaction: number | null;
  myUsage: { id: string; satisfaction: number; createdAt: string } | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedBudgetProposal {
  id: string;
  title: string;
  description: string;
  category: string;
  amountEstimate: string | null;
  status: BudgetProposalStatus;
  voteCount: number;
  myVote: boolean;
  implementationSummary: string | null;
  implementedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; displayName: string | null } | null;
}

export function serializeBenefitProvider(
  provider: BenefitProviderRow,
  options: {
    averageSatisfaction?: number | null;
    myUsage?: MyUsageRow | null;
  } = {},
): SerializedBenefitProvider {
  return {
    id: provider.id,
    name: provider.name,
    category: provider.category,
    description: provider.description,
    terms: provider.terms,
    website: provider.website,
    contactNote: provider.contactNote,
    logoEmoji: provider.logoEmoji,
    isSponsored: provider.isSponsored,
    status: provider.status,
    usageCount: provider._count?.usages ?? provider.usages?.length ?? 0,
    averageSatisfaction: options.averageSatisfaction ?? null,
    myUsage: options.myUsage
      ? {
          id: options.myUsage.id,
          satisfaction: options.myUsage.satisfaction,
          createdAt: options.myUsage.createdAt.toISOString(),
        }
      : null,
    publishedAt: provider.publishedAt?.toISOString() ?? null,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}

/**
 * فهرست ارائه‌دهندگان تأییدشده با میانگین رضایت و استفاده خود کاربر.
 */
export async function listApprovedProviders(
  userId: string,
): Promise<SerializedBenefitProvider[]> {
  const [providers, myUsages] = await Promise.all([
    prisma.benefitProvider.findMany({
      where: { status: "approved", publishedAt: { not: null } },
      include: {
        ...BENEFIT_PROVIDER_LIST_INCLUDE,
        usages: {
          where: { userId },
          select: { id: true, satisfaction: true, createdAt: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.benefitUsage.groupBy({
      by: ["providerId"],
      where: { provider: { status: "approved" } },
      _avg: { satisfaction: true },
    }),
  ]);

  const avgMap = new Map(
    myUsages.map((row) => [
      row.providerId,
      row._avg.satisfaction ?? null,
    ]),
  );

  return (providers as unknown as BenefitProviderRow[]).map((provider) =>
    serializeBenefitProvider(provider, {
      averageSatisfaction: avgMap.get(provider.id) ?? null,
      myUsage: provider.usages?.[0] ?? null,
    }),
  );
}

/**
 * جزئیات یک ارائه‌دهنده تأییدشده به‌همراه میانگین رضایت و استفاده خود کاربر.
 */
export async function getApprovedProvider(
  providerId: string,
  userId: string,
): Promise<SerializedBenefitProvider> {
  const provider = await prisma.benefitProvider.findUnique({
    where: { id: providerId },
    include: {
      ...BENEFIT_PROVIDER_LIST_INCLUDE,
      usages: {
        where: { userId },
        select: { id: true, satisfaction: true, createdAt: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!provider || provider.status !== "approved" || !provider.publishedAt) {
    throw new AppError("NOT_FOUND", "ارائه‌دهنده یافت نشد");
  }

  const avg = await prisma.benefitUsage.aggregate({
    where: { providerId },
    _avg: { satisfaction: true },
  });

  return serializeBenefitProvider(provider as unknown as BenefitProviderRow, {
    averageSatisfaction: avg._avg.satisfaction ?? null,
    myUsage: provider.usages?.[0] ?? null,
  });
}

/**
 * ثبت استفاده غیرحساس از مزیت + امتیاز رضایت.
 */
export async function registerBenefitUsage(
  input: { providerId: string; note?: string; satisfaction: number },
  userId: string,
): Promise<void> {
  const provider = await prisma.benefitProvider.findUnique({
    where: { id: input.providerId },
    select: { id: true, status: true, publishedAt: true },
  });
  if (!provider || provider.status !== "approved" || !provider.publishedAt) {
    throw new AppError("NOT_FOUND", "ارائه‌دهنده یافت نشد");
  }

  await prisma.benefitUsage.create({
    data: {
      providerId: input.providerId,
      userId,
      note: input.note ?? null,
      satisfaction: input.satisfaction,
    },
  });
}

/**
 * گزارش مشکل از یک مزیت/ارائه‌دهنده. جلوگیری از گزارش تکراری در انتظار بررسی.
 */
export async function reportBenefitProblem(
  input: {
    providerId: string;
    reason: string;
    note?: string;
  },
  userId: string,
): Promise<void> {
  const provider = await prisma.benefitProvider.findUnique({
    where: { id: input.providerId },
    select: { id: true, status: true, publishedAt: true },
  });
  if (!provider || provider.status !== "approved" || !provider.publishedAt) {
    throw new AppError("NOT_FOUND", "ارائه‌دهنده یافت نشد");
  }

  const pending = await prisma.benefitReport.findFirst({
    where: {
      providerId: input.providerId,
      reporterId: userId,
      status: "pending",
    },
    select: { id: true },
  });
  if (pending) {
    throw new AppError(
      "CONFLICT",
      "شما قبلاً برای این ارائه‌دهنده گزارش ثبت کرده‌اید و در انتظار بررسی است",
    );
  }

  await prisma.benefitReport.create({
    data: {
      providerId: input.providerId,
      reporterId: userId,
      reason: input.reason as BenefitReportReason,
      note: input.note ?? null,
    },
  });
}

export interface BenefitReportRow {
  id: string;
  providerId: string;
  reporterId: string;
  reason: string;
  note: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  moderatorNote: string | null;
  createdAt: Date;
}

/**
 * فهرست پیشنهادهای بودجه برای نمایش عمومی (وضعیت‌های قابل نمایش).
 */
export async function listVisibleProposals(
  userId: string,
): Promise<SerializedBudgetProposal[]> {
  const visibleStatuses: BudgetProposalStatus[] = [
    "under_review",
    "approved",
    "voting",
    "implemented",
    "closed",
  ];
  const [proposals, votes] = await Promise.all([
    prisma.budgetProposal.findMany({
      where: { status: { in: visibleStatuses } },
      include: {
        author: { select: { id: true, displayName: true } },
        _count: { select: { votes: true } },
        implementations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.budgetProposalVote.findMany({
      where: { userId },
      select: { proposalId: true },
    }),
  ]);

  const voteSet = new Set(votes.map((v) => v.proposalId));

  return proposals.map((proposal) =>
    serializeBudgetProposal(proposal, {
      myVote: voteSet.has(proposal.id),
    }),
  );
}

export interface BudgetProposalRow {
  id: string;
  title: string;
  description: string;
  category: string;
  amountEstimate: string | null;
  status: BudgetProposalStatus;
  createdAt: Date;
  updatedAt: Date;
  implementedAt: Date | null;
  author?: { id: string; displayName: string | null } | null;
  _count?: { votes: number };
  votes?: { userId: string }[];
  implementations?: { summary: string; createdAt: Date }[];
}

export function serializeBudgetProposal(
  proposal: BudgetProposalRow,
  options: { myVote?: boolean } = {},
): SerializedBudgetProposal {
  return {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    category: proposal.category,
    amountEstimate: proposal.amountEstimate,
    status: proposal.status,
    voteCount:
      proposal._count?.votes ?? proposal.votes?.length ?? 0,
    myVote: options.myVote ?? false,
    implementationSummary: proposal.implementations?.[0]?.summary ?? null,
    implementedAt: proposal.implementedAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    author: proposal.author
      ? {
          id: proposal.author.id,
          displayName: proposal.author.displayName,
        }
      : null,
  };
}

/**
 * ثبت پیشنهاد بودجه مشارکتی (پیش‌نویس توسط کاربر؛ بررسی صلاحیت توسط مدیر).
 */
export async function createBudgetProposal(
  input: {
    title: string;
    description: string;
    category: string;
    amountEstimate?: string;
  },
  userId: string,
): Promise<{ id: string }> {
  const proposal = await prisma.budgetProposal.create({
    data: {
      authorId: userId,
      title: input.title,
      description: input.description,
      category: input.category as BudgetProposalCategory,
      amountEstimate: input.amountEstimate ?? null,
      status: "draft",
    },
  });
  return { id: proposal.id };
}

/**
 * ثبت رأی واجدین شرایط. هر کاربر فقط یک رأی برای هر پیشنهاد رأی‌گیری.
 */
export async function voteOnProposal(
  proposalId: string,
  userId: string,
): Promise<{ count: number }> {
  const proposal = await prisma.budgetProposal.findUnique({
    where: { id: proposalId },
    select: { id: true, status: true },
  });
  if (!proposal) {
    throw new AppError("NOT_FOUND", "پیشنهاد یافت نشد");
  }
  if (proposal.status !== "voting") {
    throw new AppError("CONFLICT", "این پیشنهاد در مرحله رأی‌گیری نیست");
  }

  await prisma.budgetProposalVote.upsert({
    where: { proposalId_userId: { proposalId, userId } },
    update: {},
    create: { proposalId, userId },
  });

  const count = await prisma.budgetProposalVote.count({ where: { proposalId } });
  return { count };
}