import { AppError } from "@/lib/errors";

const ALLOWED_ORIGIN = process.env.APP_ORIGIN;

export function isSameOriginHost(
  source: string,
  requestHost: string | null,
  allowedOrigin = ALLOWED_ORIGIN,
): boolean {
  if (allowedOrigin) {
    try {
      return new URL(allowedOrigin).host === new URL(source).host;
    } catch {
      return false;
    }
  }
  try {
    return new URL(source).host === requestHost;
  } catch {
    return false;
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = origin ?? referer;
  if (!source) {
    return;
  }
  const host = request.headers.get("host");
  if (!isSameOriginHost(source, host)) {
    throw new AppError("FORBIDDEN", "درخواست نامعتبر است");
  }
}
