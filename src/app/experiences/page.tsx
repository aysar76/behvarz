import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageHeader
          title="بانک تجربه‌های میدانی"
          description="تجربه‌های واقعی بهورزان را بخوانید، اجرا کنید و نتیجه را ثبت کنید تا به دانش قابل استفاده جامعه تبدیل شود."
          icon="book"
          actions={
            <Link href="/experiences/new">
              <Button>ثبت تجربه میدانی</Button>
            </Link>
          }
        />

        <ExperienceList />
      </div>
    </AppShell>
  );
}