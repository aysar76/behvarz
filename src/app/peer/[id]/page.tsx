import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { HelpRequestDetail } from "@/components/peer/help-request-detail";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPeerHelpRequestRow, suggestHelpers } from "@/lib/peer";
import {
  serializePeerHelpRequest,
  type PeerHelpRequestRow,
} from "@/lib/serializers/peer";

export const metadata = {
  title: "درخواست همیار",
};

export default async function HelpRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const row = await getPeerHelpRequestRow(id);
  if (!row) notFound();

  const isRequester = row.requesterId === user.id;
  if (!isRequester && row.status !== "open") notFound();

  const serialized = serializePeerHelpRequest(row as PeerHelpRequestRow, {
    currentUserId: user.id,
  });

  if (!isRequester) {
    serialized.offers = serialized.offers.filter(
      (offer) => offer.helperId === user.id,
    );
  }

  const tagValues = Array.isArray(row.tags)
    ? row.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  const suggestions =
    isRequester && row.status === "open"
      ? await suggestHelpers({
          barrierType: row.barrierType,
          tags: tagValues,
          province: row.province,
          excludeUserId: user.id,
        })
      : [];

  return (
    <AppShell>
      <HelpRequestDetail
        initialHelpRequest={serialized}
        initialSuggestions={suggestions}
      />
    </AppShell>
  );
}