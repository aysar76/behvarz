import { ZodError } from "zod";
import { AppError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function jsonOk(data: unknown, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init);
}

export function jsonError(error: unknown): Response {
  if (isAppError(error)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        ok: false,
        error: { code: "VALIDATION", message: "ورودی نامعتبر است" },
      },
      { status: 400 },
    );
  }

  logger.error("api", "unhandled error", error);
  return Response.json(
    { ok: false, error: { code: "INTERNAL", message: "خطای داخلی سرور" } },
    { status: 500 },
  );
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw new AppError("VALIDATION", "بدنه درخواست JSON معتبر نیست");
  }
}
