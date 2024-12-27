import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, ListTodo, PieChart, ShoppingCart } from "lucide-react";
import prisma from "@/lib/prisma";
import { StockChart } from "@/components/stock-chart";

export default async function DashboardPage() {
  const dataDashboard = await prisma.dataDashboard.findUnique({
    where: {
      id: 1,
    },
  });

  const stockLevels = await prisma.stockLevel.findMany({
    include: {
      medicine: true,
      distributionCenter: true,
    },
  });

  // const stockData = distributionCenters.map((center) => {
  //   const centerData = { location: center.name };
  //   medicines.forEach((medicine) => {
  //     const stockLevel = stockLevels.find(
  //       (sl) => sl.medicineId === medicine.id && sl.distributionCenterId === center.id
  //     );
  //     centerData[medicine.id] = stockLevel ? stockLevel.quantity : 0;
  //   });
  //   return centerData;
  // });

  return (
    <div className="min-h-screen bg-background w-full border">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Hi, User!</h2>
              <p className="text-muted-foreground">
                Lets see the stock condition in your area
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium">
                  Lowest Demand
                </CardTitle>
                <PieChart
                  className="h-8 w-8 text-teal-500"
                  aria-hidden="true"
                />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">
                  {dataDashboard?.lowest_demand || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowest demand medicine
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium">
                  Slowest Moving
                </CardTitle>
                <ShoppingCart
                  className="h-8 w-8 text-teal-500"
                  aria-hidden="true"
                />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">
                  {dataDashboard?.slowest_moving || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Slowest moving medicine
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium">
                  Top Distributed
                </CardTitle>
                <Boxes className="h-8 w-8 text-teal-500" aria-hidden="true" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">
                  {dataDashboard?.top_distributed || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Most distributed medicine
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium">
                  Highest Demand
                </CardTitle>
                <ListTodo
                  className="h-8 w-8 text-teal-500"
                  aria-hidden="true"
                />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">
                  {dataDashboard?.highest_demand || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Highest demand medicine
                </p>
              </CardContent>
            </Card>
          </div>
          <StockChart
            stockLevel={stockLevels.map((stock) => ({
              ...stock,
              distribution: stock.distributionCenter,
              medicines: stock.medicine,
            }))}
          />
        </div>
    </div>
  );
}
