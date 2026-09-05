-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessionalThanks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "answerId" TEXT,
    "experienceId" TEXT,
    "receivedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfessionalThanks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalThanks_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ProblemAnswer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalThanks_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalThanks_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Experience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "conditions" TEXT,
    "action" TEXT NOT NULL,
    "resources" TEXT,
    "challenges" TEXT,
    "result" TEXT NOT NULL,
    "lessons" TEXT,
    "suggestion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'user_generated',
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "moderation" TEXT NOT NULL DEFAULT 'visible',
    "moderationNote" TEXT,
    "thanksCount" INTEGER NOT NULL DEFAULT 0,
    "sourceProblemId" TEXT,
    "publishedAt" DATETIME,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experience_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Experience_sourceProblemId_fkey" FOREIGN KEY ("sourceProblemId") REFERENCES "Problem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Experience" ("action", "authorId", "challenges", "conditions", "createdAt", "id", "isDraft", "lessons", "moderation", "moderationNote", "needsReview", "publishedAt", "resources", "result", "reviewedAt", "situation", "slug", "sourceProblemId", "status", "suggestion", "title", "updatedAt") SELECT "action", "authorId", "challenges", "conditions", "createdAt", "id", "isDraft", "lessons", "moderation", "moderationNote", "needsReview", "publishedAt", "resources", "result", "reviewedAt", "situation", "slug", "sourceProblemId", "status", "suggestion", "title", "updatedAt" FROM "Experience";
DROP TABLE "Experience";
ALTER TABLE "new_Experience" RENAME TO "Experience";
CREATE UNIQUE INDEX "Experience_slug_key" ON "Experience"("slug");
CREATE INDEX "Experience_status_idx" ON "Experience"("status");
CREATE INDEX "Experience_moderation_idx" ON "Experience"("moderation");
CREATE INDEX "Experience_authorId_idx" ON "Experience"("authorId");
CREATE INDEX "Experience_sourceProblemId_idx" ON "Experience"("sourceProblemId");
CREATE TABLE "new_ProblemAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isClarificationRequest" BOOLEAN NOT NULL DEFAULT false,
    "isSelectedSolution" BOOLEAN NOT NULL DEFAULT false,
    "moderation" TEXT NOT NULL DEFAULT 'visible',
    "moderationNote" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "thanksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProblemAnswer_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProblemAnswer" ("authorId", "body", "createdAt", "helpfulCount", "id", "isClarificationRequest", "isSelectedSolution", "moderation", "moderationNote", "needsReview", "problemId", "updatedAt") SELECT "authorId", "body", "createdAt", "helpfulCount", "id", "isClarificationRequest", "isSelectedSolution", "moderation", "moderationNote", "needsReview", "problemId", "updatedAt" FROM "ProblemAnswer";
DROP TABLE "ProblemAnswer";
ALTER TABLE "new_ProblemAnswer" RENAME TO "ProblemAnswer";
CREATE INDEX "ProblemAnswer_problemId_idx" ON "ProblemAnswer"("problemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Follow_targetType_targetId_idx" ON "Follow"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_userId_targetType_targetId_key" ON "Follow"("userId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "SavedItem_targetType_targetId_idx" ON "SavedItem"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedItem_userId_targetType_targetId_key" ON "SavedItem"("userId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "ProfessionalThanks_targetType_targetId_idx" ON "ProfessionalThanks"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalThanks_userId_targetType_targetId_key" ON "ProfessionalThanks"("userId", "targetType", "targetId");
