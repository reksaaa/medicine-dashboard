"use client";

import { useState, useRef, useMemo } from "react";
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
import { Loader2 } from "lucide-react";
import { Result } from "postcss";

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

// Types from Prisma schema
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
  const [medicineData, setMedicineData] = useState<any>();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [criticalMarkers, setCriticalMarkers] = useState<boolean[]>(
    new Array(distributionCenters.length).fill(false)
  );

  const handleMarkerClick = async (index: number) => {
    setIsLoading(true);
    try {
      const result = await findMedicine(1);
      console.log(result);
      setMedicineData(result);
    } catch {
      setIsLoading(false);
    } finally {
      setIsLoading(false); // Ensure loading indicator is stopped regardless of success or failure
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

  // Filter medicines based on selected filter
  // const filteredMedicines = useMemo(() => {
  //   let filtered = [...medicines];

  //   switch (filterBy) {
  //     case "expiry":
  //       filtered.sort(
  //         (a, b) => a.expiry_date.getTime() - b.expiry_date.getTime()
  //       );
  //       break;
  //     case "incoming":
  //       filtered = filtered.filter((m) => m.transaction_status === "Incoming");
  //       break;
  //     case "outgoing":
  //       filtered = filtered.filter((m) => m.transaction_status === "Outgoing");
  //       break;
  //     case "quantityLowToHigh":
  //       filtered.sort((a, b) => a.quantity - b.quantity);
  //       break;
  //     case "quantityHighToLow":
  //       filtered.sort((a, b) => b.quantity - a.quantity);
  //       break;
  //   }

  //   return filtered;
  // }, [medicines, filterBy]);

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
          </Table>
          {isLoading ? (
            <Loader2 />
          ) : (
            <div>
              {Array.isArray(medicineData) ? (
                <TableBody>
                  {medicineData.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell>{medicine.medicine_name}</TableCell>
                      <TableCell>{medicine.medicine_type}</TableCell>
                      <TableCell>{medicine.quantity}</TableCell>
                      <TableCell>{medicine.transaction_status}</TableCell>
                      <TableCell>{medicine.stock_status}</TableCell>
                      <TableCell>{medicine.delivery_batch}</TableCell>
                      <TableCell>
                        {new Date(medicine.expiry_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <p>No medicine data available.</p> // Show a message when data is empty
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
