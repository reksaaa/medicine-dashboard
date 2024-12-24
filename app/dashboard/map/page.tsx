import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import React from "react";

export default async function MapPage() {
  const medicines = await prisma.medicine.findMany();

  console.log(medicines);

  return <Card className="flex flex-1 flex-col gap-4 p-4 pt-0 mx-4"></Card>;
}
