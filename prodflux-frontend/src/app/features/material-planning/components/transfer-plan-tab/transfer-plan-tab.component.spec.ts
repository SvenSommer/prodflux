import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransferPlanTabComponent } from './transfer-plan-tab.component';
import {
  GlobalMaterialRow,
  MaterialTransferSuggestion,
  WorkshopCoverage
} from '../../models/planning/planning-result.models';
import { Workshop } from '../../models/api/workshop.model';
import { Material } from '../../models/api/material.model';

describe('TransferPlanTabComponent', () => {
  let component: TransferPlanTabComponent;
  let fixture: ComponentFixture<TransferPlanTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferPlanTabComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TransferPlanTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no materials', () => {
    component.materials = [];
    component.transfers = [];
    component.coverage = [];
    component.workshopById = {};
    component.materialById = {};
    component.workshopIds = [];
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Noch kein Plan berechnet');
  });

  it('should render table with material rows', () => {
    const mockWorkshop1: Workshop = { id: 1, name: 'Potsdam' };
    const mockWorkshop2: Workshop = { id: 2, name: 'Rauen' };
    const mockMaterial: Material = { id: 1, bezeichnung: 'Schraube M8' };

    const mockMaterialRow: GlobalMaterialRow = {
      materialId: 1,
      totalRequired: 100,
      totalStock: 50,
      openOrders: 0,
      totalAvailable: 50,
      shortage: 50,
      suggestedOrderToCentral: 50
    };

    const mockCoverage: WorkshopCoverage[] = [
      {
        workshopId: 1,
        materialId: 1,
        required: 50,
        coveredLocal: 25,
        coveredByTransfers: 0,
        remainingShortage: 25,
        localStockBeforeOrders: 25,
        localStockAfterOrdersAndTransfers: 25
      },
      {
        workshopId: 2,
        materialId: 1,
        required: 50,
        coveredLocal: 25,
        coveredByTransfers: 0,
        remainingShortage: 0,
        localStockBeforeOrders: 25,
        localStockAfterOrdersAndTransfers: 75
      }
    ];

    component.materials = [mockMaterialRow];
    component.transfers = [];
    component.coverage = mockCoverage;
    component.workshopById = { 1: mockWorkshop1, 2: mockWorkshop2 };
    component.materialById = { 1: mockMaterial };
    component.workshopIds = [1, 2];
    component.centralWorkshopId = 2;
    component.ngOnChanges();
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();

    expect(component.rows.length).toBe(1);
    expect(component.rows[0].materialName).toBe('Schraube M8');
  });

  it('should display transfer suggestions', () => {
    const mockTransfer: MaterialTransferSuggestion = {
      materialId: 1,
      fromWorkshopId: 2,
      toWorkshopId: 1,
      quantity: 25
    };

    component.workshopById = {
      1: { id: 1, name: 'Potsdam' },
      2: { id: 2, name: 'Rauen' }
    };

    const transferText = component.getTransferText([mockTransfer]);
    expect(transferText).toContain('Rauen → Potsdam: 25.00');
  });

  it('should return dash for empty transfers', () => {
    const transferText = component.getTransferText([]);
    expect(transferText).toBe('—');
  });

  it('should build rows correctly on changes', () => {
    const mockMaterial: Material = { id: 1, bezeichnung: 'Test Material' };
    const mockMaterialRow: GlobalMaterialRow = {
      materialId: 1,
      totalRequired: 100,
      totalStock: 50,
      openOrders: 0,
      totalAvailable: 50,
      shortage: 50,
      suggestedOrderToCentral: 50
    };

    const mockCoverage: WorkshopCoverage[] = [
      {
        workshopId: 1,
        materialId: 1,
        required: 50,
        coveredLocal: 25,
        coveredByTransfers: 0,
        remainingShortage: 25,
        localStockBeforeOrders: 25,
        localStockAfterOrdersAndTransfers: 25
      }
    ];

    component.materials = [mockMaterialRow];
    component.transfers = [];
    component.coverage = mockCoverage;
    component.materialById = { 1: mockMaterial };
    component.workshopIds = [1, 2];
    component.ngOnChanges();

    expect(component.rows.length).toBe(1);
    expect(component.rows[0].orderQty).toBe(50);
  });

  it('should emit adoptTodos when button clicked', () => {
    spyOn(component.adoptTodos, 'emit');

    component.onAdoptTodos();

    expect(component.adoptTodos.emit).toHaveBeenCalled();
  });
});
