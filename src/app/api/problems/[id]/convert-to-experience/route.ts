import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { syncExperienceTags } from "@/lib/experiences";
import { generateExperienceSlug } from "@/lib/slug";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    const { id } = await params;

    if (
      isRateLimited(`problems:convert:${user.id}`, 10, 60 * 60 * 1000)
    ) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد تبدیل در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });
    if (!problem || problem.moderation !== "visible") {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }
    if (problem.authorId !== user.id) {
      throw new AppError(
        "FORBIDDEN",
        "فقط نویسنده مسئله می‌تواند آن را به تجربه تبدیل کند",
      );
    }
    if (problem.status !== "solved") {
      throw new AppError(
        "CONFLICT",
        "تبدیل به تجربه فقط برای مسائل حل‌شده امکان‌پذیر است",
      );
    }
    if (!problem.selectedAnswerId) {
      throw new AppError(
        "CONFLICT",
        "ابتدا یک راهکار انتخاب کنید تا بتوانید تجربه ثبت کنید",
      );
    }

    const selectedAnswer = await prisma.problemAnswer.findUnique({
      where: { id: problem.selectedAnswerId },
    });
    if (!selectedAnswer || selectedAnswer.moderation !== "visible") {
      throw new AppError("CONFLICT", "پاسخ منتخب قابل استفاده نیست");
    }

    const alreadyConverted = await prisma.experience.findFirst({
      where: { sourceProblemId: problem.id, isDraft: false },
      select: { id: true },
    });
    if (alreadyConverted) {
      throw new AppError(
        "CONFLICT",
        "این مسئله قبلاً به تجربه منتشرشده تبدیل شده است",
      );
    }

    let slug = generateExperienceSlug();
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await prisma.experience.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) break;
      slug = generateExperienceSlug();
    }

    const experience = await prisma.experience.create({
      data: {
        authorId: user.id,
        slug,
        title: problem.title,
        situation: problem.description,
        conditions: problem.context,
        action: selectedAnswer.body,
        result:
          problem.conclusion ??
          problem.resultSummary ??
          "نتیجه نهایی پس از اجرای راهکار ثبت شد.",
        sourceProblemId: problem.id,
        isDraft: true,
        publishedAt: null,
      },
    });

    await syncExperienceTags(
      experience.id,
      problem.tags.map((item) => item.tag.name),
    );

    await auditLog({
      actorId: user.id,
      action: "problem.convert-to-experience",
      entityType: "Experience",
      entityId: experience.id,
      details: { sourceProblemId: problem.id },
      ip,
    });

    const created = await prisma.experience.findUnique({
      where: { id: experience.id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
            role: true,
          },
        },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        sourceProblem: { select: { id: true, title: true } },
        _count: { select: { references: true, reuses: true } },
      },
    });

    return jsonOk(
      {
        experience: serializeExperience(created as unknown as ExperienceRow, {
          currentUserId: user.id,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}