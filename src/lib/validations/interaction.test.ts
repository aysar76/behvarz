import { describe, expect, it } from "vitest";
import {
  followSchema,
  saveSchema,
  thanksSchema,
} from "@/lib/validations/interaction";

describe("interaction validations", () => {
  it("accepts valid follow targets", () => {
    expect(
      followSchema.parse({ targetType: "tag", targetId: "واکسیناسیون" }),
    ).toEqual({ targetType: "tag", targetId: "واکسیناسیون" });
    expect(
      followSchema.parse({ targetType: "problem", targetId: "p1" }),
    ).toEqual({ targetType: "problem", targetId: "p1" });
    expect(
      followSchema.parse({ targetType: "experience", targetId: "e1" }),
    ).toEqual({ targetType: "experience", targetId: "e1" });
    expect(
      followSchema.parse({ targetType: "user", targetId: "u1" }),
    ).toEqual({ targetType: "user", targetId: "u1" });
  });

  it("rejects invalid follow target types", () => {
    expect(() =>
      followSchema.parse({ targetType: "answer", targetId: "a1" }),
    ).toThrow();
  });

  it("accepts valid save targets", () => {
    expect(
      saveSchema.parse({ targetType: "problem", targetId: "p1" }),
    ).toEqual({ targetType: "problem", targetId: "p1" });
    expect(
      saveSchema.parse({ targetType: "experience", targetId: "e1" }),
    ).toEqual({ targetType: "experience", targetId: "e1" });
  });

  it("rejects invalid save target types", () => {
    expect(() =>
      saveSchema.parse({ targetType: "user", targetId: "u1" }),
    ).toThrow();
  });

  it("accepts valid thanks targets", () => {
    expect(
      thanksSchema.parse({ targetType: "answer", targetId: "a1" }),
    ).toEqual({ targetType: "answer", targetId: "a1" });
    expect(
      thanksSchema.parse({ targetType: "experience", targetId: "e1" }),
    ).toEqual({ targetType: "experience", targetId: "e1" });
  });

  it("rejects invalid thanks target types", () => {
    expect(() =>
      thanksSchema.parse({ targetType: "problem", targetId: "p1" }),
    ).toThrow();
  });
});