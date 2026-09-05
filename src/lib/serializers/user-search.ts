export interface SearchUserRow {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  workYears: string | null;
  membershipStatus: string;
  role: string;
}

export interface SerializedSearchUser {
  id: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  workYears: string | null;
  isVerified: boolean;
}

export function serializeUserSearch(row: SearchUserRow): SerializedSearchUser {
  return {
    id: row.id,
    displayName: row.displayName,
    province: row.province,
    city: row.city,
    workYears: row.workYears,
    isVerified: row.membershipStatus === "verified",
  };
}