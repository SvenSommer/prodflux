/**
 * Unit Tests for Material Planning Engine v2.1 (Step 6)
 * Pure TypeScript tests - no Angular TestBed required
 */

import {
  planGlobalMaterials,
  parseDecimal
} from './material-planning.engine';
import { WorkshopProductTarget } from '../models/workshop-product-target';
import { ProductMaterial } from '../models/api/product-material.model';
import { StockByWorkshopAndMaterial } from '../services/material-planning-data.service';
import { PlanOptions } from '../models/planning/planning-result.models';

describe('Material Planning Engine', () => {
  // Test data constants
  const WORKSHOP_POTSDAM = 1;
  const WORKSHOP_RAUEN = 2;
  const MATERIAL_SCREW = 100;
  const PRODUCT_WIDGET = 10;

  describe('parseDecimal', () => {
    it('should parse integer strings', () => {
      expect(parseDecimal('0')).toBe(0);
      expect(parseDecimal('1')).toBe(1);
      expect(parseDecimal('42')).toBe(42);
    });

    it('should parse decimal strings with dot', () => {
      expect(parseDecimal('1.5')).toBe(1.5);
      expect(parseDecimal('2.75')).toBe(2.75);
      expect(parseDecimal('0.5')).toBe(0.5);
    });

    it('should parse decimal strings with comma', () => {
      expect(parseDecimal('1,5')).toBe(1.5);
      expect(parseDecimal('2,75')).toBe(2.75);
      expect(parseDecimal('0,5')).toBe(0.5);
    });

    it('should return 0 for empty or invalid strings', () => {
      expect(parseDecimal('')).toBe(0);
      expect(parseDecimal('   ')).toBe(0);
      expect(parseDecimal('abc')).toBe(0);
      expect(parseDecimal('NaN')).toBe(0);
    });
  });

  describe('planGlobalMaterials', () => {
    describe('Scenario 1: Enough Global Stock', () => {
      it('should not suggest orders when stock covers requirement', () => {
        // Setup: Product built in both workshops (50 each)
        // Total requirement: 100
        // Total stock: 150 (Potsdam 50, Rauen 100)
        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '1'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: { [MATERIAL_SCREW]: 50 },
          [WORKSHOP_RAUEN]: { [MATERIAL_SCREW]: 100 }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        // Assertions
        expect(result.materials.length).toBe(1);
        const materialRow = result.materials[0];

        expect(materialRow.materialId).toBe(MATERIAL_SCREW);
        expect(materialRow.totalRequired).toBe(100);
        expect(materialRow.totalStock).toBe(150);
        expect(materialRow.totalAvailable).toBe(150);
        expect(materialRow.shortage).toBe(0);
        expect(materialRow.suggestedOrderToCentral).toBe(0);
      });

      it('should suggest transfers when one workshop has surplus', () => {
        // Setup: Product built equally in both workshops (50 each)
        // Potsdam needs 50, has 30 (needs 20 more)
        // Rauen needs 50, has 120 (has 70 surplus)
        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '1'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: { [MATERIAL_SCREW]: 30 },
          [WORKSHOP_RAUEN]: { [MATERIAL_SCREW]: 120 }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        // Should have transfer from Rauen to Potsdam
        expect(result.transferSuggestions.length).toBe(1);
        const transfer = result.transferSuggestions[0];

        expect(transfer.materialId).toBe(MATERIAL_SCREW);
        expect(transfer.fromWorkshopId).toBe(WORKSHOP_RAUEN);
        expect(transfer.toWorkshopId).toBe(WORKSHOP_POTSDAM);
        expect(transfer.quantity).toBe(20); // min of Potsdam shortage and Rauen surplus
      });
    });

    describe('Scenario 2: Global Shortage - Order Required', () => {
      it('should suggest order to central when global stock insufficient', () => {
        // Setup: Need 200 (100 each workshop), have 100 total → shortage 100
        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 100, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_WIDGET, quantity: 100, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '1'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: { [MATERIAL_SCREW]: 40 },
          [WORKSHOP_RAUEN]: { [MATERIAL_SCREW]: 60 }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        // Assertions
        const materialRow = result.materials[0];
        expect(materialRow.totalRequired).toBe(200);
        expect(materialRow.totalStock).toBe(100);
        expect(materialRow.shortage).toBe(100);
        expect(materialRow.suggestedOrderToCentral).toBe(100);

        // Meta
        expect(result.meta.centralWorkshopId).toBe(WORKSHOP_RAUEN);
        expect(result.meta.totalTargets).toBe(2); // 2 targets: Potsdam + Rauen
      });
    });

    describe('Scenario 3: Example from Concept - Potsdam Shortage, Rauen Surplus', () => {
      it('should match the exact example scenario', () => {
        // Concept Example (Step 6 updated):
        // - Product 10 requires Material 100, qty_per_unit = 1
        // - Targets: Potsdam builds 800, Rauen builds 800 → total required 1600
        // - Stock: Potsdam 200, Rauen 1200 (total 1400)
        // - Global shortage: 200 → order 200 to Rauen
        // - Required per workshop: Potsdam 800, Rauen 800
        // - After order: Rauen has 1400
        // - Deltas: Potsdam 200-800 = -600, Rauen 1400-800 = +600
        // - Transfer: 600 from Rauen to Potsdam
        // - Remaining shortage: 0 everywhere

        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 800, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_WIDGET, quantity: 800, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '1'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: { [MATERIAL_SCREW]: 200 },
          [WORKSHOP_RAUEN]: { [MATERIAL_SCREW]: 1200 }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        // Tab 1: Global Materials
        expect(result.materials.length).toBe(1);
        const materialRow = result.materials[0];
        expect(materialRow.materialId).toBe(MATERIAL_SCREW);
        expect(materialRow.totalRequired).toBe(1600);
        expect(materialRow.totalStock).toBe(1400);
        expect(materialRow.shortage).toBe(200);
        expect(materialRow.suggestedOrderToCentral).toBe(200);

        // Tab 2: Transfer Suggestions
        expect(result.transferSuggestions.length).toBe(1);
        const transfer = result.transferSuggestions[0];
        expect(transfer.materialId).toBe(MATERIAL_SCREW);
        expect(transfer.fromWorkshopId).toBe(WORKSHOP_RAUEN);
        expect(transfer.toWorkshopId).toBe(WORKSHOP_POTSDAM);
        expect(transfer.quantity).toBe(600);

        // Tab 3: Workshop Coverage
        expect(result.workshopCoverage.length).toBe(2); // 2 workshops × 1 material

        const potsdamCoverage = result.workshopCoverage.find(
          c => c.workshopId === WORKSHOP_POTSDAM && c.materialId === MATERIAL_SCREW
        );
        const rauenCoverage = result.workshopCoverage.find(
          c => c.workshopId === WORKSHOP_RAUEN && c.materialId === MATERIAL_SCREW
        );

        expect(potsdamCoverage).toBeDefined();
        expect(rauenCoverage).toBeDefined();

        // Potsdam Coverage
        expect(potsdamCoverage!.required).toBe(800);
        expect(potsdamCoverage!.coveredLocal).toBe(200);
        expect(potsdamCoverage!.coveredByTransfers).toBe(600);
        expect(potsdamCoverage!.remainingShortage).toBe(0);
        expect(potsdamCoverage!.localStockBeforeOrders).toBe(200);
        expect(potsdamCoverage!.localStockAfterOrdersAndTransfers).toBe(800); // 200 + 600 inbound

        // Rauen Coverage
        expect(rauenCoverage!.required).toBe(800);
        expect(rauenCoverage!.coveredLocal).toBe(800); // Has enough locally after order
        expect(rauenCoverage!.coveredByTransfers).toBe(0); // No inbound transfers
        expect(rauenCoverage!.remainingShortage).toBe(0);
        expect(rauenCoverage!.localStockBeforeOrders).toBe(1200);
        expect(rauenCoverage!.localStockAfterOrdersAndTransfers).toBe(800); // 1200 + 200 order - 600 outbound
      });
    });

    describe('Multiple Materials and Products', () => {
      it('should handle multiple materials correctly', () => {
        const MATERIAL_NUT = 101;
        const MATERIAL_BOLT = 102;

        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '2'
          },
          {
            id: 2,
            product: PRODUCT_WIDGET,
            material: MATERIAL_NUT,
            quantity_per_unit: '2'
          },
          {
            id: 3,
            product: PRODUCT_WIDGET,
            material: MATERIAL_BOLT,
            quantity_per_unit: '1'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: {
            [MATERIAL_SCREW]: 100,
            [MATERIAL_NUT]: 50,
            [MATERIAL_BOLT]: 25
          },
          [WORKSHOP_RAUEN]: {
            [MATERIAL_SCREW]: 100,
            [MATERIAL_NUT]: 150,
            [MATERIAL_BOLT]: 75
          }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        // Should have 3 materials
        expect(result.materials.length).toBe(3);

        // Screw: need 200, have 200 → no shortage
        const screw = result.materials.find(m => m.materialId === MATERIAL_SCREW);
        expect(screw?.totalRequired).toBe(200);
        expect(screw?.totalStock).toBe(200);
        expect(screw?.shortage).toBe(0);

        // Nut: need 200, have 200 → no shortage
        const nut = result.materials.find(m => m.materialId === MATERIAL_NUT);
        expect(nut?.totalRequired).toBe(200);
        expect(nut?.totalStock).toBe(200);
        expect(nut?.shortage).toBe(0);

        // Bolt: need 100, have 100 → no shortage
        const bolt = result.materials.find(m => m.materialId === MATERIAL_BOLT);
        expect(bolt?.totalRequired).toBe(100);
        expect(bolt?.totalStock).toBe(100);
        expect(bolt?.shortage).toBe(0);

        // Workshop coverage should have 6 entries (2 workshops × 3 materials)
        expect(result.workshopCoverage.length).toBe(6);
      });

      it('should handle multiple products with shared materials', () => {
        const PRODUCT_GADGET = 11;

        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_GADGET, quantity: 30, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '2'
          },
          {
            id: 2,
            product: PRODUCT_GADGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '3'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: { [MATERIAL_SCREW]: 50 },
          [WORKSHOP_RAUEN]: { [MATERIAL_SCREW]: 140 }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        // Total requirement: (50 × 2) + (30 × 3) = 100 + 90 = 190
        const materialRow = result.materials[0];
        expect(materialRow.totalRequired).toBe(190);
        expect(materialRow.totalStock).toBe(190);
        expect(materialRow.shortage).toBe(0);
      });
    });

    describe('Decimal quantity_per_unit', () => {
      it('should handle fractional BOM quantities', () => {
        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 100, workshopId: WORKSHOP_POTSDAM }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '1.5'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: { [MATERIAL_SCREW]: 75 },
          [WORKSHOP_RAUEN]: { [MATERIAL_SCREW]: 75 }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        // 100 × 1.5 = 150
        const materialRow = result.materials[0];
        expect(materialRow.totalRequired).toBe(150);
        expect(materialRow.totalStock).toBe(150);
        expect(materialRow.shortage).toBe(0);
      });
    });

    describe('Open Orders', () => {
      it('should include open orders in availability calculation', () => {
        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 100, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_WIDGET, quantity: 100, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '1'
          }
        ];

        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: { [MATERIAL_SCREW]: 50 },
          [WORKSHOP_RAUEN]: { [MATERIAL_SCREW]: 50 }
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN],
          openOrdersByMaterialId: {
            [MATERIAL_SCREW]: 100 // 100 units on order
          }
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        const materialRow = result.materials[0];
        expect(materialRow.totalRequired).toBe(200);
        expect(materialRow.totalStock).toBe(100);
        expect(materialRow.openOrders).toBe(100);
        expect(materialRow.totalAvailable).toBe(200); // 100 stock + 100 open orders
        expect(materialRow.shortage).toBe(0);
        expect(materialRow.suggestedOrderToCentral).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty targets', () => {
        const targets: WorkshopProductTarget[] = [];
        const bom: ProductMaterial[] = [];
        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: {},
          [WORKSHOP_RAUEN]: {}
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        expect(result.materials.length).toBe(0);
        expect(result.transferSuggestions.length).toBe(0);
        expect(result.workshopCoverage.length).toBe(0);
        expect(result.meta.totalTargets).toBe(0);
      });

      it('should throw error for non-2 workshops', () => {
        const targets: WorkshopProductTarget[] = [];
        const bom: ProductMaterial[] = [];
        const stock: StockByWorkshopAndMaterial = {};

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM] // Only 1 workshop
        };

        expect(() => planGlobalMaterials(targets, bom, stock, options)).toThrowError(
          /Step 3 only supports exactly 2 workshops/
        );
      });

      it('should handle missing stock data gracefully', () => {
        const targets: WorkshopProductTarget[] = [
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_POTSDAM },
          { productId: PRODUCT_WIDGET, quantity: 50, workshopId: WORKSHOP_RAUEN }
        ];

        const bom: ProductMaterial[] = [
          {
            id: 1,
            product: PRODUCT_WIDGET,
            material: MATERIAL_SCREW,
            quantity_per_unit: '1'
          }
        ];

        // Empty stock
        const stock: StockByWorkshopAndMaterial = {
          [WORKSHOP_POTSDAM]: {},
          [WORKSHOP_RAUEN]: {}
        };

        const options: PlanOptions = {
          centralWorkshopId: WORKSHOP_RAUEN,
          workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
        };

        const result = planGlobalMaterials(targets, bom, stock, options);

        const materialRow = result.materials[0];
        expect(materialRow.totalRequired).toBe(100);
        expect(materialRow.totalStock).toBe(0);
        expect(materialRow.shortage).toBe(100);
        expect(materialRow.suggestedOrderToCentral).toBe(100);
      });
    });
  });

  describe('Bug Report: SD-TY9X-E Transfer Calculation', () => {
    it('should correctly handle transfer when central workshop has initial stock', () => {
      // Bug scenario:
      // - 100 SD-TY9X-E adapters needed in Potsdam
      // - Each adapter needs 1x Gehäuse Unterteil and 1x Gehäuse Oberteil
      // - Rauen (central) has initial stock of 2 for each part
      // - Expected: Order 98, then transfer all 100 (2 existing + 98 ordered) to Potsdam
      // - Actual Bug: Transfer shows only 90

      const GEHAUSE_UNTERTEIL = 101;
      const GEHAUSE_OBERTEIL = 102;
      const SD_TY9X_E = 1;

      const targets: WorkshopProductTarget[] = [
        {
          productId: SD_TY9X_E,
          workshopId: WORKSHOP_POTSDAM,
          quantity: 100
        }
      ];

      const bom: ProductMaterial[] = [
        {
          id: 1,
          product: SD_TY9X_E,
          material: GEHAUSE_UNTERTEIL,
          quantity_per_unit: '1'
        },
        {
          id: 2,
          product: SD_TY9X_E,
          material: GEHAUSE_OBERTEIL,
          quantity_per_unit: '1'
        }
      ];

      const stock: StockByWorkshopAndMaterial = {
        [WORKSHOP_POTSDAM]: {
          [GEHAUSE_UNTERTEIL]: 0,
          [GEHAUSE_OBERTEIL]: 0
        },
        [WORKSHOP_RAUEN]: {
          [GEHAUSE_UNTERTEIL]: 2,
          [GEHAUSE_OBERTEIL]: 2
        }
      };

      const options: PlanOptions = {
        centralWorkshopId: WORKSHOP_RAUEN,
        workshopIds: [WORKSHOP_POTSDAM, WORKSHOP_RAUEN]
      };

      const result = planGlobalMaterials(targets, bom, stock, options);

      console.log('\n=== BUG TEST: SD-TY9X-E Transfer Calculation ===');

      // Check Global Demand (Tab 1)
      const unterteil = result.materials.find(m => m.materialId === GEHAUSE_UNTERTEIL);
      const oberteil = result.materials.find(m => m.materialId === GEHAUSE_OBERTEIL);

      console.log('\nGlobal Demand - Gehäuse Unterteil:', unterteil);
      console.log('Global Demand - Gehäuse Oberteil:', oberteil);

      expect(unterteil).toBeDefined();
      expect(oberteil).toBeDefined();

      // Should correctly identify need for 98 units
      expect(unterteil!.totalRequired).toBe(100);
      expect(unterteil!.totalStock).toBe(2);
      expect(unterteil!.shortage).toBe(98);
      expect(unterteil!.suggestedOrderToCentral).toBe(98);

      expect(oberteil!.totalRequired).toBe(100);
      expect(oberteil!.totalStock).toBe(2);
      expect(oberteil!.shortage).toBe(98);
      expect(oberteil!.suggestedOrderToCentral).toBe(98);

      // Check Transfer Suggestions (Tab 2)
      const unterteilTransfer = result.transferSuggestions.find(t => t.materialId === GEHAUSE_UNTERTEIL);
      const oberteilTransfer = result.transferSuggestions.find(t => t.materialId === GEHAUSE_OBERTEIL);

      console.log('\nTransfer - Gehäuse Unterteil:', unterteilTransfer);
      console.log('Transfer - Gehäuse Oberteil:', oberteilTransfer);

      expect(unterteilTransfer).toBeDefined();
      expect(oberteilTransfer).toBeDefined();

      // BUG FIX ASSERTION: Should transfer all 100 units (2 initial + 98 ordered)
      expect(unterteilTransfer!.fromWorkshopId).toBe(WORKSHOP_RAUEN);
      expect(unterteilTransfer!.toWorkshopId).toBe(WORKSHOP_POTSDAM);
      expect(unterteilTransfer!.quantity).toBe(100); // Currently failing with 90

      expect(oberteilTransfer!.fromWorkshopId).toBe(WORKSHOP_RAUEN);
      expect(oberteilTransfer!.toWorkshopId).toBe(WORKSHOP_POTSDAM);
      expect(oberteilTransfer!.quantity).toBe(100); // Currently failing with 90

      // Check Workshop Coverage (Tab 3)
      const potsdamUnterteil = result.workshopCoverage.find(
        c => c.workshopId === WORKSHOP_POTSDAM && c.materialId === GEHAUSE_UNTERTEIL
      );
      const rauenUnterteil = result.workshopCoverage.find(
        c => c.workshopId === WORKSHOP_RAUEN && c.materialId === GEHAUSE_UNTERTEIL
      );

      console.log('\nCoverage Potsdam - Gehäuse Unterteil:', potsdamUnterteil);
      console.log('Coverage Rauen - Gehäuse Unterteil:', rauenUnterteil);

      // Potsdam: needs 100, gets 0 local, should get 100 from transfer
      expect(potsdamUnterteil!.required).toBe(100);
      expect(potsdamUnterteil!.coveredLocal).toBe(0);
      expect(potsdamUnterteil!.coveredByTransfers).toBe(100);
      expect(potsdamUnterteil!.remainingShortage).toBe(0);
      expect(potsdamUnterteil!.localStockBeforeOrders).toBe(0);
      expect(potsdamUnterteil!.localStockAfterOrdersAndTransfers).toBe(100);

      // Rauen: needs 0 (no production), has 2 initial, gets 98 order, transfers 100 out
      expect(rauenUnterteil!.required).toBe(0);
      expect(rauenUnterteil!.localStockBeforeOrders).toBe(2); // BUG: Currently shows 0?
      expect(rauenUnterteil!.localStockAfterOrdersAndTransfers).toBe(0); // 2 + 98 - 100 = 0

      console.log('\n=== END BUG TEST ===\n');
    });
  });
});

