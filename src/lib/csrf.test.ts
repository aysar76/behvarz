import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, isSameOriginHost } from "@/lib/csrf";

describe("isSameOriginHost", () => {
  it("accepts matching host when no allowed origin is configured", () => {
    expect(
      isSameOriginHost(
        "https://behvarz.example/a",
        "behvarz.example",
        undefined,
      ),
    ).toBe(true);
  });

  it("rejects a different host when no allowed origin is configured", () => {
    expect(
      isSameOriginHost("https://evil.example/a", "behvarz.example", undefined),
    ).toBe(false);
  });

  it("accepts matching host against the configured allowed origin", () => {
    expect(
      isSameOriginHost(
        "https://behvarz.example/a",
        "behvarz.example",
        "https://behvarz.example",
      ),
    ).toBe(true);
  });

  it("rejects a foreign host even if it matches the request host when allowed origin differs", () => {
    expect(
      isSameOriginHost(
        "https://evil.example/a",
        "evil.example",
        "https://behvarz.example",
      ),
    ).toBe(false);
  });

  it("returns false for an invalid source URL", () => {
    expect(isSameOriginHost("not-a-url", "behvarz.example", undefined)).toBe(
      false,
    );
  });
});

describe("assertSameOrigin", () => {
  it("allows requests without origin or referer headers", () => {
    const request = new Request("https://behvarz.example/api/problems", {
      method: "POST",
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("allows a same-origin request", () => {
    const request = new Request("https://behvarz.example/api/problems", {
      method: "POST",
      headers: { origin: "https://behvarz.example", host: "behvarz.example" },
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects a cross-origin request", () => {
    const request = new Request("https://behvarz.example/api/problems", {
      method: "POST",
      headers: { origin: "https://evil.example", host: "behvarz.example" },
    });
    expect(() => assertSameOrigin(request)).toThrow(AppError);
  });

  it("uses the referer header when origin is absent", () => {
    const request = new Request("https://behvarz.example/api/problems", {
      method: "POST",
      headers: {
        referer: "https://evil.example/page",
        host: "behvarz.example",
      },
    });
    expect(() => assertSameOrigin(request)).toThrow(AppError);
  });
});
