-- CreateTable
CREATE TABLE "BenefitProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "description" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "website" TEXT,
    "contactNote" TEXT,
    "logoEmoji" TEXT,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BenefitProvider_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenefitUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "satisfaction" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BenefitUsage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "BenefitProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BenefitUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenefitReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "moderatorNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BenefitReport_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "BenefitProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BenefitReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "amountEstimate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "implementedAt" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetProposal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetProposalVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "BudgetProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetImplementation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "expenses" JSONB,
    "reportedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetImplementation_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "BudgetProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetImplementation_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BenefitProvider_status_idx" ON "BenefitProvider"("status");

-- CreateIndex
CREATE INDEX "BenefitProvider_category_idx" ON "BenefitProvider"("category");

-- CreateIndex
CREATE INDEX "BenefitProvider_createdById_idx" ON "BenefitProvider"("createdById");

-- CreateIndex
CREATE INDEX "BenefitUsage_providerId_idx" ON "BenefitUsage"("providerId");

-- CreateIndex
CREATE INDEX "BenefitUsage_userId_idx" ON "BenefitUsage"("userId");

-- CreateIndex
CREATE INDEX "BenefitUsage_createdAt_idx" ON "BenefitUsage"("createdAt");

-- CreateIndex
CREATE INDEX "BenefitReport_status_idx" ON "BenefitReport"("status");

-- CreateIndex
CREATE INDEX "BenefitReport_providerId_idx" ON "BenefitReport"("providerId");

-- CreateIndex
CREATE INDEX "BenefitReport_reporterId_idx" ON "BenefitReport"("reporterId");

-- CreateIndex
CREATE INDEX "BudgetProposal_status_idx" ON "BudgetProposal"("status");

-- CreateIndex
CREATE INDEX "BudgetProposal_authorId_idx" ON "BudgetProposal"("authorId");

-- CreateIndex
CREATE INDEX "BudgetProposal_category_idx" ON "BudgetProposal"("category");

-- CreateIndex
CREATE INDEX "BudgetProposalVote_proposalId_idx" ON "BudgetProposalVote"("proposalId");

-- CreateIndex
CREATE INDEX "BudgetProposalVote_userId_idx" ON "BudgetProposalVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetProposalVote_proposalId_userId_key" ON "BudgetProposalVote"("proposalId", "userId");

-- CreateIndex
CREATE INDEX "BudgetImplementation_proposalId_idx" ON "BudgetImplementation"("proposalId");
