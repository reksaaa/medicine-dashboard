"use server"

import prisma from "../prisma";

export async function getDistribution(id: number) {
    try {
      const data = await prisma.distributionCenter.findUnique({
        where: {
          id: id,
        }
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