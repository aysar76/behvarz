"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { BUDGET_PROPOSAL_CATEGORIES } from "@/lib/constants/benefits";

export function BudgetProposalForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("community");
  const [amountEstimate, setAmountEstimate] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/budget-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          amountEstimate: amountEstimate || undefined,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { proposal?: { id: string } };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت پیشنهاد", tone: "danger" });
        return;
      }
      toast({
        title: "پیشنهاد ثبت شد",
        description: "پس از بررسی صلاحیت توسط مدیران، وارد رأی‌گیری می‌شود.",
        tone: "success",
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      setAmountEstimate("");
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>پیشنهاد جدید</Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="پیشنهاد بودجه مشارکتی"
        description="پیشنهاد شما پس از بررسی صلاحیت، برای رأی‌گیری اعضا منتشر می‌شود."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="proposal-title"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              عنوان
            </label>
            <input
              id="proposal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={150}
              className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
              placeholder="مثلاً: آموزش کمک‌های اولیه برای بهورزان"
            />
          </div>
          <div>
            <label
              htmlFor="proposal-description"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              شرح پیشنهاد
            </label>
            <textarea
              id="proposal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={3000}
              className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
              placeholder="چرا این پیشنهاد مهم است؟ برای چه کسانی سود دارد؟"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="proposal-category"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                دسته‌بندی
              </label>
              <select
                id="proposal-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
              >
                {BUDGET_PROPOSAL_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="proposal-amount"
                className="text-foreground mb-1 block text-sm font-medium"
              >
                برآورد هزینه (اختیاری)
              </label>
              <input
                id="proposal-amount"
                value={amountEstimate}
                onChange={(event) => setAmountEstimate(event.target.value)}
                maxLength={200}
                className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
                placeholder="مثلاً: حدود ۵۰ میلیون"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button onClick={() => void handleSubmit()} loading={loading}>
              ثبت پیشنهاد
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}