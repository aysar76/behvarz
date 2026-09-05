import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { getCurrentUser } from "@/lib/auth/current-user";
import { siteConfig } from "@/config/site";

const pillars: { title: string; description: string; icon: IconName }[] = [
  {
    title: "اتاق مسئله",
    description:
      "مسئله واقعی خود را با ساختار مشخص مطرح کنید و از تجربه ۵۵ هزار نفر به راهکار برسید.",
    icon: "question",
  },
  {
    title: "بانک تجربه",
    description:
      "تجربه‌های میدانی به دانش قابل جست‌وجو تبدیل می‌شود؛ نتیجه را ثبت کنید و به دیگران برسانید.",
    icon: "book",
  },
  {
    title: "حلقه‌های همیار",
    description:
      "در گروه‌های کوچک و هدفمند، همکاران با تجربه مشابه را پیدا کنید و با هم مسئله را حل کنید.",
    icon: "users",
  },
];

const steps: { title: string; description: string; icon: IconName }[] = [
  {
    title: "یاد می‌گیری",
    description: "با مسیرهای کوتاه آکادمی و تجربه‌های همکاران، راهکار واقعی را می‌شناسی.",
    icon: "graduation",
  },
  {
    title: "اقدام می‌کنی",
    description: "راهکار را در میدان به کار می‌بری و نتیجه را همین‌جا ثبت می‌کنی.",
    icon: "wrench",
  },
  {
    title: "اثر را می‌بینی",
    description: "اجرا و نتیجه‌ات برای جامعه دیده می‌شود و اعتبار حرفه‌ای می‌سازی.",
    icon: "eye",
  },
  {
    title: "به اشتراک می‌گذاری",
    description: "تجربه‌ی تو به دانش قابل استفاده‌ی ۵۵ هزار نفر تبدیل می‌شود.",
    icon: "handshake",
  },
];

const stats: { value: string; label: string }[] = [
  { value: "۵۵,۰۰۰", label: "بهورز و مراقب سلامت" },
  { value: "۵", label: "محرک انگیزش حرفه‌ای" },
  { value: "۶", label: "خانواده بازی شبکه‌ای" },
  { value: "۱", label: "خانه حرفه‌ای مشترک" },
];

export default async function Home() {
  const user = await getCurrentUser();
  const ctaHref = user
    ? user.onboardingCompleted
      ? "/me"
      : "/onboarding"
    : "/auth";
  const ctaLabel = user
    ? user.onboardingCompleted
      ? "پروفایل من"
      : "تکمیل پروفایل"
    : "ثبت‌نام در جامعه";

  return (
    <AppShell>
      <section className="relative overflow-hidden py-12 md:py-20">
        <div
          aria-hidden="true"
          className="from-brand-100/60 via-brand-50/30 absolute inset-x-0 -top-24 -z-10 h-72 bg-gradient-to-b to-transparent"
        />
        <div
          aria-hidden="true"
          className="bg-brand-100/50 absolute -start-24 top-10 -z-10 size-64 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-brand-200/40 absolute -end-24 bottom-0 -z-10 size-72 rounded-full blur-3xl"
        />

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <Badge tone="brand" className="gap-1.5 px-3.5 py-1">
            <Icon name="leaf" className="size-3.5" />
            شبکه حرفه‌ای، یادگیری و هم‌افزایی بهورزان
          </Badge>

          <h1 className="text-foreground text-3xl leading-[1.5] font-extrabold tracking-tight md:text-5xl md:leading-[1.4]">
            <span className="from-brand-600 to-brand-400 bg-gradient-to-l bg-clip-text text-transparent">
              {siteConfig.name}
            </span>{" "}
            خانه حرفه‌ای بهورزان
          </h1>

          <p className="text-muted-foreground max-w-xl text-base leading-7 md:text-lg">
            {siteConfig.description}. در این خانه، مسئله را کشف می‌کنیم، با هم حل
            می‌کنیم و تجربه میدانی را به دانش ملی قابل استفاده تبدیل می‌کنیم —
            بدون بار اضافه اداری.
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href={ctaHref}>
              <Button size="lg" className="shadow-glow-brand">
                {ctaLabel}
              </Button>
            </Link>
            <Link href="/problems/new">
              <Button size="lg" variant="outline">
                پرسش در اتاق مسئله
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-border bg-card shadow-card grid grid-cols-2 divide-x overflow-hidden rounded-2xl border sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-5 text-center">
            <div className="text-brand-700 text-2xl font-extrabold md:text-3xl">
              {stat.value}
            </div>
            <div className="text-muted-foreground mt-1 text-xs md:text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <section className="py-10">
        <h2 className="text-foreground mb-2 text-center text-xl font-extrabold md:text-2xl">
          سه قلمرو اصلی خانه
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          هر قابلیت باید بار کار را کم کند، نیاز را زیاد کند یا اثر را قابل مشاهده کند.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 group rounded-2xl border p-6 transition-all duration-200"
            >
              <span
                aria-hidden="true"
                className="from-brand-50 to-brand-100/70 bg-gradient-to-br border-brand-100 text-brand-700 mb-4 flex size-12 items-center justify-center rounded-xl border shadow-sm transition-transform duration-200 group-hover:scale-105"
              >
                <Icon name={pillar.icon} className="size-6" />
              </span>
              <h3 className="text-foreground mb-2 text-base font-bold">
                {pillar.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-7">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-6">
        <div className="from-brand-600 to-brand-500 bg-gradient-to-br rounded-2xl p-6 shadow-md md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge tone="neutral" className="bg-white/15 text-white border-white/20">
                حلقه بسته دانش
              </Badge>
              <h2 className="text-primary-foreground mt-3 text-xl font-extrabold md:text-2xl">
                قرارداد معنوی خانه
              </h2>
              <p className="text-primary-foreground/85 mt-2 max-w-2xl text-sm leading-7">
                هر قابلیت باید بار کار را کم کند، نیاز را زیاد کند یا اثر را قابل
                مشاهده کند. اینجا هیچ خبری از فرم‌های اداری اضافه، رتبه‌بندی تنبیهی
                یا اطلاعات بیمار نیست؛ فقط دانش، اعتبار و تعلق.
              </p>
            </div>
            <div className="from-brand-950/30 to-transparent hidden shrink-0 rounded-xl bg-gradient-to-b p-5 md:block">
              <Icon name="handshake" className="size-16 text-white/80" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-foreground mb-2 text-center text-xl font-extrabold md:text-2xl">
          چرخه رشد در هم‌بهورز
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          از یادگیری تا دیده‌شدن؛ هر مشارکت به نتیجه‌ی بعدی وصل است.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <article className="border-border bg-card shadow-card hover:shadow-md h-full rounded-2xl border p-5 transition-all duration-200">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="bg-brand-50 text-brand-700 border-brand-100 flex size-10 items-center justify-center rounded-xl border"
                  >
                    <Icon name={step.icon} className="size-5" />
                  </span>
                  <span className="text-muted-foreground/70 text-sm font-bold">
                    گام {index + 1}
                  </span>
                </div>
                <h3 className="text-foreground mb-1.5 text-sm font-bold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-6">
                  {step.description}
                </p>
              </article>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}