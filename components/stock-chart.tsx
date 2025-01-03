"use client";

import * as React from "react";
import { X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DistributionCenter, Medicine, StockLevel } from "@prisma/client";
import { useEffect, useState } from "react";

interface StockChartProps {
  stockLevel: (StockLevel & {
    distribution: DistributionCenter;
    medicines: Medicine;
  })[];
}

function FilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-full shadow-sm">
      <button
        onClick={onRemove}
        className="text-red-500 hover:text-red-700"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

export function StockChart({ stockLevel }: StockChartProps) {
  const [selectedLocations, setSelectedLocations] = useState<DistributionCenter[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<Medicine[]>([]);
  const [selectedTransactionStatus, setSelectedTransactionStatus] = useState<string>("Current");
  const [locationSearch, setLocationSearch] = React.useState("");
  const [medicineSearch, setMedicineSearch] = React.useState("");
  const [locationOpen, setLocationOpen] = React.useState(false);
  const [medicineOpen, setMedicineOpen] = React.useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const colors = [
    "#2E86C1", "#28B463", "#D35400", "#884EA0", "#CB4335", 
    "#F1C40F", "#17A589", "#839192", "#8E44AD", "#C0392B"
  ];

  const locations = React.useMemo(() => {
    const uniqueLocations = new Map<number, DistributionCenter>();
    stockLevel.forEach((sl) => {
      uniqueLocations.set(sl.distribution.id, sl.distribution);
    });
    return Array.from(uniqueLocations.values());
  }, [stockLevel]);

  const medicines = React.useMemo(() => {
    const uniqueMedicines = new Map<string, Medicine>();
    stockLevel.forEach((sl) => {
      uniqueMedicines.set(sl.medicines.medicine_name, sl.medicines);
    });
    return Array.from(uniqueMedicines.values());
  }, [stockLevel]);

  const addLocation = (location: DistributionCenter) => {
    if (!selectedLocations.some((l) => l.id === location.id)) {
      setSelectedLocations([...selectedLocations, location]);
    }
    setLocationOpen(false);
    setLocationSearch("");
  };

  const removeLocation = (location: DistributionCenter) => {
    setSelectedLocations(selectedLocations.filter((l) => l.id !== location.id));
  };

  const addMedicine = (medicine: Medicine) => {
    if (!selectedMedicines.some((m) => m.id === medicine.id)) {
      setSelectedMedicines([...selectedMedicines, medicine]);
    }
    setMedicineOpen(false);
    setMedicineSearch("");
  };

  const removeMedicine = (medicine: Medicine) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.id !== medicine.id));
  };

  const calculateCurrentStock = (medicineData: typeof stockLevel) => {
    const incomingQuantity = medicineData
      .filter(sl => sl.medicines.transaction_status === "Incoming")
      .reduce((sum, sl) => sum + sl.quantity, 0);
    
    const outgoingQuantity = medicineData
      .filter(sl => sl.medicines.transaction_status === "Outgoing")
      .reduce((sum, sl) => sum + sl.quantity, 0);

    return incomingQuantity - outgoingQuantity;
  };

  const filteredData = React.useMemo(() => {
    // First filter by selected locations and medicines
    let filteredStockLevels = stockLevel;

    if (selectedLocations.length > 0) {
      filteredStockLevels = filteredStockLevels.filter((sl) =>
        selectedLocations.some((location) => location.id === sl.distributionCenterId)
      );
    }

    if (selectedMedicines.length > 0) {
      filteredStockLevels = filteredStockLevels.filter((sl) =>
        selectedMedicines.some((medicine) => 
          medicine.medicine_name === sl.medicines.medicine_name
        )
      );
    }

    const groupedData = filteredStockLevels.reduce((acc, sl) => {
      const locationName = sl.distribution.name;
      if (!acc[locationName]) {
        acc[locationName] = { name: locationName };
      }

      const medicineName = sl.medicines.medicine_name;
      
      if (selectedTransactionStatus === "Current") {
        // For Current, calculate net stock (incoming - outgoing)
        const medicineData = filteredStockLevels.filter(
          item => item.distribution.name === locationName && 
          item.medicines.medicine_name === medicineName
        );
        acc[locationName][medicineName] = calculateCurrentStock(medicineData);
      } else {
        // For Incoming/Outgoing, sum quantities for the selected status
        if (sl.medicines.transaction_status === selectedTransactionStatus) {
          acc[locationName][medicineName] = (acc[locationName][medicineName] || 0) + sl.quantity;
        }
      }
      
      return acc;
    }, {} as Record<string, { name: string; [key: string]: string | number }>);

    return Object.values(groupedData);
  }, [stockLevel, selectedLocations, selectedMedicines, selectedTransactionStatus, isClient]);

  const uniqueMedicines = React.useMemo(() => {
    const medicineSet = new Set<string>();
    filteredData.forEach((dataPoint) => {
      Object.keys(dataPoint).forEach((key) => {
        if (key !== "name") {
          medicineSet.add(key);
        }
      });
    });
    return Array.from(medicineSet);
  }, [filteredData, isClient]);

  if (!isClient) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>Medicine Stock Levels</CardTitle>
          <CardDescription>
            Current stock levels across distribution centers
          </CardDescription>
          <Select
            value={selectedTransactionStatus}
            onValueChange={setSelectedTransactionStatus}
            defaultValue="Current"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Current">Current</SelectItem>
              <SelectItem value="Incoming">Incoming</SelectItem>
              <SelectItem value="Outgoing">Outgoing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <CartesianGrid strokeDasharray="3 3" />
                {uniqueMedicines.map((medicineName, index) => (
                  <Bar
                    key={medicineName}
                    dataKey={medicineName}
                    name={medicineName}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-8">
            {/* Location and Medicine filters remain unchanged */}
            <div className="space-y-4">
              <h2 className="text-base font-medium">Location</h2>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Filter by location..."
                      className="pl-8"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      aria-label="Filter locations"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {locations
                          .filter(
                            (location) =>
                              location.name
                                .toLowerCase()
                                .includes(locationSearch.toLowerCase()) &&
                              !selectedLocations.some(
                                (sl) => sl.id === location.id
                              )
                          )
                          .map((location) => (
                            <CommandItem
                              key={location.id}
                              onSelect={() => addLocation(location)}
                            >
                              {location.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map((location) => (
                  <FilterBadge
                    key={location.id}
                    label={location.name}
                    onRemove={() => removeLocation(location)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-medium">Medicine</h2>
              <Popover open={medicineOpen} onOpenChange={setMedicineOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Filter by medicine..."
                      className="pl-8"
                      value={medicineSearch}
                      onChange={(e) => setMedicineSearch(e.target.value)}
                      aria-label="Filter medicines"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {medicines
                          .filter(
                            (medicine) =>
                              medicine.medicine_name
                                .toLowerCase()
                                .includes(medicineSearch.toLowerCase()) &&
                              !selectedMedicines.some(
                                (sm) => sm.id === medicine.id
                              )
                          )
                          .map((medicine) => (
                            <CommandItem
                              key={medicine.id}
                              onSelect={() => addMedicine(medicine)}
                            >
                              {medicine.medicine_name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex flex-wrap gap-2">
                {selectedMedicines.map((medicine) => (
                  <FilterBadge
                    key={medicine.id}
                    label={medicine.medicine_name}
                    onRemove={() => removeMedicine(medicine)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}