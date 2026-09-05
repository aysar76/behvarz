import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata = {
  title: "کمپین جدید",
};

export default function AdminCampaignNewPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          کمپین جدید
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          کمپین شبکه‌ای را ثبت کنید. با وضعیت «فعال» برای اعضا قابل مشاهده می‌شود.
        </p>
      </header>
      <CampaignForm />
    </div>
  );
}