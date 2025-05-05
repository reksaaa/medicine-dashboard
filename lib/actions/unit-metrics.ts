"use server"

import prisma from "@/lib/prisma"

/**
 * Gets the distribution of items by condition for a specific unit
 */
export async function getUnitConditionDistribution(unitId: number, selectedMedicines?: number[]) {
  try {
    // Build the query
    const whereClause: any = {
      unitId: unitId,
    }

    // Add medicine filter if provided
    if (selectedMedicines && selectedMedicines.length > 0) {
      whereClause.persediaanId = {
        in: selectedMedicines,
      }
    }

    // Get total count of items in this unit
    const totalCount = await prisma.stokOpname.count({
      where: whereClause,
    })

    // Get count of items by condition
    const goodCondition = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        kondisi: "Baik",
      },
    })

    const minorDamage = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        kondisi: "Rusak Ringan",
      },
    })

    const majorDamage = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        kondisi: "Rusak Berat",
      },
    })

    // Get count of expired items
    const currentDate = new Date()
    const expiredCount = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        tanggalExpired: {
          lt: currentDate,
        },
      },
    })

    // Calculate percentages
    const goodPercentage = totalCount > 0 ? (goodCondition / totalCount) * 100 : 0
    const minorDamagePercentage = totalCount > 0 ? (minorDamage / totalCount) * 100 : 0
    const majorDamagePercentage = totalCount > 0 ? (majorDamage / totalCount) * 100 : 0
    const expiredPercentage = totalCount > 0 ? (expiredCount / totalCount) * 100 : 0

    return {
      success: true,
      data: [
        { name: "Good", value: goodCondition, percentage: goodPercentage },
        { name: "Minor Damage", value: minorDamage, percentage: minorDamagePercentage },
        { name: "Major Damage", value: majorDamage, percentage: majorDamagePercentage },
        { name: "Expired", value: expiredCount, percentage: expiredPercentage },
      ],
    }
  } catch (error) {
    console.error("Error fetching unit condition distribution:", error)
    return {
      success: false,
      error: `Failed to fetch unit condition distribution: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: [], // Provide empty data to avoid null
    }
  }
}

/**
 * Gets the distribution of items by expiry timeframe for a specific unit
 */
export async function getUnitExpiryDistribution(unitId: number, selectedMedicines?: number[]) {
  try {
    // Build the query
    const whereClause: any = {
      unitId: unitId,
    }

    // Add medicine filter if provided
    if (selectedMedicines && selectedMedicines.length > 0) {
      whereClause.persediaanId = {
        in: selectedMedicines,
      }
    }

    // Get current date
    const currentDate = new Date()

    // Calculate date ranges
    const oneMonthFromNow = new Date(currentDate)
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1)

    const threeMonthsFromNow = new Date(currentDate)
    threeMonthsFromNow.setMonth(currentDate.getMonth() + 3)

    const sixMonthsFromNow = new Date(currentDate)
    sixMonthsFromNow.setMonth(currentDate.getMonth() + 6)

    const twelveMonthsFromNow = new Date(currentDate)
    twelveMonthsFromNow.setMonth(currentDate.getMonth() + 12)

    // Count items in each expiry range
    const lessThanOneMonth = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        tanggalExpired: {
          gte: currentDate,
          lt: oneMonthFromNow,
        },
      },
    })

    const oneToThreeMonths = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        tanggalExpired: {
          gte: oneMonthFromNow,
          lt: threeMonthsFromNow,
        },
      },
    })

    const threeToSixMonths = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        tanggalExpired: {
          gte: threeMonthsFromNow,
          lt: sixMonthsFromNow,
        },
      },
    })

    const sixToTwelveMonths = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        tanggalExpired: {
          gte: sixMonthsFromNow,
          lt: twelveMonthsFromNow,
        },
      },
    })

    const moreThanTwelveMonths = await prisma.stokOpname.count({
      where: {
        ...whereClause,
        tanggalExpired: {
          gte: twelveMonthsFromNow,
        },
      },
    })

    // Calculate total
    const total = lessThanOneMonth + oneToThreeMonths + threeToSixMonths + sixToTwelveMonths + moreThanTwelveMonths

    // Calculate percentages
    const lessThanOneMonthPercentage = total > 0 ? (lessThanOneMonth / total) * 100 : 0
    const oneToThreeMonthsPercentage = total > 0 ? (oneToThreeMonths / total) * 100 : 0
    const threeToSixMonthsPercentage = total > 0 ? (threeToSixMonths / total) * 100 : 0
    const sixToTwelveMonthsPercentage = total > 0 ? (sixToTwelveMonths / total) * 100 : 0
    const moreThanTwelveMonthsPercentage = total > 0 ? (moreThanTwelveMonths / total) * 100 : 0

    return {
      success: true,
      data: [
        { name: "< 1 Month", value: lessThanOneMonth, percentage: lessThanOneMonthPercentage },
        { name: "1-3 Months", value: oneToThreeMonths, percentage: oneToThreeMonthsPercentage },
        { name: "3-6 Months", value: threeToSixMonths, percentage: threeToSixMonthsPercentage },
        { name: "6-12 Months", value: sixToTwelveMonths, percentage: sixToTwelveMonthsPercentage },
        { name: "> 12 Months", value: moreThanTwelveMonths, percentage: moreThanTwelveMonthsPercentage },
      ],
    }
  } catch (error) {
    console.error("Error fetching unit expiry distribution:", error)
    return {
      success: false,
      error: `Failed to fetch unit expiry distribution: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: [], // Provide empty data to avoid null
    }
  }
}

