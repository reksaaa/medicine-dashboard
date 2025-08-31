/*
  Warnings:

  - You are about to drop the `DataDashboard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DistributionCenter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Medicine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockLevel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockLevel" DROP CONSTRAINT "StockLevel_distributionCenterId_fkey";

-- DropForeignKey
ALTER TABLE "StockLevel" DROP CONSTRAINT "StockLevel_medicineId_fkey";

-- DropTable
DROP TABLE "DataDashboard";

-- DropTable
DROP TABLE "DistributionCenter";

-- DropTable
DROP TABLE "Medicine";

-- DropTable
DROP TABLE "StockLevel";

-- CreateTable
CREATE TABLE "dbo.Kondisi" (
    "KondisiId" SERIAL NOT NULL,
    "kondisi" TEXT NOT NULL,
    "temp" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dbo.Kondisi_pkey" PRIMARY KEY ("KondisiId")
);

-- CreateTable
CREATE TABLE "dbo.Satuan" (
    "SatuanId" SERIAL NOT NULL,
    "satuan" TEXT NOT NULL,
    "temp" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dbo.Satuan_pkey" PRIMARY KEY ("SatuanId")
);

-- CreateTable
CREATE TABLE "dbo.Persediaan" (
    "PersediaanId" SERIAL NOT NULL,
    "namaPersediaan" TEXT NOT NULL,
    "kodePersediaan" TEXT NOT NULL,
    "jenisPersediaan" TEXT NOT NULL,
    "statusId" INTEGER NOT NULL,
    "statusMax" INTEGER NOT NULL,
    "jumlahMax" INTEGER NOT NULL,
    "tipe" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "temp" BOOLEAN NOT NULL DEFAULT false,
    "accessedBy" TEXT NOT NULL,
    "accessedOn" TIMESTAMP(3) NOT NULL,
    "satuanId" INTEGER NOT NULL,

    CONSTRAINT "dbo.Persediaan_pkey" PRIMARY KEY ("PersediaanId")
);

-- CreateTable
CREATE TABLE "dbo.Unit" (
    "UnitId" SERIAL NOT NULL,
    "namaUnit" TEXT NOT NULL,
    "kodeUnit" TEXT NOT NULL,
    "akronim" TEXT NOT NULL,
    "levelUnit" INTEGER NOT NULL,
    "temp" BOOLEAN NOT NULL DEFAULT false,
    "operator" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "alamat" TEXT NOT NULL,

    CONSTRAINT "dbo.Unit_pkey" PRIMARY KEY ("UnitId")
);

-- CreateTable
CREATE TABLE "dbo.Penerimaan" (
    "PenerimaanId" SERIAL NOT NULL,
    "nomorPenerimaan" TEXT NOT NULL,
    "tanggalPenerimaan" TIMESTAMP(3) NOT NULL,
    "uraian" TEXT NOT NULL,
    "tanggalSah" TIMESTAMP(3) NOT NULL,
    "temp" BOOLEAN NOT NULL DEFAULT false,
    "accessedBy" TEXT NOT NULL,
    "accessedOn" TIMESTAMP(3) NOT NULL,
    "unitId" INTEGER NOT NULL,

    CONSTRAINT "dbo.Penerimaan_pkey" PRIMARY KEY ("PenerimaanId")
);

-- CreateTable
CREATE TABLE "dbo.RincianPenerimaan" (
    "RincianPenerimaanId" SERIAL NOT NULL,
    "banyak" DOUBLE PRECISION NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "tahun" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "temp" BOOLEAN NOT NULL DEFAULT false,
    "accessedBy" TEXT NOT NULL,
    "accessedOn" TIMESTAMP(3) NOT NULL,
    "nomorRegister" TEXT NOT NULL,
    "tanggalExpired" TIMESTAMP(3) NOT NULL,
    "merkTipe" TEXT NOT NULL,
    "spesifikasi" TEXT NOT NULL,
    "penerimaanId" INTEGER NOT NULL,
    "persediaanId" INTEGER NOT NULL,
    "kondisiId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,

    CONSTRAINT "dbo.RincianPenerimaan_pkey" PRIMARY KEY ("RincianPenerimaanId")
);

-- CreateTable
CREATE TABLE "dbo.JenisPengeluaran" (
    "JenisPengeluaranId" SERIAL NOT NULL,
    "jenisPengeluaran" TEXT NOT NULL,

    CONSTRAINT "dbo.JenisPengeluaran_pkey" PRIMARY KEY ("JenisPengeluaranId")
);

-- CreateTable
CREATE TABLE "dbo.Pengeluaran" (
    "PengeluaranId" SERIAL NOT NULL,
    "nomorPengeluaran" TEXT NOT NULL,
    "tanggalSah" TIMESTAMP(3) NOT NULL,
    "temp" BOOLEAN NOT NULL DEFAULT false,
    "keterangan" TEXT NOT NULL,
    "accessedBy" TEXT NOT NULL,
    "accessedOn" TIMESTAMP(3) NOT NULL,
    "jenisPengeluaranId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,

    CONSTRAINT "dbo.Pengeluaran_pkey" PRIMARY KEY ("PengeluaranId")
);

-- CreateTable
CREATE TABLE "dbo.RincianPengeluaran" (
    "RincianPengeluaranId" SERIAL NOT NULL,
    "banyak" DOUBLE PRECISION NOT NULL,
    "accessedBy" TEXT NOT NULL,
    "accessedOn" TIMESTAMP(3) NOT NULL,
    "pengeluaranId" INTEGER NOT NULL,
    "rincianPenerimaanId" INTEGER NOT NULL,
    "persediaanId" INTEGER NOT NULL,

    CONSTRAINT "dbo.RincianPengeluaran_pkey" PRIMARY KEY ("RincianPengeluaranId")
);

-- CreateTable
CREATE TABLE "dbo.StokOpname" (
    "StokOpnameId" SERIAL NOT NULL,
    "nusp" TEXT NOT NULL,
    "saldoAwal" DOUBLE PRECISION NOT NULL,
    "penerimaan" DOUBLE PRECISION NOT NULL,
    "pengeluaran" DOUBLE PRECISION NOT NULL,
    "hilang" DOUBLE PRECISION NOT NULL,
    "rusakRingan" DOUBLE PRECISION NOT NULL,
    "usang" DOUBLE PRECISION NOT NULL,
    "rusakBerat" DOUBLE PRECISION NOT NULL,
    "pemusnahan" DOUBLE PRECISION NOT NULL,
    "koreksi" DOUBLE PRECISION NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tanggalExpired" TIMESTAMP(3) NOT NULL,
    "merkTipe" TEXT NOT NULL,
    "spesifikasi" TEXT NOT NULL,
    "persediaanId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "satuanId" INTEGER NOT NULL,

    CONSTRAINT "dbo.StokOpname_pkey" PRIMARY KEY ("StokOpnameId")
);

-- AddForeignKey
ALTER TABLE "dbo.Persediaan" ADD CONSTRAINT "dbo.Persediaan_satuanId_fkey" FOREIGN KEY ("satuanId") REFERENCES "dbo.Satuan"("SatuanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.Penerimaan" ADD CONSTRAINT "dbo.Penerimaan_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "dbo.Unit"("UnitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.RincianPenerimaan" ADD CONSTRAINT "dbo.RincianPenerimaan_penerimaanId_fkey" FOREIGN KEY ("penerimaanId") REFERENCES "dbo.Penerimaan"("PenerimaanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.RincianPenerimaan" ADD CONSTRAINT "dbo.RincianPenerimaan_persediaanId_fkey" FOREIGN KEY ("persediaanId") REFERENCES "dbo.Persediaan"("PersediaanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.RincianPenerimaan" ADD CONSTRAINT "dbo.RincianPenerimaan_kondisiId_fkey" FOREIGN KEY ("kondisiId") REFERENCES "dbo.Kondisi"("KondisiId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.RincianPenerimaan" ADD CONSTRAINT "dbo.RincianPenerimaan_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "dbo.Unit"("UnitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.Pengeluaran" ADD CONSTRAINT "dbo.Pengeluaran_jenisPengeluaranId_fkey" FOREIGN KEY ("jenisPengeluaranId") REFERENCES "dbo.JenisPengeluaran"("JenisPengeluaranId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.Pengeluaran" ADD CONSTRAINT "dbo.Pengeluaran_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "dbo.Unit"("UnitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.RincianPengeluaran" ADD CONSTRAINT "dbo.RincianPengeluaran_pengeluaranId_fkey" FOREIGN KEY ("pengeluaranId") REFERENCES "dbo.Pengeluaran"("PengeluaranId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.RincianPengeluaran" ADD CONSTRAINT "dbo.RincianPengeluaran_rincianPenerimaanId_fkey" FOREIGN KEY ("rincianPenerimaanId") REFERENCES "dbo.RincianPenerimaan"("RincianPenerimaanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.RincianPengeluaran" ADD CONSTRAINT "dbo.RincianPengeluaran_persediaanId_fkey" FOREIGN KEY ("persediaanId") REFERENCES "dbo.Persediaan"("PersediaanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.StokOpname" ADD CONSTRAINT "dbo.StokOpname_persediaanId_fkey" FOREIGN KEY ("persediaanId") REFERENCES "dbo.Persediaan"("PersediaanId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.StokOpname" ADD CONSTRAINT "dbo.StokOpname_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "dbo.Unit"("UnitId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dbo.StokOpname" ADD CONSTRAINT "dbo.StokOpname_satuanId_fkey" FOREIGN KEY ("satuanId") REFERENCES "dbo.Satuan"("SatuanId") ON DELETE RESTRICT ON UPDATE CASCADE;
