import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getPublishedToolBySlug } from "@/lib/tools";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "tools:read");

    const { slug } = await params;
    const tool = await getPublishedToolBySlug(slug);

    return jsonOk({ tool });
  } catch (error) {
    return jsonError(error);
  }
}