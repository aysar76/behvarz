import type { User } from "@/generated/prisma/client";

export interface UserWithProfile extends User {
  skills?: { skill: { name: string } }[];
  interests?: { interest: { name: string } }[];
}

export interface SerializedUser {
  id: string;
  phone: string;
  role: string;
  membershipStatus: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  workYears: string | null;
  bio: string | null;
  visibility: string;
  onboardingCompleted: boolean;
  willingToHelp: boolean;
  accountStatus: string;
  accountStatusReason: string | null;
  skills: string[];
  interests: string[];
  createdAt: string;
}

export function serializeUser(user: UserWithProfile): SerializedUser {
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    membershipStatus: user.membershipStatus,
    displayName: user.displayName,
    province: user.province,
    city: user.city,
    workYears: user.workYears,
    bio: user.bio,
    visibility: user.visibility,
    onboardingCompleted: user.onboardingCompleted,
    willingToHelp: user.willingToHelp,
    accountStatus: user.accountStatus,
    accountStatusReason: user.accountStatusReason,
    skills: (user.skills ?? []).map((item) => item.skill.name),
    interests: (user.interests ?? []).map((item) => item.interest.name),
    createdAt: user.createdAt.toISOString(),
  };
}
