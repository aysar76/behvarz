import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { listCampaigns } from "@/lib/campaigns";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "campaigns:read");

    const campaigns = await listCampaigns(user.id);

    return jsonOk({ campaigns });
  } catch (error) {
    return jsonError(error);
  }
}