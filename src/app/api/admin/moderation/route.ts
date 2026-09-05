import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import {
  serializeProblem,
  serializeReport,
  type ProblemRow,
  type ReportRow,
} from "@/lib/serializers/problem";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import { serializePeerReport, type PeerReportRow } from "@/lib/serializers/peer";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "content:moderate");

    const url = new URL(request.url);
    const onlyReports = url.searchParams.get("reports") === "1";

    const [problems, experiences, reports, peerReports] = await Promise.all([
      onlyReports
        ? []
        : prisma.problem.findMany({
            where: {
              OR: [{ needsReview: true }, { moderation: { not: "visible" } }],
            },
            include: {
              author: { select: AUTHOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              _count: { select: { answers: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: 50,
          }),
      onlyReports
        ? []
        : prisma.experience.findMany({
            where: {
              OR: [
                { needsReview: true },
                { moderation: { not: "visible" } },
                { status: { in: ["under_review"] } },
              ],
            },
            include: {
              author: { select: AUTHOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              sourceProblem: { select: { id: true, title: true } },
              _count: { select: { references: true, reuses: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: 50,
          }),
      prisma.contentReport.findMany({
        where: { status: { in: ["pending", "reviewing"] } },
        include: {
          reporter: { select: { id: true, displayName: true } },
          problem: { select: { id: true, title: true } },
          answer: {
            select: {
              id: true,
              body: true,
              problem: { select: { id: true, title: true } },
            },
          },
          experience: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.peerCooperationReport.findMany({
        where: { status: "pending" },
        include: {
          reporter: { select: { id: true, displayName: true } },
          cooperation: {
            select: {
              id: true,
              requesterId: true,
              helperId: true,
              requester: { select: { displayName: true } },
              helper: { select: { displayName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    await auditLog({
      actorId: user.id,
      action: "moderation.queue.read",
      entityType: "ModerationQueue",
      ip,
    });

    return jsonOk({
      problems: (problems as unknown as ProblemRow[]).map((row) =>
        serializeProblem(row, { revealAuthor: true }),
      ),
      experiences: (experiences as unknown as ExperienceRow[]).map((row) =>
        serializeExperience(row),
      ),
      reports: (reports as unknown as ReportRow[]).map(serializeReport),
      peerReports: (peerReports as unknown as PeerReportRow[]).map(
        serializePeerReport,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
