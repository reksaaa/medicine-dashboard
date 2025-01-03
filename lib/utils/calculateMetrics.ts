import { StockLevel, Medicine, DistributionCenter } from "@prisma/client";

type ExtendedStockLevel = StockLevel & {
  medicine: Medicine;
  distributionCenter: DistributionCenter;
};

interface MetricsResult {
  lowestDemand: {
    quantity: number;
    medicineName: string;
  };
  highestDemand: {
    quantity: number;
    medicineName: string;
  };
  topDistributed: {
    quantity: number;
    locationName: string;
  };
  mostReceived: {
    quantity: number;
    medicineName: string;
  };
}

export function calculateDashboardMetrics(stockLevels: ExtendedStockLevel[]): MetricsResult {
  // Step 1: Create a map to track total demand for each medicine
  const medicineDemand = new Map<string, number>();
  const medicineNames = new Map<string, string>();

  // Step 2: Calculate total demand by summing quantities across all locations
  stockLevels.forEach((stock) => {
    const medicineName = stock.medicine.medicine_name;
    const currentTotal = medicineDemand.get(medicineName) || 0;
    medicineDemand.set(medicineName, currentTotal + stock.quantity);
    medicineNames.set(medicineName, medicineName);
  });

  // Step 3: Convert demand data to array for comparison
  const demandEntries = Array.from(medicineDemand.entries()).map(([name, total]) => ({
    name,
    total
  }));

  // Step 4: Find medicines with highest and lowest total demand
  const lowestDemand = demandEntries.reduce((min, current) => 
    current.total < min.total ? current : min
  , { name: '', total: Infinity });

  const highestDemand = demandEntries.reduce((max, current) => 
    current.total > max.total ? current : max
  , { name: '', total: -Infinity });

  // Step 5: Calculate distribution center totals
  const locationTotals = new Map<string, number>();
  const locationNames = new Map<string, string>();

  stockLevels.forEach((stock) => {
    const centerName = stock.distributionCenter.name;
    const currentTotal = locationTotals.get(centerName) || 0;
    locationTotals.set(centerName, currentTotal + stock.quantity);
    locationNames.set(centerName, centerName);
  });

  // Step 6: Find top distribution location
  const topLocation = Array.from(locationTotals.entries())
    .reduce(([maxName, maxTotal], [name, total]) => 
      total > maxTotal ? [name, total] : [maxName, maxTotal]
    , ['', -Infinity]);

  // Step 7: Calculate most received items (only incoming transactions)
  const receivedTotals = new Map<string, number>();
  
  stockLevels.forEach((stock) => {
    if (stock.medicine.transaction_status === "Incoming") {
      const medicineName = stock.medicine.medicine_name;
      const currentTotal = receivedTotals.get(medicineName) || 0;
      receivedTotals.set(medicineName, currentTotal + stock.quantity);
    }
  });

  const mostReceived = Array.from(receivedTotals.entries())
    .reduce(([maxName, maxTotal], [name, total]) => 
      total > maxTotal ? [name, total] : [maxName, maxTotal]
    , ['', -Infinity]);

  return {
    lowestDemand: {
      quantity: lowestDemand.total,
      medicineName: lowestDemand.name
    },
    highestDemand: {
      quantity: highestDemand.total,
      medicineName: highestDemand.name
    },
    topDistributed: {
      quantity: topLocation[1],
      locationName: topLocation[0]
    },
    mostReceived: {
      quantity: mostReceived[1],
      medicineName: mostReceived[0]
    }
  };
}