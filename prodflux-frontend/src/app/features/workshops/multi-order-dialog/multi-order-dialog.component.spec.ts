import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MultiOrderDialogComponent } from './multi-order-dialog.component';
import { WorkshopService } from '../workshop.service';
import { of } from 'rxjs';

describe('MultiOrderDialogComponent', () => {
  let component: MultiOrderDialogComponent;
  let fixture: ComponentFixture<MultiOrderDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockWorkshopService = {
    getAggregatedRequirements: jasmine.createSpy('getAggregatedRequirements').and.returnValue(of([]))
  };

  const mockDialogData = {
    workshopId: 1,
    workshopName: 'Test Workshop',
    productLifecycle: [
      {
        product_id: 1,
        product: 'Test Product',
        version: '1.0',
        variante: null,
        finished_goods: 10,
        in_production: 5,
        ordered: 3
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiOrderDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: WorkshopService, useValue: mockWorkshopService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MultiOrderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize multiOrderProducts from dialog data', () => {
    expect(component.multiOrderProducts.length).toBe(1);
    expect(component.multiOrderProducts[0].product).toBe('Test Product');
    expect(component.multiOrderProducts[0].quantity).toBe(0);
  });
});
