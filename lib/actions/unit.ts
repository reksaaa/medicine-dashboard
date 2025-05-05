"use server"

import prisma from "@/lib/prisma"

export async function getUnits() {
  try {
    const units = await prisma.unit.findMany({
      where: {
        temp: false, // Only get active units
      },
      orderBy: {
        namaUnit: "asc",
      },
    })

    return {
      data: units,
      success: true,
    }
  } catch (error) {
    console.error("Error fetching units:", error)
    return {
      success: false,
      error: `Failed to fetch units: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function getUnitById(unitId: number) {
  try {
    const unit = await prisma.unit.findUnique({
      where: {
        id: unitId,
      },
    })

    if (!unit) {
      return {
        success: false,
        error: `Unit with ID ${unitId} not found`,
      }
    }

    // Since unitLokasi doesn't exist, we'll use the unit's own fields
    // We'll format a location string based on available unit data
    const unitWithLocation = {
      ...unit,
      // Use existing fields from the unit table to create a location string
      lokasi: unit.alamat || `${unit.kodeUnit} - ${unit.akronim || ""}`,
    }

    return {
      success: true,
      data: unitWithLocation,
    }
  } catch (error) {
    console.error("Error fetching unit:", error)
    return {
      success: false,
      error: `Failed to fetch unit: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function getUnitInventorySummary(unitId: number) {
  try {
    // Get all stock data for the unit
    const stockData = await prisma.stokOpname.findMany({
      where: {
        unitId: unitId,
      },
      select: {
        jumlah: true,
        rusakRingan: true,
        rusakBerat: true,
        usang: true,
        hilang: true,
        tanggalExpired: true,
      },
    })

    // Get receipts count
    const receiptsCount = await prisma.rincianPenerimaan.count({
      where: {
        unitId: unitId,
      },
    })

    // Get dispensed count
    const dispensedCount = await prisma.rincianPengeluaran.count({
      where: {
        pengeluaran: {
          unitId: unitId,
        },
      },
    })

    // Calculate totals
    let totalInventory = 0
    let damagedOrExpired = 0
    let expiredMedicines = 0
    const currentDate = new Date();

    stockData.forEach((item) => {
      const itemTotal = item.jumlah || 0
      const itemDamaged = (item.rusakRingan || 0) + (item.rusakBerat || 0) + (item.usang || 0) + (item.hilang || 0)

      totalInventory += itemTotal
      damagedOrExpired += itemDamaged

      // Check for expired medicines
      if (item.tanggalExpired && item.tanggalExpired < currentDate) {
        expiredMedicines += item.jumlah || 0
      }
    })

    // Calculate available (total minus damaged)
    const available = Math.max(0, totalInventory - damagedOrExpired)

    return {
      success: true,
      data: {
        totalInventory,
        available,
        damagedOrExpired,
        totalReceipts: receiptsCount,
        totalDispensed: dispensedCount,
        expiredMedicines,
      },
    }
  } catch (error) {
    console.error("Error fetching unit inventory summary:", error)
    return {
      success: false,
      error: `Failed to fetch inventory summary: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}