-- CreateTable
CREATE TABLE "github_webhook" (
    "id" TEXT NOT NULL,
    "repoId" INTEGER NOT NULL,
    "repoName" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "webhookId" INTEGER NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_webhook_repoId_key" ON "github_webhook"("repoId");
