/*
  Warnings:

  - You are about to drop the column `statusId` on the `dbo.Persediaan` table. All the data in the column will be lost.
  - You are about to drop the column `statusMax` on the `dbo.Persediaan` table. All the data in the column will be lost.
  - Added the required column `satuanMax` to the `dbo.Persediaan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dbo.Persediaan" DROP COLUMN "statusId",
DROP COLUMN "statusMax",
ADD COLUMN     "satuanMax" INTEGER NOT NULL;
