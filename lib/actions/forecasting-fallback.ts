"use server"

import prisma from "@/lib/prisma"
import type { Unit, Medicine } from "@/lib/forecasting/types"

// Fallback function to get units directly from database
export async function getAvailableUnitsFromDB(): Promise<{ success: boolean; data?: Unit[]; error?: string }> {
  try {
    const units = await prisma.unit.findMany({
      where: {
        temp: false,
        penerimaan: {
          some: {}, // Only units that have received medicines
        },
      },
      select: {
        id: true,
        namaUnit: true,
        kodeUnit: true,
      },
      orderBy: {
        namaUnit: "asc",
      },
    })

    return {
      success: true,
      data: units.map((unit) => ({
        id: unit.id,
        namaUnit: unit.namaUnit,
        kodeUnit: unit.kodeUnit,
      })),
    }
  } catch (error) {
    console.error("Error fetching units from database:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    }
  }
}

// Fallback function to get medicines directly from database
export async function getUnitMedicinesFromDB(
  unitId: number,
): Promise<{ success: boolean; data?: Medicine[]; error?: string }> {
  try {
    const medicines = await prisma.persediaan.findMany({
      where: {
        temp: false,
        rincianPenerimaan: {
          some: {
            unitId: unitId,
          },
        },
      },
      select: {
        id: true,
        namaPersediaan: true,
        kodePersediaan: true,
      },
      orderBy: {
        namaPersediaan: "asc",
      },
    })

    return {
      success: true,
      data: medicines.map((medicine) => ({
        id: medicine.id,
        namaPersediaan: medicine.namaPersediaan,
        kodePersediaan: medicine.kodePersediaan,
      })),
    }
  } catch (error) {
    console.error("Error fetching medicines from database:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    }
  }
}
