"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getUnitStockHistory } from "@/lib/actions/unit-stock-history"

interface UnitStockHistoryChartProps {
  unitId: number
}

interface StockData {
  month: string
  value: number
}

export function UnitStockHistoryChart({ unitId }: UnitStockHistoryChartProps) {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function fetchData() {
      setIsLoading(true)
      try {
        const response = await getUnitStockHistory(unitId)
        if (response.success && response.data) {
          setStockData(response.data)
        } else {
          setError(response.error || "Failed to fetch stock history")
        }
      } catch (error) {
        console.error("Error fetching stock history:", error)
        setError("An error occurred while fetching stock history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [unitId, mounted])

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{`Stock: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Stock History</CardTitle>
        <CardDescription>Stock level changes over the past 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p>Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px] text-red-500">
            <p>{error}</p>
          </div>
        ) : stockData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={stockData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4ade80"
                activeDot={{ r: 8 }}
                name="Stock Quantity"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
