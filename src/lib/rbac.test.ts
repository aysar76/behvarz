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

  it("lets members create and reuse experiences", () => {
    expect(hasPermission("member", "experiences:create")).toBe(true);
    expect(hasPermission("member", "experiences:update:own")).toBe(true);
    expect(hasPermission("member", "experiences:reuse")).toBe(true);
    expect(hasPermission("member", "experiences:archive")).toBe(true);
    expect(hasPermission("member", "experiences:report")).toBe(true);
  });

  it("lets moderators review experiences", () => {
    expect(hasPermission("content_moderator", "experiences:review")).toBe(true);
    expect(hasPermission("member", "experiences:review")).toBe(false);
  });

  it("lets admins review experiences", () => {
    expect(hasPermission("admin", "experiences:review")).toBe(true);
  });

  it("lets members create circles and join circles", () => {
    expect(hasPermission("member", "circles:create")).toBe(true);
    expect(hasPermission("member", "circles:join")).toBe(true);
    expect(hasPermission("member", "circles:meeting")).toBe(true);
  });

  it("denies guests circle and peer permissions", () => {
    expect(hasPermission("guest", "circles:create")).toBe(false);
    expect(hasPermission("guest", "circles:join")).toBe(false);
    expect(hasPermission("guest", "peer:request")).toBe(false);
    expect(hasPermission("guest", "peer:offer")).toBe(false);
    expect(hasPermission("guest", "peer:cooperate")).toBe(false);
  });

  it("lets members use peer help features", () => {
    expect(hasPermission("member", "peer:request")).toBe(true);
    expect(hasPermission("member", "peer:offer")).toBe(true);
    expect(hasPermission("member", "peer:cooperate")).toBe(true);
  });

  it("lets admins moderate users and manage terms/tags/appeals", () => {
    expect(hasPermission("admin", "moderation:users")).toBe(true);
    expect(hasPermission("admin", "moderation:appeals")).toBe(true);
    expect(hasPermission("admin", "moderation:terms")).toBe(true);
    expect(hasPermission("admin", "moderation:decisions")).toBe(true);
    expect(hasPermission("admin", "tags:manage")).toBe(true);
  });

  it("lets content moderators view decisions but not manage users", () => {
    expect(hasPermission("content_moderator", "moderation:decisions")).toBe(true);
    expect(hasPermission("content_moderator", "moderation:users")).toBe(false);
    expect(hasPermission("content_moderator", "moderation:appeals")).toBe(false);
    expect(hasPermission("content_moderator", "tags:manage")).toBe(false);
  });

  it("denies members governance permissions", () => {
    expect(hasPermission("member", "moderation:users")).toBe(false);
    expect(hasPermission("member", "moderation:appeals")).toBe(false);
    expect(hasPermission("member", "moderation:terms")).toBe(false);
    expect(hasPermission("member", "tags:manage")).toBe(false);
  });

  it("lets members read and learn from the academy", () => {
    expect(hasPermission("member", "academy:read")).toBe(true);
    expect(hasPermission("member", "academy:learn")).toBe(true);
    expect(hasPermission("member", "academy:manage")).toBe(false);
  });

  it("lets admins manage the academy", () => {
    expect(hasPermission("admin", "academy:read")).toBe(true);
    expect(hasPermission("admin", "academy:learn")).toBe(true);
    expect(hasPermission("admin", "academy:manage")).toBe(true);
    expect(hasPermission("super_admin", "academy:manage")).toBe(true);
    expect(hasPermission("content_moderator", "academy:manage")).toBe(false);
  });

  it("denies guests academy access", () => {
    expect(hasPermission("guest", "academy:read")).toBe(false);
    expect(hasPermission("guest", "academy:learn")).toBe(false);
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
