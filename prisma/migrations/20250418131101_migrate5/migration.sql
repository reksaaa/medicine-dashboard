/*
  Warnings:

  - You are about to drop the column `accessedBy` on the `dbo.Persediaan` table. All the data in the column will be lost.
  - You are about to drop the column `accessedOn` on the `dbo.Persediaan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dbo.Persediaan" DROP COLUMN "accessedBy",
DROP COLUMN "accessedOn";
