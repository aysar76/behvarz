import { AdminAppealsQueue } from "@/components/admin/admin-appeals-queue";

export const metadata = {
  title: "اعتراض‌ها",
};

export default function AdminAppealsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">اعتراض‌ها</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          بررسی اعتراض کاربران به تصمیم‌های نظارتی. در صورت پذیرش، محتوا بازیابی
          یا محدودیت حساب برداشته می‌شود.
        </p>
      </header>
      <AdminAppealsQueue />
    </div>
  );
}