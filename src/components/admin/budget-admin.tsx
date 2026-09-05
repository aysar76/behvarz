"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import {
  BUDGET_PROPOSAL_CATEGORY_LABELS,
  BUDGET_PROPOSAL_STATUS_LABELS,
  BUDGET_PROPOSAL_STATUS_TONES,
} from "@/lib/constants/benefits";

interface AdminProposal {
  id: string;
  title: string;
  description: string;
  category: string;
  amountEstimate: string | null;
  status: string;
  voteCount: number;
  implementationSummary: string | null;
  implementedAt: string | null;
  createdAt: string;
  author: { id: string; displayName: string | null } | null;
}

interface ExpenseRow {
  item: string;
  amount: string;
}

const TRANSITIONS: Record<string, string[]> = {
  draft: ["under_review", "rejected"],
  under_review: ["approved", "voting", "rejected"],
  approved: ["voting", "rejected"],
  voting: ["implemented", "closed"],
  implemented: ["closed"],
  rejected: [],
  closed: [],
};

const ACTION_LABELS: Record<string, string> = {
  under_review: "بررسی صلاحیت",
  approved: "تأیید برای رأی‌گیری",
  rejected: "رد",
  voting: "شروع رأی‌گیری",
  implemented: "اجرا شده",
  closed: "بستن",
};

export function BudgetAdmin({
  initialProposals,
}: {
  initialProposals: AdminProposal[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [proposals] = useState(initialProposals);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [implTarget, setImplTarget] = useState<AdminProposal | null>(null);
  const [summary, setSummary] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { item: "", amount: "" },
  ]);

  async function review(proposalId: string, status: string) {
    setPending((current) => ({ ...current, [proposalId]: true }));
    try {
      const res = await fetch(
        `/api/admin/budget-proposals/${proposalId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در تغییر وضعیت", tone: "danger" });
        return;
      }
      toast({ title: "وضعیت به‌روزرسانی شد", tone: "success" });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setPending((current) => ({ ...current, [proposalId]: false }));
    }
  }

  async function submitImplementation() {
    if (!implTarget) return;
    setPending((current) => ({ ...current, [implTarget.id]: true }));
    try {
      const res = await fetch("/api/admin/budget-proposals/implement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: implTarget.id,
          summary,
          expenses: expenses.filter((row) => row.item.trim() && row.amount.trim()),
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
      toast({ title: "گزارش اجرا ثبت شد (قابل ممیزی)", tone: "success" });
      setImplTarget(null);
      setSummary("");
      setExpenses([{ item: "", amount: "" }]);
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setPending((current) => ({ ...current, [implTarget.id]: false }));
    }
  }

  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="coins" className="size-6" />}
        title="پیشنهادی ثبت نشده است"
        description="پیشنهادهای اعضا برای بررسی صلاحیت اینجا ظاهر می‌شوند."
      />
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const tone =
          BUDGET_PROPOSAL_STATUS_TONES[
            proposal.status as keyof typeof BUDGET_PROPOSAL_STATUS_TONES
          ] ?? "neutral";
        const nextActions = TRANSITIONS[proposal.status] ?? [];
        return (
          <article
            key={proposal.id}
            className="border-border bg-card shadow-card rounded-xl border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground font-bold">{proposal.title}</h3>
                <Badge tone={tone}>
                  {BUDGET_PROPOSAL_STATUS_LABELS[
                    proposal.status as keyof typeof BUDGET_PROPOSAL_STATUS_LABELS
                  ]}
                </Badge>
                <Badge tone="neutral">
                  {BUDGET_PROPOSAL_CATEGORY_LABELS[
                    proposal.category as keyof typeof BUDGET_PROPOSAL_CATEGORY_LABELS
                  ]}
                </Badge>
              </div>
              <span className="text-muted-foreground text-xs">
                {proposal.author?.displayName ?? "بی‌نام"} •{" "}
                {formatRelativeTime(proposal.createdAt)}
              </span>
            </div>

            <p className="text-muted-foreground mt-2 text-sm leading-7">
              {proposal.description}
            </p>

            <div className="text-muted-foreground mt-2 text-xs">
              {proposal.amountEstimate
                ? `برآورد هزینه: ${proposal.amountEstimate} • `
                : ""}
              {proposal.voteCount} رأی
            </div>

            {proposal.implementationSummary && (
              <div className="border-border bg-muted/40 mt-3 rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">گزارش اجرا:</p>
                <p className="text-foreground mt-1 text-sm">
                  {proposal.implementationSummary}
                </p>
              </div>
            )}

            {nextActions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {nextActions.map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant={
                      action === "rejected" || action === "closed" ? "ghost" : "outline"
                    }
                    onClick={() => void review(proposal.id, action)}
                    loading={pending[proposal.id] && implTarget?.id !== proposal.id}
                    disabled={pending[proposal.id] && implTarget?.id !== proposal.id}
                  >
                    {ACTION_LABELS[action]}
                  </Button>
                ))}
                {proposal.status === "voting" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setImplTarget(proposal)}
                  >
                    ثبت گزارش اجرا
                  </Button>
                )}
              </div>
            )}
          </article>
        );
      })}

      <Modal
        open={implTarget !== null}
        onClose={() => setImplTarget(null)}
        title="گزارش اجرا و هزینه"
        description="این گزارش به‌صورت قابل ممیزی برای پیشنهاد ثبت می‌شود."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="impl-summary"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              خلاصه اجرا
            </label>
            <textarea
              id="impl-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
              maxLength={2000}
              className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
              placeholder="چه کاری انجام شد؟ نتیجه چه بود؟"
            />
          </div>

          <div>
            <p className="text-foreground mb-1 text-sm font-medium">
              هزینه‌ها (اختیاری)
            </p>
            <div className="space-y-2">
              {expenses.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <input
                    value={row.item}
                    onChange={(event) =>
                      setExpenses((current) =>
                        current.map((r, i) =>
                          i === index ? { ...r, item: event.target.value } : r,
                        ),
                      )
                    }
                    placeholder="عنوان هزینه"
                    maxLength={120}
                    className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
                  />
                  <input
                    value={row.amount}
                    onChange={(event) =>
                      setExpenses((current) =>
                        current.map((r, i) =>
                          i === index ? { ...r, amount: event.target.value } : r,
                        ),
                      )
                    }
                    placeholder="مبلغ"
                    maxLength={120}
                    className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExpenses((current) =>
                        current.length > 1
                          ? current.filter((_, i) => i !== index)
                          : current,
                      )
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="حذف هزینه"
                  >
                    <Icon name="x" className="size-4" />
                  </button>
                </div>
              ))}
              {expenses.length < 20 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExpenses((current) => [...current, { item: "", amount: "" }])
                  }
                >
                  افزودن هزینه
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setImplTarget(null)}>
              انصراف
            </Button>
            <Button
              onClick={() => void submitImplementation()}
              loading={implTarget ? pending[implTarget.id] : false}
            >
              ثبت گزارش اجرا
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}