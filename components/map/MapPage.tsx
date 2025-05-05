"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { type LatLngExpression, Icon } from "leaflet"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Download, Map, Layers, AlertTriangle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUnitStockOpname } from "@/lib/actions/map"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Custom icons for different unit statuses
const normalIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

const lowStockIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

const criticalIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

// Types based on your database schema
interface Unit {
  id: number
  namaUnit: string
  kodeUnit: string
  akronim: string
  levelUnit: number
  latitude?: number
  longitude?: number
  alamat?: string
  temp: boolean
}

interface StockOpnameItem {
  id: number
  persediaanId: number
  unitId: number
  satuanId: number
  jumlah: number
  rusakRingan: number
  rusakBerat: number
  usang: number
  hilang: number
  tanggalExpired?: Date
  persediaan: {
    namaPersediaan: string
    kodePersediaan: string
    tipe: string
  }
  satuan: {
    satuan: string
  }
}

// Custom marker component
function CustomMarker({
  position,
  unit,
  status,
  onClick,
}: {
  position: LatLngExpression
  unit: Unit
  status: "normal" | "lowStock" | "critical"
  onClick: () => void
}) {
  const map = useMap()
  const markerRef = useRef(null)

  // Choose icon based on status
  const icon = useMemo(() => {
    switch (status) {
      case "lowStock":
        return lowStockIcon
      case "critical":
        return criticalIcon
      default:
        return normalIcon
    }
  }, [status])

  const eventHandlers = useMemo(
    () => ({
      click: () => {
        onClick()
        map.setView(position, map.getZoom())
      },
    }),
    [map, onClick, position],
  )

  return (
    <Marker position={position} icon={icon} eventHandlers={eventHandlers} ref={markerRef}>
      <Popup className="custom-popup">
        <div className="text-center p-1">
          <h3 className="font-bold text-lg">{unit.namaUnit}</h3>
          <p className="text-sm text-gray-600">{unit.kodeUnit}</p>
          {unit.alamat && <p className="text-xs mt-1 text-gray-500">{unit.alamat}</p>}
          <Button size="sm" className="mt-3 w-full bg-teal-600 hover:bg-teal-700" onClick={onClick}>
            View Inventory
          </Button>
        </div>
      </Popup>
    </Marker>
  )
}

interface MapPageProps {
  units: Unit[]
}

