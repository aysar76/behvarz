import { prisma } from "@/lib/db";
import { BudgetAdmin } from "@/components/admin/budget-admin";
import {
  serializeBudgetProposal,
  type BudgetProposalRow,
} from "@/lib/benefits";

export const metadata = {
  title: "بودجه مشارکتی",
};

export default async function AdminBudgetPage() {
  const proposals = await prisma.budgetProposal.findMany({
    include: {
      author: { select: { id: true, displayName: true } },
      _count: { select: { votes: true } },
      implementations: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = (proposals as unknown as BudgetProposalRow[]).map(
    (proposal) => serializeBudgetProposal(proposal),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          بودجه‌ریزی مشارکتی
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          بررسی صلاحیت پیشنهادها، مدیریت رأی‌گیری و ثبت گزارش اجرا (قابل ممیزی).
        </p>
      </header>
      <BudgetAdmin initialProposals={serialized} />
    </div>
  );
}