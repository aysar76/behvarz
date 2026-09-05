import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { NotificationSettings } from "@/components/notifications/notification-settings";

export const metadata = {
  title: "تنظیمات اعلان",
};

export default async function NotificationSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            تنظیمات اعلان
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            انتخاب کنید کدام رویدادها برای شما اعلان شوند.
          </p>
        </header>
        <NotificationSettings />
      </div>
    </AppShell>
  );
}