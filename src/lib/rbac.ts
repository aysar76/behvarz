import type { Role } from "@/generated/prisma/client";

export const ROLES = {
  guest: "guest",
  member: "member",
  verified_member: "verified_member",
  mentor: "mentor",
  circle_facilitator: "circle_facilitator",
  content_moderator: "content_moderator",
  admin: "admin",
  super_admin: "super_admin",
} as const satisfies Record<string, Role>;

export const ROLE_LABELS: Record<Role, string> = {
  guest: "مهمان",
  member: "عضو",
  verified_member: "عضو تأییدشده",
  mentor: "منتور",
  circle_facilitator: "تسهیل‌گر حلقه",
  content_moderator: "ناظر محتوا",
  admin: "مدیر",
  super_admin: "مدیر ارشد",
};

export type Permission =
  | "auth:signin"
  | "profile:read:own"
  | "profile:update:own"
  | "profile:request-verification"
  | "membership:review"
  | "users:manage"
  | "audit:read";

const PERMISSIONS_BY_ROLE: Record<Role, readonly Permission[]> = {
  guest: ["auth:signin"],
  member: [
    "auth:signin",
    "profile:read:own",
    "profile:update:own",
    "profile:request-verification",
  ],
  verified_member: [
    "auth:signin",
    "profile:read:own",
    "profile:update:own",
    "profile:request-verification",
  ],
  mentor: [
    "auth:signin",
    "profile:read:own",
    "profile:update:own",
    "profile:request-verification",
  ],
  circle_facilitator: [
    "auth:signin",
    "profile:read:own",
    "profile:update:own",
    "profile:request-verification",
  ],
  content_moderator: [
    "auth:signin",
    "profile:read:own",
    "profile:update:own",
    "profile:request-verification",
  ],
  admin: [
    "auth:signin",
    "profile:read:own",
    "profile:update:own",
    "profile:request-verification",
    "membership:review",
    "users:manage",
  ],
  super_admin: [
    "auth:signin",
    "profile:read:own",
    "profile:update:own",
    "profile:request-verification",
    "membership:review",
    "users:manage",
    "audit:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS_BY_ROLE[role].includes(permission);
}

export interface Principal {
  role: Role;
}

export function can(principal: Principal, permission: Permission): boolean {
  return hasPermission(principal.role, permission);
}
