-- CreateTable
CREATE TABLE "Experience" (
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
    "sourceProblemId" TEXT,
    "publishedAt" DATETIME,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experience_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Experience_sourceProblemId_fkey" FOREIGN KEY ("sourceProblemId") REFERENCES "Problem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExperienceTag" (
    "experienceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("experienceId", "tagId"),
    CONSTRAINT "ExperienceTag_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExperienceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExperienceReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experienceId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExperienceReference_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExperienceReference_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ProblemAnswer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExperienceReuse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experienceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExperienceReuse_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExperienceReuse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "problemId" TEXT,
    "answerId" TEXT,
    "experienceId" TEXT,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "moderatorNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentReport_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentReport_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ProblemAnswer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentReport_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ContentReport" ("answerId", "createdAt", "id", "moderatorNote", "note", "problemId", "reason", "reporterId", "reviewedAt", "reviewedBy", "status") SELECT "answerId", "createdAt", "id", "moderatorNote", "note", "problemId", "reason", "reporterId", "reviewedAt", "reviewedBy", "status" FROM "ContentReport";
DROP TABLE "ContentReport";
ALTER TABLE "new_ContentReport" RENAME TO "ContentReport";
CREATE INDEX "ContentReport_status_idx" ON "ContentReport"("status");
CREATE INDEX "ContentReport_problemId_idx" ON "ContentReport"("problemId");
CREATE INDEX "ContentReport_answerId_idx" ON "ContentReport"("answerId");
CREATE INDEX "ContentReport_experienceId_idx" ON "ContentReport"("experienceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Experience_slug_key" ON "Experience"("slug");

-- CreateIndex
CREATE INDEX "Experience_status_idx" ON "Experience"("status");

-- CreateIndex
CREATE INDEX "Experience_moderation_idx" ON "Experience"("moderation");

-- CreateIndex
CREATE INDEX "Experience_authorId_idx" ON "Experience"("authorId");

-- CreateIndex
CREATE INDEX "Experience_sourceProblemId_idx" ON "Experience"("sourceProblemId");

-- CreateIndex
CREATE INDEX "ExperienceTag_tagId_idx" ON "ExperienceTag"("tagId");

-- CreateIndex
CREATE INDEX "ExperienceReference_experienceId_idx" ON "ExperienceReference"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceReference_answerId_idx" ON "ExperienceReference"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceReference_experienceId_answerId_key" ON "ExperienceReference"("experienceId", "answerId");

-- CreateIndex
CREATE INDEX "ExperienceReuse_experienceId_idx" ON "ExperienceReuse"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceReuse_userId_idx" ON "ExperienceReuse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceReuse_experienceId_userId_key" ON "ExperienceReuse"("experienceId", "userId");
