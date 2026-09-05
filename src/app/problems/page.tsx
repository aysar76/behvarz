import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
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
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold">
              اتاق مسئله
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              مسئله واقعی خود را با ساختار مشخص مطرح کنید و از تجربه ۵۵ هزار نفر
              به راهکار برسید.
            </p>
          </div>
          <Link href="/problems/new">
            <Button>مطرح‌کردن مسئله</Button>
          </Link>
        </header>

        <ProblemList />
      </div>
    </AppShell>
  );
}
