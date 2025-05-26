"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ForecastResult } from "@/lib/forecasting/types"
import { TrendingUp, TrendingDown, Activity, Calendar, BarChart3, Target, CheckCircle } from "lucide-react"

interface ForecastMetricsProps {
  forecastResult: ForecastResult
}

export function ForecastMetrics({ forecastResult }: ForecastMetricsProps) {
  const { summary, model_type, model_parameters, metrics } = forecastResult

  // Calculate trend
  const trend = summary.avg_monthly > summary.historical_avg ? "up" : "down"
  const trendPercentage =
    summary.historical_avg > 0
      ? Math.abs(((summary.avg_monthly - summary.historical_avg) / summary.historical_avg) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forecast */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forecast</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_forecast.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Next {summary.forecast_period} months</p>
          </CardContent>
        </Card>

        {/* Average Monthly */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avg_monthly.toFixed(1)}</div>
            <div className="flex items-center gap-1 text-xs">
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={trend === "up" ? "text-green-500" : "text-red-500"}>{trendPercentage.toFixed(1)}%</span>
              <span className="text-muted-foreground">vs historical</span>
            </div>
          </CardContent>
        </Card>

        {/* Historical Average */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historical Avg</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.historical_avg.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Based on {summary.data_points} months</p>
          </CardContent>
        </Card>

        {/* Model Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Type</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{model_type}</div>
            <div className="flex gap-1 mt-1">
              <Badge variant="secondary" className="text-xs">
                {model_type === "SARIMA"
                  ? `(${model_parameters.p},${model_parameters.d},${model_parameters.q})(${model_parameters.seasonal_P},${model_parameters.seasonal_D},${model_parameters.seasonal_Q})${model_parameters.seasonal_m}`
                  : `(${model_parameters.p},${model_parameters.d},${model_parameters.q})`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Model Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* RMSE */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.rmse?.toFixed(2)}</div>
                <div className="text-sm font-medium">RMSE</div>
                <div className="text-xs text-muted-foreground">Root Mean Square Error</div>
              </div>

              {/* MAE */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.mae?.toFixed(2)}</div>
                <div className="text-sm font-medium">MAE</div>
                <div className="text-xs text-muted-foreground">Mean Absolute Error</div>
              </div>

              {/* MAPE */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{metrics.mape?.toFixed(1)}%</div>
                <div className="text-sm font-medium">MAPE</div>
                <div className="text-xs text-muted-foreground">Mean Absolute Percentage Error</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Model trained on {metrics.train_size} months, validated on {metrics.test_size} months
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
