import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageHeader
          title="جست‌وجو"
          description="مسائل، تجربه‌ها، حلقه‌ها و اعضا را جست‌وجو کنید."
          icon="search"
        />
        <SearchExplorer />
      </div>
    </AppShell>
  );
}