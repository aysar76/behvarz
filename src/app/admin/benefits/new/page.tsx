import { BenefitProviderForm } from "@/components/admin/benefit-provider-form";

export const metadata = {
  title: "ارائه‌دهنده جدید",
};

export default function AdminBenefitProviderNewPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          ارائه‌دهنده جدید
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ارائه‌دهنده مزیت را ثبت کنید. پس از تأیید، برای اعضا قابل مشاهده می‌شود.
        </p>
      </header>
      <BenefitProviderForm />
    </div>
  );
}