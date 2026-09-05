import { prisma } from "@/lib/db";
import { CampaignForm } from "@/components/admin/campaign-form";
import { Badge } from "@/components/ui/badge";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_TONES } from "@/lib/constants/campaign";
import { toPersianDigits } from "@/lib/dates";

export const metadata = {
  title: "ویرایش کمپین",
};

export default async function AdminCampaignEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { participations: true } } },
  });

  if (!campaign) {
    return <p className="text-muted-foreground text-sm">کمپین یافت نشد.</p>;
  }

  const tone = CAMPAIGN_STATUS_TONES[campaign.status];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-extrabold">
          ویرایش کمپین
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <Badge tone={tone}>{CAMPAIGN_STATUS_LABELS[campaign.status]}</Badge>
          <span className="text-muted-foreground">
            {toPersianDigits(campaign._count.participations)} مشارکت
          </span>
        </div>
      </header>
      <CampaignForm
        campaignId={campaign.id}
        initial={{
          family: campaign.family,
          title: campaign.title,
          description: campaign.description,
          status: campaign.status,
          startsAt: campaign.startsAt ? toLocalInput(campaign.startsAt) : "",
          endsAt: campaign.endsAt ? toLocalInput(campaign.endsAt) : "",
          isOptional: campaign.isOptional,
        }}
      />
    </div>
  );
}

function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}