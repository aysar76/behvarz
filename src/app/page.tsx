import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { siteConfig } from "@/config/site";

const pillars = [
  {
    title: "اتاق مسئله",
    description:
      "مسئله واقعی خود را با ساختار مشخص مطرح کنید و از تجربه ۵۵ هزار نفر به راهکار برسید.",
  },
  {
    title: "بانک تجربه",
    description:
      "تجربه‌های میدانی به دانش قابل جست‌وجو تبدیل می‌شود؛ نتیجه را ثبت کنید و به دیگران برسانید.",
  },
  {
    title: "حلقه‌های همیار",
    description:
      "در گروه‌های کوچک و هدفمند، همکاران با تجربه مشابه را پیدا کنید و با هم مسئله را حل کنید.",
  },
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
      <section className="flex flex-col items-center gap-6 py-10 text-center md:py-16">
        <Badge tone="brand">شبکه حرفه‌ای، یادگیری و هم‌افزایی بهورزان</Badge>
        <h1 className="text-foreground max-w-2xl text-3xl leading-relaxed font-extrabold md:text-4xl">
          سیب محل کار است؛
          <br />
          <span className="text-primary">{siteConfig.name}</span> خانه حرفه‌ای
          است.
        </h1>
        <p className="text-muted-foreground max-w-xl text-base md:text-lg">
          {siteConfig.description}. در این خانه، مسئله را کشف می‌کنیم، با هم حل
          می‌کنیم و تجربه میدانی را به دانش ملی قابل استفاده تبدیل می‌کنیم —
          بدون بار اضافه اداری.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link href={ctaHref}>
            <Button size="lg">{ctaLabel}</Button>
          </Link>
          <Link href="/problems/new">
            <Button size="lg" variant="outline">
              پرسش در اتاق مسئله
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 py-6 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="border-border bg-card shadow-card rounded-xl border p-5"
          >
            <h2 className="text-foreground mb-2 text-base font-bold">
              {pillar.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-6">
              {pillar.description}
            </p>
          </article>
        ))}
      </section>

      <section className="py-6">
        <div className="bg-accent rounded-xl p-6 md:p-8">
          <h2 className="text-accent-foreground mb-2 text-lg font-bold">
            قرارداد معنوی خانه
          </h2>
          <p className="text-accent-foreground/80 max-w-2xl text-sm leading-7">
            هر قابلیت باید بار کار را کم کند، نیاز را زیاد کند یا اثر را قابل
            مشاهده کند. اینجا هیچ خبری از فرم‌های اداری اضافه، رتبه‌بندی تنبیهی
            یا اطلاعات بیمار نیست؛ فقط دانش، اعتبار و تعلق.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
