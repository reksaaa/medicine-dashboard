/*
  Warnings:

  - You are about to drop the column `lenisPersediaan` on the `dbo.Persediaan` table. All the data in the column will be lost.
  - Added the required column `levelPersediaan` to the `dbo.Persediaan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dbo.Persediaan" DROP COLUMN "lenisPersediaan",
ADD COLUMN     "levelPersediaan" TEXT NOT NULL;
