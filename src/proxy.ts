import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isSameOriginHost } from "@/lib/csrf";

export function proxy(request: NextRequest) {
  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return NextResponse.next();
  }

  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = origin ?? referer;

  if (source) {
    const host = request.headers.get("host");
    if (!isSameOriginHost(source, host)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "FORBIDDEN", message: "درخواست نامعتبر است" },
        },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
