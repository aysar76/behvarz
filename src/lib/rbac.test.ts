import { describe, expect, it } from "vitest";
import { can, hasPermission, ROLE_LABELS } from "@/lib/rbac";

describe("hasPermission", () => {
  it("lets guests sign in", () => {
    expect(hasPermission("guest", "auth:signin")).toBe(true);
  });

  it("denies guests profile access", () => {
    expect(hasPermission("guest", "profile:update:own")).toBe(false);
  });

  it("lets members manage their own profile", () => {
    expect(hasPermission("member", "profile:read:own")).toBe(true);
    expect(hasPermission("member", "profile:update:own")).toBe(true);
    expect(hasPermission("member", "profile:request-verification")).toBe(true);
  });

  it("denies members membership review", () => {
    expect(hasPermission("member", "membership:review")).toBe(false);
  });

  it("lets admins review memberships and manage users", () => {
    expect(hasPermission("admin", "membership:review")).toBe(true);
    expect(hasPermission("admin", "users:manage")).toBe(true);
  });

  it("lets only super admins read audits", () => {
    expect(hasPermission("super_admin", "audit:read")).toBe(true);
    expect(hasPermission("admin", "audit:read")).toBe(false);
  });
});

describe("can", () => {
  it("checks permissions for a principal", () => {
    expect(can({ role: "member" }, "profile:update:own")).toBe(true);
    expect(can({ role: "member" }, "membership:review")).toBe(false);
  });
});

describe("ROLE_LABELS", () => {
  it("has a Persian label for every role", () => {
    expect(ROLE_LABELS.admin).toBe("مدیر");
    expect(ROLE_LABELS.verified_member).toBe("عضو تأییدشده");
  });
});
