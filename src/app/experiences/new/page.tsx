import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ExperienceForm } from "@/components/experiences/experience-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = {
  title: "ثبت تجربه میدانی",
};

export default async function NewExperiencePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            ثبت تجربه میدانی
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            تجربه‌ای که در میدان به نتیجه رسیده را ساختاریافته بنویسید تا
            همکارانتان بتوانند آن را اجرا کنند. بدون اطلاعات قابل شناسایی
            بیمار.
          </p>
        </header>

        <section className="border-border bg-card shadow-card rounded-xl border p-5">
          <ExperienceForm mode="create" />
        </section>
      </div>
    </AppShell>
  );
}