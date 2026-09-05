import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { listApprovedProviders } from "@/lib/benefits";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:read");

    const providers = await listApprovedProviders(user.id);

    return jsonOk({ providers });
  } catch (error) {
    return jsonError(error);
  }
}