import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGrowthDashboard } from "@/lib/growth";
import { formatRelativeTime } from "@/lib/dates";

export const metadata = {
  title: "داشبورد رشد من",
};

const badgeToneClass: Record<
  string,
  { bg: string; text: string }
> = {
  brand: { bg: "bg-brand-100", text: "text-brand-800" },
  success: { bg: "bg-green-100", text: "text-green-800" },
  info: { bg: "bg-sky-100", text: "text-sky-800" },
  warning: { bg: "bg-amber-100", text: "text-amber-800" },
  neutral: { bg: "bg-muted", text: "text-muted-foreground" },
};

export default async function GrowthPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const dashboard = await getGrowthDashboard(user.id);

  const statItems: Array<{ key: string; label: string }> = [
    { key: "publishedExperiences", label: "تجربه منتشرشده" },
    { key: "solvedProblems", label: "مسئله حل‌شده" },
    { key: "helpfulAnswers", label: "پاسخ مفید" },
    { key: "activeCircles", label: "حلقه فعال" },
    { key: "successfulReusesByOthers", label: "اجرای موفق توسط دیگران" },
    { key: "thanksReceived", label: "تشکر حرفه‌ای" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="داشبورد رشد من"
          description="تصویر مشارکت واقعی تو در جامعه هم‌بهورز — بر اساس رویدادهای واقعی، بدون رقابت ناسالم."
          icon="chart"
        />

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statItems.map((item) => (
            <div
              key={item.key}
              className="border-border bg-card shadow-card rounded-xl border p-3 text-center"
            >
              <div className="text-foreground text-2xl font-extrabold">
                {dashboard.stats[item.key as keyof typeof dashboard.stats]}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                {item.label}
              </div>
            </div>
          ))}
        </section>

        {dashboard.nextStep && (
          <section className="border-brand-200 bg-brand-50/60 border-brand-300 rounded-xl border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-brand-800 text-xs font-bold">
                  قدم بعدی پیشنهادی
                </p>
                <h2 className="text-foreground mt-1 text-lg font-extrabold">
                  {dashboard.nextStep.title}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {dashboard.nextStep.description}
                </p>
              </div>
              <Link href={dashboard.nextStep.href}>
                <Button>شروع</Button>
              </Link>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            نشان‌های مشارکت
          </h2>
          {dashboard.badges.length === 0 ? (
            <EmptyState
              icon={<Icon name="star" className="size-6" />}
              title="هنوز نشانی ندارید"
              description="با ثبت تجربه، حل مسئله، پاسخ مفید و عضویت در حلقه، نشان‌ها به‌دست می‌آیند."
              action={
                <Link href="/experiences/new">
                  <Button>ثبت نخستین تجربه</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {dashboard.badges.map((badge) => {
                const tone =
                  badgeToneClass[badge.tone] ?? badgeToneClass.neutral;
                return (
                  <div
                    key={badge.id}
                    className={`${tone.bg} ${tone.text} rounded-lg px-3 py-2`}
                    title={badge.description}
                  >
                    <p className="text-sm font-bold">{badge.label}</p>
                    <p className="mt-0.5 max-w-[220px] text-xs opacity-80">
                      {badge.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            ادامه فعالیت‌های نیمه‌تمام
          </h2>
          {dashboard.unfinished.length === 0 ? (
            <EmptyState
              title="پیش‌نویسی در انتظار نیست"
              description="پیش‌نویس‌های مسئله و تجربه شما اینجا نمایش داده می‌شوند."
            />
          ) : (
            <div className="space-y-2">
              {dashboard.unfinished.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="border-border bg-card shadow-card flex items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div>
                    <p className="text-foreground text-sm font-bold">
                      {item.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {item.kind === "draft_problem"
                        ? "پیش‌نویس مسئله"
                        : "پیش‌نویس تجربه"}
                      {" • "}
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={
                      item.kind === "draft_problem"
                        ? `/problems/${item.id}`
                        : `/experiences/${item.id}`
                    }
                    className="text-brand-700 hover:text-brand-800 shrink-0 text-sm font-medium"
                  >
                    ادامه
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border-border bg-card shadow-card rounded-xl border p-5">
          <h2 className="text-foreground text-lg font-bold">مدرک رسمی؟</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            این داشبورد نشان‌های «مشارکت حرفه‌ای» را نمایش می‌دهد و هیچ ادعای
            رسمی ندارد. مدرک‌های رسمی وزارت بهداشت از این پلتفرم صادر نمی‌شوند.
          </p>
        </section>
      </div>
    </AppShell>
  );
}