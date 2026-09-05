import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { listPublishedTools } from "@/lib/tools";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "tools:read");

    const tools = await listPublishedTools();

    return jsonOk({ tools });
  } catch (error) {
    return jsonError(error);
  }
}