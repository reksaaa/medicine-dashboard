"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { getMedicinesApproachingExpiry } from "@/lib/actions/unit-stock-history"

interface UnitExpiryChartProps {
  unitId: number
  selectedMedicines: number[]
}

interface ExpiryData {
  id: number
  name: string
  code: string
  quantity: number
  unit: string
  daysRemaining: number
  expiryDate: Date
}

export function UnitExpiryChart({ unitId, selectedMedicines }: UnitExpiryChartProps) {
  const [expiryData, setExpiryData] = useState<ExpiryData[]>([])
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
        const response = await getMedicinesApproachingExpiry(
          unitId,
          selectedMedicines.length > 0 ? selectedMedicines : undefined,
        )
        if (response.success && response.data) {
          setExpiryData(response.data)
        } else {
          setError(response.error || "Failed to fetch expiry data")
        }
      } catch (error) {
        console.error("Error fetching expiry data:", error)
        setError("An error occurred while fetching expiry data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [unitId, selectedMedicines, mounted])

  // Format data for the chart - limit to top 5 medicines with earliest expiry
  const chartData = expiryData
    .sort((a, b) => a.daysRemaining - b.daysRemaining) // Sort by days remaining (ascending)
    .slice(0, 5) // Take top 5
    .map((item) => {
      // Truncate and format medicine name for better readability
      let formattedName = item.name

      // If name is too long, truncate it and add the code in a new line
      if (formattedName.length > 20) {
        formattedName = `${formattedName.substring(0, 20)}...`
      }

      // Add code in brackets for identification
      formattedName = `${formattedName} [${item.code}]`

      return {
        name: formattedName,
        fullName: item.name, // Keep full name for tooltip
        code: item.code,
        quantity: item.quantity,
        daysRemaining: item.daysRemaining,
        unit: item.unit,
      }
    })

  // Find the maximum quantity to set appropriate scale for X-axis
  const maxQuantity = chartData.length > 0 ? Math.max(...chartData.map((item) => item.quantity)) : 100

  // Round up to nearest 10, 100, or 1000 depending on the magnitude
  const getAxisMaximum = (value: number) => {
    if (value <= 10) return 10
    if (value <= 100) return Math.ceil(value / 10) * 10
    if (value <= 1000) return Math.ceil(value / 100) * 100
    return Math.ceil(value / 1000) * 1000
  }

  const xAxisMaximum = getAxisMaximum(maxQuantity)

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{item.fullName}</p>
          <p className="text-sm">{`Code: ${item.code}`}</p>
          <p className="text-sm">{`Quantity: ${payload[0].value} ${item.unit}`}</p>
          <p className="text-sm">{`Days Remaining: ${payload[1].value}`}</p>
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
    <Card className="h-full unit-expiry-chart">
      <CardHeader>
        <CardTitle>Medicines Approaching Expiry</CardTitle>
        <CardDescription>Medicines that will expire within the next 30 days</CardDescription>
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
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 5, // Reduced left margin to move Y-axis closer to container edge
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, xAxisMaximum]} // Set the domain based on data
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format the tick labels to fit better
                  return value.length > 18 ? `${value.substring(0, 15)}...` : value
                }}
                // Move Y-axis to the right side of the chart
                orientation="right"
                yAxisId={0}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="quantity" fill="#60a5fa" name="Quantity" />
              <Bar dataKey="daysRemaining" fill="#fbbf24" name="Days Remaining" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No medicines approaching expiry</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
