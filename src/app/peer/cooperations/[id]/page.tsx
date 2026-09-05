import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { CooperationDetail } from "@/components/peer/cooperation-detail";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCooperationRow } from "@/lib/peer";
import {
  serializePeerCooperation,
  serializePeerMessage,
  type PeerMessageRow,
} from "@/lib/serializers/peer";

export const metadata = {
  title: "همکاری همیار",
};

export default async function CooperationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const cooperation = await getCooperationRow(id);
  if (!cooperation) notFound();
  if (
    cooperation.requesterId !== user.id &&
    cooperation.helperId !== user.id
  ) {
    notFound();
  }

  const serialized = serializePeerCooperation(
    cooperation as unknown as Parameters<typeof serializePeerCooperation>[0],
  );
  const messages = (cooperation.messages as unknown as PeerMessageRow[]).map(
    (message) => serializePeerMessage(message, user.id),
  );

  return (
    <AppShell>
      <CooperationDetail
        initialCooperation={serialized}
        initialMessages={messages}
        currentUserId={user.id}
      />
    </AppShell>
  );
}