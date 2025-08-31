"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DebugPanelProps {
  metrics: any;
  stockLevels?: any;
  expiryData?: any;
  topItems?: any;
  lowStockItems?: any;
  conditionData?: any;
  recentMovements?: any;
}

export function UnitDebugPanel({
  metrics,
  stockLevels,
  expiryData,
  topItems,
  lowStockItems,
  conditionData,
  recentMovements
}: DebugPanelProps) {
  // Detailed info about what data is actually loaded
  const dataInfo = {
    metrics: metrics ? 
      `✅ ${Object.keys(metrics).length} keys` : 
      "❌ Missing",
    stockLevels: stockLevels ? 
      `✅ ${Array.isArray(stockLevels) ? stockLevels.length + " items" : Object.keys(stockLevels).length + " keys"}` : 
      "❌ Missing",
    expiryData: expiryData ? 
      `✅ ${Array.isArray(expiryData) ? expiryData.length + " items" : Object.keys(expiryData).length + " keys"}` : 
      "❌ Missing",
    topItems: topItems ? 
      `✅ ${Array.isArray(topItems) ? topItems.length + " items" : Object.keys(topItems).length + " keys"}` : 
      "❌ Missing",
    lowStockItems: lowStockItems ? 
      `✅ ${Array.isArray(lowStockItems) ? lowStockItems.length + " items" : Object.keys(lowStockItems).length + " keys"}` : 
      "❌ Missing",
    conditionData: conditionData ? 
      `✅ ${Array.isArray(conditionData) ? conditionData.length + " items" : Object.keys(conditionData).length + " keys"}` : 
      "❌ Missing",
    recentMovements: recentMovements ? 
      `✅ ${Array.isArray(recentMovements) ? recentMovements.length + " items" : Object.keys(recentMovements).length + " keys"}` : 
      "❌ Missing",
  }

  // Get counts of loaded vs missing data
  const loadedCount = Object.values(dataInfo).filter(v => v.includes("✅")).length;
  const totalCount = Object.values(dataInfo).length;

  return (
    <Card className="border-2 border-amber-100">
      <CardHeader className="bg-amber-50 pb-2">
        <CardTitle className="text-sm">Debug: Data Load Status ({loadedCount}/{totalCount} loaded)</CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        <ul>
          {Object.entries(dataInfo).map(([key, value]) => (
            <li key={key} className={`mb-1 ${value.includes("❌") ? "text-red-600" : "text-green-600"}`}>
              <strong>{key}:</strong> {value}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}