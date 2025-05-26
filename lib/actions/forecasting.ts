"use server"

import type { ForecastResult, Unit, Medicine } from "@/lib/forecasting/types"
import prisma from "@/lib/prisma"

// Use only localhost:8000 since that works for units/medicines
const PYTHON_API_URLS = ["http://localhost:8000"]

async function tryPythonAPI(endpoint: string, options: RequestInit = {}): Promise<Response | null> {
  for (const baseUrl of PYTHON_API_URLS) {
    try {
      console.log(`Trying Python API at: ${baseUrl}${endpoint}`)

      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })

      if (response.ok) {
        console.log(`✅ Success with: ${baseUrl}`)
        return response
      } else {
        console.log(`❌ Failed with ${baseUrl}: ${response.status}`)
        const errorText = await response.text()
        console.log(`Error details: ${errorText}`)
      }
    } catch (error) {
      console.log(`❌ Error with ${baseUrl}:`, error instanceof Error ? error.message : error)
    }
  }
  return null
}

export async function testPythonConnection(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Testing Python API connection...")

    const response = await tryPythonAPI("/health")

    if (!response) {
      return {
        success: false,
        message: `Connection failed to ${PYTHON_API_URLS.join(", ")}`,
      }
    }

    const result = await response.json()
    console.log("Python API health check:", result)

    const isHealthy = result.status === "healthy" && result.database === "connected"

    return {
      success: isHealthy,
      message: `API: ${result.status}, Database: ${result.database}`,
    }
  } catch (error) {
    console.error("Python API connection test failed:", error)
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function getAvailableUnits(): Promise<{ success: boolean; data?: Unit[]; error?: string }> {
  try {
    console.log("Fetching units from Python API...")

    const response = await tryPythonAPI("/api/forecast/units")

    if (!response) {
      console.log("Python API not available, using database fallback")
      throw new Error("Python API not reachable")
    }

    const result = await response.json()
    console.log("Units fetched successfully from Python API:", result.data?.length || 0, "units")
    return result
  } catch (error) {
    console.error("Python API failed, using database fallback:", error)

    // Fallback to direct database query
    try {
      console.log("Using database fallback for units...")
      const units = await prisma.unit.findMany({
        where: {
          penerimaan: {
            some: {
              rincianPenerimaan: {
                some: {},
              },
            },
          },
        },
        select: {
          id: true,
          namaUnit: true,
          kodeUnit: true,
        },
        distinct: ["id"],
      })

      console.log("Database fallback successful:", units.length, "units")
      return {
        success: true,
        data: units,
      }
    } catch (dbError) {
      console.error("Database fallback failed:", dbError)
      return {
        success: false,
        error: "Failed to fetch units from both API and database",
      }
    }
  }
}

export async function getUnitMedicines(
  unitId: number,
): Promise<{ success: boolean; data?: Medicine[]; error?: string }> {
  try {
    console.log("Fetching medicines for unit", unitId, "from Python API")

    const response = await tryPythonAPI(`/api/forecast/units/${unitId}/medicines`)

    if (!response) {
      console.log("Python API not available, using database fallback")
      throw new Error("Python API not reachable")
    }

    const result = await response.json()
    console.log("Medicines fetched successfully from Python API:", result.data?.length || 0, "medicines")
    return result
  } catch (error) {
    console.error("Python API failed, using database fallback:", error)

    // Fallback to direct database query
    try {
      console.log("Using database fallback for medicines...")
      const medicines = await prisma.persediaan.findMany({
        where: {
          rincianPenerimaan: {
            some: {
              unitId: unitId,
            },
          },
        },
        select: {
          id: true,
          namaPersediaan: true,
          kodePersediaan: true,
        },
        distinct: ["id"],
      })

      console.log("Database fallback successful:", medicines.length, "medicines")
      return {
        success: true,
        data: medicines,
      }
    } catch (dbError) {
      console.error("Database fallback failed:", dbError)
      return {
        success: false,
        error: "Failed to fetch medicines from both API and database",
      }
    }
  }
}

export async function generateForecast(unitId: number, medicineId: number, periods = 6): Promise<ForecastResult> {
  try {
    console.log(`Generating REAL ARIMA/SARIMA forecast for Unit ${unitId}, Medicine ${medicineId}, Periods ${periods}`)

    // First, test if Python API and database are available
    const connectionTest = await testPythonConnection()
    if (!connectionTest.success) {
      console.error("Python API or database connection failed:", connectionTest.message)
      return {
        success: false,
        unit_id: unitId,
        medicine_id: medicineId,
        model_type: "",
        model_parameters: { p: 0, d: 0, q: 0, seasonal_P: 0, seasonal_D: 0, seasonal_Q: 0, seasonal_m: 0 },
        historical_data: [],
        forecast_data: [],
        summary: { total_forecast: 0, avg_monthly: 0, historical_avg: 0, data_points: 0, forecast_period: 0 },
        recommendations: { safety_stock: 0, reorder_point: 0, lead_time_months: 0, service_level: "" },
        error: `Python API or database not available: ${connectionTest.message}. Real ARIMA/SARIMA forecasting requires both Python service and database connection.`,
      }
    }

    console.log("Python API and database are available, proceeding with ARIMA/SARIMA forecast...")

    const response = await tryPythonAPI(
      `/api/forecast/generate?unit_id=${unitId}&medicine_id=${medicineId}&periods=${periods}`,
      { method: "POST" },
    )

    if (!response) {
      return {
        success: false,
        unit_id: unitId,
        medicine_id: medicineId,
        model_type: "",
        model_parameters: { p: 0, d: 0, q: 0, seasonal_P: 0, seasonal_D: 0, seasonal_Q: 0, seasonal_m: 0 },
        historical_data: [],
        forecast_data: [],
        summary: { total_forecast: 0, avg_monthly: 0, historical_avg: 0, data_points: 0, forecast_period: 0 },
        recommendations: { safety_stock: 0, reorder_point: 0, lead_time_months: 0, service_level: "" },
        error: "Python API not reachable for forecast generation.",
      }
    }

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        unit_id: unitId,
        medicine_id: medicineId,
        model_type: "",
        model_parameters: { p: 0, d: 0, q: 0, seasonal_P: 0, seasonal_D: 0, seasonal_Q: 0, seasonal_m: 0 },
        historical_data: [],
        forecast_data: [],
        summary: { total_forecast: 0, avg_monthly: 0, historical_avg: 0, data_points: 0, forecast_period: 0 },
        recommendations: { safety_stock: 0, reorder_point: 0, lead_time_months: 0, service_level: "" },
        error: result.error || "Unknown error from Python API",
      }
    }

    console.log("✅ Real ARIMA/SARIMA forecast generated successfully!")
    console.log("Model type:", result.model_type)
    console.log("Parameters determined by statistical tests:", result.model_parameters)

    return result
  } catch (error) {
    console.error("Real ARIMA/SARIMA forecast failed:", error)
    return {
      success: false,
      unit_id: unitId,
      medicine_id: medicineId,
      model_type: "",
      model_parameters: { p: 0, d: 0, q: 0, seasonal_P: 0, seasonal_D: 0, seasonal_Q: 0, seasonal_m: 0 },
      historical_data: [],
      forecast_data: [],
      summary: { total_forecast: 0, avg_monthly: 0, historical_avg: 0, data_points: 0, forecast_period: 0 },
      recommendations: { safety_stock: 0, reorder_point: 0, lead_time_months: 0, service_level: "" },
      error: `Forecast generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
