import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/shell/app-shell";
import { ProblemDetail } from "@/components/problems/problem-detail";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUser } from "@/lib/auth/authorization";
import { ANSWER_DETAIL_INCLUDE } from "@/lib/problems";
import {
  serializeProblem,
  type ProblemRow,
  type SerializedProblem,
} from "@/lib/serializers/problem";

export const metadata = {
  title: "اتاق مسئله",
};

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      author: { select: AUTHOR_SELECT },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      answers: {
        include: ANSWER_DETAIL_INCLUDE,
        orderBy: { createdAt: "asc" },
      },
      statusHistory: { orderBy: { createdAt: "asc" } },
      _count: { select: { answers: true } },
    },
  });

  if (!problem) notFound();
  const canModerate = canUser(user, "content:moderate");
  if (problem.moderation !== "visible" && !canModerate) notFound();

  const tagNames = problem.tags.map((item) => item.tag.name);
  let related: SerializedProblem[] = [];
  if (tagNames.length > 0) {
    const relatedRows = await prisma.problem.findMany({
      where: {
        id: { not: problem.id },
        isDraft: false,
        publishedAt: { not: null },
        moderation: "visible",
        tags: { some: { tag: { name: { in: tagNames } } } },
      },
      include: {
        author: { select: AUTHOR_SELECT },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    related = (relatedRows as unknown as ProblemRow[]).map((row) =>
      serializeProblem(row),
    );
  }

  return (
    <AppShell>
      <ProblemDetail
        initialProblem={serializeProblem(problem as unknown as ProblemRow, {
          currentUserId: user.id,
          revealAuthor: canModerate,
        })}
        related={related}
        isAuthor={problem.authorId === user.id}
        canModerate={canModerate}
      />
    </AppShell>
  );
}
