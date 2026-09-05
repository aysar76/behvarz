import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { assertAccountCanInteract } from "@/lib/moderation";
import { joinCampaign, leaveCampaign } from "@/lib/campaigns";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "campaigns:join");
    assertAccountCanInteract(user);

    const { id } = await params;
    await joinCampaign(id, user.id);

    return jsonOk({ joined: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "campaigns:join");

    const { id } = await params;
    await leaveCampaign(id, user.id);

    return jsonOk({ left: true });
  } catch (error) {
    return jsonError(error);
  }
}