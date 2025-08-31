"use client";
import { TopItemsChart } from "@/components/dashboard/top-items-chart";
import { BlankContainer } from "@/components/dashboard/blank-container";

interface ItemsSectionProps {
  selectedMedicines: number[];
}

export function ItemsSection({ selectedMedicines }: ItemsSectionProps) {
  return (
    <div className="grid gap-4 grid-cols-12">
      {/* Chart takes up 8/12 columns (66.67%) */}
      <div className="col-span-8">
        <TopItemsChart selectedMedicines={selectedMedicines} />
      </div>
      {/* Blank container takes up 4/12 columns (33.33%) */}
      <div className="col-span-4">
        <BlankContainer />
      </div>
    </div>
  );
}
