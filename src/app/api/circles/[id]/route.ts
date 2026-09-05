import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { getCircleRow } from "@/lib/circles";
import {
  serializeCircle,
  type CircleRow,
} from "@/lib/serializers/circle";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const circle = await getCircleRow(id);
    if (!circle) {
      return jsonOk({ circle: null });
    }

    return jsonOk({
      circle: serializeCircle(circle as CircleRow, { currentUserId: user.id }),
    });
  } catch (error) {
    return jsonError(error);
  }
}