import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { ExperienceList } from "@/components/experiences/experience-list";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = {
  title: "بانک تجربه",
};

export default async function ExperiencesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold">
              بانک تجربه‌های میدانی
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              تجربه‌های واقعی بهورزان را بخوانید، اجرا کنید و نتیجه را ثبت
              کنید تا به دانش قابل استفاده جامعه تبدیل شود.
            </p>
          </div>
          <Link href="/experiences/new">
            <Button>ثبت تجربه میدانی</Button>
          </Link>
        </header>

        <ExperienceList />
      </div>
    </AppShell>
  );
}