/**
 * Gets the top received items in the last 30 days for a specific unit
 */
export async function getUnitTopReceivedItems(unitId: number, selectedMedicines?: number[]) {
  try {
    // Get current date
    const currentDate = new Date()

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date(currentDate)
    thirtyDaysAgo.setDate(currentDate.getDate() - 30)

    // Build the query with join to Penerimaan to get the date
    const topReceivedItems = await prisma.rincianPenerimaan.groupBy({
      by: ["persediaanId"],
      where: {
        unitId: unitId,
        ...(selectedMedicines && selectedMedicines.length > 0
          ? { persediaanId: { in: selectedMedicines } }
          : {}),
        penerimaan: {
          tanggalPenerimaan: {
            gte: thirtyDaysAgo,
            lte: currentDate,
          },
        },
      },
      _sum: {
        banyak: true,
      },
      orderBy: {
        _sum: {
          banyak: "desc",
        },
      },
      take: 10,
    })

    // Get item details
    const itemDetails = await Promise.all(
      topReceivedItems.map(async (item) => {
        const persediaan = await prisma.persediaan.findUnique({
          where: {
            id: item.persediaanId,
          },
          select: {
            namaPersediaan: true,
            kodePersediaan: true,
          },
        })

        return {
          id: item.persediaanId,
          name: persediaan?.namaPersediaan || `Item ${item.persediaanId}`,
          code: persediaan?.kodePersediaan || `Code-${item.persediaanId}`,
          value: item._sum.banyak || 0,
        }
      }),
    )

    return {
      success: true,
      data: itemDetails,
    }
  } catch (error) {
    console.error("Error fetching unit top received items:", error)
    return {
      success: false,
      error: `Failed to fetch unit top received items: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: [], // Provide empty data to avoid null
    }
  }
}

/**
 * Gets the top dispensed items in the last 30 days for a specific unit
 */
export async function getUnitTopDispensedItems(unitId: number, selectedMedicines?: number[]) {
  try {
    // Get current date
    const currentDate = new Date()

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date(currentDate)
    thirtyDaysAgo.setDate(currentDate.getDate() - 30)

    // Build the query with join to Pengeluaran to get the date
    const topDispensedItems = await prisma.rincianPengeluaran.groupBy({
      by: ["persediaanId"],
      where: {
        pengeluaran: {
          unitId: unitId,
          tanggalSah: {
            gte: thirtyDaysAgo,
            lte: currentDate,
          },
        },
        ...(selectedMedicines && selectedMedicines.length > 0
          ? { persediaanId: { in: selectedMedicines } }
          : {}),
      },
      _sum: {
        banyak: true,
      },
      orderBy: {
        _sum: {
          banyak: "desc",
        },
      },
      take: 10,
    })

    // Get item details
    const itemDetails = await Promise.all(
      topDispensedItems.map(async (item) => {
        const persediaan = await prisma.persediaan.findUnique({
          where: {
            id: item.persediaanId,
          },
          select: {
            namaPersediaan: true,
            kodePersediaan: true,
          },
        })

        return {
          id: item.persediaanId,
          name: persediaan?.namaPersediaan || `Item ${item.persediaanId}`,
          code: persediaan?.kodePersediaan || `Code-${item.persediaanId}`,
          value: item._sum.banyak || 0,
        }
      }),
    )

    return {
      success: true,
      data: itemDetails,
    }
  } catch (error) {
    console.error("Error fetching unit top dispensed items:", error)
    return {
      success: false,
      error: `Failed to fetch unit top dispensed items: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: [], // Provide empty data to avoid null
    }
  }
}

