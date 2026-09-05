import { AdminUsersManager } from "@/components/admin/admin-users-manager";

export const metadata = {
  title: "مدیریت کاربران",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">کاربران</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          مدیریت وضعیت حساب کاربران: اخطار، محدودسازی، تعلیق و رفع محدودیت. همه
          اقدامات ثبت و قابل بازگشت است.
        </p>
      </header>
      <AdminUsersManager />
    </div>
  );
}