import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getCampaign } from "@/lib/campaigns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "campaigns:read");

    const { id } = await params;
    const campaign = await getCampaign(id, user.id);

    return jsonOk({ campaign });
  } catch (error) {
    return jsonError(error);
  }
}