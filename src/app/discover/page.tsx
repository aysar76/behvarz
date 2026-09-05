import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DiscoveryFeed } from "@/components/discovery/discovery-feed";

export const metadata = {
  title: "کشف دانش",
};

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="کشف دانش"
          description="پیشنهادهای مرتبط با علایق شما، مسائل بی‌پاسخ، تجربه‌های برگزیده و حلقه‌ها — بدون معیار محبوبیت."
          icon="compass"
          actions={
            <Link href="/search">
              <Button variant="outline">جست‌وجو</Button>
            </Link>
          }
        />
        <DiscoveryFeed />
      </div>
    </AppShell>
  );
}