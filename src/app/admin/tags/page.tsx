import { AdminTagsManager } from "@/components/admin/admin-tags-manager";

export const metadata = {
  title: "برچسب‌ها",
};

export default function AdminTagsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">برچسب‌ها</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          مدیریت برچسب‌های موضوعی: ایجاد برچسب جدید و فعال/غیرفعال‌کردن برچسب‌های
          موجود.
        </p>
      </header>
      <AdminTagsManager />
    </div>
  );
}