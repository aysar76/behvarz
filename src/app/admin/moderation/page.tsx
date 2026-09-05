import { ModerationQueue } from "@/components/admin/moderation-queue";

export const metadata = {
  title: "مدیریت محتوا",
};

export default function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          مدیریت محتوا و ایمنی
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          بررسی مسائل نیازمند بررسی و رسیدگی به گزارش‌های کاربران. همه اقدامات
          ثبت و قابل بازگشت است.
        </p>
      </header>
      <ModerationQueue />
    </div>
  );
}
