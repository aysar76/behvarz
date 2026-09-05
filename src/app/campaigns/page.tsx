import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listCampaigns, type SerializedCampaign } from "@/lib/campaigns";
import {
  CAMPAIGN_FAMILY_EMOJIS,
  CAMPAIGN_FAMILY_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONES,
} from "@/lib/constants/campaign";
import { CampaignJoinButton } from "@/components/campaigns/campaign-join-button";
import { formatRelativeTime } from "@/lib/dates";

export const metadata = {
  title: "کمپین‌ها و بازی‌های شبکه‌ای",
};

function CampaignCard({ campaign }: { campaign: SerializedCampaign }) {
  const tone = CAMPAIGN_STATUS_TONES[campaign.status];
  return (
    <article className="border-border bg-card shadow-card flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-foreground text-xl font-bold" aria-hidden="true">
          {CAMPAIGN_FAMILY_EMOJIS[campaign.family]}
        </span>
        <Badge tone={tone}>{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">
          {CAMPAIGN_FAMILY_LABELS[campaign.family]}
        </Badge>
        {campaign.isOptional && <Badge tone="neutral">اختیاری</Badge>}
      </div>
      <h3 className="text-foreground font-bold">{campaign.title}</h3>
      <p className="text-muted-foreground text-sm leading-7">
        {campaign.description}
      </p>
      <div className="text-muted-foreground mt-auto text-xs">
        {campaign.startsAt
          ? `شروع: ${formatRelativeTime(campaign.startsAt)}`
          : "زمان‌بندی اعلام‌نشده"}
      </div>
      <div className="mt-auto pt-1">
        <CampaignJoinButton
          campaignId={campaign.id}
          isParticipating={campaign.isParticipating}
          participationCount={campaign.participationCount}
        />
      </div>
    </article>
  );
}

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const campaigns = await listCampaigns(user.id);

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            کمپین‌ها و بازی‌های شبکه‌ای
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            نسخه‌های سبک و کاملاً اختیاری از شش خانواده بازی (یادگیری، همکاری،
            شبکه، نوآوری، رشد، مأموریت) — بدون رقابت ناسالم و بدون لیدربورد.
          </p>
        </header>

        <section className="bg-muted/40 border-border rounded-xl border border-dashed p-4">
          <h2 className="text-foreground text-sm font-bold">قواعد شفاف</h2>
          <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-xs">
            <li>شرکت در همه کمپین‌ها اختیاری است.</li>
            <li>هیچ رتبه‌بندی و مقایسه تنبیهی بین استان‌ها یا افراد ساخته نمی‌شود.</li>
            <li>مشارکت فقط به مسئله، تجربه، یادگیری یا همکاری حرفه‌ای متصل است.</li>
          </ul>
        </section>

        {campaigns.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">🎯</span>}
            title="هنوز کمپین فعالی نیست"
            description="کمپین‌های جدید به‌زودی از سوی تیم جامعه معرفی می‌شوند."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}