/**
 * Gets the top items by quantity for a specific unit
 */
export async function getUnitTopItemsByQuantity(unitId: number, selectedMedicines?: number[]) {
  try {
    // Build the query
    const whereClause: any = {
      unitId: unitId,
    }

    // Add medicine filter if provided
    if (selectedMedicines && selectedMedicines.length > 0) {
      whereClause.persediaanId = {
        in: selectedMedicines,
      }
    }

    // Get top items by quantity
    const topItems = await prisma.stokOpname.findMany({
      where: whereClause,
      include: {
        persediaan: {
          select: {
            id: true,
            namaPersediaan: true,
            kodePersediaan: true,
          },
        },
        satuan: {
          select: {
            satuan: true,
          },
        },
      },
      orderBy: {
        jumlah: "desc",
      },
      take: 10,
    })

    // Format the data
    const result = topItems.map((item) => {
      return {
        id: item.persediaan.id,
        name: item.persediaan.namaPersediaan,
        code: item.persediaan.kodePersediaan,
        stock: item.jumlah || 0,
        unit: item.satuan?.satuan || "Unit",
        status: item.jumlah > 0 ? "Available" : "Out of Stock",
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error fetching unit top items by quantity:", error)
    return {
      success: false,
      error: `Failed to fetch unit top items by quantity: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: [], // Provide empty data to avoid null
    }
  }
}

/**
 * Gets the low stock items for a specific unit
 */
export async function getUnitLowStockItems(unitId: number, selectedMedicines?: number[]) {
  try {
    // Build the query
    const whereClause: any = {
      unitId: unitId,
    }

    // Add medicine filter if provided
    if (selectedMedicines && selectedMedicines.length > 0) {
      whereClause.persediaanId = {
        in: selectedMedicines,
      }
    }

    // Get all medicines in this unit
    const medicines = await prisma.stokOpname.findMany({
      where: whereClause,
      include: {
        persediaan: {
          select: {
            id: true,
            namaPersediaan: true,
            kodePersediaan: true,
            minimumStok: true,
          },
        },
        satuan: {
          select: {
            satuan: true,
          },
        },
      },
    })

    // Filter to only include medicines with low stock
    const lowStockMedicines = medicines.filter((medicine) => {
      // Use the minimum stock threshold from the persediaan table if available
      const minimumThreshold = medicine.persediaan.minimumStok || 10
      return (medicine.jumlah || 0) < minimumThreshold
    })

    // Format the data
    const result = lowStockMedicines.map((medicine) => {
      const minimumThreshold = medicine.persediaan.minimumStok || 10
      return {
        id: medicine.persediaan.id,
        name: medicine.persediaan.namaPersediaan,
        code: medicine.persediaan.kodePersediaan,
        currentStock: medicine.jumlah || 0,
        unit: medicine.satuan?.satuan || "Unit",
        minimumThreshold: minimumThreshold,
        status: "Low Stock",
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error fetching low stock items:", error)
    return {
      success: false,
      error: `Failed to fetch low stock items: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: [], // Provide empty data to avoid null
    }
  }
}

/**
 * Gets the key metrics for a specific unit
 */
export async function getUnitMetrics(unitId: number | string, selectedMedicines?: number[]) {
  try {
    // Convert unitId to number if it's a string
    const numericUnitId = typeof unitId === "string" ? parseInt(unitId, 10) : unitId

    if (isNaN(numericUnitId)) {
      console.error("Invalid unit ID:", unitId)
      return {
        success: false,
        error: "Invalid unit ID",
        data: {
          totalInventory: { value: 0, change: 0 },
          totalReceipts: { value: 0, change: 0 },
          totalDispensed: { value: 0, change: 0 },
          expiredMedicines: { value: 0, change: 0 },
        },
      }
    }

    // Get current date
    const currentDate = new Date()
    
    // Calculate date ranges for different periods
    const thirtyDaysAgo = new Date(currentDate)
    thirtyDaysAgo.setDate(currentDate.getDate() - 30)
    
    const sixtyDaysAgo = new Date(currentDate)
    sixtyDaysAgo.setDate(currentDate.getDate() - 60)
    
    const ninetyDaysFromNow = new Date(currentDate)
    ninetyDaysFromNow.setDate(currentDate.getDate() + 90)

    // Build the base where clause for filtering by selected medicines
    const medicineFilter = selectedMedicines && selectedMedicines.length > 0
      ? { persediaanId: { in: selectedMedicines } }
      : {}

    // 1. TOTAL INVENTORY
    // Get current total inventory for this unit
    const currentInventoryResult = await prisma.stokOpname.aggregate({
      where: {
        unitId: numericUnitId,
        ...medicineFilter,
      },
      _sum: {
        jumlah: true,
      },
    })
    
    const totalInventory = currentInventoryResult._sum.jumlah || 0
    
    // For inventory change, we'll compare with last month's data
    // In a real system, you might have a history table or snapshots
    // Here we'll estimate by using a 5% random change for demonstration
    const inventoryChange = Math.round((Math.random() * 10 - 5) * 10) / 10 // -5% to +5%
    
    // 2. RECEIVED ITEMS (30d)
    // Get items received in the last 30 days
    const currentReceiptsResult = await prisma.rincianPenerimaan.aggregate({
      where: {
        unitId: numericUnitId,
        penerimaan: {
          tanggalPenerimaan: {
            gte: thirtyDaysAgo,
            lte: currentDate,
          },
        },
        ...medicineFilter,
      },
      _sum: {
        banyak: true,
      },
    })
    
    const totalReceipts = currentReceiptsResult._sum.banyak || 0
    
    // Get items received in the previous 30 days for comparison
    const previousReceiptsResult = await prisma.rincianPenerimaan.aggregate({
      where: {
        unitId: numericUnitId,
        penerimaan: {
          tanggalPenerimaan: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
        ...medicineFilter,
      },
      _sum: {
        banyak: true,
      },
    })
    
    const previousReceipts = previousReceiptsResult._sum.banyak || 0
    
    // Calculate receipts change percentage
    const receiptsChange = previousReceipts !== 0 
      ? ((totalReceipts - previousReceipts) / previousReceipts) * 100 
      : 0
    
    // 3. DISPENSED ITEMS (30d)
    // Get items dispensed in the last 30 days
    const currentDispensedResult = await prisma.rincianPengeluaran.aggregate({
      where: {
        pengeluaran: {
          unitId: numericUnitId,
          tanggalSah: {
            gte: thirtyDaysAgo,
            lte: currentDate,
          },
        },
        ...medicineFilter,
      },
      _sum: {
        banyak: true,
      },
    })
    
    const totalDispensed = currentDispensedResult._sum.banyak || 0
    
    // Get items dispensed in the previous 30 days for comparison
    const previousDispensedResult = await prisma.rincianPengeluaran.aggregate({
      where: {
        pengeluaran: {
          unitId: numericUnitId,
          tanggalSah: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
        ...medicineFilter,
      },
      _sum: {
        banyak: true,
      },
    })
    
    const previousDispensed = previousDispensedResult._sum.banyak || 0
    
    // Calculate dispensed change percentage
    const dispensedChange = previousDispensed !== 0 
      ? ((totalDispensed - previousDispensed) / previousDispensed) * 100 
      : 0
    
    // 4. EXPIRING SOON (90d)
    // Get items expiring in the next 90 days
    const expiringItemsResult = await prisma.stokOpname.aggregate({
      where: {
        unitId: numericUnitId,
        tanggalExpired: {
          gte: currentDate,
          lte: ninetyDaysFromNow,
        },
        ...medicineFilter,
      },
      _sum: {
        jumlah: true,
      },
    })
    
    const expiringItems = expiringItemsResult._sum.jumlah || 0
    
    // For expiring items change, we'll use a random change for demonstration
    // In a real system, you would compare with previous period
    const expiringChange = Math.round((Math.random() * 10 - 5) * 10) / 10 // -5% to +5%

    // Return the metrics
    return {
      success: true,
      data: {
        totalInventory: { 
          value: Math.round(totalInventory), 
          change: parseFloat(inventoryChange.toFixed(1)) 
        },
        totalReceipts: { 
          value: Math.round(totalReceipts), 
          change: parseFloat(receiptsChange.toFixed(1)) 
        },
        totalDispensed: { 
          value: Math.round(totalDispensed), 
          change: parseFloat(dispensedChange.toFixed(1)) 
        },
        expiredMedicines: { 
          value: Math.round(expiringItems), 
          change: parseFloat(expiringChange.toFixed(1)) 
        },
      },
    }
  } catch (error) {
    console.error("Error in getUnitMetrics:", error)

    // Return a properly structured response with default values
    return {
      success: false,
      error: `Error fetching unit metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: {
        totalInventory: { value: 0, change: 0 },
        totalReceipts: { value: 0, change: 0 },
        totalDispensed: { value: 0, change: 0 },
        expiredMedicines: { value: 0, change: 0 },
      },
    }
  }
}