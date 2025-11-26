import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialPlannerTargetsFormComponent } from './material-planner-targets-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('MaterialPlannerTargetsFormComponent', () => {
  let component: MaterialPlannerTargetsFormComponent;
  let fixture: ComponentFixture<MaterialPlannerTargetsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MaterialPlannerTargetsFormComponent,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialPlannerTargetsFormComponent);
    component = fixture.componentInstance;

    // Set workshops BEFORE detectChanges to simulate real scenario
    component.workshops = [
      { id: 1, label: 'Potsdam' },
      { id: 2, label: 'Rauen' }
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add initial row when workshops are available', () => {
    // Component already initialized in beforeEach with workshops
    expect(component.targets.length).toBe(1);
    expect(component.targets.at(0).value.workshopId).toBe(1); // First workshop
  });

  it('should render the component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.targets-form-container')).toBeTruthy();
  });

  it('should add a row when "Zeile hinzufügen" button is clicked', () => {
    const initialLength = component.targets.length;

    const button = fixture.nativeElement.querySelector('button[color="primary"]') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.type).toBe('button'); // Verify type="button" to prevent form submit

    button.click();
    fixture.detectChanges();

    expect(component.targets.length).toBe(initialLength + 1);
  });

  it('should remove a row when delete button is clicked', () => {
    component.addTarget();
    const lengthAfterAdd = component.targets.length;

    // Call removeTarget directly since mat-table doesn't fully render in tests
    component.removeTarget(0);

    expect(component.targets.length).toBe(lengthAfterAdd - 1);
  });

  it('should emit targetsChange when workshopId, productId and quantity are set', (done) => {
    let emissionCount = 0;

    // Set workshops first
    component.workshops = [
      { id: 1, label: 'Potsdam' },
      { id: 2, label: 'Rauen' }
    ];

    component.targetsChange.subscribe(targets => {
      emissionCount++;
      // Skip the first emission from addTarget (empty array or invalid)
      // Wait for the second emission after patchValue
      if (emissionCount === 2) {
        expect(targets.length).toBe(1);
        expect(targets[0]).toEqual({ workshopId: 1, productId: 1, quantity: 10 });
        done();
      }
    });

    component.addTarget();
    fixture.detectChanges();

    const targetControl = component.targets.at(0);
    targetControl.patchValue({ workshopId: 1, productId: 1, quantity: 10 });
    targetControl.markAsDirty();
    fixture.detectChanges();
  });

  it('should only emit valid targets', () => {
    // Set workshops first
    component.workshops = [
      { id: 1, label: 'Potsdam' },
      { id: 2, label: 'Rauen' }
    ];

    component.addTarget();
    component.addTarget();

    // Set first target as valid
    component.targets.at(0).patchValue({ workshopId: 1, productId: 1, quantity: 10 });

    // Leave second target invalid (no productId)
    component.targets.at(1).patchValue({ workshopId: 1, quantity: 5 });

    let emittedTargets: any[] = [];
    component.targetsChange.subscribe(targets => {
      emittedTargets = targets;
    });

    // Manually trigger emission
    component['emitTargets']();

    // Verify only valid target was emitted
    expect(emittedTargets.length).toBe(1);
    expect(emittedTargets[0]).toEqual({ workshopId: 1, productId: 1, quantity: 10 });
  });

  it('should use empty products array when no products input is provided', () => {
    expect(component.availableProducts.length).toBe(0);
  });

  it('should use provided products when products input is set', () => {
    const customProducts = [
      { id: 100, label: 'Custom Product 1' },
      { id: 200, label: 'Custom Product 2' }
    ];

    component.products = customProducts;
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.availableProducts).toEqual(customProducts);
  });

  it('should set default workshopId when adding target with workshops available', () => {
    component.workshops = [
      { id: 1, label: 'Potsdam' },
      { id: 2, label: 'Rauen' }
    ];

    component.addTarget();
    const newTarget = component.targets.at(component.targets.length - 1);

    expect(newTarget.value.workshopId).toBe(1); // First workshop
  });

  it('should include workshopId in emitted targets', () => {
    component.workshops = [
      { id: 1, label: 'Potsdam' },
      { id: 2, label: 'Rauen' }
    ];

    component.addTarget();
    const targetControl = component.targets.at(0);
    targetControl.patchValue({ workshopId: 2, productId: 10, quantity: 100 });

    let emittedTargets: any[] = [];
    component.targetsChange.subscribe(targets => {
      emittedTargets = targets;
    });

    component['emitTargets']();

    expect(emittedTargets.length).toBe(1);
    expect(emittedTargets[0].workshopId).toBe(2);
    expect(emittedTargets[0].productId).toBe(10);
    expect(emittedTargets[0].quantity).toBe(100);
  });

  it('should add row when button clicked even without workshops set initially', () => {
    // Create new component without workshops
    const newFixture = TestBed.createComponent(MaterialPlannerTargetsFormComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    // Should have no rows initially (no workshops)
    expect(newComponent.targets.length).toBe(0);

    // Now set workshops
    newComponent.workshops = [
      { id: 1, label: 'Potsdam' },
      { id: 2, label: 'Rauen' }
    ];
    newFixture.detectChanges();

    // Click "Zeile hinzufügen" button
    const button = newFixture.nativeElement.querySelector('button[color="primary"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    button.click();
    newFixture.detectChanges();

    // Should have added a row
    expect(newComponent.targets.length).toBe(1);
    expect(newComponent.targets.at(0).value.workshopId).toBe(1); // Default to first workshop
  });
});
