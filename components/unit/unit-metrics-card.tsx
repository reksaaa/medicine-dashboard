"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getUnitMetrics } from "@/lib/actions/unit-metrics"
import { ArrowDown, ArrowUp, Package, ShoppingCart, Truck, AlertTriangle } from "lucide-react"

interface UnitMetricsCardsProps {
  unitId: string | number
  selectedMedicines?: number[]
}

export function UnitMetricsCards({ unitId, selectedMedicines = [] }: UnitMetricsCardsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        // Convert unitId to string if it's a number
        const id = typeof unitId === "number" ? unitId : unitId

        // Create a stable dependency for selectedMedicines
        const medicineFilter = selectedMedicines && selectedMedicines.length > 0 ? [...selectedMedicines] : undefined

        const response = await getUnitMetrics(id, medicineFilter)

        if (response.success) {
          setMetrics(response.data)
        } else {
          setError(response.message || "Failed to fetch metrics")
        }
      } catch (err) {
        setError("An error occurred while fetching metrics")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [unitId, JSON.stringify(selectedMedicines)]) // Use JSON.stringify to create a stable dependency

  // Format number with commas
  const formatNumber = (num: number) => {
    if (num === undefined || num === null) return "0"
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Inventory Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : error ? (
            <div className="text-sm text-red-500">Error loading data</div>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalInventory?.value || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.totalInventory?.change >= 0 ? (
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    {metrics?.totalInventory?.change?.toFixed(1) || "0.0"}% from last month
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <ArrowDown className="mr-1 h-3 w-3" />
                    {Math.abs(metrics?.totalInventory?.change || 0).toFixed(1)}% from last month
                  </span>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Received Items Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Received Items (30d)</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : error ? (
            <div className="text-sm text-red-500">Error loading data</div>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalReceipts?.value || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.totalReceipts?.change >= 0 ? (
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    {metrics?.totalReceipts?.change?.toFixed(1) || "0.0"}% from previous period
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <ArrowDown className="mr-1 h-3 w-3" />
                    {Math.abs(metrics?.totalReceipts?.change || 0).toFixed(1)}% from previous period
                  </span>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dispensed Items Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dispensed Items (30d)</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : error ? (
            <div className="text-sm text-red-500">Error loading data</div>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalDispensed?.value || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.totalDispensed?.change >= 0 ? (
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    {metrics?.totalDispensed?.change?.toFixed(1) || "0.0"}% from previous period
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <ArrowDown className="mr-1 h-3 w-3" />
                    {Math.abs(metrics?.totalDispensed?.change || 0).toFixed(1)}% from previous period
                  </span>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expiring Soon Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon (90d)</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : error ? (
            <div className="text-sm text-red-500">Error loading data</div>
          ) : (
            <>
              <div className="text-2xl font-bold">{formatNumber(metrics?.expiredMedicines?.value || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.expiredMedicines?.change >= 0 ? (
                  <span className="flex items-center text-amber-600">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    {metrics?.expiredMedicines?.change?.toFixed(1) || "0.0"}% from previous period
                  </span>
                ) : (
                  <span className="flex items-center text-green-600">
                    <ArrowDown className="mr-1 h-3 w-3" />
                    {Math.abs(metrics?.expiredMedicines?.change || 0).toFixed(1)}% from previous period
                  </span>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
