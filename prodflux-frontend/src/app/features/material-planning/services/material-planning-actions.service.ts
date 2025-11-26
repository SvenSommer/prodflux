import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Order, OrderRequest, OrderItemRequest } from '../models/api/order.model';
import { MaterialTransfer, MaterialTransferRequest, MaterialTransferItemRequest } from '../models/api/material-transfer.model';
import { GlobalMaterialRow } from '../models/planning/planning-result.models';
import { TransferTodo } from '../models/todos/transfer-todo';

interface GroupedTransfer {
  sourceWorkshopId: number;
  targetWorkshopId: number;
  items: Array<{ materialId: number; quantity: number }>;
}

@Injectable({ providedIn: 'root' })
export class MaterialPlanningActionsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api`;

  /**
   * Creates an order from material planning suggestions
   * @param rows Global material rows with suggested orders
   * @param note Optional note for the order
   * @returns Observable of created Order
   */
  createOrderFromPlan(rows: GlobalMaterialRow[], note?: string): Observable<Order> {
    // Filter materials with suggested orders
    const materialsToOrder = rows.filter(row => row.suggestedOrderToCentral > 0);

    if (materialsToOrder.length === 0) {
      throw new Error('Keine Materialien mit Bestellvorschlag gefunden');
    }

    // Build order items
    const items: OrderItemRequest[] = materialsToOrder.map(row => ({
      material: row.materialId,
      quantity: row.suggestedOrderToCentral.toFixed(2),
      preis_pro_stueck: '1.00' // Placeholder - Backend TODO: use actual material prices
    }));

    // Build order request
    const orderRequest: OrderRequest = {
      bestellt_am: this.getTodayAsISOString(),
      notiz: note || 'MaterialPlanner – Bestellvorschlag',
      items
    };

    return this.http.post<Order>(`${this.baseUrl}/orders/`, orderRequest);
  }

  /**
   * Creates transfers from transfer todos
   * Groups todos by source/target workshop pair
   * @param todos Transfer todos to create (only non-done todos)
   * @returns Observable array of created MaterialTransfers
   */
  createTransfersFromTodos(todos: TransferTodo[]): Observable<MaterialTransfer[]> {
    // Filter out done todos
    const openTodos = todos.filter(todo => !todo.done);

    if (openTodos.length === 0) {
      throw new Error('Keine offenen Transfer-ToDos gefunden');
    }

    // Group by (source_workshop, target_workshop)
    const grouped = this.groupTransfersByWorkshopPair(openTodos);

    // Build transfer requests
    const transferRequests: MaterialTransferRequest[] = grouped.map(group => ({
      source_workshop: group.sourceWorkshopId,
      target_workshop: group.targetWorkshopId,
      note: 'MaterialPlanner Transfer',
      items: group.items.map(item => ({
        material: item.materialId,
        quantity: item.quantity.toFixed(2)
      }))
    }));

    // Execute all transfer requests in parallel
    const requests = transferRequests.map(request =>
      this.http.post<MaterialTransfer>(`${this.baseUrl}/transfers/`, request)
    );

    return forkJoin(requests);
  }

  /**
   * Groups transfer todos by (sourceWorkshopId, targetWorkshopId) pair
   */
  private groupTransfersByWorkshopPair(todos: TransferTodo[]): GroupedTransfer[] {
    const groupMap = new Map<string, GroupedTransfer>();

    todos.forEach(todo => {
      const key = `${todo.fromWorkshopId}-${todo.toWorkshopId}`;

      let group = groupMap.get(key);
      if (!group) {
        group = {
          sourceWorkshopId: todo.fromWorkshopId,
          targetWorkshopId: todo.toWorkshopId,
          items: []
        };
        groupMap.set(key, group);
      }

      group.items.push({
        materialId: todo.materialId,
        quantity: todo.quantity
      });
    });

    return Array.from(groupMap.values());
  }

  /**
   * Returns today's date as ISO string (YYYY-MM-DD)
   */
  private getTodayAsISOString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
