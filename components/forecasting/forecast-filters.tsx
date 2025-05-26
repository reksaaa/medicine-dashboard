"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Unit, Medicine } from "@/lib/forecasting/types"
import { getAvailableUnits, getUnitMedicines } from "@/lib/actions/forecasting"
import { Loader2, TrendingUp, AlertCircle } from "lucide-react"

interface ForecastFiltersProps {
  onGenerateForecast: (unitId: number, medicineId: number, periods: number) => void
  isLoading: boolean
}

export function ForecastFilters({ onGenerateForecast, isLoading }: ForecastFiltersProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string>("")
  const [selectedMedicine, setSelectedMedicine] = useState<string>("")
  const [forecastPeriods, setForecastPeriods] = useState([6])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [loadingMedicines, setLoadingMedicines] = useState(false)
  const [error, setError] = useState<string>("")

  // Load units on component mount
  useEffect(() => {
    async function loadUnits() {
      setLoadingUnits(true)
      setError("")

      try {
        console.log("Attempting to load units...")
        const result = await getAvailableUnits()

        if (result.success && result.data) {
          console.log("Units loaded successfully:", result.data)
          
          // Sort units alphabetically by name
          const sortedUnits = [...result.data].sort((a, b) => 
            a.namaUnit.localeCompare(b.namaUnit)
          )
          setUnits(sortedUnits)
        } else {
          setError(result.error || "Failed to load units")
        }
      } catch (error) {
        console.error("Error loading units:", error)
        setError("Failed to load units")
      } finally {
        setLoadingUnits(false)
      }
    }

    loadUnits()
  }, [])

  // Load medicines when unit changes
  useEffect(() => {
    async function loadMedicines() {
      if (!selectedUnit) {
        setMedicines([])
        setSelectedMedicine("")
        return
      }

      setLoadingMedicines(true)
      setError("")

      try {
        console.log("Attempting to load medicines for unit:", selectedUnit)
        const result = await getUnitMedicines(Number.parseInt(selectedUnit))

        if (result.success && result.data) {
          console.log("Medicines loaded successfully:", result.data)
          
          // Sort medicines alphabetically by name
          const sortedMedicines = [...result.data].sort((a, b) => 
            a.namaPersediaan.localeCompare(b.namaPersediaan)
          )
          setMedicines(sortedMedicines)
          setSelectedMedicine("") // Reset medicine selection
        } else {
          setError(result.error || "Failed to load medicines")
        }
      } catch (error) {
        console.error("Error loading medicines:", error)
        setError("Failed to load medicines")
      } finally {
        setLoadingMedicines(false)
      }
    }

    loadMedicines()
  }, [selectedUnit])

  const handleGenerateForecast = () => {
    if (selectedUnit && selectedMedicine) {
      onGenerateForecast(Number.parseInt(selectedUnit), Number.parseInt(selectedMedicine), forecastPeriods[0])
    }
  }

  const canGenerate = selectedUnit && selectedMedicine && !isLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Forecast Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unit Selection */}
          <div className="space-y-2">
            <Label htmlFor="unit-select">Select Unit</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={loadingUnits}>
              <SelectTrigger id="unit-select">
                <SelectValue placeholder={loadingUnits ? "Loading units..." : "Choose a unit"} />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    {unit.namaUnit} ({unit.kodeUnit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingUnits && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading units...
              </div>
            )}
          </div>

          {/* Medicine Selection */}
          <div className="space-y-2">
            <Label htmlFor="medicine-select">Select Medicine</Label>
            <Select
              value={selectedMedicine}
              onValueChange={setSelectedMedicine}
              disabled={!selectedUnit || loadingMedicines}
            >
              <SelectTrigger id="medicine-select">
                <SelectValue
                  placeholder={
                    !selectedUnit
                      ? "Select a unit first"
                      : loadingMedicines
                        ? "Loading medicines..."
                        : "Choose a medicine"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((medicine) => (
                  <SelectItem key={medicine.id} value={medicine.id.toString()}>
                    {medicine.namaPersediaan} ({medicine.kodePersediaan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingMedicines && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading medicines...
              </div>
            )}
          </div>
        </div>

        {/* Forecast Period */}
        <div className="space-y-3">
          <Label>Forecast Period: {forecastPeriods[0]} months</Label>
          <Slider
            value={forecastPeriods}
            onValueChange={setForecastPeriods}
            max={12}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1 month</span>
            <span>12 months</span>
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={handleGenerateForecast} disabled={!canGenerate} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Forecast...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Forecast
            </>
          )}
        </Button>

        {/* Debug Info */}
        <div className="text-xs text-muted-foreground">
          Units loaded: {units.length} | Selected unit: {selectedUnit} | Medicines: {medicines.length}
        </div>
      </CardContent>
    </Card>
  )
}