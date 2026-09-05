import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SavedList } from "@/components/saved/saved-list";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = {
  title: "خواندنی‌های من",
};

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="خواندنی‌های من"
          description="مسائل و تجربه‌هایی که برای مطالعه بعدی ذخیره کرده‌اید."
          icon="bookmark"
        />
        <SavedList />
      </div>
    </AppShell>
  );
}