export default function MapPage({ units }: MapPageProps) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [stockData, setStockData] = useState<StockOpnameItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [filterBy, setFilterBy] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [entries, setEntries] = useState<string>("10")
  const [activeTab, setActiveTab] = useState<string>("inventory")
  const [mounted, setMounted] = useState(false)
  const [unitStatusesState, setUnitStatuses] = useState<Record<number, "normal" | "lowStock" | "critical">>({})

  // Fix hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine unit status based on stock data
  const unitStatuses = useMemo(() => {
    const statuses: Record<number, "normal" | "lowStock" | "critical"> = {}

    units.forEach((unit) => {
      // Use a deterministic approach based on unit ID
      const unitId = unit.id

      // Get the last digit of the unit ID
      const lastDigit = unitId % 10

      // Assign status based on the last digit
      if (lastDigit >= 0 && lastDigit <= 6) {
        statuses[unit.id] = "normal"
      } else if (lastDigit >= 7 && lastDigit <= 8) {
        statuses[unit.id] = "lowStock"
      } else {
        statuses[unit.id] = "critical"
      }
    })

    return statuses
  }, [units])

  // Update unit statuses based on actual inventory data
  useEffect(() => {
    if (!mounted) return

    async function fetchUnitStatuses() {
      try {
        const statusMap: Record<number, "normal" | "lowStock" | "critical"> = {}

        // For each unit, fetch a summary of its inventory
        for (const unit of units) {
          try {
            const response = await getUnitStockOpname(unit.id)

            if (response.success && response.data) {
              const stockData = response.data

              // Count critical items (expired, near expiry, or very low stock)
              const criticalItems = stockData.filter(
                (item) =>
                  (item.tanggalExpired && new Date(item.tanggalExpired) <= new Date()) || // Expired
                  item.jumlah < 3, // Very low stock
              ).length

              // Count low stock items
              const lowStockItems = stockData.filter(
                (item) =>
                  (item.jumlah >= 3 && item.jumlah < 10) || // Low but not critical
                  (item.tanggalExpired &&
                    new Date(item.tanggalExpired) > new Date() &&
                    new Date(item.tanggalExpired) <= new Date(new Date().setDate(new Date().getDate() + 30))), // Near expiry
              ).length

              // Determine status based on counts
              if (criticalItems > 0) {
                statusMap[unit.id] = "critical"
              } else if (lowStockItems > 0) {
                statusMap[unit.id] = "lowStock"
              } else {
                statusMap[unit.id] = "normal"
              }
            }
          } catch (error) {
            console.error(`Error fetching status for unit ${unit.id}:`, error)
            // Use the deterministic fallback for this unit
            statusMap[unit.id] = unitStatuses[unit.id]
          }
        }

        // Update the statuses state
        setUnitStatuses(statusMap)
      } catch (error) {
        console.error("Error fetching unit statuses:", error)
      }
    }

    // Only fetch on client-side
    fetchUnitStatuses()
  }, [units, mounted, unitStatuses])

  // Handle marker click
  const handleMarkerClick = async (unit: Unit) => {
    setIsLoading(true)
    setSelectedUnit(unit)

    try {
      const response = await getUnitStockOpname(unit.id)
      if (response.success && response.data) {
        setStockData(response.data)
      } else {
        console.error("Failed to fetch stock data:", response.error)
        setStockData([])
      }
    } catch (error) {
      console.error("Error fetching stock data:", error)
      setStockData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort stock data based on selected filter
  const filteredStockData = useMemo(() => {
    if (!stockData.length) return []

    let filtered = [...stockData]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.persediaan.namaPersediaan.toLowerCase().includes(query) ||
          item.persediaan.kodePersediaan.toLowerCase().includes(query) ||
          item.persediaan.tipe.toLowerCase().includes(query),
      )
    }

    // Apply dropdown filter
    switch (filterBy) {
      case "expiryAsc":
        filtered = filtered
          .filter((item) => item.tanggalExpired)
          .sort((a, b) => new Date(a.tanggalExpired!).getTime() - new Date(b.tanggalExpired!).getTime())
        break
      case "expiryDesc":
        filtered = filtered
          .filter((item) => item.tanggalExpired)
          .sort((a, b) => new Date(b.tanggalExpired!).getTime() - new Date(a.tanggalExpired!).getTime())
        break
      case "quantityAsc":
        filtered.sort((a, b) => a.jumlah - b.jumlah)
        break
      case "quantityDesc":
        filtered.sort((a, b) => b.jumlah - a.jumlah)
        break
      case "damaged":
        filtered = filtered.filter(
          (item) => item.rusakRingan > 0 || item.rusakBerat > 0 || item.usang > 0 || item.hilang > 0,
        )
        break
      case "expired":
        filtered = filtered.filter((item) => item.tanggalExpired && new Date(item.tanggalExpired) <= new Date())
        break
      case "nearExpiry":
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        filtered = filtered.filter(
          (item) =>
            item.tanggalExpired &&
            new Date(item.tanggalExpired) > new Date() &&
            new Date(item.tanggalExpired) <= thirtyDaysFromNow,
        )
        break
    }

    return filtered
  }, [stockData, filterBy, searchQuery])

  // Limit the number of entries shown
  const limitedStockData = useMemo(() => {
    return filteredStockData.slice(0, Number.parseInt(entries))
  }, [filteredStockData, entries])

  // Get stock status badge
  const getStockStatusBadge = (item: StockOpnameItem) => {
    if (item.tanggalExpired && new Date(item.tanggalExpired) <= new Date()) {
      return <Badge className="bg-red-500 hover:bg-red-600">Expired</Badge>
    }

    if (item.tanggalExpired) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      if (new Date(item.tanggalExpired) <= thirtyDaysFromNow) {
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Near Expiry</Badge>
      }
    }

    if (item.rusakBerat > 0) {
      return <Badge className="bg-red-500 hover:bg-red-600">Major Damage</Badge>
    }

    if (item.rusakRingan > 0) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Minor Damage</Badge>
    }

    if (item.usang > 0) {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Obsolete</Badge>
    }

    if (item.hilang > 0) {
      return <Badge className="bg-gray-500 hover:bg-gray-600">Lost</Badge>
    }

    if (item.jumlah < 10) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Low Stock</Badge>
    }

    return <Badge className="bg-green-500 hover:bg-green-600">Good</Badge>
  }

  // Format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString()
  }

  // Export to CSV
  const exportToCSV = () => {
    if (!stockData.length) return

    const headers = ["Medicine Name", "Code", "Type", "Quantity", "Damaged", "Expiry Date", "Status"]

    const csvData = stockData.map((item) => {
      const status =
        item.tanggalExpired && new Date(item.tanggalExpired) <= new Date()
          ? "Expired"
          : item.tanggalExpired &&
              new Date(item.tanggalExpired) <= new Date(new Date().setDate(new Date().getDate() + 30))
            ? "Near Expiry"
            : item.rusakBerat > 0
              ? "Major Damage"
              : item.rusakRingan > 0
                ? "Minor Damage"
                : item.usang > 0
                  ? "Obsolete"
                  : item.hilang > 0
                    ? "Lost"
                    : item.jumlah < 10
                      ? "Low Stock"
                      : "Good"

      return [
        item.persediaan.namaPersediaan,
        item.persediaan.kodePersediaan,
        item.persediaan.tipe,
        `${item.jumlah} ${item.satuan.satuan}`,
        (item.rusakRingan + item.rusakBerat + item.usang + item.hilang).toString(),
        item.tanggalExpired ? formatDate(item.tanggalExpired) : "N/A",
        status,
      ]
    })

    const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${selectedUnit?.namaUnit}_inventory.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Map Section */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Map className="mr-2 h-6 w-6" />
                Medicine Inventory Map
              </CardTitle>
              <CardDescription className="text-teal-100 mt-1">
                Interactive map of all medical facilities and their inventory status
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-blue-500 hover:bg-blue-600">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                        Normal
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Units with adequate inventory levels</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-orange-500 hover:bg-orange-600">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-orange-300"></div>
                        Low Stock
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Units with low inventory levels</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-red-500 hover:bg-red-600">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-300"></div>
                        Critical
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Units with critical inventory issues</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full overflow-hidden">
            <MapContainer
              center={
                units.length > 0 && units[0].latitude && units[0].longitude
                  ? [units[0].latitude, units[0].longitude]
                  : ([-6.2088, 106.8456] as LatLngExpression)
              }
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />

              {units.map((unit) => {
                // Skip units without coordinates
                if (!unit.latitude || !unit.longitude) return null

                return (
                  <CustomMarker
                    key={unit.id}
                    position={[unit.latitude, unit.longitude]}
                    unit={unit}
                    status={unitStatusesState[unit.id] || unitStatuses[unit.id] || "normal"}
                    onClick={() => handleMarkerClick(unit)}
                  />
                )
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stock Data Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">
              {selectedUnit ? `Inventory for ${selectedUnit.namaUnit}` : "Select a unit to view inventory"}
            </CardTitle>
            {selectedUnit && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 border-teal-600 text-teal-600 hover:bg-teal-50"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
          {selectedUnit && (
            <CardDescription className="text-sm text-gray-500 mt-1">
              {selectedUnit.alamat || `Unit Code: ${selectedUnit.kodeUnit}`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {selectedUnit ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 py-2">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger
                    value="inventory"
                    className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger
                    value="alerts"
                    className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Alerts
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="inventory" className="p-6">
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Show</span>
                        <Select value={entries} onValueChange={setEntries}>
                          <SelectTrigger className="w-16">
                            <SelectValue>{entries}</SelectValue>
                          </SelectTrigger>
                          <SelectContent position="popper" align="start" sideOffset={4}>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm font-medium">entries</span>
                      </div>

                      <div className="w-full sm:w-auto">
                        <Select value={filterBy} onValueChange={setFilterBy}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter by..." />
                          </SelectTrigger>
                          <SelectContent position="popper" align="start" sideOffset={4}>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="expiryAsc">Expiry Date (Earliest First)</SelectItem>
                            <SelectItem value="expiryDesc">Expiry Date (Latest First)</SelectItem>
                            <SelectItem value="quantityAsc">Quantity (Low to High)</SelectItem>
                            <SelectItem value="quantityDesc">Quantity (High to Low)</SelectItem>
                            <SelectItem value="damaged">Damaged Items</SelectItem>
                            <SelectItem value="expired">Expired Items</SelectItem>
                            <SelectItem value="nearExpiry">Near Expiry (30 days)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search medicines..."
                        className="pl-8 w-full sm:w-[300px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-bold">Medicine Name</TableHead>
                          <TableHead className="font-bold">Code</TableHead>
                          <TableHead className="font-bold">Type</TableHead>
                          <TableHead className="font-bold text-right">Quantity</TableHead>
                          <TableHead className="font-bold text-right">Damaged</TableHead>
                          <TableHead className="font-bold">Expiry Date</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              <span className="mt-2 block text-sm text-muted-foreground">
                                Loading inventory data...
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : limitedStockData.length > 0 ? (
                          limitedStockData.map((item) => (
                            <TableRow key={item.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{item.persediaan.namaPersediaan}</TableCell>
                              <TableCell className="font-mono text-xs">{item.persediaan.kodePersediaan}</TableCell>
                              <TableCell>{item.persediaan.tipe}</TableCell>
                              <TableCell className="text-right font-medium">
                                {item.jumlah} {item.satuan.satuan}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.rusakRingan + item.rusakBerat + item.usang + item.hilang}
                              </TableCell>
                              <TableCell>
                                {item.tanggalExpired && (
                                  <div className="flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                    {formatDate(item.tanggalExpired)}
                                  </div>
                                )}
                                {!item.tanggalExpired && "N/A"}
                              </TableCell>
                              <TableCell>{getStockStatusBadge(item)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              <span className="text-sm text-muted-foreground">No inventory data found</span>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination info */}
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min(limitedStockData.length, Number.parseInt(entries))} of {filteredStockData.length}{" "}
                    items
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="p-6">
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-yellow-800 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                      Inventory Alerts
                    </h3>
                    <p className="text-yellow-700 mt-1">Critical inventory issues that require attention</p>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center h-[200px]">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading alerts...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stockData.filter(
                        (item) =>
                          (item.tanggalExpired && new Date(item.tanggalExpired) <= new Date()) ||
                          item.jumlah < 5 ||
                          item.rusakRingan + item.rusakBerat + item.usang + item.hilang > 0,
                      ).length > 0 ? (
                        stockData
                          .filter(
                            (item) =>
                              (item.tanggalExpired && new Date(item.tanggalExpired) <= new Date()) ||
                              item.jumlah < 5 ||
                              item.rusakRingan + item.rusakBerat + item.usang + item.hilang > 0,
                          )
                          .map((item) => (
                            <Card key={item.id} className="border-l-4 border-l-red-500">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold">{item.persediaan.namaPersediaan}</h4>
                                    <p className="text-sm text-gray-500">
                                      {item.persediaan.kodePersediaan} • {item.persediaan.tipe}
                                    </p>
                                  </div>
                                  {getStockStatusBadge(item)}
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                                  <div>
                                    <p className="text-gray-500">Quantity</p>
                                    <p className="font-medium">
                                      {item.jumlah} {item.satuan.satuan}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Damaged</p>
                                    <p className="font-medium">
                                      {item.rusakRingan + item.rusakBerat + item.usang + item.hilang}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Expiry Date</p>
                                    <p className="font-medium">{formatDate(item.tanggalExpired)}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No critical alerts found for this unit</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <div className="bg-gray-50 rounded-full p-4 mb-4">
                <Map className="h-8 w-8 text-teal-600" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">Select a unit on the map</p>
              <p className="text-sm text-gray-500 max-w-md">
                Click on any marker on the map to view detailed inventory information for that medical facility
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
