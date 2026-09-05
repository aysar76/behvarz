import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import {
  serializeCapitalProfile,
  type CapitalUserRow,
} from "@/lib/serializers/capital";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const viewer = await requireUser();
    assertPermission(viewer, "profile:read:other");
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        province: true,
        city: true,
        bio: true,
        workYears: true,
        role: true,
        membershipStatus: true,
        visibility: true,
        onboardingCompleted: true,
      },
    });

    if (!user || !user.onboardingCompleted) {
      throw new AppError("NOT_FOUND", "عضو یافت نشد");
    }

    if (user.visibility === "private") {
      throw new AppError("FORBIDDEN", "پروفایل این عضو خصوصی است");
    }

    const [experiences, solvedProblems, reuseCount, thanksCount] =
      await Promise.all([
        prisma.experience.findMany({
          where: {
            authorId: user.id,
            isDraft: false,
            publishedAt: { not: null },
            moderation: "visible",
            status: { in: ["user_generated", "under_review", "reviewed", "featured"] },
          },
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            thanksCount: true,
            reuses: { select: { outcome: true } },
            _count: { select: { references: true, reuses: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.problem.findMany({
          where: {
            authorId: user.id,
            status: "solved",
            isDraft: false,
            moderation: "visible",
            publishedAt: { not: null },
          },
          select: {
            id: true,
            title: true,
            status: true,
            conclusion: true,
            solvedAt: true,
          },
          orderBy: { solvedAt: "desc" },
          take: 50,
        }),
        prisma.experienceReuse.count({
          where: {
            experience: { authorId: user.id },
            outcome: "successful",
          },
        }),
        prisma.professionalThanks.count({ where: { receivedById: user.id } }),
      ]);

    const profile = serializeCapitalProfile({
      user: user as CapitalUserRow,
      experiences,
      solvedProblems,
      successfulReuseCount: reuseCount,
      thanksReceivedCount: thanksCount,
    });

    return jsonOk({ profile });
  } catch (error) {
    return jsonError(error);
  }
}