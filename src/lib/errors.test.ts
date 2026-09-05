import { describe, expect, it } from "vitest";
import { AppError, isAppError } from "@/lib/errors";

describe("AppError", () => {
  it("assigns a default status per code", () => {
    expect(new AppError("NOT_FOUND", "not found").status).toBe(404);
    expect(new AppError("VALIDATION", "invalid").status).toBe(400);
    expect(new AppError("RATE_LIMITED", "slow down").status).toBe(429);
    expect(new AppError("INTERNAL", "oops").status).toBe(500);
  });

  it("accepts an explicit status override", () => {
    const err = new AppError("FORBIDDEN", "no", { status: 418 });
    expect(err.status).toBe(418);
  });

  it("carries code, details and operational flag", () => {
    const err = new AppError("CONFLICT", "duplicate", { details: { id: 1 } });
    expect(err.code).toBe("CONFLICT");
    expect(err.details).toEqual({ id: 1 });
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe("AppError");
  });
});

describe("isAppError", () => {
  it("distinguishes AppError from other errors", () => {
    expect(isAppError(new AppError("INTERNAL", "x"))).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});
