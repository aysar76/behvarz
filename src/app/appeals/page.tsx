import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/shell/app-shell";
import { AppealsManager } from "@/components/auth/appeals-manager";

export const metadata = {
  title: "اعتراض به تصمیم",
};

export default async function AppealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            اعتراض به تصمیم
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            اگر تصمیم ناظر درباره محتوای شما یا وضعیت حساب شما نادرست به نظر
            می‌رسد، اینجا اعتراض خود را ثبت کنید.
          </p>
        </header>
        <AppealsManager />
      </div>
    </AppShell>
  );
}