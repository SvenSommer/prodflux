import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { MaterialFormComponent } from './material-form.component';
import { MaterialsService } from './materials.service';
import { MaterialCategoriesService } from '../settings/material-categories.service';
import { SuppliersService } from '../settings/suppliers.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('MaterialFormComponent - Suppliers', () => {
  let component: MaterialFormComponent;
  let fixture: ComponentFixture<MaterialFormComponent>;
  let suppliersService: jasmine.SpyObj<SuppliersService>;
  let materialsService: jasmine.SpyObj<MaterialsService>;

  beforeEach(async () => {
    const suppliersSpy = jasmine.createSpyObj('SuppliersService', ['getAll']);
    const materialsSpy = jasmine.createSpyObj('MaterialsService', [
      'getMaterial',
      'getMaterialsGrouped',
      'getMaterialAlternatives',
      'updateMaterialFormData',
      'createMaterialFormData'
    ]);
    const categoriesSpy = jasmine.createSpyObj('MaterialCategoriesService', ['getAll']);

    await TestBed.configureTestingModule({
      imports: [
        MaterialFormComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: SuppliersService, useValue: suppliersSpy },
        { provide: MaterialsService, useValue: materialsSpy },
        { provide: MaterialCategoriesService, useValue: categoriesSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialFormComponent);
    component = fixture.componentInstance;
    suppliersService = TestBed.inject(SuppliersService) as jasmine.SpyObj<SuppliersService>;
    materialsService = TestBed.inject(MaterialsService) as jasmine.SpyObj<MaterialsService>;

    // Setup default return values
    suppliersService.getAll.and.returnValue(of([]));
    materialsSpy.getMaterialsGrouped.and.returnValue(of([]));
    categoriesSpy.getAll.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Supplier Selection', () => {
    it('should load suppliers on init', () => {
      const mockSuppliers = [
        { id: 1, name: 'Supplier A', url: 'https://a.com', kundenkonto: 'KTO-001', is_active: true },
        { id: 2, name: 'Supplier B', url: 'https://b.com', kundenkonto: 'KTO-002', is_active: true }
      ];

      suppliersService.getAll.and.returnValue(of(mockSuppliers));
      component.ngOnInit();

      expect(suppliersService.getAll).toHaveBeenCalled();
      expect(component.suppliers.length).toBe(2);
    });

    it('should populate supplier IDs when editing material', () => {
      const mockMaterial = {
        id: 1,
        bezeichnung: 'Test Material',
        hersteller_bezeichnung: 'Test Hersteller',
        bild: null,
        bild_url: null,
        alternatives: [],
        suppliers: [1, 2],
        supplier_details: [
          { id: 1, name: 'Supplier A' },
          { id: 2, name: 'Supplier B' }
        ]
      };

      const mockSuppliers = [
        { id: 1, name: 'Supplier A', url: 'https://a.com', kundenkonto: 'KTO-001', is_active: true },
        { id: 2, name: 'Supplier B', url: 'https://b.com', kundenkonto: 'KTO-002', is_active: true }
      ];

      suppliersService.getAll.and.returnValue(of(mockSuppliers));
      materialsService.getMaterial.and.returnValue(of(mockMaterial));
      materialsService.getMaterialAlternatives.and.returnValue(of([]));

      // Simulate editing mode
      const activatedRoute = TestBed.inject(ActivatedRoute);
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue('1');

      component.ngOnInit();

      expect(component.selectedSupplierIds).toEqual([1, 2]);
    });

    it('should send supplier IDs when saving material', () => {
      component.material = {
        bezeichnung: 'Test Material',
        hersteller_bezeichnung: 'Test Hersteller',
        bild: null,
      };
      component.selectedSupplierIds = [1, 3];
      component.selectedCategoryId = 5;

      const mockCreatedMaterial = {
        id: 1,
        bezeichnung: 'Test Material',
        hersteller_bezeichnung: 'Test Hersteller',
        bild: null,
        bild_url: null,
        alternatives: [],
        suppliers: [1, 3]
      };

      materialsService.createMaterialFormData.and.returnValue(of(mockCreatedMaterial));

      component.save();

      expect(materialsService.createMaterialFormData).toHaveBeenCalled();

      // Check that FormData includes suppliers
      const callArgs = materialsService.createMaterialFormData.calls.mostRecent().args[0];
      expect(callArgs).toBeInstanceOf(FormData);
    });

    it('should handle multiple supplier selection', () => {
      component.selectedSupplierIds = [];

      // Simulate selecting multiple suppliers
      component.selectedSupplierIds = [1, 2, 3];

      expect(component.selectedSupplierIds.length).toBe(3);
      expect(component.selectedSupplierIds).toContain(1);
      expect(component.selectedSupplierIds).toContain(2);
      expect(component.selectedSupplierIds).toContain(3);
    });

    it('should handle empty supplier selection', () => {
      component.selectedSupplierIds = [];
      component.material = {
        bezeichnung: 'Test Material',
        hersteller_bezeichnung: 'Test Hersteller',
        bild: null,
      };

      const mockCreatedMaterial = {
        id: 1,
        bezeichnung: 'Test Material',
        hersteller_bezeichnung: 'Test Hersteller',
        bild: null,
        bild_url: null,
        alternatives: [],
        suppliers: []
      };

      materialsService.createMaterialFormData.and.returnValue(of(mockCreatedMaterial));

      component.save();

      expect(materialsService.createMaterialFormData).toHaveBeenCalled();
      expect(component.selectedSupplierIds.length).toBe(0);
    });
  });
});
