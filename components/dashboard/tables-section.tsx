"use client"

import { TopItemsTable } from "@/components/dashboard/top-items-table"
import { TopLocationsTable } from "@/components/dashboard/top-locations-table"

interface TablesSectionProps {
  selectedMedicines: number[]
}

export function TablesSection({ selectedMedicines }: TablesSectionProps) {
  return (
    <div className="grid gap-4 grid-cols-12">
      {/* Top Items Table takes up 8/12 columns (66.67%) */}
      <div className="col-span-8">
        <TopItemsTable selectedMedicines={selectedMedicines} />
      </div>
      {/* Top Locations Table takes up 4/12 columns (33.33%) */}
      <div className="col-span-4">
        <TopLocationsTable />
      </div>
    </div>
  )
}
