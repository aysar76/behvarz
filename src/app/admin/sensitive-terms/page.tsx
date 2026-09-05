import { SensitiveTermsManager } from "@/components/admin/sensitive-terms-manager";

export const metadata = {
  title: "واژه‌های حساس",
};

export default function AdminSensitiveTermsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          واژه‌های حساس
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          مدیریت واژه‌ها و الگوهای حساس که هنگام انتشار محتوا بررسی می‌شوند.
        </p>
      </header>
      <SensitiveTermsManager />
    </div>
  );
}