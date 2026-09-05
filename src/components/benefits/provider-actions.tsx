"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { BENEFIT_REPORT_REASONS } from "@/lib/constants/benefits";
import { toPersianDigits } from "@/lib/dates";

interface MyUsage {
  id: string;
  satisfaction: number;
  createdAt: string;
}

export function ProviderActions({
  providerId,
  myUsage,
  satisfactionLabels,
}: {
  providerId: string;
  myUsage: MyUsage | null;
  satisfactionLabels: Record<number, string>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [usageOpen, setUsageOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [satisfaction, setSatisfaction] = useState(5);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("issue_service");
  const [reportNote, setReportNote] = useState("");

  async function handleRegisterUsage() {
    setLoading(true);
    try {
      const res = await fetch("/api/benefits/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, satisfaction, note: note || undefined }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت استفاده", tone: "danger" });
        return;
      }
      toast({ title: "استفاده ثبت شد. ممنون از بازخورد تو", tone: "success" });
      setUsageOpen(false);
      setNote("");
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  async function handleReport() {
    setLoading(true);
    try {
      const res = await fetch("/api/benefits/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          reason,
          note: reportNote || undefined,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت گزارش", tone: "danger" });
        return;
      }
      toast({ title: "گزارش ثبت شد و در صف بررسی قرار گرفت", tone: "success" });
      setReportOpen(false);
      setReportNote("");
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-border bg-card shadow-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <h2 className="text-foreground text-sm font-bold">
            {myUsage ? "استفاده قبلی" : "از این مزیت استفاده کردی؟"}
          </h2>
          {myUsage ? (
            <p className="text-muted-foreground mt-1 text-xs">
              امتیاز تو: {toPersianDigits(myUsage.satisfaction)} از ۵
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-xs">
              ثبت استفاده فقط شامل یک یادداشت غیرحساس و امتیاز رضایت است.
            </p>
          )}
        </div>
        <Button onClick={() => setUsageOpen(true)} variant={myUsage ? "outline" : "primary"}>
          {myUsage ? "ثبت استفاده جدید" : "ثبت استفاده"}
        </Button>
      </div>

      <div className="border-border bg-card shadow-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <h2 className="text-foreground text-sm font-bold">مشکل داری؟</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            اگر خدمتی مشکل داشت یا اطلاعات گمراه‌کننده بود، گزارش کن.
          </p>
        </div>
        <Button variant="outline" onClick={() => setReportOpen(true)}>
          گزارش مشکل
        </Button>
      </div>

      <Modal
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        title="ثبت استفاده از مزیت"
        description="بازخورد تو به انتخاب بهتر مزایا برای همه کمک می‌کند."
      >
        <div className="space-y-4">
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">
              امتیاز رضایت
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSatisfaction(value)}
                  aria-pressed={satisfaction === value}
                  className={
                    satisfaction === value
                      ? "bg-brand-600 text-primary-foreground rounded-md px-3 py-1.5 text-sm"
                      : "border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                  }
                >
                  {toPersianDigits(value)}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {satisfactionLabels[satisfaction]}
            </p>
          </div>
          <div>
            <label
              htmlFor="usage-note"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              یادداشت (اختیاری — بدون اطلاعات حساس)
            </label>
            <textarea
              id="usage-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={800}
              className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
              placeholder="مثلاً: خدمات به‌موقع ارائه شد."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUsageOpen(false)}>
              انصراف
            </Button>
            <Button onClick={() => void handleRegisterUsage()} loading={loading}>
              ثبت
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="گزارش مشکل از مزیت"
        description="گزارش بدون نام شما نزد مدیران بررسی می‌شود."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="report-reason"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              دلیل
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            >
              {BENEFIT_REPORT_REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="report-note"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              توضیح (اختیاری)
            </label>
            <textarea
              id="report-note"
              value={reportNote}
              onChange={(event) => setReportNote(event.target.value)}
              rows={3}
              maxLength={1000}
              className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
              placeholder="جزئیات مشکل..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={() => void handleReport()} loading={loading}>
              ثبت گزارش
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}