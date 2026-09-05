import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { serializeCampaign, type CampaignRow } from "@/lib/campaigns";
import {
  CAMPAIGN_FAMILY_EMOJIS,
  CAMPAIGN_FAMILY_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONES,
} from "@/lib/constants/campaign";
import { toPersianDigits } from "@/lib/dates";

export const metadata = {
  title: "مدیریت کمپین‌ها",
};

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          membershipStatus: true,
          role: true,
        },
      },
      _count: { select: { participations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-extrabold">
            مدیریت کمپین‌ها
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ساخت و مدیریت کمپین‌ها و بازی‌های شبکه‌ای سبک و اختیاری.
          </p>
        </div>
        <Link href="/admin/campaigns/new">
          <Button>کمپین جدید</Button>
        </Link>
      </header>

      {campaigns.length === 0 ? (
        <EmptyState
          title="کمپینی ثبت نشده است"
          description="با ساختن نخستین کمپین، بازی شبکه‌ای را راه‌اندازی کنید."
          action={
            <Link href="/admin/campaigns/new">
              <Button>ساخت کمپین جدید</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">کمپین</th>
                <th className="px-4 py-3 text-right font-medium">خانواده</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium">مشارکت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((raw) => {
                const campaign = serializeCampaign(
                  raw as unknown as CampaignRow,
                );
                const tone = CAMPAIGN_STATUS_TONES[campaign.status];
                return (
                  <tr key={campaign.id} className="hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="text-foreground hover:text-brand-700 font-semibold"
                      >
                        {CAMPAIGN_FAMILY_EMOJIS[campaign.family]} {campaign.title}
                      </Link>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {CAMPAIGN_FAMILY_LABELS[campaign.family]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {toPersianDigits(campaign.participationCount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}