import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { serializeUser } from "@/lib/serializers";
import { ROLE_LABELS } from "@/lib/rbac";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
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
        <header className="border-border bg-card shadow-card rounded-xl border p-5">
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
          <dl className="text-muted-foreground mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <div className="flex gap-1">
              <dt>شماره:</dt>
              <dd dir="ltr">{profile.phone}</dd>
            </div>
            {location && (
              <div className="flex gap-1">
                <dt>محل خدمت:</dt>
                <dd>{location}</dd>
              </div>
            )}
          </dl>
          {profile.bio && (
            <p className="text-foreground mt-3 text-sm leading-6">
              {profile.bio}
            </p>
          )}
          {profile.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.skills.map((item) => (
                <Badge key={item.skill.id} tone="neutral">
                  {item.skill.name}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <VerificationRequest user={serialized} />

        <section className="border-border bg-card shadow-card rounded-xl border p-5">
          <h2 className="text-foreground mb-4 text-lg font-bold">
            ویرایش پروفایل
          </h2>
          <ProfileForm user={serialized} />
        </section>
      </div>
    </AppShell>
  );
}
