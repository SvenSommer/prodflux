import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlobalDemandOrdersTabComponent } from './global-demand-orders-tab.component';
import { GlobalMaterialRow } from '../../models/planning/planning-result.models';
import { Material } from '../../models/api/material.model';

describe('GlobalDemandOrdersTabComponent', () => {
  let component: GlobalDemandOrdersTabComponent;
  let fixture: ComponentFixture<GlobalDemandOrdersTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalDemandOrdersTabComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalDemandOrdersTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no rows', () => {
    component.rows = [];
    component.materialById = {};
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Noch kein Plan berechnet');
  });

  it('should render material table with material rows', () => {
    const mockMaterial: Material = {
      id: 1,
      bezeichnung: 'Schraube M8',
      bestell_nr: 'SCH-M8-001'
    };

    const mockRow: GlobalMaterialRow = {
      materialId: 1,
      totalRequired: 100,
      totalStock: 50,
      openOrders: 0,
      totalAvailable: 50,
      shortage: 50,
      suggestedOrderToCentral: 50
    };

    component.rows = [mockRow];
    component.materialById = { 1: mockMaterial };
    fixture.detectChanges();

    const materialTable = fixture.nativeElement.querySelector('app-material-table');
    expect(materialTable).toBeTruthy();
    expect(component.materialTableRows.length).toBe(1);
    expect(component.materialTableRows[0].materialName).toContain('Schraube M8');
  });

  it('should display material order number', () => {
    const mockMaterial: Material = {
      id: 1,
      bezeichnung: 'Test Material',
      bestell_nr: 'TEST-001'
    };

    component.materialById = { 1: mockMaterial };

    expect(component.getMaterialOrderNumber(1)).toBe('TEST-001');
  });

  it('should return dash for missing order number', () => {
    const mockMaterial: Material = {
      id: 1,
      bezeichnung: 'Test Material'
    };

    component.materialById = { 1: mockMaterial };

    expect(component.getMaterialOrderNumber(1)).toBe('—');
  });

  it('should filter orders to place (suggestedOrderToCentral > 0)', () => {
    const mockRows: GlobalMaterialRow[] = [
      {
        materialId: 1,
        totalRequired: 100,
        totalStock: 50,
        openOrders: 0,
        totalAvailable: 50,
        shortage: 50,
        suggestedOrderToCentral: 50
      },
      {
        materialId: 2,
        totalRequired: 30,
        totalStock: 30,
        openOrders: 0,
        totalAvailable: 30,
        shortage: 0,
        suggestedOrderToCentral: 0
      }
    ];

    component.rows = mockRows;

    const ordersToPlace = component.ordersToPlace;
    expect(ordersToPlace.length).toBe(1);
    expect(ordersToPlace[0].materialId).toBe(1);
  });
});
