import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MaterialPlanningActionsService } from './material-planning-actions.service';
import { environment } from '../../../../environments/environment';
import { GlobalMaterialRow } from '../models/planning/planning-result.models';
import { TransferTodo } from '../models/todos/transfer-todo';

describe('MaterialPlanningActionsService', () => {
  let service: MaterialPlanningActionsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MaterialPlanningActionsService]
    });
    service = TestBed.inject(MaterialPlanningActionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createOrderFromPlan', () => {
    it('should create order with correct payload', (done) => {
      const rows: GlobalMaterialRow[] = [
        {
          materialId: 10,
          totalRequired: 1000,
          totalStock: 500,
          openOrders: 0,
          totalAvailable: 500,
          shortage: 500,
          suggestedOrderToCentral: 500
        },
        {
          materialId: 20,
          totalRequired: 200,
          totalStock: 50,
          openOrders: 0,
          totalAvailable: 50,
          shortage: 150,
          suggestedOrderToCentral: 150
        },
        {
          materialId: 30,
          totalRequired: 100,
          totalStock: 200,
          openOrders: 0,
          totalAvailable: 200,
          shortage: 0,
          suggestedOrderToCentral: 0 // Should be filtered out
        }
      ];

      const mockOrder = {
        id: 123,
        bestellt_am: '2025-11-26',
        angekommen_am: null,
        notiz: 'MaterialPlanner – Bestellvorschlag',
        items: [
          { id: 1, material: 10, quantity: '500.00', preis_pro_stueck: '1.00' },
          { id: 2, material: 20, quantity: '150.00', preis_pro_stueck: '1.00' }
        ]
      };

      service.createOrderFromPlan(rows).subscribe(order => {
        expect(order).toEqual(mockOrder);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/orders/`);
      expect(req.request.method).toBe('POST');

      const payload = req.request.body;
      expect(payload.bestellt_am).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
      expect(payload.notiz).toBe('MaterialPlanner – Bestellvorschlag');
      expect(payload.items.length).toBe(2);
      expect(payload.items[0].material).toBe(10);
      expect(payload.items[0].quantity).toBe('500.00');
      expect(payload.items[0].preis_pro_stueck).toBe('1.00');
      expect(payload.items[1].material).toBe(20);
      expect(payload.items[1].quantity).toBe('150.00');

      req.flush(mockOrder);
    });

    it('should accept custom note', (done) => {
      const rows: GlobalMaterialRow[] = [
        {
          materialId: 10,
          totalRequired: 100,
          totalStock: 0,
          openOrders: 0,
          totalAvailable: 0,
          shortage: 100,
          suggestedOrderToCentral: 100
        }
      ];

      const customNote = 'Custom order note';

      service.createOrderFromPlan(rows, customNote).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/orders/`);
      expect(req.request.body.notiz).toBe(customNote);

      req.flush({ id: 1, bestellt_am: '2025-11-26', angekommen_am: null, items: [] });
    });

    it('should throw error when no materials to order', () => {
      const rows: GlobalMaterialRow[] = [
        {
          materialId: 10,
          totalRequired: 100,
          totalStock: 200,
          openOrders: 0,
          totalAvailable: 200,
          shortage: 0,
          suggestedOrderToCentral: 0
        }
      ];

      expect(() => service.createOrderFromPlan(rows)).toThrowError('Keine Materialien mit Bestellvorschlag gefunden');
    });
  });

  describe('createTransfersFromTodos', () => {
    it('should create transfers grouped by workshop pair', (done) => {
      const todos: TransferTodo[] = [
        {
          id: '1',
          materialId: 10,
          materialName: 'Material A',
          fromWorkshopId: 2,
          fromWorkshopName: 'Rauen',
          toWorkshopId: 1,
          toWorkshopName: 'Potsdam',
          quantity: 100,
          done: false
        },
        {
          id: '2',
          materialId: 20,
          materialName: 'Material B',
          fromWorkshopId: 2,
          fromWorkshopName: 'Rauen',
          toWorkshopId: 1,
          toWorkshopName: 'Potsdam',
          quantity: 50,
          done: false
        },
        {
          id: '3',
          materialId: 30,
          materialName: 'Material C',
          fromWorkshopId: 1,
          fromWorkshopName: 'Potsdam',
          toWorkshopId: 2,
          toWorkshopName: 'Rauen',
          quantity: 25,
          done: false
        }
      ];

      const mockTransfers = [
        {
          id: 1,
          source_workshop: 2,
          target_workshop: 1,
          created_at: '2025-11-26T10:00:00Z',
          note: 'MaterialPlanner Transfer',
          items: [
            { id: 1, material: 10, quantity: '100.00' },
            { id: 2, material: 20, quantity: '50.00' }
          ]
        },
        {
          id: 2,
          source_workshop: 1,
          target_workshop: 2,
          created_at: '2025-11-26T10:00:00Z',
          note: 'MaterialPlanner Transfer',
          items: [
            { id: 3, material: 30, quantity: '25.00' }
          ]
        }
      ];

      service.createTransfersFromTodos(todos).subscribe(transfers => {
        expect(transfers.length).toBe(2);
        done();
      });

      // Expect two POST requests (grouped) - order may vary
      const requests = httpMock.match(`${baseUrl}/transfers/`);
      expect(requests.length).toBe(2);

      // Flush both requests
      requests.forEach((req, index) => {
        expect(req.request.method).toBe('POST');
        const payload = req.request.body;
        expect(payload.note).toBe('MaterialPlanner Transfer');

        // Verify grouping is correct
        if (payload.source_workshop === 2 && payload.target_workshop === 1) {
          expect(payload.items.length).toBe(2);
        } else if (payload.source_workshop === 1 && payload.target_workshop === 2) {
          expect(payload.items.length).toBe(1);
        }

        req.flush(mockTransfers[index]);
      });
    });

    it('should filter out done todos', (done) => {
      const todos: TransferTodo[] = [
        {
          id: '1',
          materialId: 10,
          materialName: 'Material A',
          fromWorkshopId: 2,
          fromWorkshopName: 'Rauen',
          toWorkshopId: 1,
          toWorkshopName: 'Potsdam',
          quantity: 100,
          done: true // Already done
        },
        {
          id: '2',
          materialId: 20,
          materialName: 'Material B',
          fromWorkshopId: 2,
          fromWorkshopName: 'Rauen',
          toWorkshopId: 1,
          toWorkshopName: 'Potsdam',
          quantity: 50,
          done: false
        }
      ];

      const mockTransfer = {
        id: 1,
        source_workshop: 2,
        target_workshop: 1,
        created_at: '2025-11-26T10:00:00Z',
        items: [{ id: 1, material: 20, quantity: '50.00' }]
      };

      service.createTransfersFromTodos(todos).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/transfers/`);
      const payload = req.request.body;
      expect(payload.items.length).toBe(1);
      expect(payload.items[0].material).toBe(20);
      req.flush([mockTransfer]);
    });

    it('should throw error when no open todos', () => {
      const todos: TransferTodo[] = [
        {
          id: '1',
          materialId: 10,
          materialName: 'Material A',
          fromWorkshopId: 2,
          fromWorkshopName: 'Rauen',
          toWorkshopId: 1,
          toWorkshopName: 'Potsdam',
          quantity: 100,
          done: true
        }
      ];

      expect(() => service.createTransfersFromTodos(todos)).toThrowError('Keine offenen Transfer-ToDos gefunden');
    });
  });
});
