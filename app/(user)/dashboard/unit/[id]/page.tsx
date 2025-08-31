import { UnitDetailPage } from "@/components/unit/unit-detail-page"
import { notFound } from "next/navigation"
import { getUnitById } from "@/lib/actions/unit"

interface UnitPageProps {
  params: {
    id: string
  }
}

export default async function UnitPage({ params }: UnitPageProps) {
  // Convert the id to a number
  const unitId = Number.parseInt(params.id, 10)

  // If the id is not a valid number, return 404
  if (isNaN(unitId)) {
    notFound()
  }

  try {
    // Fetch unit data
    const unitResponse = await getUnitById(unitId)

    // If unit not found, return 404
    if (!unitResponse.success || !unitResponse.data) {
      notFound()
    }

    return <UnitDetailPage unit={unitResponse.data} />
  } catch (error) {
    console.error("Error in unit page:", error)
    notFound()
  }
}
