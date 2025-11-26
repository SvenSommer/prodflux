/**
 * Material Planning Engine v2.1 (Step 6)
 * Pure TypeScript, deterministic, no side effects, no Angular dependencies
 *
 * Assumptions (Step 6):
 * - Only 2 workshops supported (Potsdam, Rauen)
 * - Required per workshop calculated from targets (workshopId in targets)
 * - Central workshop: Rauen (default workshopId=2)
 * - Transfer logic: greedy (simple deterministic)
 * - Open orders: default 0 (Backend TODO: derive from /orders + /deliveries)
 */

import { WorkshopProductTarget } from '../models/workshop-product-target';
import { ProductMaterial } from '../models/api/product-material.model';
import { StockByWorkshopAndMaterial } from '../services/material-planning-data.service';
import {
  GlobalMaterialRow,
  MaterialTransferSuggestion,
  WorkshopCoverage,
  GlobalPlanningResult,
  PlanOptions
} from '../models/planning/planning-result.models';

/**
 * Helper: Parse decimal string to number
 * Supports: "0", "1", "1.5", "1,5" (comma as decimal separator)
 * Invalid values return 0
 */
export function parseDecimal(quantityPerUnit: string): number {
  if (!quantityPerUnit || quantityPerUnit.trim() === '') {
    return 0;
  }

  // Replace comma with dot for decimal separator
  const normalized = quantityPerUnit.replace(',', '.');
  const parsed = parseFloat(normalized);

  // Return 0 for invalid values (NaN, Infinity, etc.)
  if (!isFinite(parsed)) {
    console.warn(`Invalid quantity_per_unit: "${quantityPerUnit}", using 0`);
    return 0;
  }

  return parsed;
}

/**
 * Main planning function
 * Pure function - no side effects, deterministic
 */
