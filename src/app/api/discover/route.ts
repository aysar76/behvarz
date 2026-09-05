import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { getDiscovery } from "@/lib/discovery";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit")) || 5;

    const discovery = await getDiscovery({ userId: user.id, limit });

    return jsonOk(discovery);
  } catch (error) {
    return jsonError(error);
  }
}