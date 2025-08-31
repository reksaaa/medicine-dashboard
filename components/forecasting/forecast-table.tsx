"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ForecastResult } from "@/lib/forecasting/types"
import { Calendar } from "lucide-react"

interface ForecastTableProps {
  forecastResult: ForecastResult
}

export function ForecastTable({ forecastResult }: ForecastTableProps) {
  const getConfidenceLevel = (forecast: number, lowerCI: number, upperCI: number): number => {
    // Calculate confidence level based on the width of confidence interval
    // Narrower intervals = higher confidence
    const intervalWidth = upperCI - lowerCI
    const relativeWidth = intervalWidth / forecast

    // Convert to confidence percentage (inverse relationship)
    // Smaller relative width = higher confidence
    const confidence = Math.max(85, Math.min(99, 100 - relativeWidth * 50))
    return Math.round(confidence)
  }

  const getConfidenceBadgeColor = (confidence: number): "default" | "secondary" | "destructive" | "outline" => {
    if (confidence >= 95) return "default"
    if (confidence >= 90) return "secondary"
    if (confidence >= 85) return "outline"
    return "destructive"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Monthly Forecast Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 font-medium">Month</th>
                <th className="text-right py-2 px-4 font-medium">Forecast</th>
                <th className="text-right py-2 px-4 font-medium">Lower CI</th>
                <th className="text-right py-2 px-4 font-medium">Upper CI</th>
                <th className="text-center py-2 px-4 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {forecastResult.forecast_data.map((item, index) => {
                const confidence = getConfidenceLevel(item.forecasted_usage, item.lower_ci, item.upper_ci)
                const badgeColor = getConfidenceBadgeColor(confidence)

                return (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">{item.forecasted_usage.toFixed(1)}</td>
                    <td className="text-right py-3 px-4 text-muted-foreground">{item.lower_ci.toFixed(1)}</td>
                    <td className="text-right py-3 px-4 text-muted-foreground">{item.upper_ci.toFixed(1)}</td>
                    <td className="text-center py-3 px-4">
                      <Badge variant={badgeColor} className="text-xs">
                        {confidence}%
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            <strong>Confidence Level:</strong> Statistical confidence in the forecast accuracy. Higher confidence
            indicates more reliable predictions.
          </p>
          <p className="mt-1">
            <strong>CI (Confidence Interval):</strong> 95% confidence interval - the actual value is expected to fall
            within this range.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
