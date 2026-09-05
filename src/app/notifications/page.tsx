import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata = {
  title: "اعلان‌ها",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold">اعلان‌ها</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              پاسخ‌ها، ارجاع‌ها، پذیرش در حلقه و رویدادهای مرتبط با فعالیت شما.
            </p>
          </div>
          <Link href="/notifications/settings">
            <Button size="sm" variant="outline">
              تنظیمات اعلان
            </Button>
          </Link>
        </header>
        <NotificationList />
      </div>
    </AppShell>
  );
}