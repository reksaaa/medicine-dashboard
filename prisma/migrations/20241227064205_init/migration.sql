-- CreateTable
CREATE TABLE "Medicine" (
    "id" SERIAL NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "medicine_type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "transaction_status" TEXT NOT NULL,
    "stock_status" TEXT NOT NULL,
    "delivery_batch" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLevel" (
    "id" SERIAL NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "distributionCenterId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataDashboard" (
    "id" SERIAL NOT NULL,
    "lowest_demand" DOUBLE PRECISION NOT NULL,
    "slowest_moving" DOUBLE PRECISION NOT NULL,
    "top_distributed" DOUBLE PRECISION NOT NULL,
    "highest_demand" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DataDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionCenter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DistributionCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockLevel_medicineId_distributionCenterId_key" ON "StockLevel"("medicineId", "distributionCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_distributionCenterId_fkey" FOREIGN KEY ("distributionCenterId") REFERENCES "DistributionCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
