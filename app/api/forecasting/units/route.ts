import { NextResponse } from "next/server"
import prisma  from "@/lib/prisma"

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      where: {
        penerimaan: {
          some: {
            rincianPenerimaan: {
              some: {},
            },
          },
        },
      },
      select: {
        id: true,
        namaUnit: true,
        kodeUnit: true,
      },
      distinct: ["id"],
    })

    return NextResponse.json({
      success: true,
      data: units,
    })
  } catch (error) {
    console.error("Error fetching units:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch units" }, { status: 500 })
  }
}
