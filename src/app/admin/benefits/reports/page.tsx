import { prisma } from "@/lib/db";
import { BenefitReportsQueue } from "@/components/admin/benefit-reports-queue";
import { BENEFIT_REPORT_REASON_LABELS, BENEFIT_REPORT_STATUS_LABELS } from "@/lib/constants/benefits";

export const metadata = {
  title: "گزارش‌های مزیت",
};

export default async function AdminBenefitReportsPage() {
  const reports = await prisma.benefitReport.findMany({
    include: {
      provider: { select: { id: true, name: true, logoEmoji: true } },
      reporter: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = reports.map((report) => ({
    id: report.id,
    providerId: report.providerId,
    providerName: report.provider.name,
    providerEmoji: report.provider.logoEmoji,
    reporterName: report.reporter.displayName,
    reason: report.reason,
    reasonLabel: BENEFIT_REPORT_REASON_LABELS[report.reason],
    note: report.note,
    status: report.status,
    statusLabel: BENEFIT_REPORT_STATUS_LABELS[report.status],
    moderatorNote: report.moderatorNote,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          گزارش‌های مزیت
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          رسیدگی به گزارش‌های مشکل از ارائه‌دهندگان مزایا.
        </p>
      </header>
      <BenefitReportsQueue initialReports={serialized} />
    </div>
  );
}