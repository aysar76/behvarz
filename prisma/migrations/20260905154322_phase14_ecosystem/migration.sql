-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "family" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "isOptional" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignParticipation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignParticipation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "reviewedAt" DATETIME,
    "tags" JSONB,
    "createdById" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tool_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "membershipStatus" TEXT NOT NULL DEFAULT 'none',
    "displayName" TEXT,
    "province" TEXT,
    "city" TEXT,
    "workYears" TEXT,
    "bio" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'members',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "willingToHelp" BOOLEAN NOT NULL DEFAULT false,
    "allowDataContribution" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "accountStatusReason" TEXT,
    "accountStatusAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("accountStatus", "accountStatusAt", "accountStatusReason", "bio", "city", "createdAt", "displayName", "id", "membershipStatus", "onboardingCompleted", "phone", "province", "role", "updatedAt", "visibility", "willingToHelp", "workYears") SELECT "accountStatus", "accountStatusAt", "accountStatusReason", "bio", "city", "createdAt", "displayName", "id", "membershipStatus", "onboardingCompleted", "phone", "province", "role", "updatedAt", "visibility", "willingToHelp", "workYears" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_family_idx" ON "Campaign"("family");

-- CreateIndex
CREATE INDEX "CampaignParticipation_campaignId_idx" ON "CampaignParticipation"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignParticipation_userId_idx" ON "CampaignParticipation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignParticipation_campaignId_userId_key" ON "CampaignParticipation"("campaignId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");

-- CreateIndex
CREATE INDEX "Tool_status_idx" ON "Tool"("status");

-- CreateIndex
CREATE INDEX "Tool_kind_idx" ON "Tool"("kind");
