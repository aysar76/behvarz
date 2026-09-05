import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { listPublishedCourses } from "@/lib/academy";

export async function GET() {
  try {
    const user = await requireUser();
    assertPermission(user, "academy:read");

    const courses = await listPublishedCourses(user.id);

    return jsonOk({ courses });
  } catch (error) {
    return jsonError(error);
  }
}
