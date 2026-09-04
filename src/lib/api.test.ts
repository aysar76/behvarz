import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";

describe("jsonOk", () => {
  it("returns ok true with data", async () => {
    const res = jsonOk({ hello: "world" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { hello: "world" } });
  });
});

describe("jsonError", () => {
  it("maps AppError to its status and code", async () => {
    const res = jsonError(new AppError("NOT_FOUND", "یافت نشد"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "یافت نشد" },
    });
  });

  it("maps ZodError to a 400 validation error", async () => {
    const res = jsonError(new ZodError([]));
    expect(res.status).toBe(400);
  });

  it("maps unknown errors to 500", async () => {
    const res = jsonError(new Error("boom"));
    expect(res.status).toBe(500);
    const body = (await res.json()) as {
      error: { code: string };
    };
    expect(body.error.code).toBe("INTERNAL");
  });
});
