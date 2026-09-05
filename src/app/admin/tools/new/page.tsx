import { ToolForm } from "@/components/admin/tool-form";

export const metadata = {
  title: "ابزار جدید",
};

export default function AdminToolNewPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          ابزار جدید
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ابزار اجرایی را ثبت کنید. با وضعیت «منتشرشده» برای اعضا قابل مشاهده می‌شود.
        </p>
      </header>
      <ToolForm />
    </div>
  );
}