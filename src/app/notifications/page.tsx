import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageHeader
          title="اعلان‌ها"
          description="پاسخ‌ها، ارجاع‌ها، پذیرش در حلقه و رویدادهای مرتبط با فعالیت شما."
          icon="bell"
          actions={
            <Link href="/notifications/settings">
              <Button variant="outline">تنظیمات اعلان</Button>
            </Link>
          }
        />
        <NotificationList />
      </div>
    </AppShell>
  );
}