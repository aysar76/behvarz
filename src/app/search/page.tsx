import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SearchExplorer } from "@/components/search/search-explorer";

export const metadata = {
  title: "جست‌وجو",
};

export default async function SearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">جست‌وجو</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مسائل، تجربه‌ها، حلقه‌ها و اعضا را جست‌وجو کنید.
          </p>
        </header>
        <SearchExplorer />
      </div>
    </AppShell>
  );
}