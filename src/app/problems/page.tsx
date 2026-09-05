import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ProblemList } from "@/components/problems/problem-list";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = {
  title: "اتاق مسئله",
};

export default async function ProblemsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="اتاق مسئله"
          description="مسئله واقعی خود را با ساختار مشخص مطرح کنید و از تجربه ۵۵ هزار نفر به راهکار برسید."
          icon="question"
          actions={
            <Link href="/problems/new">
              <Button>
                مطرح‌کردن مسئله
              </Button>
            </Link>
          }
        />

        <ProblemList />
      </div>
    </AppShell>
  );
}
