import type { User } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { getSession } from "@/lib/auth/session";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "برای این عملیات باید وارد شوید");
  }
  return user;
}
