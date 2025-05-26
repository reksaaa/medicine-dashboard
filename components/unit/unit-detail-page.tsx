"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitMetricsCards } from "@/components/unit/unit-metrics-card";
import { UnitConditionSection } from "@/components/unit/unit-condition-section";
import { UnitInventorySummary } from "@/components/unit/unit-inventory-summary";
import { UnitChartsSection } from "@/components/unit/unit-charts-section";
import { UnitTablesSection } from "@/components/unit/unit-tables-section";
import { NotificationBell } from "@/components/notification/notification-bell";
import { UnitExportReport } from "@/components/unit/unit-export-report";
import { UnitAIInsightsPanel } from "@/components/unit/unit-ai-insights-panel"; // Import the new component
import { getUnits } from "@/lib/actions/medicine";
import { getUnitMetrics } from "@/lib/actions/unit-metrics"; // Import to fetch metrics
import { getItemConditionDistribution } from "@/lib/actions/medicine"; // Import to fetch condition data
import { getUnitStockHistory } from "@/lib/actions/unit-stock-history"; // Import to fetch stock history
import { getMedicinesApproachingExpiry } from "@/lib/actions/unit-stock-history"; // Import to fetch expiry data
import { getTopMedicinesInUnit } from "@/lib/actions/unit-stock-history"; // Import to fetch top medicines
import { getLowStockWarnings } from "@/lib/actions/unit-stock-history"; // Import to fetch low stock items
import { getUnitInventorySummary } from "@/lib/actions/unit-metrics"; // Import to fetch inventory summary
import { useRouter } from "next/navigation";

interface UnitDetailPageProps {
  unit: {
    id: number;
    namaUnit: string;
    kodeUnit: string;
    akronim: string;
    levelUnit: number;
    lokasi?: string;
    alamat?: string;
  };
}

interface Unit {
  id: number;
  namaUnit: string;
  kodeUnit: string;
  akronim: string;
  levelUnit: number;
}

export function UnitDetailPage({ unit }: UnitDetailPageProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    unit.id.toString()
  );
  const [selectedMedicines, setSelectedMedicines] = useState<number[]>([]);

  // New states for AI insights data
  const [metrics, setMetrics] = useState<any>(null);
  const [conditionData, setConditionData] = useState<any>(null);
  const [stockHistory, setStockHistory] = useState<any>(null);
  const [expiryData, setExpiryData] = useState<any>(null);
  const [topMedicines, setTopMedicines] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any>(null);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all units for the dropdown
  useEffect(() => {
    if (!mounted) return;

    async function fetchUnits() {
      try {
        const unitsResponse = await getUnits();
        if (unitsResponse.success && unitsResponse.data) {
          setUnits(unitsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    }

    fetchUnits();
  }, [mounted]);

  // Fetch data for AI insights
  useEffect(() => {
    if (!mounted) return;

    async function fetchDataForInsights() {
      setIsDataLoading(true);
      try {
        // Fetch unit metrics
        const metricsResponse = await getUnitMetrics(unit.id);
        if (metricsResponse.success && metricsResponse.data) {
          setMetrics(metricsResponse.data);
        }

        // Fetch inventory summary
        const inventorySummaryResponse = await getUnitInventorySummary(unit.id);
        if (inventorySummaryResponse.success && inventorySummaryResponse.data) {
          setInventorySummary(inventorySummaryResponse.data);
        }

        // Fetch condition distribution
        const conditionResponse = await getItemConditionDistribution(
          unit.id,
          selectedMedicines.length > 0 ? selectedMedicines : undefined
        );
        if (conditionResponse.success && conditionResponse.data) {
          setConditionData(conditionResponse.data);
        }

        // Fetch stock history
        const stockHistoryResponse = await getUnitStockHistory(unit.id);
        if (stockHistoryResponse.success && stockHistoryResponse.data) {
          setStockHistory(stockHistoryResponse.data);
        }

        // Fetch expiry data
        const expiryResponse = await getMedicinesApproachingExpiry(
          unit.id,
          selectedMedicines.length > 0 ? selectedMedicines : undefined
        );
        if (expiryResponse.success && expiryResponse.data) {
          setExpiryData(expiryResponse.data);
        }

        // Fetch top medicines
        const topMedicinesResponse = await getTopMedicinesInUnit(
          unit.id,
          selectedMedicines.length > 0 ? selectedMedicines : undefined
        );
        if (topMedicinesResponse.success && topMedicinesResponse.data) {
          setTopMedicines(topMedicinesResponse.data);
        }

        // Fetch low stock items
        const lowStockResponse = await getLowStockWarnings(
          unit.id,
          selectedMedicines.length > 0 ? selectedMedicines : undefined
        );
        if (lowStockResponse.success && lowStockResponse.data) {
          setLowStockItems(lowStockResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data for insights:", error);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchDataForInsights();
  }, [unit.id, selectedMedicines, mounted]);

  // Handle unit selection
  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);

    if (unitId === "overview") {
      window.location.href = `/dashboard`;
    } else {
      window.location.href = `/dashboard/unit/${unitId}`;
    }
  };

  // Handle medicine selection from filter
  const handleMedicineSelectionChange = (medicineIds: number[]) => {
    setSelectedMedicines(medicineIds);
  };

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null;
  }

  // Determine location display text
  const locationText =
    unit.lokasi || unit.alamat || `Unit Code: ${unit.kodeUnit}`;

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              {unit.namaUnit}
            </h2>
            <p className="text-muted-foreground">{locationText}</p>
          </div>
          <div className="flex items-center gap-2">
            <UnitExportReport
              unitId={unit.id}
              unitName={unit.namaUnit}
              selectedMedicines={selectedMedicines}
            />
            <NotificationBell />
            <Select value={selectedUnitId} onValueChange={handleUnitChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.namaUnit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Inventory Summary */}
        <UnitInventorySummary unitId={unit.id} />

        {/* Unit Metrics Cards */}
        <div className="mt-6">
          <UnitMetricsCards unitId={unit.id} />
        </div>

        {/* Unit Condition Section with Chart and Filter */}
        <div className="mt-6">
          <UnitConditionSection
            unitId={unit.id}
            onMedicineSelectionChange={handleMedicineSelectionChange}
          />
        </div>

        {/* Stock History and Expiry Charts */}
        <div className="mt-6">
          <UnitChartsSection
            unitId={unit.id}
            selectedMedicines={selectedMedicines}
          />
        </div>

        {/* Tables Section with Top Medicines and Low Stock */}
        <div className="mt-6">
          <UnitTablesSection
            unitId={unit.id}
            selectedMedicines={selectedMedicines}
            unitName={unit.namaUnit}
          />
        </div>

        {/* Add AI Insights Panel at the bottom */}
        <div className="mt-6">
          <UnitAIInsightsPanel
            unitId={unit.id}
            unitName={unit.namaUnit}
            metrics={metrics}
            selectedMedicines={selectedMedicines}
            inventorySummary={inventorySummary}
            conditionData={conditionData}
            stockHistory={stockHistory}
            expiryData={expiryData}
            topMedicines={topMedicines}
            lowStockItems={lowStockItems}
            isLoading={isDataLoading}
          />
        </div>
      </div>
    </div>
  );
}
