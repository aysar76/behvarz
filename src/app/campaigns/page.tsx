import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listCampaigns, type SerializedCampaign } from "@/lib/campaigns";
import {
  CAMPAIGN_FAMILY_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONES,
} from "@/lib/constants/campaign";
import { CampaignJoinButton } from "@/components/campaigns/campaign-join-button";
import { formatRelativeTime } from "@/lib/dates";

export const metadata = {
  title: "کمپین‌ها و بازی‌های شبکه‌ای",
};

const familyIcon: Record<SerializedCampaign["family"], IconName> = {
  learning: "graduation",
  cooperation: "handshake",
  network: "users",
  innovation: "lightbulb",
  growth: "leaf",
  mission: "target",
};

const familyTone: Record<SerializedCampaign["family"], string> = {
  learning: "from-brand-50 to-brand-100/70 border-brand-100 text-brand-700",
  cooperation: "from-sky-50 to-sky-100/70 border-sky-100 text-sky-700",
  network: "from-violet-50 to-violet-100/70 border-violet-100 text-violet-700",
  innovation: "from-amber-50 to-amber-100/70 border-amber-100 text-amber-700",
  growth: "from-green-50 to-green-100/70 border-green-100 text-green-700",
  mission: "from-rose-50 to-rose-100/70 border-rose-100 text-rose-700",
};

function CampaignCard({ campaign }: { campaign: SerializedCampaign }) {
  const tone = CAMPAIGN_STATUS_TONES[campaign.status];
  return (
    <article className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          aria-hidden="true"
          className={`bg-gradient-to-br flex size-11 shrink-0 items-center justify-center rounded-xl border ${familyTone[campaign.family]}`}
        >
          <Icon name={familyIcon[campaign.family]} className="size-5" />
        </span>
        <Badge tone={tone}>{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">{CAMPAIGN_FAMILY_LABELS[campaign.family]}</Badge>
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
        <PageHeader
          title="کمپین‌ها و بازی‌های شبکه‌ای"
          description="نسخه‌های سبک و کاملاً اختیاری از شش خانواده بازی (یادگیری، همکاری، شبکه، نوآوری، رشد، مأموریت) — بدون رقابت ناسالم و بدون لیدربورد."
          icon="target"
        />

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
            icon={<Icon name="target" className="size-6" />}
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