import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getCommandCenterReport } from "@/lib/command-center";
import { toPersianDigits } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "مرکز فرماندهی",
};

const alertLevelClass: Record<string, string> = {
  critical: "border-red-300 bg-red-50",
  warning: "border-amber-300 bg-amber-50",
  info: "border-sky-300 bg-sky-50",
};

const trendToneClass: Record<string, string> = {
  positive: "text-green-700",
  negative: "text-red-700",
  neutral: "text-muted-foreground",
};

export default async function CommandCenterPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    assertPermission(user, "command-center:view");
  } catch {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-muted-foreground text-sm">
          این بخش فقط برای تیم عامل و شورای جامعه است.
        </p>
      </main>
    );
  }

  const report = await getCommandCenterReport();

  const overviewItems: Array<{ label: string; value: number; href?: string }> = [
    { label: "اعضای فعال", value: report.overview.members, href: "/admin/users" },
    { label: "عضو تأییدشده", value: report.overview.verifiedMembers },
    { label: "کمپین فعال", value: report.overview.activeCampaigns, href: "/admin/campaigns" },
    { label: "مسئله باز", value: report.overview.openProblems, href: "/problems" },
    { label: "مسئله حل‌شده", value: report.overview.solvedProblems },
    { label: "تجربه منتشرشده", value: report.overview.publishedExperiences },
    { label: "اجرای مجدد", value: report.overview.experienceReuses },
    { label: "حلقه فعال", value: report.overview.activeCircles, href: "/circles" },
    { label: "همکاری فعال", value: report.overview.activeCooperations },
    { label: "گزارش در انتظار", value: report.overview.totalReportsPending, href: "/admin/moderation" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-extrabold">
            مرکز فرماندهی
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            تصویر زنده و تجمیعی وضعیت شبکه برای تیم عامل و شورا — برای
            هم‌افزایی و حمایت، نه نظارت تنبیهی.
          </p>
        </div>
        <Link href="/insights">
          <Button variant="outline" size="sm">
            نقشه موانع
          </Button>
        </Link>
      </header>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">نمای کلی</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {overviewItems.map((item) => (
            <div
              key={item.label}
              className="border-border bg-card shadow-card rounded-xl border p-3 text-center"
            >
              <div className="text-foreground text-2xl font-extrabold">
                {toPersianDigits(item.value)}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                {item.href ? (
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">هشدارها</h2>
        {report.alerts.length === 0 ? (
          <div className="border-border bg-card shadow-card rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">
              هیچ هشدار فعالی وجود ندارد.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {report.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 ${alertLevelClass[alert.level]}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-foreground text-sm font-bold">
                    {alert.title}
                  </h3>
                  <Badge tone={alert.level === "critical" ? "danger" : alert.level === "warning" ? "warning" : "info"}>
                    {toPersianDigits(alert.count)}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs leading-6">
                  {alert.description}
                </p>
                {alert.href && (
                  <Link
                    href={alert.href}
                    className="text-brand-700 hover:text-brand-800 mt-2 inline-block text-xs font-medium"
                  >
                    مشاهده و پیگیری ←
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">الگوها</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "نوع مانع", items: report.patterns.barrierTypes },
            { title: "وضعیت مسائل", items: report.patterns.problemStatuses },
            { title: "استان‌های با بیشترین عضو", items: report.patterns.topProvinces },
            { title: "برچسب‌های پرتکرار", items: report.patterns.topTags },
          ].map((section) => (
            <div key={section.title} className="border-border bg-card shadow-card rounded-xl border p-4">
              <h3 className="text-foreground text-sm font-bold">{section.title}</h3>
              <div className="mt-3 space-y-2">
                {section.items.length === 0 ? (
                  <p className="text-muted-foreground text-xs">داده‌ای نیست.</p>
                ) : (
                  section.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {toPersianDigits(item.count)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          روندهای هفتگی (جاری vs هفته قبل)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.trends.map((trend) => {
            const tone =
              trend.changePercent === null
                ? "neutral"
                : trend.changePercent >= 0
                  ? "positive"
                  : "negative";
            return (
              <div key={trend.label} className="border-border bg-card shadow-card rounded-xl border p-4">
                <p className="text-muted-foreground text-xs">{trend.label}</p>
                <p className="text-foreground mt-1 text-xl font-extrabold">
                  {toPersianDigits(trend.current)}
                  <span className="text-muted-foreground text-xs font-normal">
                    {" "}
                    / {toPersianDigits(trend.previous)}
                  </span>
                </p>
                <p className={`mt-1 text-xs font-bold ${trendToneClass[tone]}`}>
                  {trend.changePercent === null
                    ? "—"
                    : trend.changePercent >= 0
                      ? `▲ ${toPersianDigits(trend.changePercent)}٪`
                      : `▼ ${toPersianDigits(Math.abs(trend.changePercent))}٪`}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          پیشنهاد حمایت و Coaching
        </h2>
        {report.coaching.length === 0 ? (
          <div className="border-border bg-card shadow-card rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">
              پیشنهاد فعالی نیست.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {report.coaching.map((item) => (
              <div key={item.id} className="border-brand-200 bg-brand-50/60 border-brand-300 rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-brand-800 text-sm font-bold">{item.title}</h3>
                  <Badge tone="brand">{toPersianDigits(item.count)}</Badge>
                </div>
                <p className="text-brand-700/80 mt-1 text-xs leading-6">
                  {item.description}
                </p>
                {item.href && (
                  <Link
                    href={item.href}
                    className="text-brand-700 hover:text-brand-800 mt-2 inline-block text-xs font-medium"
                  >
                    مشاهده ←
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-muted-foreground text-xs">
        آخرین به‌روزرسانی: {toPersianDigits(report.generatedAt.slice(0, 16).replace("T", " "))}
      </p>
    </div>
  );
}