import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { AppError } from "@/lib/errors";
import { enrollInCourse } from "@/lib/academy";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/auth/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = getClientIp(_request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:learn");
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!course) {
      throw new AppError("NOT_FOUND", "دوره یافت نشد");
    }

    await enrollInCourse(course.id, user.id);

    await auditLog({
      actorId: user.id,
      action: "academy.enroll",
      entityType: "Course",
      entityId: course.id,
      ip,
    });

    return jsonOk({ enrolled: true });
  } catch (error) {
    return jsonError(error);
  }
}
