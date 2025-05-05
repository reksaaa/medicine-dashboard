"use server"

import prisma from "@/lib/prisma"

// Get all units with coordinates for the map
export async function getUnitsForMap() {
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
      success: true,
      data: units,
    }
  } catch (error) {
    console.error("Error fetching units for map:", error)
    return {
      success: false,
      error: `Failed to fetch units: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Get stock opname data for a specific unit
export async function getUnitStockOpname(unitId: number) {
  try {
    const stockData = await prisma.stokOpname.findMany({
      where: {
        unitId: unitId,
      },
      include: {
        persediaan: {
          select: {
            namaPersediaan: true,
            kodePersediaan: true,
            tipe: true,
          },
        },
        satuan: {
          select: {
            satuan: true,
          },
        },
      },
      orderBy: {
        persediaan: {
          namaPersediaan: "asc",
        },
      },
    })

    return {
      success: true,
      data: stockData,
    }
  } catch (error) {
    console.error("Error fetching unit stock opname:", error)
    return {
      success: false,
      error: `Failed to fetch stock data: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Get units with critical inventory status
export async function getUnitsWithCriticalInventory() {
  try {
    // Find units with items that are expired, near expiry, or low in stock
    const currentDate = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30)

    const criticalUnits = await prisma.stokOpname.findMany({
      where: {
        OR: [
          // Expired items
          {
            tanggalExpired: {
              lte: currentDate,
            },
          },
          // Near expiry items
          {
            tanggalExpired: {
              gt: currentDate,
              lte: thirtyDaysFromNow,
            },
          },
          // Low stock items
          {
            jumlah: {
              lt: 10, // Arbitrary threshold
            },
          },
          // Damaged items
          {
            OR: [{ rusakRingan: { gt: 0 } }, { rusakBerat: { gt: 0 } }, { usang: { gt: 0 } }, { hilang: { gt: 0 } }],
          },
        ],
      },
      select: {
        unitId: true,
      },
      distinct: ["unitId"],
    })

    const unitIds = criticalUnits.map((item) => item.unitId)

    return {
      success: true,
      data: unitIds,
    }
  } catch (error) {
    console.error("Error fetching critical units:", error)
    return {
      success: false,
      error: `Failed to fetch critical units: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
