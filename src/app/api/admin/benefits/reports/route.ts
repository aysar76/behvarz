import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");

    const reports = await prisma.benefitReport.findMany({
      include: {
        provider: { select: { id: true, name: true, logoEmoji: true } },
        reporter: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      reports: reports.map((report) => ({
        id: report.id,
        providerId: report.providerId,
        providerName: report.provider.name,
        providerEmoji: report.provider.logoEmoji,
        reporterId: report.reporterId,
        reporterName: report.reporter.displayName,
        reason: report.reason,
        note: report.note,
        status: report.status,
        moderatorNote: report.moderatorNote,
        reviewedBy: report.reviewedBy,
        reviewedAt: report.reviewedAt?.toISOString() ?? null,
        createdAt: report.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}