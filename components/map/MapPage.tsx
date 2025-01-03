"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngExpression, Icon } from "leaflet";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findMedicine } from "@/lib/actions/medicine";
import { Loader2 } from 'lucide-react';

// Fix Leaflet default icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const defaultIcon = new Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconSize: [30, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -45],
});

const criticalIcon = new Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [30, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -45],
});

// Types
interface Medicine {
  id: number;
  medicine_name: string;
  medicine_type: string;
  quantity: number;
  transaction_status: string;
  stock_status: string;
  delivery_batch: string;
  expiry_date: Date;
  created_by: string;
}

interface DistributionCenter {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface StockLevel {
  id: number;
  medicineId: number;
  distributionCenterId: number;
  quantity: number;
  medicine: Medicine;
  distributionCenter: DistributionCenter;
}

interface MapPageProps {
  distributionCenters: DistributionCenter[];
}

// Custom marker component
function CustomMarker({
  position,
  name,
  isCritical,
  onClick,
}: {
  position: LatLngExpression;
  name: string;
  isCritical: boolean;
  onClick: () => void;
}) {
  const map = useMap();
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      click: () => {
        onClick();
        map.setView(position, map.getZoom());
      },
    }),
    [map, onClick, position]
  );

  return (
    <Marker
      position={position}
      icon={isCritical ? criticalIcon : defaultIcon}
      eventHandlers={eventHandlers}
      ref={markerRef}
    >
      <Popup>
        <b>{name}</b>
        <br />
        Medicine Distribution Center
      </Popup>
    </Marker>
  );
}

export default function MapPage({ distributionCenters }: MapPageProps) {
  const [entries, setEntries] = useState<string>("10");
  const [filterBy, setFilterBy] = useState<string>("");
  const [medicineData, setMedicineData] = useState<StockLevel[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [criticalMarkers, setCriticalMarkers] = useState<boolean[]>(
    new Array(distributionCenters.length).fill(false)
  );

  const handleMarkerClick = async (index: number) => {
    setIsLoading(true);
    setSelectedMarker(index);
    try {
      const result = await findMedicine(distributionCenters[index].id);
      if (result.success && result.data) {
        setMedicineData(result.data);
      } else {
        console.error("Failed to fetch medicine data:", result.error);
        setMedicineData([]);
      }
    } catch (error) {
      console.error("Error fetching medicine data:", error);
      setMedicineData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHighlightCritical = () => {
    if (selectedMarker !== null) {
      setCriticalMarkers((prev) => {
        const newCriticalMarkers = [...prev];
        newCriticalMarkers[selectedMarker] =
          !newCriticalMarkers[selectedMarker];
        return newCriticalMarkers;
      });
    }
  };

  // Filter and sort medicineData based on selected filter
  const filteredMedicineData = useMemo(() => {
    let filtered = [...medicineData];

    switch (filterBy) {
      case "expiry":
        filtered.sort(
          (a, b) =>
            new Date(a.medicine.expiry_date).getTime() -
            new Date(b.medicine.expiry_date).getTime()
        );
        break;
      case "incoming":
        filtered = filtered.filter(
          (m) => m.medicine.transaction_status === "Incoming"
        );
        break;
      case "outgoing":
        filtered = filtered.filter(
          (m) => m.medicine.transaction_status === "Outgoing"
        );
        break;
      case "quantityLowToHigh":
        filtered.sort((a, b) => a.quantity - b.quantity);
        break;
      case "quantityHighToLow":
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
    }

    return filtered;
  }, [medicineData, filterBy]);

  // Limit the number of entries shown based on the selected value
  const limitedMedicineData = useMemo(() => {
    return filteredMedicineData.slice(0, parseInt(entries));
  }, [filteredMedicineData, entries]);

  return (
    <div className="p-8">
      {/* Map Section */}
      <div className="rounded-lg border bg-white relative z-0">
        <MapContainer
          center={
            distributionCenters[0]
              ? [
                  distributionCenters[0].latitude,
                  distributionCenters[0].longitude,
                ]
              : ([-6.2088, 106.8456] as LatLngExpression)
          }
          zoom={13}
          className="h-[400px] w-full rounded-lg"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {distributionCenters.map((center, index) => (
            <CustomMarker
              key={center.id}
              position={[center.latitude, center.longitude]}
              name={center.name}
              isCritical={criticalMarkers[index]}
              onClick={() => handleMarkerClick(index)}
            />
          ))}
        </MapContainer>
      </div>

      {/* Controls and Table Section */}
      <div className="mt-8 space-y-4 relative z-50">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-gray-700">Show</span>
            <Select value={entries} onValueChange={setEntries}>
              <SelectTrigger className="w-16 relative z-[60]">
                <SelectValue>{entries}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="font-bold text-gray-700">entries</span>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-60 relative z-[60]">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="z-[1000]">
                <SelectItem value="expiry">Expiry Date</SelectItem>
                <SelectItem value="incoming">
                  Transaction Status: Incoming
                </SelectItem>
                <SelectItem value="outgoing">
                  Transaction Status: Outgoing
                </SelectItem>
                <SelectItem value="quantityLowToHigh">
                  Quantity: Low to High
                </SelectItem>
                <SelectItem value="quantityHighToLow">
                  Quantity: High to Low
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              className="bg-teal-600 text-white hover:bg-teal-700"
              onClick={handleHighlightCritical}
              disabled={selectedMarker === null}
            >
              Highlight Critical
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Medicine Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Transaction Status</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Delivery Batch</TableHead>
                <TableHead>Expiry Date</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : limitedMedicineData.length > 0 ? (
              <TableBody>
                {limitedMedicineData.map((stockLevel) => (
                  <TableRow key={stockLevel.id}>
                    <TableCell>{stockLevel.medicine.medicine_name}</TableCell>
                    <TableCell>{stockLevel.medicine.medicine_type}</TableCell>
                    <TableCell>{stockLevel.quantity}</TableCell>
                    <TableCell>{stockLevel.medicine.transaction_status}</TableCell>
                    <TableCell>{stockLevel.medicine.stock_status}</TableCell>
                    <TableCell>{stockLevel.medicine.delivery_batch}</TableCell>
                    <TableCell>
                      {new Date(stockLevel.medicine.expiry_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No medicine data available.
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}