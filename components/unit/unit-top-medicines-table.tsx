"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { getTopMedicinesInUnit } from "@/lib/actions/unit-stock-history"

interface UnitTopMedicinesTableProps {
  unitId: number
  selectedMedicines: number[]
  unitName: string
}

interface MedicineData {
  id: number
  name: string
  code: string
  stock: number
  unit: string
  status: string
}

export function UnitTopMedicinesTable({ unitId, selectedMedicines, unitName }: UnitTopMedicinesTableProps) {
  const [medicines, setMedicines] = useState<MedicineData[]>([])
  const [filteredMedicines, setFilteredMedicines] = useState<MedicineData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch top medicines when unit or selected medicines change
  useEffect(() => {
    if (!mounted) return

    async function fetchData() {
      setIsLoading(true)
      try {
        const response = await getTopMedicinesInUnit(
          unitId,
          selectedMedicines.length > 0 ? selectedMedicines : undefined,
        )
        if (response.success && response.data) {
          setMedicines(response.data)
          setFilteredMedicines(response.data)
        } else {
          setError(response.error || "Failed to fetch top medicines")
        }
      } catch (error) {
        console.error("Error fetching top medicines:", error)
        setError("An error occurred while fetching top medicines")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [unitId, selectedMedicines, mounted])

  // Filter medicines based on search query
  useEffect(() => {
    if (!mounted) return

    if (searchQuery.trim() === "") {
      setFilteredMedicines(medicines)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = medicines.filter(
        (medicine) => medicine.name.toLowerCase().includes(query) || medicine.code.toLowerCase().includes(query),
      )
      setFilteredMedicines(filtered)
    }
  }, [searchQuery, medicines, mounted])

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-500">Available</Badge>
      case "Out of Stock":
        return <Badge className="bg-red-500">Out of Stock</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top 5 Medicines in {unitName}</CardTitle>
        <CardDescription>Based on stock quantity</CardDescription>
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
            <div className="flex items-center justify-center h-[200px]">
              <p>Loading medicines...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[200px] text-red-500">
              <p>{error}</p>
            </div>
          ) : filteredMedicines.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.code}</TableCell>
                      <TableCell className="text-right">{medicine.stock}</TableCell>
                      <TableCell>{getStatusBadge(medicine.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No medicines found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
