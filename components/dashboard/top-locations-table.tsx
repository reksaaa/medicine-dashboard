"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTopReceiptLocations, getTopDispensedLocations } from "@/lib/actions/medicine"

interface UnitData {
  id: number
  name: string
  count: number
  percentage: string
}

export function TopLocationsTable() {
  const [activeTab, setActiveTab] = useState("receipts")
  const [receiptUnits, setReceiptUnits] = useState<UnitData[]>([])
  const [dispensedUnits, setDispensedUnits] = useState<UnitData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration issues by only rendering after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch data when component mounts
  useEffect(() => {
    if (!mounted) return

    async function fetchData() {
      setIsLoading(true)
      setError(null)
      try {
        // Always fetch both datasets to avoid loading state when switching tabs
        const [receiptResponse, dispensedResponse] = await Promise.all([
          getTopReceiptLocations(),
          getTopDispensedLocations(),
        ])

        if (receiptResponse.success && receiptResponse.data) {
          setReceiptUnits(receiptResponse.data)
        } else if (receiptResponse.error) {
          console.error("Error in receipt units data:", receiptResponse.error)
          setError(receiptResponse.error)
        }

        if (dispensedResponse.success && dispensedResponse.data) {
          setDispensedUnits(dispensedResponse.data)
        } else if (dispensedResponse.error) {
          console.error("Error in dispensed units data:", dispensedResponse.error)
          setError(dispensedResponse.error)
        }
      } catch (error) {
        console.error("Error fetching units data:", error)
        setError(`Failed to fetch data: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [mounted])

  // Don't render anything on the server, only on the client
  if (!mounted) {
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top 10 Units</CardTitle>
        <CardDescription>Units with highest receipt and dispensing activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="receipts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="dispensed">Dispensed</TabsTrigger>
          </TabsList>
          <TabsContent value="receipts">
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <p>Loading data...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[400px] text-red-500">
                <p>{error}</p>
              </div>
            ) : receiptUnits.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell className="text-right">{unit.count}</TableCell>
                        <TableCell className="text-right">{unit.percentage}%</TableCell>
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
          </TabsContent>
          <TabsContent value="dispensed">
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <p>Loading data...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[400px] text-red-500">
                <p>{error}</p>
              </div>
            ) : dispensedUnits.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispensedUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell className="text-right">{unit.count}</TableCell>
                        <TableCell className="text-right">{unit.percentage}%</TableCell>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
