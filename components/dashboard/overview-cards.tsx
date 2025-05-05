"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Package, PackageCheck, BarChart3, TrendingUp } from "lucide-react"

interface DashboardMetrics {
  totalReceipts: {
    value: number
    change: number
  }
  totalDispensed: {
    value: number
    change: number
  }
  availableStock: {
    value: number
    change: number
  }
  stockToConsumptionRatio: {
    value: number
    change: number
  }
}

interface OverviewCardsProps {
  metrics: DashboardMetrics | null
  isLoading: boolean
}

export function OverviewCards({ metrics, isLoading }: OverviewCardsProps) {
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Receipts Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Receipts</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics ? formatNumber(metrics.totalReceipts.value) : 0}</div>
            <div className="flex items-center text-sm">
              {metrics && metrics.totalReceipts.change > 0 ? (
                <>
                  <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">+{metrics.totalReceipts.change.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500">{metrics ? metrics.totalReceipts.change.toFixed(1) : 0}%</span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Dispensed Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Dispensed</span>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics ? formatNumber(metrics.totalDispensed.value) : 0}</div>
            <div className="flex items-center text-sm">
              {metrics && metrics.totalDispensed.change > 0 ? (
                <>
                  <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">+{metrics.totalDispensed.change.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500">{metrics ? metrics.totalDispensed.change.toFixed(1) : 0}%</span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Stock Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Available Stock</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics ? formatNumber(metrics.availableStock.value) : 0}</div>
            <div className="flex items-center text-sm">
              {metrics && metrics.availableStock.change > 0 ? (
                <>
                  <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">+{metrics.availableStock.change.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500">{metrics ? metrics.availableStock.change.toFixed(1) : 0}%</span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock-to-Consumption Ratio Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Stock-to-Consumption</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics ? metrics.stockToConsumptionRatio.value : 0}×</div>
            <div className="flex items-center text-sm">
              {metrics && metrics.stockToConsumptionRatio.change > 0 ? (
                <>
                  <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">+{metrics.stockToConsumptionRatio.change.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500">
                    {metrics ? metrics.stockToConsumptionRatio.change.toFixed(1) : 0}%
                  </span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
