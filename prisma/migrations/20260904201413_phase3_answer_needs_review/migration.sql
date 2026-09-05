-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProblemAnswer_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProblemAnswer" ("authorId", "body", "createdAt", "helpfulCount", "id", "isClarificationRequest", "isSelectedSolution", "moderation", "moderationNote", "problemId", "updatedAt") SELECT "authorId", "body", "createdAt", "helpfulCount", "id", "isClarificationRequest", "isSelectedSolution", "moderation", "moderationNote", "problemId", "updatedAt" FROM "ProblemAnswer";
DROP TABLE "ProblemAnswer";
ALTER TABLE "new_ProblemAnswer" RENAME TO "ProblemAnswer";
CREATE INDEX "ProblemAnswer_problemId_idx" ON "ProblemAnswer"("problemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
