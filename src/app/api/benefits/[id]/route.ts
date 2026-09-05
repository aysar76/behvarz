import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getApprovedProvider } from "@/lib/benefits";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:read");
    const { id } = await params;

    const provider = await getApprovedProvider(id, user.id);

    return jsonOk({ provider });
  } catch (error) {
    return jsonError(error);
  }
}