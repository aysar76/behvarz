import { MembershipQueue } from "@/components/auth/membership-queue";

export const metadata = {
  title: "مدیریت عضویت‌ها",
};

export default function AdminMembershipsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          درخواست‌های تأیید عضویت
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          بررسی و تأیید اعضای حرفه‌ای جامعه. این تأیید توسط مدیران انجام می‌شود
          و معیار رسمی نیست.
        </p>
      </header>
      <MembershipQueue />
    </div>
  );
}
