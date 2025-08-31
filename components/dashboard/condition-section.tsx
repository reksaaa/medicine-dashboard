"use client"

import { useState } from "react"
import { ConditionChart } from "@/components/dashboard/condition-chart"
import { MedicineFilter } from "@/components/dashboard/medicine-filter"

interface ConditionSectionProps {
  onMedicineSelectionChange?: (selectedIds: number[]) => void
}

export function ConditionSection({ onMedicineSelectionChange }: ConditionSectionProps) {
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
        <ConditionChart selectedMedicines={selectedMedicines} />
      </div>
      {/* Filter takes up 4/12 columns (33.33%) */}
      <div className="col-span-4">
        <MedicineFilter onSelectionChange={handleSelectionChange} />
      </div>
    </div>
  )
}
