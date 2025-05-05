"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getLowStockWarnings } from "@/lib/actions/unit-stock-history"

interface UnitLowStockTableProps {
  unitId: number
  selectedMedicines: number[]
  unitName: string
}

interface LowStockData {
  id: number
  name: string
  code: string
  currentStock: number
  unit: string
  minimumThreshold: number
  status: string
}

export function UnitLowStockTable({ unitId, selectedMedicines, unitName }: UnitLowStockTableProps) {
  const [lowStockItems, setLowStockItems] = useState<LowStockData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch low stock items when unit or selected medicines change
  useEffect(() => {
    if (!mounted) return

    async function fetchData() {
      setIsLoading(true)
      try {
        const response = await getLowStockWarnings(unitId, selectedMedicines.length > 0 ? selectedMedicines : undefined)
        if (response.success && response.data) {
          setLowStockItems(response.data)
        } else {
          setError(response.error || "Failed to fetch low stock warnings")
        }
      } catch (error) {
        console.error("Error fetching low stock warnings:", error)
        setError("An error occurred while fetching low stock warnings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [unitId, selectedMedicines, mounted])

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Low Stock Warning in {unitName}</CardTitle>
        <CardDescription>Medicines requiring immediate replenishment</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[200px] text-red-500">
            <p>{error}</p>
          </div>
        ) : lowStockItems.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Minimum Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell className="text-right">{item.currentStock}</TableCell>
                    <TableCell className="text-right">{item.minimumThreshold}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500">Low Stock</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No low stock items found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
