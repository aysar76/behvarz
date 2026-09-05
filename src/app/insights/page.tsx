import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBarrierMapReport, getDataContributionStatus } from "@/lib/insights";
import { DataContributionToggle } from "@/components/insights/data-contribution-toggle";
import { toPersianDigits } from "@/lib/dates";

export const metadata = {
  title: "نقشه موانع تجمیعی",
};

const BARRIER_COLORS: Record<string, string> = {
  resources: "bg-brand-600",
  knowledge: "bg-sky-600",
  process: "bg-amber-500",
  community: "bg-green-600",
  equipment: "bg-purple-600",
  other: "bg-muted-foreground",
};

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const [report, allowDataContribution] = await Promise.all([
    getBarrierMapReport(),
    getDataContributionStatus(user.id),
  ]);

  const maxTotal =
    report.totals.length > 0
      ? Math.max(...report.totals.map((item) => item.count))
      : 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            نقشه موانع تجمیعی
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            تصویر تجمیعی و کاملاً ناشناس از نوع موانعی که بهورزان در میدان با آن
            روبه‌رو هستند — دارایی دانشی جامعه، با رضایت و حکمرانی داده.
          </p>
        </header>

        <section className="border-brand-200 bg-brand-50/60 border-brand-300 rounded-xl border p-4">
          <h2 className="text-brand-800 text-sm font-bold">
            مشارکت داده‌ها (اختیاری و قابل برگشت)
          </h2>
          <p className="text-brand-700/80 mt-1 text-xs leading-6">
            این نقشه فقط از مسائل کاربرانی ساخته می‌شود که رضایت صریح داده‌اند.
            شماره، نام، استان دقیق و هیچ داده بیمار شامل نمی‌شود؛ فقط شمارش تجمیعی
            «نوع مانع» از مسائل منتشرشده. هر زمان می‌توانید رضایت را بردارید.
          </p>
          <div className="mt-3">
            <DataContributionToggle
              allowDataContribution={allowDataContribution}
            />
          </div>
        </section>

        <section className="border-border bg-card shadow-card rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-foreground text-lg font-bold">موانع اصلی</h2>
            <div className="text-muted-foreground text-xs">
              {toPersianDigits(report.contributors)} مشارکت‌کننده •{" "}
              {toPersianDigits(report.problemsContributed)} مسئله
            </div>
          </div>

          {report.totals.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="داده کافی برای نقشه نیست"
                description="با فعال‌کردن رضایت مشارکت و ثبت مسائل میدانی، نقشه پر می‌شود."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {report.totals
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div key={item.barrierType}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {toPersianDigits(item.count)}
                      </span>
                    </div>
                    <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                      <div
                        className={`${BARRIER_COLORS[item.barrierType] ?? "bg-muted-foreground"} h-full rounded-full`}
                        style={{
                          width: `${maxTotal > 0 ? (item.count / maxTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {report.byProvince.length > 0 && (
          <section className="border-border bg-card shadow-card rounded-xl border p-5">
            <h2 className="text-foreground text-lg font-bold">
              موانع به تفکیک استان (تجمیعی)
            </h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium">استان</th>
                    {report.totals.map((item) => (
                      <th
                        key={item.barrierType}
                        className="px-3 py-3 text-right font-medium"
                      >
                        {item.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-medium">جمع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.byProvince.map((row) => (
                    <tr key={row.province} className="hover:bg-accent/50">
                      <td className="text-foreground px-4 py-3 font-medium">
                        {row.province}
                      </td>
                      {report.totals.map((item) => (
                        <td
                          key={item.barrierType}
                          className="text-muted-foreground px-3 py-3"
                        >
                          {toPersianDigits(row.counts[item.barrierType] ?? 0)}
                        </td>
                      ))}
                      <td className="text-foreground px-4 py-3 font-semibold">
                        {toPersianDigits(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="bg-muted/40 border-border rounded-xl border border-dashed p-4">
          <h2 className="text-foreground text-sm font-bold">حکمرانی داده</h2>
          <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-xs">
            <li>فقط شمارش تجمیعی؛ بدون فروش یا افشای داده شخصی.</li>
            <li>رضایت صریح و قابل برگشت؛ بدون «موافقت ضمنی».</li>
            <li>مشابه سایر محتوا، اطلاعات هویتی بیمار در هیچ حالتی ثبت نمی‌شود.</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">منبع: مسائل منتشرشده با رضایت</Badge>
          <Badge tone="neutral">به‌روزرسانی: لحظه‌ای از رویدادهای واقعی</Badge>
        </div>
      </div>
    </AppShell>
  );
}