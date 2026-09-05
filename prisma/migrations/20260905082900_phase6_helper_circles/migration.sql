-- CreateTable
CREATE TABLE "Circle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "topic" TEXT,
    "province" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 12,
    "status" TEXT NOT NULL DEFAULT 'active',
    "facilitatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Circle_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircleMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    CONSTRAINT "CircleMembership_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CircleMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircleJoinRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CircleJoinRequest_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CircleJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircleInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "CircleInvite_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CircleInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CircleInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircleMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "circleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agenda" TEXT,
    "scheduledAt" DATETIME,
    "summary" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CircleMeeting_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CircleMeeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeerHelpRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "barrierType" TEXT NOT NULL DEFAULT 'other',
    "tags" JSONB,
    "province" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PeerHelpRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeerOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "helpRequestId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "initiator" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "PeerOffer_helpRequestId_fkey" FOREIGN KEY ("helpRequestId") REFERENCES "PeerHelpRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PeerOffer_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeerCooperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "helpRequestId" TEXT,
    "requesterId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "goal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "outcomeSummary" TEXT,
    "requesterRating" INTEGER,
    "helperRating" INTEGER,
    "completedAt" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PeerCooperation_helpRequestId_fkey" FOREIGN KEY ("helpRequestId") REFERENCES "PeerHelpRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PeerCooperation_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PeerCooperation_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeerMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cooperationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerMessage_cooperationId_fkey" FOREIGN KEY ("cooperationId") REFERENCES "PeerCooperation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PeerMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PeerCooperationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cooperationId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerCooperationReport_cooperationId_fkey" FOREIGN KEY ("cooperationId") REFERENCES "PeerCooperation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PeerCooperationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("bio", "city", "createdAt", "displayName", "id", "membershipStatus", "onboardingCompleted", "phone", "province", "role", "updatedAt", "visibility", "workYears") SELECT "bio", "city", "createdAt", "displayName", "id", "membershipStatus", "onboardingCompleted", "phone", "province", "role", "updatedAt", "visibility", "workYears" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Circle_status_idx" ON "Circle"("status");

-- CreateIndex
CREATE INDEX "Circle_facilitatorId_idx" ON "Circle"("facilitatorId");

-- CreateIndex
CREATE INDEX "CircleMembership_circleId_idx" ON "CircleMembership"("circleId");

-- CreateIndex
CREATE INDEX "CircleMembership_userId_idx" ON "CircleMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMembership_circleId_userId_key" ON "CircleMembership"("circleId", "userId");

-- CreateIndex
CREATE INDEX "CircleJoinRequest_circleId_idx" ON "CircleJoinRequest"("circleId");

-- CreateIndex
CREATE INDEX "CircleJoinRequest_userId_idx" ON "CircleJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "CircleJoinRequest_status_idx" ON "CircleJoinRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CircleJoinRequest_circleId_userId_key" ON "CircleJoinRequest"("circleId", "userId");

-- CreateIndex
CREATE INDEX "CircleInvite_circleId_idx" ON "CircleInvite"("circleId");

-- CreateIndex
CREATE INDEX "CircleInvite_userId_idx" ON "CircleInvite"("userId");

-- CreateIndex
CREATE INDEX "CircleInvite_status_idx" ON "CircleInvite"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CircleInvite_circleId_userId_key" ON "CircleInvite"("circleId", "userId");

-- CreateIndex
CREATE INDEX "CircleMeeting_circleId_idx" ON "CircleMeeting"("circleId");

-- CreateIndex
CREATE INDEX "PeerHelpRequest_requesterId_idx" ON "PeerHelpRequest"("requesterId");

-- CreateIndex
CREATE INDEX "PeerHelpRequest_status_idx" ON "PeerHelpRequest"("status");

-- CreateIndex
CREATE INDEX "PeerHelpRequest_barrierType_idx" ON "PeerHelpRequest"("barrierType");

-- CreateIndex
CREATE INDEX "PeerOffer_helpRequestId_idx" ON "PeerOffer"("helpRequestId");

-- CreateIndex
CREATE INDEX "PeerOffer_helperId_idx" ON "PeerOffer"("helperId");

-- CreateIndex
CREATE INDEX "PeerOffer_status_idx" ON "PeerOffer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PeerOffer_helpRequestId_helperId_key" ON "PeerOffer"("helpRequestId", "helperId");

-- CreateIndex
CREATE INDEX "PeerCooperation_requesterId_idx" ON "PeerCooperation"("requesterId");

-- CreateIndex
CREATE INDEX "PeerCooperation_helperId_idx" ON "PeerCooperation"("helperId");

-- CreateIndex
CREATE INDEX "PeerCooperation_status_idx" ON "PeerCooperation"("status");

-- CreateIndex
CREATE INDEX "PeerMessage_cooperationId_idx" ON "PeerMessage"("cooperationId");

-- CreateIndex
CREATE INDEX "PeerCooperationReport_cooperationId_idx" ON "PeerCooperationReport"("cooperationId");

-- CreateIndex
CREATE INDEX "PeerCooperationReport_status_idx" ON "PeerCooperationReport"("status");
