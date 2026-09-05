import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getApprovedProvider } from "@/lib/benefits";
import {
  BENEFIT_PROVIDER_CATEGORY_LABELS,
  BENEFIT_PROVIDER_CATEGORY_EMOJIS,
  BENEFIT_SATISFACTION_LABELS,
} from "@/lib/constants/benefits";
import { toPersianDigits } from "@/lib/dates";
import { ProviderActions } from "@/components/benefits/provider-actions";

export const metadata = {
  title: "جزئیات مزیت",
};

export default async function BenefitProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const { id } = await params;

  let provider;
  try {
    provider = await getApprovedProvider(id, user.id);
  } catch {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <Link
            href="/benefits"
            className="text-brand-700 hover:text-brand-800 text-sm font-medium"
          >
            ← باشگاه مزایا
          </Link>
          <div className="mt-2 flex items-start gap-3">
            <span
              aria-hidden="true"
              className="bg-brand-100 text-brand-800 flex size-14 items-center justify-center rounded-xl text-3xl"
            >
              {provider.logoEmoji ?? BENEFIT_PROVIDER_CATEGORY_EMOJIS[provider.category]}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground text-2xl font-extrabold">
                  {provider.name}
                </h1>
                {provider.isSponsored ? <Badge tone="info">اسپانسر</Badge> : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge tone="brand">
                  {BENEFIT_PROVIDER_CATEGORY_LABELS[provider.category]}
                </Badge>
                <Badge tone="neutral">
                  {toPersianDigits(provider.usageCount)} استفاده
                </Badge>
                {provider.averageSatisfaction !== null && (
                  <Badge tone="success">
                    رضایت {toPersianDigits(provider.averageSatisfaction.toFixed(1))}/۵
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        {provider.isSponsored && (
          <section className="bg-sky-50 border-sky-200 rounded-xl border p-3">
            <p className="text-sky-800 text-xs">
              این ارائه‌دهنده با برچسب «اسپانسر» حمایت مالی شده است. محتوای
              حرفه‌ای پلتفرم مستقل از این حمایت منتشر می‌شود.
            </p>
          </section>
        )}

        <section className="border-border bg-card shadow-card rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-bold">درباره ارائه‌دهنده</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            {provider.description}
          </p>
          {provider.website && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">وب‌سایت: </span>
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 hover:text-brand-800 break-all"
                dir="ltr"
              >
                {provider.website}
              </a>
            </p>
          )}
          {provider.contactNote && (
            <p className="text-muted-foreground mt-2 text-sm">
              {provider.contactNote}
            </p>
          )}
        </section>

        <section className="border-border bg-card shadow-card rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-bold">شرایط استفاده</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-7">
            {provider.terms}
          </p>
        </section>

        <ProviderActions
          providerId={provider.id}
          myUsage={provider.myUsage}
          satisfactionLabels={BENEFIT_SATISFACTION_LABELS}
        />
      </div>
    </AppShell>
  );
}