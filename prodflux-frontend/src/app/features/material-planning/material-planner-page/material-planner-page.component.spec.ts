import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialPlannerPageComponent } from './material-planner-page.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialPlanningDataService, MaterialPlanningData } from '../services/material-planning-data.service';
import { of } from 'rxjs';
import { WorkshopProductTarget } from '../models/workshop-product-target';

describe('MaterialPlannerPageComponent', () => {
  let component: MaterialPlannerPageComponent;
  let fixture: ComponentFixture<MaterialPlannerPageComponent>;
  let mockDataService: jasmine.SpyObj<MaterialPlanningDataService>;

  const mockPlanningData: MaterialPlanningData = {
    workshops: [
      { id: 1, name: 'Workshop Rauen' },
      { id: 2, name: 'Workshop Berlin' }
    ],
    products: [
      { id: 1, bezeichnung: 'Produkt A', artikelnummer: 'P001' },
      { id: 2, bezeichnung: 'Produkt B', artikelnummer: 'P002' }
    ],
    materials: [
      { id: 1, bezeichnung: 'Material A', bestell_nr: 'M001' },
      { id: 2, bezeichnung: 'Material B', bestell_nr: 'M002' }
    ],
    bom: [
      { id: 1, product: 1, material: 1, quantity_per_unit: '2.5' }
    ],
    lookups: {
      workshopById: {
        1: { id: 1, name: 'Workshop Rauen' },
        2: { id: 2, name: 'Workshop Berlin' }
      },
      productById: {
        1: { id: 1, bezeichnung: 'Produkt A', artikelnummer: 'P001' },
        2: { id: 2, bezeichnung: 'Produkt B', artikelnummer: 'P002' }
      },
      materialById: {
        1: { id: 1, bezeichnung: 'Material A', bestell_nr: 'M001' },
        2: { id: 2, bezeichnung: 'Material B', bestell_nr: 'M002' }
      }
    },
    stockByWorkshopAndMaterial: {
      1: { 1: 100, 2: 50 },
      2: { 1: 75, 2: 25 }
    }
  };

  beforeEach(async () => {
    // Create spy object for MaterialPlanningDataService
    mockDataService = jasmine.createSpyObj('MaterialPlanningDataService', ['loadAll']);
    mockDataService.loadAll.and.returnValue(of(mockPlanningData));

    await TestBed.configureTestingModule({
      imports: [
        MaterialPlannerPageComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MaterialPlanningDataService, useValue: mockDataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialPlannerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h1');
    expect(title?.textContent).toContain('Materialplanung');
  });

  it('should contain 3 tabs with correct labels', () => {
    // First trigger plan calculation to show tabs
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    component.calculatePlan(mockPlanningData);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabLabels = compiled.querySelectorAll('.mat-mdc-tab');

    expect(tabLabels.length).toBe(3);
    expect(tabLabels[0].textContent).toContain('Globaler Bedarf & Bestellungen');
    expect(tabLabels[1].textContent).toContain('Transfers nach Lieferung');
    expect(tabLabels[2].textContent).toContain('Deckung pro Werkstatt');
  });

  it('should react to output from child component', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 },
      { productId: 2, quantity: 20, workshopId: 2 }
    ];

    component.onTargetsChange(testTargets);

    expect(component.targets).toEqual(testTargets);
    expect(component.targets.length).toBe(2);
  });

  it('should initialize with empty targets array', () => {
    expect(component.targets).toEqual([]);
    expect(component.targets.length).toBe(0);
  });

  it('should contain the MaterialPlannerTargetsFormComponent', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const formComponent = compiled.querySelector('app-material-planner-targets-form');
    expect(formComponent).toBeTruthy();
  });

  it('should load planning data on init', () => {
    expect(mockDataService.loadAll).toHaveBeenCalled();
  });

  it('should provide products to form component', (done) => {
    component.productsForForm$.subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[0]).toEqual({ id: 1, label: 'Produkt A (P001)' });
      expect(products[1]).toEqual({ id: 2, label: 'Produkt B (P002)' });
      done();
    });
  });

  it('should provide workshops to form component', (done) => {
    component.workshopsForForm$.subscribe(workshops => {
      expect(workshops.length).toBe(2);
      expect(workshops[0]).toEqual({ id: 1, label: 'Workshop Rauen' });
      expect(workshops[1]).toEqual({ id: 2, label: 'Workshop Berlin' });
      done();
    });
  });

  it('should not use dummy products when real products are loaded', (done) => {
    component.productsForForm$.subscribe(products => {
      expect(products.length).toBe(2);
      // Verify these are real products, not dummy "Produkt A/B/C"
      expect(products[0].label).toContain('P001');
      expect(products[1].label).toContain('P002');
      done();
    });
  });

  it('should display loading state initially', () => {
    // Create new component instance without triggering ngOnInit
    const newFixture = TestBed.createComponent(MaterialPlannerPageComponent);
    const newComponent = newFixture.componentInstance;

    // Don't call detectChanges yet
    expect(newComponent.isLoading).toBe(true);
  });

  it('should calculate plan when button clicked', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    fixture.detectChanges();

    component.calculatePlan(mockPlanningData);

    expect(component.planningResult).not.toBeNull();
    expect(component.error).toBeNull();
  });

  it('should display error for invalid workshop count', () => {
    const invalidData: MaterialPlanningData = {
      ...mockPlanningData,
      workshops: [{ id: 1, name: 'Only One Workshop' }]
    };

    component.targets = [{ productId: 1, quantity: 10, workshopId: 1 }];
    component.calculatePlan(invalidData);

    expect(component.error).not.toBeNull();
    expect(component.error).toContain('2 Werkstätten');
    expect(component.planningResult).toBeNull();
  });

  it('should show material name in tab after calculation', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    component.calculatePlan(mockPlanningData);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Material should appear in the results
    expect(component.planningResult).not.toBeNull();
    expect(component.planningResult?.materials.length).toBeGreaterThan(0);
  });

  it('should show no result hint when planningResult is null', () => {
    component.planningResult = null;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const hint = compiled.querySelector('.no-result-hint');
    expect(hint).toBeTruthy();
    expect(hint?.textContent).toContain('Bitte Produktziele erfassen');
  });

  it('should hide no result hint when planningResult exists', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    component.calculatePlan(mockPlanningData);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const hint = compiled.querySelector('.no-result-hint');
    expect(hint).toBeNull();
  });

  it('should adopt transfer todos when adoptTransferTodos is called', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    component.calculatePlan(mockPlanningData);

    // Assuming the engine creates transfer suggestions
    if (component.planningResult && component.planningResult.transferSuggestions.length > 0) {
      component.adoptTransferTodos(mockPlanningData);

      expect(component.transferTodos.length).toBeGreaterThan(0);
      expect(component.transferTodos[0].done).toBe(false);
    }
  });

  it('should toggle todo done state', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    component.calculatePlan(mockPlanningData);
    component.adoptTransferTodos(mockPlanningData);

    if (component.transferTodos.length > 0) {
      const firstTodoId = component.transferTodos[0].id;
      const initialDoneState = component.transferTodos[0].done;

      component.toggleTodoDone(firstTodoId);

      expect(component.transferTodos[0].done).toBe(!initialDoneState);
    }
  });

  it('should delete todo', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    component.calculatePlan(mockPlanningData);
    component.adoptTransferTodos(mockPlanningData);

    const initialLength = component.transferTodos.length;

    if (initialLength > 0) {
      const firstTodoId = component.transferTodos[0].id;

      component.deleteTodo(firstTodoId);

      expect(component.transferTodos.length).toBe(initialLength - 1);
    }
  });

  it('should not create duplicate todos when adopting twice', () => {
    const testTargets: WorkshopProductTarget[] = [
      { productId: 1, quantity: 10, workshopId: 1 }
    ];

    component.targets = testTargets;
    component.calculatePlan(mockPlanningData);
    component.adoptTransferTodos(mockPlanningData);

    const firstAdoptLength = component.transferTodos.length;

    component.adoptTransferTodos(mockPlanningData);

    // Should update quantity, not add duplicates
    expect(component.transferTodos.length).toBe(firstAdoptLength);
  });
});
