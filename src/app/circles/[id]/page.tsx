import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { CircleDetail } from "@/components/circles/circle-detail";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUser } from "@/lib/auth/authorization";
import { getCircleRow } from "@/lib/circles";
import {
  serializeCircle,
  type CircleRow,
} from "@/lib/serializers/circle";

export const metadata = {
  title: "حلقه همیار",
};

export default async function CircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const circle = await getCircleRow(id);
  if (!circle) notFound();

  const serialized = serializeCircle(circle as CircleRow, {
    currentUserId: user.id,
  });

  const isAdmin = canUser(user, "content:moderate");
  const canViewArchived =
    serialized.isMember || serialized.isFacilitator || isAdmin;
  if (circle.status === "archived" && !canViewArchived) notFound();
  if (circle.status !== "archived" && !serialized.isMember && !isAdmin) {
    // مخفی‌کردن عضوهای کامل از غیرعضوها (فقط تعداد و راهبر)
  }

  const inviteCandidates =
    serialized.isFacilitator && circle.status === "active"
      ? await prisma.user.findMany({
          where: {
            onboardingCompleted: true,
            willingToHelp: true,
            visibility: { not: "private" },
            id: { not: user.id },
            NOT: {
              circleMemberships: {
                some: { circleId: id, status: "active" },
              },
            },
          },
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
          },
          orderBy: { createdAt: "asc" },
          take: 10,
        })
      : [];

  return (
    <AppShell>
      <CircleDetail
        initialCircle={serialized}
        inviteCandidates={inviteCandidates.map((candidate) => ({
          id: candidate.id,
          displayName: candidate.displayName,
          province: candidate.province,
          city: candidate.city,
        }))}
        canModerate={isAdmin}
      />
    </AppShell>
  );
}