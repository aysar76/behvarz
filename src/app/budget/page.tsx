import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listVisibleProposals, type SerializedBudgetProposal } from "@/lib/benefits";
import {
  BUDGET_PROPOSAL_CATEGORY_LABELS,
  BUDGET_PROPOSAL_STATUS_LABELS,
  BUDGET_PROPOSAL_STATUS_TONES,
} from "@/lib/constants/benefits";
import { toPersianDigits } from "@/lib/dates";
import { VoteButton } from "@/components/benefits/vote-button";
import { BudgetProposalForm } from "@/components/benefits/budget-proposal-form";

export const metadata = {
  title: "بودجه‌ریزی مشارکتی",
};

function ProposalCard({ proposal }: { proposal: SerializedBudgetProposal }) {
  const tone = BUDGET_PROPOSAL_STATUS_TONES[proposal.status];
  return (
    <article className="border-border bg-card shadow-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={tone}>{BUDGET_PROPOSAL_STATUS_LABELS[proposal.status]}</Badge>
        <Badge tone="neutral">
          {BUDGET_PROPOSAL_CATEGORY_LABELS[
            proposal.category as keyof typeof BUDGET_PROPOSAL_CATEGORY_LABELS
          ]}
        </Badge>
      </div>
      <h3 className="text-foreground font-bold">{proposal.title}</h3>
      <p className="text-muted-foreground text-sm leading-7">
        {proposal.description}
      </p>
      {proposal.amountEstimate && (
        <p className="text-muted-foreground text-xs">
          برآورد هزینه: {proposal.amountEstimate}
        </p>
      )}
      <div className="text-muted-foreground text-xs">
        {proposal.author?.displayName
          ? `پیشنهاددهنده: ${proposal.author.displayName}`
          : "پیشنهاددهنده: بی‌نام"}
      </div>
      {proposal.implementationSummary && (
        <div className="border-border bg-muted/40 rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">گزارش اجرا:</p>
          <p className="text-foreground mt-1 text-sm">
            {proposal.implementationSummary}
          </p>
        </div>
      )}
      {proposal.status === "voting" && (
        <div className="mt-auto">
          <VoteButton
            proposalId={proposal.id}
            voteCount={proposal.voteCount}
            myVote={proposal.myVote}
          />
        </div>
      )}
      {proposal.status !== "voting" && (
        <div className="text-muted-foreground mt-auto text-xs">
          {toPersianDigits(proposal.voteCount)} رأی
        </div>
      )}
    </article>
  );
}

export default async function BudgetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const proposals = await listVisibleProposals(user.id);

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold">
              بودجه‌ریزی مشارکتی
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              گام اولیه: اعضا پیشنهاد می‌دهند، مدیران صلاحیت را بررسی می‌کنند و
              واجدین شرایط رأی می‌دهند. رأی‌ها و گزارش هزینه‌ها قابل ممیزی‌اند.
            </p>
          </div>
          <BudgetProposalForm />
        </header>

        <section className="bg-muted/40 border-border rounded-xl border border-dashed p-4">
          <h2 className="text-foreground text-sm font-bold">قواعد شفاف</h2>
          <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-xs">
            <li>هر عضو واجد شرایط فقط یک رأی برای هر پیشنهاد دارد.</li>
            <li>پیشنهادها قبل از رأی‌گیری صلاحیت‌سنجی می‌شوند.</li>
            <li>اجرا و هزینه‌ها با گزارش قابل ممیزی منتشر می‌شوند.</li>
            <li>تضاد منافع باید اعلام شود؛ فروشگاه و کیف پول نداریم.</li>
          </ul>
        </section>

        {proposals.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">🗳️</span>}
            title="هنوز پیشنهادی ثبت نشده است"
            description="اولین پیشنهاد بودجه مشارکتی را تو ثبت کن."
            action={<BudgetProposalForm />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}