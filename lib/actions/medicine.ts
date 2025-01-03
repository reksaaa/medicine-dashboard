"use server";

import prisma from "@/lib/prisma";

export async function findMedicine(id: number) {
  try {
    const data = await prisma.stockLevel.findMany({
      where: {
        distributionCenterId: id,
      },
      include: {
        medicine: true,
        distributionCenter: true,
      },
    });
    return { data: data, success: true };
  } catch (error) {
    console.error("Deletion error:", error);
    return {
      success: false,
      error: `Failed to delete user: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
