"use client"

import { UnitTopMedicinesTable } from "@/components/unit/unit-top-medicines-table"
import { UnitLowStockTable } from "@/components/unit/unit-low-stock-table"

interface UnitTablesSectionProps {
  unitId: number
  selectedMedicines: number[]
  unitName: string
}

export function UnitTablesSection({ unitId, selectedMedicines, unitName }: UnitTablesSectionProps) {
  return (
    <div className="space-y-6">
      {/* Top Medicines Table */}
      <UnitTopMedicinesTable unitId={unitId} selectedMedicines={selectedMedicines} unitName={unitName} />

      {/* Low Stock Table */}
      <UnitLowStockTable unitId={unitId} selectedMedicines={selectedMedicines} unitName={unitName} />
    </div>
  )
}
