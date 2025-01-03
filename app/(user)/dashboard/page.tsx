import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, ListTodo, PieChart, ShoppingCart } from 'lucide-react';
import prisma from "@/lib/prisma";
import { StockChart } from "@/components/stock-chart";
import { calculateDashboardMetrics } from "@/lib/utils/calculateMetrics";

export default async function DashboardPage() {
  const stockLevels = await prisma.stockLevel.findMany({
    include: {
      medicine: true,
      distributionCenter: true,
    },
  });

  const metrics = calculateDashboardMetrics(stockLevels);

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
              <PieChart className="h-8 w-8 text-teal-500" aria-hidden="true" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-bold">
                {metrics.lowestDemand.quantity}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.lowestDemand.medicineName}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
              <CardTitle className="text-base font-medium">
                Highest Demand
              </CardTitle>
              <ShoppingCart
                className="h-8 w-8 text-teal-500"
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-bold">
                {metrics.highestDemand.quantity}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.highestDemand.medicineName}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
              <CardTitle className="text-base font-medium">
                Top Distribution Location
              </CardTitle>
              <Boxes className="h-8 w-8 text-teal-500" aria-hidden="true" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-bold">
                {metrics.topDistributed.quantity}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.topDistributed.locationName}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
              <CardTitle className="text-base font-medium">
                Most Received Item
              </CardTitle>
              <ListTodo className="h-8 w-8 text-teal-500" aria-hidden="true" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-2xl font-bold">
                {metrics.mostReceived.quantity}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.mostReceived.medicineName}
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

