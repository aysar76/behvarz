import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { serializeUser } from "@/lib/serializers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        {
          ok: false,
          error: { code: "UNAUTHORIZED", message: "وارد نشده‌اید" },
        },
        { status: 401 },
      );
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        skills: { include: { skill: true } },
        interests: { include: { interest: true } },
      },
    });
    if (!profile) {
      return Response.json(
        { ok: false, error: { code: "NOT_FOUND", message: "کاربر یافت نشد" } },
        { status: 404 },
      );
    }

    return jsonOk({ user: serializeUser(profile) });
  } catch (error) {
    return jsonError(error);
  }
}
