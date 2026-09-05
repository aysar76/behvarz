import { DecisionsHistory } from "@/components/admin/decisions-history";

export const metadata = {
  title: "تاریخچه تصمیم‌ها",
};

export default function AdminDecisionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          تاریخچه تصمیم ناظر
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          تمام اقدامات نظارتی (اخطار، محدودسازی، تعلیق، مخفی‌سازی، حذف و بازیابی)
          برای شفافیت و امکان بازگشت ثبت می‌شوند.
        </p>
      </header>
      <DecisionsHistory />
    </div>
  );
}