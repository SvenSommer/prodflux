import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkshopCoverageTabComponent } from './workshop-coverage-tab.component';
import { WorkshopCoverage } from '../../models/planning/planning-result.models';
import { Workshop } from '../../models/api/workshop.model';
import { Material } from '../../models/api/material.model';

describe('WorkshopCoverageTabComponent', () => {
  let component: WorkshopCoverageTabComponent;
  let fixture: ComponentFixture<WorkshopCoverageTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkshopCoverageTabComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopCoverageTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no coverage', () => {
    component.coverage = [];
    component.workshopById = {};
    component.materialById = {};
    component.workshopIds = [];
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Noch kein Plan berechnet');
  });

  it('should render table with coverage rows', () => {
    const mockWorkshop1: Workshop = { id: 1, name: 'Potsdam' };
    const mockWorkshop2: Workshop = { id: 2, name: 'Rauen' };
    const mockMaterial: Material = { id: 1, bezeichnung: 'Schraube M8' };

    const mockCoverage: WorkshopCoverage[] = [
      {
        workshopId: 1,
        materialId: 1,
        required: 50,
        coveredLocal: 25,
        coveredByTransfers: 10,
        remainingShortage: 15,
        localStockBeforeOrders: 25,
        localStockAfterOrdersAndTransfers: 35
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

    component.coverage = mockCoverage;
    component.workshopById = { 1: mockWorkshop1, 2: mockWorkshop2 };
    component.materialById = { 1: mockMaterial };
    component.workshopIds = [1, 2];
    component.ngOnChanges();
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();

    expect(component.rows.length).toBe(1);
    expect(component.rows[0].materialName).toBe('Schraube M8');
  });

  it('should group coverage by material', () => {
    const mockMaterial1: Material = { id: 1, bezeichnung: 'Material A' };
    const mockMaterial2: Material = { id: 2, bezeichnung: 'Material B' };

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
        workshopId: 1,
        materialId: 2,
        required: 30,
        coveredLocal: 20,
        coveredByTransfers: 0,
        remainingShortage: 10,
        localStockBeforeOrders: 20,
        localStockAfterOrdersAndTransfers: 20
      }
    ];

    component.coverage = mockCoverage;
    component.workshopById = { 1: { id: 1, name: 'Potsdam' } };
    component.materialById = { 1: mockMaterial1, 2: mockMaterial2 };
    component.workshopIds = [1];
    component.ngOnChanges();

    expect(component.rows.length).toBe(2);
  });

  it('should extract workshop data correctly', () => {
    const mockCoverage: WorkshopCoverage = {
      workshopId: 1,
      materialId: 1,
      required: 50,
      coveredLocal: 25,
      coveredByTransfers: 10,
      remainingShortage: 15,
      localStockBeforeOrders: 25,
      localStockAfterOrdersAndTransfers: 35
    };

    const row: any = {
      materialId: 1,
      materialName: 'Test',
      byWorkshop: { 1: mockCoverage }
    };

    const data = component.getWorkshopData(row, 1);

    expect(data).toBeTruthy();
    expect(data?.required).toBe(50);
    expect(data?.local).toBe(25);
    expect(data?.transfer).toBe(10);
    expect(data?.shortage).toBe(15);
  });

  it('should return null for missing workshop data', () => {
    const row: any = {
      materialId: 1,
      materialName: 'Test',
      byWorkshop: {}
    };

    const data = component.getWorkshopData(row, 1);
    expect(data).toBeNull();
  });
});
