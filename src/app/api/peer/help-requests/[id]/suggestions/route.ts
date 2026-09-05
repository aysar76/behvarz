import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getPeerHelpRequestRow, suggestHelpers } from "@/lib/peer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "peer:request");
    const { id } = await params;

    const row = await getPeerHelpRequestRow(id);
    if (!row) {
      throw new AppError("NOT_FOUND", "درخواست همیار یافت نشد");
    }
    if (row.requesterId !== user.id) {
      throw new AppError("FORBIDDEN", "فقط ثبت‌کننده درخواست می‌تواند پیشنهاد همیار ببیند");
    }

    const tagValues = Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : [];

    const suggestions = await suggestHelpers({
      barrierType: row.barrierType,
      tags: tagValues,
      province: row.province,
      excludeUserId: user.id,
    });

    return jsonOk({ suggestions });
  } catch (error) {
    return jsonError(error);
  }
}