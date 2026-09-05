import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listApprovedProviders, type SerializedBenefitProvider } from "@/lib/benefits";
import {
  BENEFIT_PROVIDER_CATEGORY_LABELS,
  BENEFIT_PROVIDER_CATEGORY_EMOJIS,
} from "@/lib/constants/benefits";
import { toPersianDigits } from "@/lib/dates";

export const metadata = {
  title: "باشگاه مزایا",
};

function ProviderCard({ provider }: { provider: SerializedBenefitProvider }) {
  const avg = provider.averageSatisfaction;
  return (
    <Link
      href={`/benefits/${provider.id}`}
      className="border-border bg-card shadow-card hover:border-brand-300 focus-visible:outline-ring flex flex-col gap-3 rounded-xl border p-4 transition-colors focus-visible:outline-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="bg-brand-100 text-brand-800 flex size-12 items-center justify-center rounded-lg text-2xl"
          >
            {provider.logoEmoji ?? BENEFIT_PROVIDER_CATEGORY_EMOJIS[provider.category]}
          </span>
          <div>
            <p className="text-foreground font-bold">{provider.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge tone="brand">
                {BENEFIT_PROVIDER_CATEGORY_LABELS[provider.category]}
              </Badge>
              {provider.isSponsored ? <Badge tone="info">اسپانسر</Badge> : null}
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground line-clamp-2 text-sm">
        {provider.description}
      </p>

      <div className="text-muted-foreground mt-auto flex items-center justify-between text-xs">
        <span>استفاده: {toPersianDigits(provider.usageCount)}</span>
        <span>
          رضایت:{" "}
          {avg !== null
            ? toPersianDigits(avg.toFixed(1))
            : "—"}
        </span>
      </div>
    </Link>
  );
}

export default async function BenefitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const providers = await listApprovedProviders(user.id);

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">باشگاه مزایا</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مزایا و فرصت‌های تأییدشده برای اعضای جامعه بهورزان. تبلیغ و محتوای
            حرفه‌ای به‌صورت شفاف از هم جدا شده‌اند.
          </p>
        </header>

        <section className="bg-brand-50 border-brand-200 rounded-xl border p-4">
          <h2 className="text-brand-800 text-sm font-bold">تفکیک شفاف</h2>
          <p className="text-brand-700 mt-1 text-xs">
            ارائه‌دهندگانی که با برچسب «اسپانسر» مشخص شده‌اند، حمایت مالی شده‌اند؛
            اما این هرگز بر اعتبار محتوای حرفه‌ای پلتفرم اثر نمی‌گذارد و محتوای
            علمی مستقل از هر اسپانسر منتشر می‌شود.
          </p>
        </section>

        {providers.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">🎁</span>}
            title="هنوز مزیتی ثبت نشده است"
            description="به‌زودی ارائه‌دهندگان تأییدشده برای اعضای شبکه معرفی می‌شوند."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}

        <section className="border-border bg-muted/40 rounded-xl border border-dashed p-4">
          <h2 className="text-foreground text-sm font-bold">
            بودجه‌ریزی مشارکتی
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            اعضا پیشنهاد می‌دهند، مدیران صلاحیت را بررسی می‌کنند و واجدین شرایط
            رأی می‌دهند. اجرا و هزینه‌ها با گزارش قابل ممیزی منتشر می‌شود.
          </p>
          <div className="mt-3">
            <Link href="/budget">
              <Button size="sm" variant="outline">
                مشاهده پیشنهادها
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}