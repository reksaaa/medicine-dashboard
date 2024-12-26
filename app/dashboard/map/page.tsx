import MapPage from "@/components/map/MapPage";
import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import React from "react";

export default async function MapLayout() {
  // Fetch all medicines
  const medicines = await prisma.medicine.findMany({
    orderBy: {
      medicine_name: 'asc'
    }
  });

  // Fetch distribution centers
  const distributionCenters = await prisma.distributionCenter.findMany();

  return (
    <Card className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <MapPage 
        medicines={medicines} 
        distributionCenters={distributionCenters} 
      />
    </Card>
  );
}

