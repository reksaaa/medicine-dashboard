import { type NextRequest, NextResponse } from "next/server"
import { generateForecast } from "@/lib/actions/forecasting"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = Number.parseInt(searchParams.get("unit_id") || "0")
    const medicineId = Number.parseInt(searchParams.get("medicine_id") || "0")
    const periods = Number.parseInt(searchParams.get("periods") || "6")

    if (!unitId || !medicineId) {
      return NextResponse.json({ success: false, error: "Unit ID and Medicine ID are required" }, { status: 400 })
    }

    const result = await generateForecast(unitId, medicineId, periods)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in forecast API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
