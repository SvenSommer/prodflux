import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SuppliersService } from './suppliers.service';
import { Supplier, SupplierRequest } from './models/supplier.model';
import { environment } from '../../../environments/environment';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/suppliers/`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SuppliersService]
    });
    service = TestBed.inject(SuppliersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should return all suppliers', () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 1,
          name: 'Supplier A',
          url: 'https://supplier-a.com',
          kundenkonto: 'KTO-001',
          notes: 'Test notes',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Supplier B',
          url: 'https://supplier-b.com',
          kundenkonto: 'KTO-002',
          is_active: false,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ];

      service.getAll().subscribe(suppliers => {
        expect(suppliers.length).toBe(2);
        expect(suppliers).toEqual(mockSuppliers);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockSuppliers);
    });
  });

  describe('get', () => {
    it('should return a single supplier by id', () => {
      const mockSupplier: Supplier = {
        id: 1,
        name: 'Supplier A',
        url: 'https://supplier-a.com',
        kundenkonto: 'KTO-001',
        notes: 'Test notes',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      service.get(1).subscribe(supplier => {
        expect(supplier).toEqual(mockSupplier);
      });

      const req = httpMock.expectOne(`${baseUrl}1/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSupplier);
    });
  });

  describe('create', () => {
    it('should create a new supplier', () => {
      const newSupplier: SupplierRequest = {
        name: 'New Supplier',
        url: 'https://new-supplier.com',
        kundenkonto: 'KTO-003',
        notes: 'New supplier notes',
        is_active: true
      };

      const createdSupplier: Supplier = {
        id: 3,
        name: newSupplier.name,
        url: newSupplier.url!,
        kundenkonto: newSupplier.kundenkonto!,
        notes: newSupplier.notes,
        is_active: newSupplier.is_active!,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z'
      };

      service.create(newSupplier).subscribe(supplier => {
        expect(supplier).toEqual(createdSupplier);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newSupplier);
      req.flush(createdSupplier);
    });
  });

  describe('update', () => {
    it('should update an existing supplier', () => {
      const updateData: SupplierRequest = {
        name: 'Updated Supplier',
        url: 'https://updated-supplier.com',
        kundenkonto: 'KTO-001-UPD',
        notes: 'Updated notes',
        is_active: true
      };

      const updatedSupplier: Supplier = {
        id: 1,
        name: updateData.name,
        url: updateData.url!,
        kundenkonto: updateData.kundenkonto!,
        notes: updateData.notes,
        is_active: updateData.is_active!,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z'
      };

      service.update(1, updateData).subscribe(supplier => {
        expect(supplier).toEqual(updatedSupplier);
      });

      const req = httpMock.expectOne(`${baseUrl}1/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedSupplier);
    });
  });

  describe('patch', () => {
    it('should partially update a supplier', () => {
      const patchData: Partial<SupplierRequest> = {
        is_active: false
      };

      const patchedSupplier: Supplier = {
        id: 1,
        name: 'Supplier A',
        url: 'https://supplier-a.com',
        kundenkonto: 'KTO-001',
        notes: 'Test notes',
        is_active: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z'
      };

      service.patch(1, patchData).subscribe(supplier => {
        expect(supplier).toEqual(patchedSupplier);
      });

      const req = httpMock.expectOne(`${baseUrl}1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patchData);
      req.flush(patchedSupplier);
    });
  });

  describe('delete', () => {
    it('should delete a supplier', () => {
      service.delete(1).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
