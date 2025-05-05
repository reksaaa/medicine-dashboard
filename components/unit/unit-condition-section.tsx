"use client"

import { useState } from "react"
import { UnitConditionChart } from "@/components/unit/unit-condition-chart"
import { UnitMedicineFilter } from "@/components/unit/unit-medicine-filter"

interface UnitConditionSectionProps {
  unitId: number
  onMedicineSelectionChange?: (selectedIds: number[]) => void
}

export function UnitConditionSection({ unitId, onMedicineSelectionChange }: UnitConditionSectionProps) {
  const [selectedMedicines, setSelectedMedicines] = useState<number[]>([])

  const handleSelectionChange = (ids: number[]) => {
    setSelectedMedicines(ids)
    if (onMedicineSelectionChange) {
      onMedicineSelectionChange(ids)
    }
  }

  return (
    <div className="grid gap-4 grid-cols-12">
      {/* Chart takes up 8/12 columns (66.67%) */}
      <div className="col-span-8">
        <UnitConditionChart unitId={unitId} selectedMedicines={selectedMedicines} />
      </div>
      {/* Filter takes up 4/12 columns (33.33%) */}
      <div className="col-span-4">
        <UnitMedicineFilter unitId={unitId} onSelectionChange={handleSelectionChange} />
      </div>
    </div>
  )
}
