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
  // Step 1: Create maps to track outgoing demand and current stock for each medicine and location
  const medicineDemand = new Map<string, number>();
  const medicineNames = new Map<string, string>();
  const locationCurrentStock = new Map<string, number>();
  const locationNames = new Map<string, string>();
  const receivedTotals = new Map<string, number>();

  // Step 2: Calculate outgoing demand, current stock, and received totals
  stockLevels.forEach((stock) => {
    const medicineName = stock.medicine.medicine_name;
    const locationName = stock.distributionCenter.name;
    const quantity = stock.quantity;

    // Update outgoing demand (only for outgoing transactions)
    if (stock.medicine.transaction_status === "Outgoing") {
      const currentDemand = medicineDemand.get(medicineName) || 0;
      medicineDemand.set(medicineName, currentDemand + quantity);
    }

    // Update current stock (Incoming - Outgoing)
    const currentStock = locationCurrentStock.get(locationName) || 0;
    locationCurrentStock.set(locationName, 
      currentStock + (stock.medicine.transaction_status === "Incoming" ? quantity : -quantity)
    );

    // Update received totals (only for incoming transactions)
    if (stock.medicine.transaction_status === "Incoming") {
      const currentReceived = receivedTotals.get(medicineName) || 0;
      receivedTotals.set(medicineName, currentReceived + quantity);
    }

    medicineNames.set(medicineName, medicineName);
    locationNames.set(locationName, locationName);
  });

  // Step 3: Find medicines with lowest and highest outgoing demand
  const demandEntries = Array.from(medicineDemand.entries());
  const lowestDemand = demandEntries.reduce((min, current) => 
    current[1] < min[1] ? current : min
  , ['', Infinity]);

  const highestDemand = demandEntries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  , ['', -Infinity]);

  // Step 4: Find top distribution location based on current stock
  const topLocation = Array.from(locationCurrentStock.entries())
    .reduce(([maxName, maxStock], [name, stock]) => 
      stock > maxStock ? [name, stock] : [maxName, maxStock]
    , ['', -Infinity]);

  // Step 5: Find most received item
  const mostReceived = Array.from(receivedTotals.entries())
    .reduce(([maxName, maxTotal], [name, total]) => 
      total > maxTotal ? [name, total] : [maxName, maxTotal]
    , ['', -Infinity]);

  return {
    lowestDemand: {
      quantity: lowestDemand[1],
      medicineName: lowestDemand[0]
    },
    highestDemand: {
      quantity: highestDemand[1],
      medicineName: highestDemand[0]
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

