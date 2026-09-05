import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
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
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold">
              کشف دانش
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              پیشنهادهای مرتبط با علایق شما، مسائل بی‌پاسخ، تجربه‌های برگزیده و
              حلقه‌ها — بدون معیار محبوبیت.
            </p>
          </div>
          <Link href="/search">
            <Button size="sm" variant="outline">
              جست‌وجو
            </Button>
          </Link>
        </header>
        <DiscoveryFeed />
      </div>
    </AppShell>
  );
}