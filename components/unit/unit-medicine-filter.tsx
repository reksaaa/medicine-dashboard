"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { getUnitMedicines } from "@/lib/actions/medicine"

interface Medicine {
  id: number
  namaPersediaan: string
  kodePersediaan: string
  tipe: string
}

interface UnitMedicineFilterProps {
  unitId: number
  onSelectionChange: (selectedIds: number[]) => void
}

export function UnitMedicineFilter({ unitId, onSelectionChange }: UnitMedicineFilterProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([])
  const [selectedMedicines, setSelectedMedicines] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectAll, setSelectAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch medicines for the specific unit
  useEffect(() => {
    if (!mounted) return

    async function fetchMedicines() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await getUnitMedicines(unitId)

        if (response.success && response.data) {
          setMedicines(response.data)
          setFilteredMedicines(response.data)
        } else {
          setError(response.error || "Failed to fetch medicines")
        }
      } catch (error) {
        console.error("Error fetching medicines:", error)
        setError("An error occurred while fetching medicines")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedicines()
  }, [unitId, mounted])

  // Filter medicines based on search query
  useEffect(() => {
    if (!mounted) return

    if (searchQuery.trim() === "") {
      setFilteredMedicines(medicines)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = medicines.filter(
        (medicine) =>
          medicine.namaPersediaan.toLowerCase().includes(query) ||
          medicine.kodePersediaan.toLowerCase().includes(query) ||
          medicine.tipe.toLowerCase().includes(query),
      )
      setFilteredMedicines(filtered)
    }
  }, [searchQuery, medicines, mounted])

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const allIds = filteredMedicines.map((medicine) => medicine.id)
      setSelectedMedicines(allIds)
      onSelectionChange(allIds)
    } else {
      setSelectedMedicines([])
      onSelectionChange([])
    }
  }

  // Handle individual medicine selection
  const handleMedicineSelect = (medicineId: number, checked: boolean) => {
    let newSelected: number[]

    if (checked) {
      newSelected = [...selectedMedicines, medicineId]
    } else {
      newSelected = selectedMedicines.filter((id) => id !== medicineId)
    }

    setSelectedMedicines(newSelected)
    onSelectionChange(newSelected)

    // Update select all state
    setSelectAll(newSelected.length === filteredMedicines.length && filteredMedicines.length > 0)
  }

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Medicine Filter</CardTitle>
        <CardDescription>Select medicines to filter dashboard data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medicines..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <p>Loading medicines...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All
                </label>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((medicine) => (
                      <div key={medicine.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`medicine-${medicine.id}`}
                          checked={selectedMedicines.includes(medicine.id)}
                          onCheckedChange={(checked) => handleMedicineSelect(medicine.id, checked === true)}
                        />
                        <div className="grid gap-0.5">
                          <label
                            htmlFor={`medicine-${medicine.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {medicine.namaPersediaan}
                          </label>
                          <p className="text-xs text-muted-foreground">{medicine.tipe}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No medicines found</p>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
