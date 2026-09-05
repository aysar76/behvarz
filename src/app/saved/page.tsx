import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
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
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            خواندنی‌های من
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مسائل و تجربه‌هایی که برای مطالعه بعدی ذخیره کرده‌اید.
          </p>
        </header>
        <SavedList />
      </div>
    </AppShell>
  );
}