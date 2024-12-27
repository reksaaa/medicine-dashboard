"use client";

import React, { useState, useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { X } from 'lucide-react';
import { DistributionCenter, Medicine, StockLevel } from "@prisma/client";

interface TestProps {
  stock: (StockLevel & {
    medicine: Medicine;
    distributionCenter: DistributionCenter;
  })[];
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
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

const Test = ({ stock }: TestProps) => {
  const [selectedLocations, setSelectedLocations] = useState<DistributionCenter[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<Medicine[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [medicineOpen, setMedicineOpen] = useState(false);

  const locations = useMemo(() => {
    return Array.from(new Set(stock.map(item => item.distributionCenter)));
  }, [stock]);

  const medicines = useMemo(() => {
    return Array.from(new Set(stock.map(item => item.medicine)));
  }, [stock]);

  const addLocation = (location: DistributionCenter) => {
    if (!selectedLocations.some(l => l.id === location.id)) {
      setSelectedLocations([...selectedLocations, location]);
    }
    setLocationOpen(false);
    setLocationSearch("");
  };

  const removeLocation = (location: DistributionCenter) => {
    setSelectedLocations(selectedLocations.filter((l) => l.id !== location.id));
  };

  const addMedicine = (medicine: Medicine) => {
    if (!selectedMedicines.some(m => m.id === medicine.id)) {
      setSelectedMedicines([...selectedMedicines, medicine]);
    }
    setMedicineOpen(false);
    setMedicineSearch("");
  };

  const removeMedicine = (medicine: Medicine) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.id !== medicine.id));
  };

  const filteredData = useMemo(() => {
    let filteredStock = stock;

    if (selectedLocations.length > 0) {
      filteredStock = filteredStock.filter(item =>
        selectedLocations.some(location => location.id === item.distributionCenter.id)
      );
    }

    if (selectedMedicines.length > 0) {
      filteredStock = filteredStock.filter(item =>
        selectedMedicines.some(medicine => medicine.id === item.medicine.id)
      );
    }

    const groupedData = filteredStock.reduce((acc, item) => {
      const locationName = item.distributionCenter.name;
      if (!acc[locationName]) {
        acc[locationName] = { Location: locationName };
      }
      acc[locationName][item.medicine.medicine_name] = item.quantity;
      return acc;
    }, {} as Record<string, { [key: string]: string | number }>);

    const chartData = [
      ['Location', ...medicines.map(m => m.medicine_name)],
      ...Object.values(groupedData).map(row => 
        [row.Location, ...medicines.map(m => row[m.medicine_name] || 0)]
      )
    ];

    return chartData;
  }, [stock, selectedLocations, selectedMedicines, medicines]);

  const options = {
    chart: {
      title: 'Medicine Stock Levels',
      subtitle: 'Current stock levels across distribution centers',
    },
    bars: 'vertical',
    hAxis: {
      title: 'Location',
    },
    vAxis: {
      title: 'Quantity',
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Medicine Stock Levels by Location</CardTitle>
        <CardDescription>Current stock levels across distribution centers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3">
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="400px"
              data={filteredData}
              options={options}
            />
          </div>
          <div className="space-y-8">
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
                              !selectedLocations.some(sl => sl.id === location.id)
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
                              !selectedMedicines.some(sm => sm.id === medicine.id)
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
};

export default Test;

