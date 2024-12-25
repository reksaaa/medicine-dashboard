import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, ListTodo, PieChart, ShoppingCart } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  const data = await prisma.dataDashboard.findUnique({
    where: {
      id: 1,
    },
  });

  console.log(data);
  return (
    <div className="min-h-screen">
      <main className="flex-1">
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
                <PieChart className="h-8 w-8 text-teal-500" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">Med1</div>
                <p className="text-xs text-muted-foreground">
                  {data?.lowest_demand}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium">
                  Slowest Moving
                </CardTitle>
                <ShoppingCart className="h-8 w-8 text-teal-500" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">Med3</div>
                <p className="text-xs text-muted-foreground">
                  {data?.slowest_moving}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium">
                  Top Distributed
                </CardTitle>
                <Boxes className="h-8 w-8 text-teal-500" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">Med3</div>
                <p className="text-xs text-muted-foreground">
                  {data?.top_distributed}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-base font-medium">
                  Highest Demand
                </CardTitle>
                <ListTodo className="h-8 w-8 text-teal-500" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">Med3</div>
                <p className="text-xs text-muted-foreground">
                  {data?.highest_demand}
                </p>
              </CardContent>
            </Card>
          </div>
          {/* <StockChart /> */}
        </div>
      </main>
    </div>
  );
}
