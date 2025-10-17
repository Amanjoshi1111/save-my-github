/*
  Warnings:

  - Added the required column `repoName` to the `backup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "backup" ADD COLUMN     "repoName" TEXT NOT NULL;
