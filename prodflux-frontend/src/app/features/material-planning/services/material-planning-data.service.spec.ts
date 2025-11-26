import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MaterialPlanningDataService, computeOpenOrdersByMaterialId } from './material-planning-data.service';
import { environment } from '../../../../environments/environment';
import { Workshop } from '../models/api/workshop.model';
import { Product } from '../models/api/product.model';
import { Material } from '../models/api/material.model';
import { ProductMaterial } from '../models/api/product-material.model';
import { Order } from '../models/api/order.model';

describe('MaterialPlanningDataService', () => {
  let service: MaterialPlanningDataService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MaterialPlanningDataService]
    });
    service = TestBed.inject(MaterialPlanningDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load all data with correct API calls', (done) => {
    const mockWorkshops: Workshop[] = [
      { id: 1, name: 'Workshop Rauen' },
      { id: 2, name: 'Workshop Berlin' }
    ];

    const mockProducts: Product[] = [
      { id: 1, bezeichnung: 'Produkt A', artikelnummer: 'P001' },
      { id: 2, bezeichnung: 'Produkt B', artikelnummer: 'P002' }
    ];

    const mockMaterials: Material[] = [
      { id: 1, bezeichnung: 'Material A', bestell_nr: 'M001' },
      { id: 2, bezeichnung: 'Material B', bestell_nr: 'M002' }
    ];

    const mockBom: ProductMaterial[] = [
      { id: 1, product: 1, material: 1, quantity_per_unit: '2.5' },
      { id: 2, product: 1, material: 2, quantity_per_unit: '1.0' }
    ];

    const mockOrders: Order[] = [
      {
        id: 1,
        bestellt_am: '2025-01-01',
        angekommen_am: null,
        items: [
          { id: 1, material: 1, quantity: '100.00', preis_pro_stueck: '2.50' }
        ]
      }
    ];

    const mockStockWorkshop1 = [
      {
        category_id: 1,
        category_name: 'Kategorie 1',
        materials: [
          { id: 1, current_stock: 100 },
          { id: 2, current_stock: 50 }
        ]
      }
    ];

    const mockStockWorkshop2 = [
      {
        category_id: 1,
        category_name: 'Kategorie 1',
        materials: [
          { id: 1, current_stock: 75 },
          { id: 2, current_stock: 25 }
        ]
      }
    ];

    service.loadAll().subscribe(data => {
      // Verify data structure
      expect(data.workshops).toEqual(mockWorkshops);
      expect(data.products).toEqual(mockProducts);
      expect(data.materials).toEqual(mockMaterials);
      expect(data.bom).toEqual(mockBom);
      expect(data.orders).toEqual(mockOrders);

      // Verify lookups
      expect(data.lookups.workshopById[1]).toEqual(mockWorkshops[0]);
      expect(data.lookups.productById[1]).toEqual(mockProducts[0]);
      expect(data.lookups.materialById[1]).toEqual(mockMaterials[0]);

      // Verify stock
      expect(data.stockByWorkshopAndMaterial[1][1]).toBe(100);
      expect(data.stockByWorkshopAndMaterial[1][2]).toBe(50);
      expect(data.stockByWorkshopAndMaterial[2][1]).toBe(75);
      expect(data.stockByWorkshopAndMaterial[2][2]).toBe(25);

      // Verify openOrdersByMaterialId
      expect(data.openOrdersByMaterialId[1]).toBe(100);

      done();
    });

    // Respond to base data requests
    const reqWorkshops = httpMock.expectOne(`${baseUrl}/workshops/`);
    expect(reqWorkshops.request.method).toBe('GET');
    reqWorkshops.flush(mockWorkshops);

    const reqProducts = httpMock.expectOne(`${baseUrl}/products/`);
    expect(reqProducts.request.method).toBe('GET');
    reqProducts.flush(mockProducts);

    const reqMaterials = httpMock.expectOne(`${baseUrl}/materials/`);
    expect(reqMaterials.request.method).toBe('GET');
    reqMaterials.flush([{ category_id: 1, category_name: 'Cat', materials: mockMaterials }]);

    const reqBom = httpMock.expectOne(`${baseUrl}/product-materials/`);
    expect(reqBom.request.method).toBe('GET');
    reqBom.flush(mockBom);

    const reqOrders = httpMock.expectOne(`${baseUrl}/orders/`);
    expect(reqOrders.request.method).toBe('GET');
    reqOrders.flush(mockOrders);

    // Respond to stock requests
    const reqStock1 = httpMock.expectOne(`${baseUrl}/workshops/1/material-stock/`);
    expect(reqStock1.request.method).toBe('GET');
    reqStock1.flush(mockStockWorkshop1);

    const reqStock2 = httpMock.expectOne(`${baseUrl}/workshops/2/material-stock/`);
    expect(reqStock2.request.method).toBe('GET');
    reqStock2.flush(mockStockWorkshop2);
  });

  it('should build lookups correctly', (done) => {
    const mockWorkshops: Workshop[] = [
      { id: 10, name: 'Workshop A' },
      { id: 20, name: 'Workshop B' }
    ];

    const mockProducts: Product[] = [
      { id: 100, bezeichnung: 'Product X', artikelnummer: 'X001' }
    ];

    const mockMaterials: Material[] = [
      { id: 1000, bezeichnung: 'Material Z', bestell_nr: 'Z001' }
    ];

    const mockBom: ProductMaterial[] = [];

    service.loadAll().subscribe(data => {
      expect(Object.keys(data.lookups.workshopById).length).toBe(2);
      expect(data.lookups.workshopById[10].name).toBe('Workshop A');
      expect(data.lookups.workshopById[20].name).toBe('Workshop B');

      expect(Object.keys(data.lookups.productById).length).toBe(1);
      expect(data.lookups.productById[100].bezeichnung).toBe('Product X');

      expect(Object.keys(data.lookups.materialById).length).toBe(1);
      expect(data.lookups.materialById[1000].bezeichnung).toBe('Material Z');

      done();
    });

    httpMock.expectOne(`${baseUrl}/workshops/`).flush(mockWorkshops);
    httpMock.expectOne(`${baseUrl}/products/`).flush(mockProducts);
    httpMock.expectOne(`${baseUrl}/materials/`).flush([{ category_id: null, category_name: 'All', materials: mockMaterials }]);
    httpMock.expectOne(`${baseUrl}/product-materials/`).flush(mockBom);
    httpMock.expectOne(`${baseUrl}/orders/`).flush([]);

    // Stock requests
    httpMock.expectOne(`${baseUrl}/workshops/10/material-stock/`).flush([]);
    httpMock.expectOne(`${baseUrl}/workshops/20/material-stock/`).flush([]);
  });

  it('should build stockByWorkshopAndMaterial correctly', (done) => {
    const mockWorkshops: Workshop[] = [{ id: 1, name: 'Workshop 1' }];
    const mockProducts: Product[] = [];
    const mockMaterials: Material[] = [];
    const mockBom: ProductMaterial[] = [];

    const mockStock = [
      {
        category_id: 1,
        category_name: 'Cat 1',
        materials: [
          { id: 10, current_stock: 42 },
          { id: 20, current_stock: 99 }
        ]
      },
      {
        category_id: 2,
        category_name: 'Cat 2',
        materials: [
          { id: 30, current_stock: 15 }
        ]
      }
    ];

    service.loadAll().subscribe(data => {
      expect(data.stockByWorkshopAndMaterial[1][10]).toBe(42);
      expect(data.stockByWorkshopAndMaterial[1][20]).toBe(99);
      expect(data.stockByWorkshopAndMaterial[1][30]).toBe(15);

      done();
    });

    httpMock.expectOne(`${baseUrl}/workshops/`).flush(mockWorkshops);
    httpMock.expectOne(`${baseUrl}/products/`).flush(mockProducts);
    httpMock.expectOne(`${baseUrl}/materials/`).flush([]);
    httpMock.expectOne(`${baseUrl}/product-materials/`).flush(mockBom);
    httpMock.expectOne(`${baseUrl}/orders/`).flush([]);
    httpMock.expectOne(`${baseUrl}/workshops/1/material-stock/`).flush(mockStock);
  });

  it('should handle stock call failure gracefully', (done) => {
    const mockWorkshops: Workshop[] = [
      { id: 1, name: 'Workshop 1' },
      { id: 2, name: 'Workshop 2' }
    ];
    const mockProducts: Product[] = [];
    const mockMaterials: Material[] = [];
    const mockBom: ProductMaterial[] = [];

    const mockStockWorkshop1 = [
      {
        category_id: 1,
        category_name: 'Cat 1',
        materials: [{ id: 1, current_stock: 10 }]
      }
    ];

    service.loadAll().subscribe(data => {
      // Workshop 1 should have stock
      expect(data.stockByWorkshopAndMaterial[1]).toBeDefined();
      expect(data.stockByWorkshopAndMaterial[1][1]).toBe(10);

      // Workshop 2 should have empty stock (error was caught)
      expect(data.stockByWorkshopAndMaterial[2]).toBeDefined();
      expect(Object.keys(data.stockByWorkshopAndMaterial[2]).length).toBe(0);

      done();
    });

    httpMock.expectOne(`${baseUrl}/workshops/`).flush(mockWorkshops);
    httpMock.expectOne(`${baseUrl}/products/`).flush(mockProducts);
    httpMock.expectOne(`${baseUrl}/materials/`).flush([]);
    httpMock.expectOne(`${baseUrl}/product-materials/`).flush(mockBom);
    httpMock.expectOne(`${baseUrl}/orders/`).flush([]);

    // Workshop 1 succeeds
    httpMock.expectOne(`${baseUrl}/workshops/1/material-stock/`).flush(mockStockWorkshop1);

    // Workshop 2 fails
    const reqStock2 = httpMock.expectOne(`${baseUrl}/workshops/2/material-stock/`);
    reqStock2.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle empty workshops list', (done) => {
    const mockWorkshops: Workshop[] = [];
    const mockProducts: Product[] = [];
    const mockMaterials: Material[] = [];
    const mockBom: ProductMaterial[] = [];

    service.loadAll().subscribe(data => {
      expect(data.workshops.length).toBe(0);
      expect(data.stockByWorkshopAndMaterial).toEqual({});
      done();
    });

    httpMock.expectOne(`${baseUrl}/workshops/`).flush(mockWorkshops);
    httpMock.expectOne(`${baseUrl}/products/`).flush(mockProducts);
    httpMock.expectOne(`${baseUrl}/materials/`).flush([]);
    httpMock.expectOne(`${baseUrl}/product-materials/`).flush(mockBom);
    httpMock.expectOne(`${baseUrl}/orders/`).flush([]);
  });

  describe('computeOpenOrdersByMaterialId', () => {
    it('should compute open orders correctly', () => {
      const orders: Order[] = [
        {
          id: 1,
          bestellt_am: '2025-01-01',
          angekommen_am: null, // Open
          items: [
            { id: 1, material: 10, quantity: '100.00', preis_pro_stueck: '2.50' },
            { id: 2, material: 20, quantity: '50.50', preis_pro_stueck: '1.00' }
          ]
        },
        {
          id: 2,
          bestellt_am: '2025-01-02',
          angekommen_am: null, // Open
          items: [
            { id: 3, material: 10, quantity: '25.00', preis_pro_stueck: '2.50' }
          ]
        },
        {
          id: 3,
          bestellt_am: '2025-01-03',
          angekommen_am: '2025-01-10', // Closed - should be ignored
          items: [
            { id: 4, material: 10, quantity: '1000.00', preis_pro_stueck: '2.50' }
          ]
        }
      ];

      const result = computeOpenOrdersByMaterialId(orders);

      expect(result[10]).toBe(125); // 100 + 25
      expect(result[20]).toBe(50.5); // 50.50
      expect(result[30]).toBeUndefined(); // No orders for material 30
    });

    it('should return empty object for empty orders', () => {
      const result = computeOpenOrdersByMaterialId([]);
      expect(result).toEqual({});
    });

    it('should ignore all closed orders', () => {
      const orders: Order[] = [
        {
          id: 1,
          bestellt_am: '2025-01-01',
          angekommen_am: '2025-01-05', // Closed
          items: [
            { id: 1, material: 10, quantity: '100.00', preis_pro_stueck: '2.50' }
          ]
        }
      ];

      const result = computeOpenOrdersByMaterialId(orders);
      expect(result).toEqual({});
    });

    it('should handle decimal strings correctly', () => {
      const orders: Order[] = [
        {
          id: 1,
          bestellt_am: '2025-01-01',
          angekommen_am: null,
          items: [
            { id: 1, material: 10, quantity: '12.345', preis_pro_stueck: '1.00' },
            { id: 2, material: 10, quantity: '7.655', preis_pro_stueck: '1.00' }
          ]
        }
      ];

      const result = computeOpenOrdersByMaterialId(orders);
      expect(result[10]).toBeCloseTo(20, 2);
    });
  });

  it('should handle orders loading failure gracefully', (done) => {
    const mockWorkshops: Workshop[] = [];
    const mockProducts: Product[] = [];
    const mockMaterials: Material[] = [];
    const mockBom: ProductMaterial[] = [];

    service.loadAll().subscribe(data => {
      expect(data.orders).toEqual([]);
      expect(data.openOrdersByMaterialId).toEqual({});
      done();
    });

    httpMock.expectOne(`${baseUrl}/workshops/`).flush(mockWorkshops);
    httpMock.expectOne(`${baseUrl}/products/`).flush(mockProducts);
    httpMock.expectOne(`${baseUrl}/materials/`).flush([]);
    httpMock.expectOne(`${baseUrl}/product-materials/`).flush(mockBom);

    const reqOrders = httpMock.expectOne(`${baseUrl}/orders/`);
    reqOrders.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
