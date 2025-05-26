import { type NextRequest, NextResponse } from "next/server"
import { getUnitMedicines } from "@/lib/actions/forecasting"

export async function GET(request: NextRequest, { params }: { params: { unitId: string } }) {
  try {
    const unitId = Number.parseInt(params.unitId)

    if (!unitId) {
      return NextResponse.json({ success: false, error: "Invalid unit ID" }, { status: 400 })
    }

    const result = await getUnitMedicines(unitId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching medicines:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