export function planGlobalMaterials(
  targets: WorkshopProductTarget[],
  bom: ProductMaterial[],
  stockByWorkshop: StockByWorkshopAndMaterial,
  options: PlanOptions
): GlobalPlanningResult {
  const {
    centralWorkshopId,
    workshopIds,
    openOrdersByMaterialId = {}
  } = options;

  // Validate: Step 3 only supports 2 workshops
  if (workshopIds.length !== 2) {
    throw new Error(`Step 3 only supports exactly 2 workshops, got ${workshopIds.length}`);
  }

  // Step A: Global Required per Material AND Workshop-specific Required
  const requiredByMaterialId: Record<number, number> = {};
  const requiredByWorkshopAndMaterial: Record<number, Record<number, number>> = {};

  // Initialize workshop records
  workshopIds.forEach(wId => {
    requiredByWorkshopAndMaterial[wId] = {};
  });

  targets.forEach(target => {
    const relevantBomEntries = bom.filter(b => b.product === target.productId);

    relevantBomEntries.forEach(bomEntry => {
      const qtyPerUnit = parseDecimal(bomEntry.quantity_per_unit);
      const required = target.quantity * qtyPerUnit;

      // Global required
      if (!requiredByMaterialId[bomEntry.material]) {
        requiredByMaterialId[bomEntry.material] = 0;
      }
      requiredByMaterialId[bomEntry.material] += required;

      // Workshop-specific required
      const wId = target.workshopId;
      if (!requiredByWorkshopAndMaterial[wId]) {
        requiredByWorkshopAndMaterial[wId] = {};
      }
      if (!requiredByWorkshopAndMaterial[wId][bomEntry.material]) {
        requiredByWorkshopAndMaterial[wId][bomEntry.material] = 0;
      }
      requiredByWorkshopAndMaterial[wId][bomEntry.material] += required;
    });
  });

  // Step B: Global Stock per Material
  const totalStockByMaterialId: Record<number, number> = {};

  workshopIds.forEach(wId => {
    const workshopStock = stockByWorkshop[wId] || {};
    Object.keys(workshopStock).forEach(mIdStr => {
      const materialId = Number(mIdStr);
      const stockQty = workshopStock[materialId] || 0;

      if (!totalStockByMaterialId[materialId]) {
        totalStockByMaterialId[materialId] = 0;
      }
      totalStockByMaterialId[materialId] += stockQty;
    });
  });

  // Step C: Open Orders (Step 3 default)
  // Backend TODO: later derive from /orders + /deliveries
  // Already provided via options.openOrdersByMaterialId, defaults to {}

  // Step D: Shortage & Suggested Order to Central
  const materialRows: GlobalMaterialRow[] = [];
  const allMaterialIds = new Set([
    ...Object.keys(requiredByMaterialId).map(Number),
    ...Object.keys(totalStockByMaterialId).map(Number)
  ]);

  allMaterialIds.forEach(materialId => {
    const totalRequired = requiredByMaterialId[materialId] || 0;
    const totalStock = totalStockByMaterialId[materialId] || 0;
    const openOrders = openOrdersByMaterialId[materialId] || 0;

    const totalAvailable = totalStock + openOrders;
    const shortage = Math.max(0, totalRequired - totalAvailable);
    const suggestedOrderToCentral = shortage;

    materialRows.push({
      materialId,
      totalRequired,
      totalStock,
      openOrders,
      totalAvailable,
      shortage,
      suggestedOrderToCentral
    });
  });

  // Step E: Stock After Orders (only central workshop)
  const stockAfterOrders: Record<number, Record<number, number>> = {};

  workshopIds.forEach(wId => {
    stockAfterOrders[wId] = {};
    const workshopStock = stockByWorkshop[wId] || {};

    allMaterialIds.forEach(materialId => {
      const stockBefore = workshopStock[materialId] || 0;
      let stockAfter = stockBefore;

      // Add suggested order only to central workshop
      if (wId === centralWorkshopId) {
        const row = materialRows.find(r => r.materialId === materialId);
        if (row) {
          stockAfter += row.suggestedOrderToCentral;
        }
      }

      stockAfterOrders[wId][materialId] = stockAfter;
    });
  });

  // Step F: Greedy Transfer Planning (2 workshops only)
  const transferSuggestions: MaterialTransferSuggestion[] = [];

  allMaterialIds.forEach(materialId => {
    const [wId1, wId2] = workshopIds;

    const required1 = requiredByWorkshopAndMaterial[wId1][materialId] || 0;
    const required2 = requiredByWorkshopAndMaterial[wId2][materialId] || 0;

    const stockAfter1 = stockAfterOrders[wId1][materialId] || 0;
    const stockAfter2 = stockAfterOrders[wId2][materialId] || 0;

    const delta1 = stockAfter1 - required1;
    const delta2 = stockAfter2 - required2;

    // Workshop 1 has surplus, Workshop 2 needs material
    if (delta1 > 0 && delta2 < 0) {
      const transferQty = Math.min(delta1, Math.abs(delta2));
      if (transferQty > 0) {
        transferSuggestions.push({
          materialId,
          fromWorkshopId: wId1,
          toWorkshopId: wId2,
          quantity: transferQty
        });
      }
    }
    // Workshop 2 has surplus, Workshop 1 needs material
    else if (delta2 > 0 && delta1 < 0) {
      const transferQty = Math.min(delta2, Math.abs(delta1));
      if (transferQty > 0) {
        transferSuggestions.push({
          materialId,
          fromWorkshopId: wId2,
          toWorkshopId: wId1,
          quantity: transferQty
        });
      }
    }
  });

  // Step G: Workshop Coverage Output
  const workshopCoverageList: WorkshopCoverage[] = [];

  workshopIds.forEach(wId => {
    allMaterialIds.forEach(materialId => {
      const required = requiredByWorkshopAndMaterial[wId][materialId] || 0;
      const localStockBeforeOrders = (stockByWorkshop[wId]?.[materialId]) || 0;

      // Calculate covered local (before any orders/transfers)
      const coveredLocal = Math.min(required, localStockBeforeOrders);

      // Calculate inbound and outbound transfers
      let inboundTransfers = 0;
      let outboundTransfers = 0;

      transferSuggestions.forEach(transfer => {
        if (transfer.materialId === materialId) {
          if (transfer.toWorkshopId === wId) {
            inboundTransfers += transfer.quantity;
          }
          if (transfer.fromWorkshopId === wId) {
            outboundTransfers += transfer.quantity;
          }
        }
      });

      // Coverage by transfers (limited to remaining need after local coverage)
      const remainingAfterLocal = Math.max(0, required - coveredLocal);
      const coveredByTransfers = Math.min(inboundTransfers, remainingAfterLocal);

      // Remaining shortage
      const remainingShortage = Math.max(0, required - coveredLocal - coveredByTransfers);

      // Calculate stock after orders and transfers
      let localStockAfterOrdersAndTransfers = localStockBeforeOrders;

      // Add order if central workshop
      if (wId === centralWorkshopId) {
        const row = materialRows.find(r => r.materialId === materialId);
        if (row) {
          localStockAfterOrdersAndTransfers += row.suggestedOrderToCentral;
        }
      }

      // Add inbound, subtract outbound
      localStockAfterOrdersAndTransfers += inboundTransfers;
      localStockAfterOrdersAndTransfers -= outboundTransfers;

      // Ensure no negative stock (safety check)
      localStockAfterOrdersAndTransfers = Math.max(0, localStockAfterOrdersAndTransfers);

      workshopCoverageList.push({
        workshopId: wId,
        materialId,
        required,
        coveredLocal,
        coveredByTransfers,
        remainingShortage,
        localStockBeforeOrders,
        localStockAfterOrdersAndTransfers
      });
    });
  });

  // Return Result
  return {
    materials: materialRows,
    transferSuggestions,
    workshopCoverage: workshopCoverageList,
    meta: {
      centralWorkshopId,
      workshopIds,
      totalTargets: targets.length
    }
  };
}
