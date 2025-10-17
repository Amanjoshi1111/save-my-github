-- CreateTable
CREATE TABLE "backup" (
    "id" TEXT NOT NULL,
    "repoId" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "lastBackupDate" TIMESTAMP(3),

    CONSTRAINT "backup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "backup_repoId_key" ON "backup"("repoId");
