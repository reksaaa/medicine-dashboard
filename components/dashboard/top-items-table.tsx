"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getTopItemsByQuantity } from "@/lib/actions/medicine"

interface TopItemsTableProps {
  selectedMedicines: number[]
}

interface ItemData {
  id: number
  name: string
  code: string
  quantity: number
  unit: string
  status: string
}

export function TopItemsTable({ selectedMedicines }: TopItemsTableProps) {
  const [items, setItems] = useState<ItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch data when selectedMedicines changes
  useEffect(() => {
    if (!mounted) return

    async function fetchData() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await getTopItemsByQuantity(selectedMedicines.length > 0 ? selectedMedicines : undefined)

        if (response.success && response.data) {
          setItems(response.data)
        } else if (response.error) {
          console.error("Error fetching top items:", response.error)
          setError(response.error)
        }
      } catch (error) {
        console.error("Error fetching top items data:", error)
        setError(`Failed to fetch data: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedMedicines, mounted])

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Good":
        return <Badge className="bg-green-500">Good</Badge>
      case "Fair":
        return <Badge className="bg-yellow-500">Fair</Badge>
      case "Poor":
        return <Badge className="bg-red-500">Poor</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top 10 Items by Quantity</CardTitle>
        <CardDescription>Items with highest stock levels</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[400px] text-red-500">
            <p>{error}</p>
          </div>
        ) : items.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.quantity)} {item.unit}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
