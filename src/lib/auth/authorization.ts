import type { User } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { can, hasPermission, type Permission } from "@/lib/rbac";

export function assertPermission(user: User, permission: Permission): void {
  if (!hasPermission(user.role, permission)) {
    throw new AppError("FORBIDDEN", "شما مجوز انجام این عملیات را ندارید");
  }
}

export function canUser(user: User, permission: Permission): boolean {
  return can(user, permission);
}
