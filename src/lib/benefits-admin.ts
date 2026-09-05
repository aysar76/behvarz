import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { auditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { Prisma, type BudgetProposalStatus } from "@/generated/prisma/client";

/**
 * تغییر وضعیت ارائه‌دهنده با تنظیم publishedAt.
 */
export async function updateProviderStatus(
  providerId: string,
  status: "draft" | "approved" | "archived",
): Promise<void> {
  const provider = await prisma.benefitProvider.findUnique({
    where: { id: providerId },
    select: { id: true, status: true },
  });
  if (!provider) {
    throw new AppError("NOT_FOUND", "ارائه‌دهنده یافت نشد");
  }

  await prisma.benefitProvider.update({
    where: { id: providerId },
    data: {
      status,
      publishedAt: status === "approved" ? new Date() : null,
    },
  });
}

/**
 * بررسی صلاحیت پیشنهاد بودجه و تغییر وضعیت آن.
 */
export async function reviewBudgetProposal(
  proposalId: string,
  status: Exclude<BudgetProposalStatus, "draft">,
  actorId: string,
  ip?: string | null,
): Promise<void> {
  const proposal = await prisma.budgetProposal.findUnique({
    where: { id: proposalId },
    select: { id: true, status: true, title: true, authorId: true },
  });
  if (!proposal) {
    throw new AppError("NOT_FOUND", "پیشنهاد یافت نشد");
  }

  const allowedTransitions: Record<string, string[]> = {
    draft: ["under_review", "rejected"],
    under_review: ["approved", "voting", "rejected"],
    approved: ["voting", "rejected"],
    voting: ["implemented", "closed"],
    implemented: ["closed"],
  };

  const allowed = allowedTransitions[proposal.status] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(
      "CONFLICT",
      `تغییر وضعیت از «${proposal.status}» به «${status}» مجاز نیست`,
    );
  }

  await prisma.budgetProposal.update({
    where: { id: proposalId },
    data: {
      status,
      reviewedBy: actorId,
      reviewedAt: new Date(),
      implementedAt: status === "implemented" ? new Date() : null,
      closedAt: status === "closed" ? new Date() : null,
    },
  });

  const labels: Record<string, string> = {
    under_review: "در حال بررسی صلاحیت",
    approved: "تأیید شده برای رأی‌گیری",
    rejected: "رد شده",
    voting: "وارد مرحله رأی‌گیری شده",
    implemented: "اجرا شده",
    closed: "بسته شده",
  };
  await notifyUser({
    userId: proposal.authorId,
    type: "budget_proposal_reviewed",
    actorId,
    title: "نتیجه بررسی پیشنهاد بودجه",
    body: `پیشنهاد «${proposal.title}» به وضعیت «${labels[status] ?? status}» رسید.`,
    targetType: "budget_proposal",
    targetId: proposalId,
  });

  await auditLog({
    actorId,
    action: "benefits.budgetProposalReview",
    entityType: "BudgetProposal",
    entityId: proposalId,
    details: { from: proposal.status, to: status },
    ip: ip ?? null,
  });
}

/**
 * ثبت گزارش اجرا و هزینه (قابل ممیزی) برای یک پیشنهاد.
 */
export async function reportImplementation(
  input: {
    proposalId: string;
    summary: string;
    expenses?: { item: string; amount: string }[];
  },
  reporterId: string,
  ip?: string | null,
): Promise<void> {
  const proposal = await prisma.budgetProposal.findUnique({
    where: { id: input.proposalId },
    select: { id: true, status: true },
  });
  if (!proposal) {
    throw new AppError("NOT_FOUND", "پیشنهاد یافت نشد");
  }

  await prisma.$transaction(async (tx) => {
    await tx.budgetImplementation.create({
      data: {
        proposalId: input.proposalId,
        summary: input.summary,
        expenses:
          input.expenses && input.expenses.length > 0
            ? (input.expenses as unknown as Prisma.InputJsonValue)
            : undefined,
        reportedById: reporterId,
      },
    });

    await tx.budgetProposal.update({
      where: { id: input.proposalId },
      data: {
        status: "implemented",
        implementedAt: new Date(),
        reviewedBy: reporterId,
        reviewedAt: new Date(),
      },
    });
  });

  await auditLog({
    actorId: reporterId,
    action: "benefits.budgetImplementationReported",
    entityType: "BudgetProposal",
    entityId: input.proposalId,
    details: { expenseCount: input.expenses?.length ?? 0 },
    ip: ip ?? null,
  });
}

/**
 * رسیدگی به گزارش مشکل ارائه‌دهنده.
 */
export async function reviewBenefitReport(
  reportId: string,
  status: "pending" | "resolved" | "rejected",
  moderatorNote: string | null,
  moderatorId: string,
  ip?: string | null,
): Promise<void> {
  const report = await prisma.benefitReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, providerId: true, reporterId: true },
  });
  if (!report) {
    throw new AppError("NOT_FOUND", "گزارش یافت نشد");
  }

  await prisma.benefitReport.update({
    where: { id: reportId },
    data: {
      status,
      moderatorNote,
      reviewedBy: moderatorId,
      reviewedAt: new Date(),
    },
  });

  if (status === "resolved") {
    await notifyUser({
      userId: report.reporterId,
      type: "benefit_report_resolved",
      actorId: moderatorId,
      title: "نتیجه گزارش مزیت",
      body: "گزارش شما از ارائه‌دهنده بررسی و ثبت شد.",
      targetType: "benefit_provider",
      targetId: report.providerId,
    });
  }

  await auditLog({
    actorId: moderatorId,
    action: "benefits.benefitReportReview",
    entityType: "BenefitReport",
    entityId: reportId,
    details: { from: report.status, to: status },
    ip: ip ?? null,
  });
}