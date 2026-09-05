import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ProblemForm } from "@/components/problems/problem-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = {
  title: "مطرح‌کردن مسئله",
};

export default async function NewProblemPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            مطرح‌کردن مسئله
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مسئله را ساختاریافته بنویسید تا همکارانتان راحت‌تر به شما کمک کنند.
            بدون اطلاعات قابل شناسایی بیمار.
          </p>
        </header>

        <section className="border-border bg-card shadow-card rounded-xl border p-5">
          <ProblemForm mode="create" />
        </section>
      </div>
    </AppShell>
  );
}
