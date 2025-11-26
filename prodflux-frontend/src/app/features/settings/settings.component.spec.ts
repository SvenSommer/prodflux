import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { SettingsComponent } from './settings.component';
import { SuppliersService } from './suppliers.service';
import { WorkshopsService } from './workshop.services';
import { VersionsService } from './versions.service';
import { VariantsService } from './variants.service';
import { MaterialCategoriesService } from './material-categories.service';
import { of } from 'rxjs';
import { Supplier } from './models/supplier.model';

describe('SettingsComponent - Suppliers', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let suppliersService: jasmine.SpyObj<SuppliersService>;

  beforeEach(async () => {
    const suppliersSpy = jasmine.createSpyObj('SuppliersService', ['getAll', 'create', 'update', 'delete']);
    const workshopsSpy = jasmine.createSpyObj('WorkshopsService', ['getAll', 'create', 'update', 'delete']);
    const versionsSpy = jasmine.createSpyObj('VersionsService', ['getAll', 'create', 'update', 'delete']);
    const variantsSpy = jasmine.createSpyObj('VariantsService', ['getAll', 'create', 'update', 'delete']);
    const categoriesSpy = jasmine.createSpyObj('MaterialCategoriesService', ['getAll', 'create', 'update', 'delete']);

    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        FormsModule
      ],
      providers: [
        { provide: SuppliersService, useValue: suppliersSpy },
        { provide: WorkshopsService, useValue: workshopsSpy },
        { provide: VersionsService, useValue: versionsSpy },
        { provide: VariantsService, useValue: variantsSpy },
        { provide: MaterialCategoriesService, useValue: categoriesSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    suppliersService = TestBed.inject(SuppliersService) as jasmine.SpyObj<SuppliersService>;

    // Setup default return values
    suppliersService.getAll.and.returnValue(of([]));
    workshopsSpy.getAll.and.returnValue(of([]));
    versionsSpy.getAll.and.returnValue(of([]));
    variantsSpy.getAll.and.returnValue(of([]));
    categoriesSpy.getAll.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Supplier Management', () => {
    it('should load suppliers on init', () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 1,
          name: 'Test Supplier',
          url: 'https://test.com',
          kundenkonto: 'KTO-001',
          is_active: true
        }
      ];

      suppliersService.getAll.and.returnValue(of(mockSuppliers));
      component.ngOnInit();

      expect(suppliersService.getAll).toHaveBeenCalled();
      expect(component.suppliers.length).toBe(1);
      expect(component.suppliers[0].name).toBe('Test Supplier');
    });

    it('should create a new supplier when saveSupplier is called', () => {
      const newSupplier: Supplier = {
        id: 1,
        name: 'New Supplier',
        url: 'https://new.com',
        kundenkonto: 'KTO-002',
        notes: 'Test notes',
        is_active: true
      };

      suppliersService.create.and.returnValue(of(newSupplier));
      suppliersService.getAll.and.returnValue(of([newSupplier]));

      component.newSupplierName = 'New Supplier';
      component.newSupplierUrl = 'https://new.com';
      component.newSupplierKundenkonto = 'KTO-002';
      component.newSupplierNotes = 'Test notes';
      component.newSupplierIsActive = true;

      component.saveSupplier();

      expect(suppliersService.create).toHaveBeenCalledWith({
        name: 'New Supplier',
        url: 'https://new.com',
        kundenkonto: 'KTO-002',
        notes: 'Test notes',
        is_active: true
      });
    });

    it('should not save supplier if name is empty', () => {
      component.newSupplierName = '';
      component.saveSupplier();

      expect(suppliersService.create).not.toHaveBeenCalled();
      expect(suppliersService.update).not.toHaveBeenCalled();
    });

    it('should update supplier when editing', () => {
      const existingSupplier: Supplier = {
        id: 1,
        name: 'Old Name',
        url: 'https://old.com',
        kundenkonto: 'KTO-001',
        is_active: true
      };

      const updatedSupplier: Supplier = {
        ...existingSupplier,
        name: 'Updated Name'
      };

      suppliersService.update.and.returnValue(of(updatedSupplier));
      suppliersService.getAll.and.returnValue(of([updatedSupplier]));

      component.editingSupplier = existingSupplier;
      component.newSupplierName = 'Updated Name';
      component.newSupplierUrl = existingSupplier.url;
      component.newSupplierKundenkonto = existingSupplier.kundenkonto;
      component.newSupplierIsActive = existingSupplier.is_active;

      component.saveSupplier();

      expect(suppliersService.update).toHaveBeenCalledWith(1, {
        name: 'Updated Name',
        url: 'https://old.com',
        kundenkonto: 'KTO-001',
        notes: '',
        is_active: true
      });
    });

    it('should populate form when editSupplier is called', () => {
      const supplier: Supplier = {
        id: 1,
        name: 'Test Supplier',
        url: 'https://test.com',
        kundenkonto: 'KTO-001',
        notes: 'Test notes',
        is_active: true
      };

      component.editSupplier(supplier);

      expect(component.editingSupplier).toEqual(supplier);
      expect(component.newSupplierName).toBe('Test Supplier');
      expect(component.newSupplierUrl).toBe('https://test.com');
      expect(component.newSupplierKundenkonto).toBe('KTO-001');
      expect(component.newSupplierNotes).toBe('Test notes');
      expect(component.newSupplierIsActive).toBe(true);
    });

    it('should delete supplier when deleteSupplier is called and confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      suppliersService.delete.and.returnValue(of(void 0));
      suppliersService.getAll.and.returnValue(of([]));

      component.deleteSupplier(1);

      expect(suppliersService.delete).toHaveBeenCalledWith(1);
      expect(suppliersService.getAll).toHaveBeenCalled();
    });

    it('should not delete supplier when deleteSupplier is called and not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteSupplier(1);

      expect(suppliersService.delete).not.toHaveBeenCalled();
    });

    it('should reset form after successful save', () => {
      const newSupplier: Supplier = {
        id: 1,
        name: 'New Supplier',
        url: 'https://new.com',
        kundenkonto: 'KTO-002',
        is_active: true
      };

      suppliersService.create.and.returnValue(of(newSupplier));
      suppliersService.getAll.and.returnValue(of([newSupplier]));

      component.newSupplierName = 'New Supplier';
      component.newSupplierUrl = 'https://new.com';
      component.newSupplierKundenkonto = 'KTO-002';
      component.newSupplierNotes = 'Notes';
      component.newSupplierIsActive = true;

      component.saveSupplier();

      expect(component.newSupplierName).toBe('');
      expect(component.newSupplierUrl).toBe('');
      expect(component.newSupplierKundenkonto).toBe('');
      expect(component.newSupplierNotes).toBe('');
      expect(component.newSupplierIsActive).toBe(true);
      expect(component.editingSupplier).toBeNull();
    });
  });
});
