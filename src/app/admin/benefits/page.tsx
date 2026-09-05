import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  serializeBenefitProvider,
  type BenefitProviderRow,
} from "@/lib/benefits";
import {
  BENEFIT_PROVIDER_CATEGORY_LABELS,
  BENEFIT_PROVIDER_CATEGORY_EMOJIS,
  BENEFIT_PROVIDER_STATUS_LABELS,
  BENEFIT_PROVIDER_STATUS_TONES,
} from "@/lib/constants/benefits";
import { toPersianDigits } from "@/lib/dates";

export const metadata = {
  title: "مدیریت باشگاه مزایا",
};

export default async function AdminBenefitsPage() {
  const providers = await prisma.benefitProvider.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          membershipStatus: true,
          role: true,
        },
      },
      _count: { select: { usages: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-extrabold">
            مدیریت باشگاه مزایا
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مدیریت ارائه‌دهندگان، گزارش‌های مشکل و بررسی پیشنهادهای بودجه.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/benefits/reports">
            <Button variant="outline">گزارش‌های مزیت</Button>
          </Link>
          <Link href="/admin/budget">
            <Button variant="outline">بودجه مشارکتی</Button>
          </Link>
          <Link href="/admin/benefits/new">
            <Button>ارائه‌دهنده جدید</Button>
          </Link>
        </div>
      </header>

      {providers.length === 0 ? (
        <EmptyState
          title="ارائه‌دهنده‌ای ثبت نشده است"
          description="با افزودن نخستین ارائه‌دهنده، باشگاه مزایا را راه‌اندازی کن."
          action={
            <Link href="/admin/benefits/new">
              <Button>افزودن ارائه‌دهنده</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">ارائه‌دهنده</th>
                <th className="px-4 py-3 text-right font-medium">دسته</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium">استفاده</th>
                <th className="px-4 py-3 text-right font-medium">اسپانسر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {providers.map((raw) => {
                const provider = serializeBenefitProvider(
                  raw as unknown as BenefitProviderRow,
                );
                const tone = BENEFIT_PROVIDER_STATUS_TONES[
                  provider.status as keyof typeof BENEFIT_PROVIDER_STATUS_TONES
                ];
                return (
                  <tr key={provider.id} className="hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/benefits/${provider.id}`}
                        className="text-foreground hover:text-brand-700 font-semibold"
                      >
                        {provider.logoEmoji ?? BENEFIT_PROVIDER_CATEGORY_EMOJIS[provider.category]}{" "}
                        {provider.name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {BENEFIT_PROVIDER_CATEGORY_LABELS[provider.category]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone ?? "neutral"}>
                        {BENEFIT_PROVIDER_STATUS_LABELS[
                          provider.status as keyof typeof BENEFIT_PROVIDER_STATUS_LABELS
                        ]}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {toPersianDigits(provider.usageCount)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {provider.isSponsored ? "بله" : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}