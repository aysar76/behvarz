import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { serializeUser } from "@/lib/serializers";
import { ROLE_LABELS } from "@/lib/rbac";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProfileForm } from "@/components/auth/profile-form";
import { VerificationRequest } from "@/components/auth/verification-request";

export const metadata = {
  title: "پروفایل من",
};

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
  });
  if (!profile) redirect("/auth");

  const serialized = serializeUser(profile);
  const location = [profile.province, profile.city].filter(Boolean).join("، ");

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="border-border bg-card shadow-card relative overflow-hidden rounded-2xl border p-5">
          <div
            aria-hidden="true"
            className="from-brand-100/70 to-brand-50/30 absolute inset-x-0 top-0 -z-0 h-20 bg-gradient-to-b to-transparent"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="bg-gradient-to-br from-brand-600 to-brand-400 text-primary-foreground shadow-md flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold"
              >
                {(profile.displayName ?? "کاربر").charAt(0)}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-foreground text-2xl font-extrabold">
                    {profile.displayName ?? "کاربر"}
                  </h1>
                  <Badge tone="brand">{ROLE_LABELS[profile.role]}</Badge>
                  {profile.membershipStatus === "verified" && (
                    <Badge tone="success">عضو تأییدشده</Badge>
                  )}
                  {profile.membershipStatus === "pending" && (
                    <Badge tone="warning">در انتظار تأیید</Badge>
                  )}
                </div>
                <dl className="text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <div className="inline-flex items-center gap-1.5">
                    <Icon name="phone" className="size-4" />
                    <dt className="sr-only">شماره:</dt>
                    <dd dir="ltr">{profile.phone}</dd>
                  </div>
                  {location && (
                    <div className="inline-flex items-center gap-1.5">
                      <Icon name="map-pin" className="size-4" />
                      <dt className="sr-only">محل خدمت:</dt>
                      <dd>{location}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
          {profile.bio && (
            <p className="text-foreground relative mt-4 text-sm leading-7">
              {profile.bio}
            </p>
          )}
          {profile.skills.length > 0 && (
            <div className="relative mt-3 flex flex-wrap gap-1.5">
              {profile.skills.map((item) => (
                <Badge key={item.skill.id} tone="neutral">
                  {item.skill.name}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <VerificationRequest user={serialized} />

        <section className="border-border bg-card shadow-card hover:shadow-md flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 transition-all duration-200">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="from-brand-50 to-brand-100/70 bg-gradient-to-br border-brand-100 text-brand-700 flex size-11 items-center justify-center rounded-xl border"
            >
              <Icon name="chart" className="size-5" />
            </span>
            <div>
              <h2 className="text-foreground text-lg font-bold">
                داشبورد رشد من
              </h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                تصویر مشارکت واقعی، نشان‌ها و قدم بعدی پیشنهادی خود را ببینید.
              </p>
            </div>
          </div>
          <Link href="/growth">
            <Button variant="outline">مشاهده داشبورد رشد</Button>
          </Link>
        </section>

        <section className="border-border bg-card shadow-card rounded-2xl border p-5">
          <h2 className="text-foreground mb-4 text-lg font-bold">
            ویرایش پروفایل
          </h2>
          <ProfileForm user={serialized} />
        </section>
      </div>
    </AppShell>
  );
}
