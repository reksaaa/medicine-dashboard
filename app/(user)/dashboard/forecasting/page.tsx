import { ForecastDashboard } from "@/components/forecasting/forecast-dashboard"

export default function ForecastingPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Medicine Usage Forecasting</h2>
      </div>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Predict future medicine usage patterns using advanced time series analysis. Select a unit and medicine to
          generate forecasts with inventory recommendations.
        </p>
        <ForecastDashboard />
      </div>
    </div>
  )
}
