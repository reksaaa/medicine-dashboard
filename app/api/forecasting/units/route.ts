import { NextResponse } from "next/server"
import { getAvailableUnits } from "@/lib/actions/forecasting"

export async function GET() {
  try {
    const result = await getAvailableUnits()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching units:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
