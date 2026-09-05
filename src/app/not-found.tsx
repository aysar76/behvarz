import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppShell>
      <div className="py-16">
        <EmptyState
          icon={<span aria-hidden="true">۴۰۴</span>}
          title="صفحه پیدا نشد"
          description="نشانی موردنظر وجود ندارد یا منتقل شده است. به خانه برگردید و از بخش‌های اصلی ادامه دهید."
          action={
            <Link href="/">
              <Button>بازگشت به خانه</Button>
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
