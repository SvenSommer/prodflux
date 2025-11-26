/**
 * Planning Engine Result Models
 * Pure TypeScript models for planning results (Step 3)
 * No Angular dependencies
 */

/**
 * Global material overview (Tab 1)
 */
export interface GlobalMaterialRow {
  materialId: number;
  totalRequired: number;

  totalStock: number;
  openOrders: number; // Step 3: default 0, later from /orders + /deliveries
  totalAvailable: number; // stock + openOrders

  shortage: number; // max(0, required - available)
  suggestedOrderToCentral: number; // shortage (to Rauen)
}

/**
 * Transfer suggestion between workshops (Tab 2)
 */
export interface MaterialTransferSuggestion {
  materialId: number;
  fromWorkshopId: number;
  toWorkshopId: number;
  quantity: number;
}

/**
 * Workshop-specific coverage detail (Tab 3)
 */
export interface WorkshopCoverage {
  workshopId: number;
  materialId: number;

  required: number;
  coveredLocal: number;
  coveredByTransfers: number;
  remainingShortage: number;

  localStockBeforeOrders: number;
  localStockAfterOrdersAndTransfers: number;
}

/**
 * Complete planning result
 */
export interface GlobalPlanningResult {
  materials: GlobalMaterialRow[]; // Tab 1
  transferSuggestions: MaterialTransferSuggestion[]; // Tab 2
  workshopCoverage: WorkshopCoverage[]; // Tab 3
  meta: {
    centralWorkshopId: number;
    workshopIds: number[];
    totalTargets: number;
  };
}

/**
 * Planning options
 */
export interface PlanOptions {
  centralWorkshopId: number; // Rauen (default: 2)
  workshopIds: number[]; // Step 6: [potsdamId, rauenId]

  // Open orders by material ID
  // Step 6: default {}, later from backend
  // Backend TODO: derive from /orders + /deliveries
  openOrdersByMaterialId?: Record<number, number>;
}
