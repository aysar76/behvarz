import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getCourseDetail } from "@/lib/academy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireUser();
    assertPermission(user, "academy:read");
    const { slug } = await params;

    const { course, lessons } = await getCourseDetail(slug, user.id);

    return jsonOk({ course, lessons });
  } catch (error) {
    return jsonError(error);
  }
}
