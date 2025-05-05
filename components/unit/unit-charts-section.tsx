"use client"

import { UnitStockHistoryChart } from "@/components/unit/unit-stock-history-chart"
import { UnitExpiryChart } from "@/components/unit/unit-expiry-chart"

interface UnitChartsSectionProps {
  unitId: number
  selectedMedicines: number[]
}

export function UnitChartsSection({ unitId, selectedMedicines }: UnitChartsSectionProps) {
  return (
    <div className="grid gap-4 grid-cols-12">
      {/* Stock History Chart takes up 6/12 columns (50%) */}
      <div className="col-span-6">
        <UnitStockHistoryChart unitId={unitId} />
      </div>
      {/* Expiry Chart takes up 6/12 columns (50%) */}
      <div className="col-span-6">
        <UnitExpiryChart unitId={unitId} selectedMedicines={selectedMedicines} />
      </div>
    </div>
  )
}
