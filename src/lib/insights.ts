import { prisma } from "@/lib/db";
import type { ProblemStatus } from "@/generated/prisma/client";

/**
 * نقشه موانع تجمیعی ناشناس — دارایی دانشی برای همکاری پژوهشی.
 * فقط داده‌های تجمیعی و ناشناس از کاربرانی که `allowDataContribution` را
 * فعال کرده‌اند. هیچ داده هویتی، بیمار یا پرونده‌ای بازگردانده نمی‌شود.
 * (رجوع به docs/data-privacy-rules.md و docs/phase-reports/phase-14-ecosystem.md)
 */

export interface BarrierBucket {
  barrierType: string;
  label: string;
  count: number;
}

export interface BarrierByProvince {
  province: string;
  counts: Record<string, number>;
  total: number;
}

export interface BarrierMapReport {
  totals: BarrierBucket[];
  byProvince: BarrierByProvince[];
  contributors: number;
  problemsContributed: number;
  generatedAt: string;
}

const BARRIER_TYPE_LABELS: Record<string, string> = {
  resources: "منابع",
  knowledge: "دانش و مهارت",
  process: "فرآیند و اداری",
  community: "مشارکت جامعه",
  equipment: "تجهیزات",
  other: "سایر",
};

/**
 * محاسبه نقشه موانع از مسائل منتشرشده کاربران دارای رضایت.
 * گروه‌بندی بر اساس استان و نوع مانع؛ خروجی فقط شمارش تجمیعی است.
 */
export async function getBarrierMapReport(): Promise<BarrierMapReport> {
  // فقط کاربرانی که رضایت صریح برای مشارکت داده‌اند.
  const consentedUsers = await prisma.user.findMany({
    where: { allowDataContribution: true },
    select: { id: true, province: true },
  });

  const consentedIds = consentedUsers.map((user) => user.id);
  const provinceById = new Map(
    consentedUsers.map((user) => [user.id, user.province ?? "نامشخص"]),
  );

  const where = {
    authorId: { in: consentedIds },
    isDraft: false,
    moderation: "visible" as const,
    publishedAt: { not: null },
    status: {
      in: ["open", "discussing", "solved"] as ProblemStatus[],
    },
  };

  const [totals, byProvince] = await Promise.all([
    prisma.problem.groupBy({
      by: ["barrierType"],
      where,
      _count: { _all: true },
    }),
    prisma.problem.findMany({
      where,
      select: {
        authorId: true,
        barrierType: true,
      },
    }),
  ]);

  const provinceMap = new Map<string, Record<string, number>>();
  for (const problem of byProvince) {
    const province = provinceById.get(problem.authorId) ?? "نامشخص";
    const counts = provinceMap.get(province) ?? {};
    counts[problem.barrierType] = (counts[problem.barrierType] ?? 0) + 1;
    provinceMap.set(province, counts);
  }

  const byProvinceReport: BarrierByProvince[] = [...provinceMap.entries()]
    .map(([province, counts]) => ({
      province,
      counts,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totals: totals.map((item) => ({
      barrierType: item.barrierType,
      label: BARRIER_TYPE_LABELS[item.barrierType] ?? item.barrierType,
      count: item._count?._all ?? 0,
    })),
    byProvince: byProvinceReport,
    contributors: consentedIds.length,
    problemsContributed: byProvince.length,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * وضعیت رضایت کاربر برای مشارکت داده‌ها (برای صفحه تنظیم).
 */
export async function getDataContributionStatus(
  userId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { allowDataContribution: true },
  });
  return user?.allowDataContribution ?? false;
}

/**
 * به‌روزرسانی رضایت کاربر برای مشارکت داده‌های ناشناس.
 */
export async function updateDataContribution(
  userId: string,
  allow: boolean,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { allowDataContribution: allow },
  });
}