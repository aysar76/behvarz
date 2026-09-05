import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { CircleForm } from "@/components/circles/circle-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = {
  title: "ایجاد حلقه همیار",
};

export default async function NewCirclePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            ایجاد حلقه همیار
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            یک گروه کوچک ۵ تا ۱۲ نفره برای یادگیری و حل مسئله با همکاران
            هم‌حرفه بسازید؛ شما راهبر حلقه خواهید بود.
          </p>
        </header>
        <div className="border-border bg-card shadow-card rounded-xl border p-5">
          <CircleForm />
        </div>
      </div>
    </AppShell>
  );
}