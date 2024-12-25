import MapPage from "@/components/map/MapPage";

import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import React from "react";

export default async function MapLayout() {
  const medicines = await prisma.medicine.findUnique({
    where: {
      id: 1,
    },
  });

  console.log(medicines);

  return (
    <Card className="flex flex-1 flex-col gap-4 p-4 pt-0 mx-4">
      <label htmlFor="">{medicines?.medicine_name}</label>
      <label htmlFor="">{medicines?.medicine_type}</label>
      <MapPage />
    </Card>
  );
}
