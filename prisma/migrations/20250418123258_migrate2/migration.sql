/*
  Warnings:

  - You are about to drop the column `jenisPersediaan` on the `dbo.Persediaan` table. All the data in the column will be lost.
  - Added the required column `lenisPersediaan` to the `dbo.Persediaan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dbo.Persediaan" DROP COLUMN "jenisPersediaan",
ADD COLUMN     "lenisPersediaan" TEXT NOT NULL;
