import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MaterialPlannerTargetsFormComponent } from '../material-planner-targets-form/material-planner-targets-form.component';
import { WorkshopProductTarget } from '../models/workshop-product-target';
import { MaterialPlanningDataService, MaterialPlanningData } from '../services/material-planning-data.service';
import { MaterialPlanningActionsService } from '../services/material-planning-actions.service';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { planGlobalMaterials } from '../engine/material-planning.engine';
import { GlobalPlanningResult } from '../models/planning/planning-result.models';
import { GlobalDemandOrdersTabComponent } from '../components/global-demand-orders-tab/global-demand-orders-tab.component';
import { TransferPlanTabComponent } from '../components/transfer-plan-tab/transfer-plan-tab.component';
import { WorkshopCoverageTabComponent } from '../components/workshop-coverage-tab/workshop-coverage-tab.component';
import { TransferTodo, generateTodoId } from '../models/todos/transfer-todo';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

interface ProductOption {
  id: number;
  label: string;
}

interface WorkshopOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-material-planner-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTableModule,
    MaterialPlannerTargetsFormComponent,
    GlobalDemandOrdersTabComponent,
    TransferPlanTabComponent,
    WorkshopCoverageTabComponent
  ],
  templateUrl: './material-planner-page.component.html',
  styleUrl: './material-planner-page.component.scss'
})
export class MaterialPlannerPageComponent implements OnInit {
  private dataService = inject(MaterialPlanningDataService);
  private actionsService = inject(MaterialPlanningActionsService);
  private snackBar = inject(MatSnackBar);

  targets: WorkshopProductTarget[] = [];
  planningData$!: Observable<MaterialPlanningData>;
  productsForForm$!: Observable<ProductOption[]>;
  workshopsForForm$!: Observable<WorkshopOption[]>;
  isLoading = true;
  isCreatingOrder = false;
  isCreatingTransfers = false;

  planningResult: GlobalPlanningResult | null = null;
  error: string | null = null;
  transferTodos: TransferTodo[] = [];
  todosDisplayedColumns: string[] = ['material', 'fromTo', 'quantity', 'done', 'actions'];

  ngOnInit(): void {
    this.planningData$ = this.dataService.loadAll().pipe(
      shareReplay(1)
    );

    this.productsForForm$ = this.planningData$.pipe(
      map(data => data.products.map(p => ({
        id: p.id,
        label: `${p.bezeichnung} (${p.artikelnummer})`
      })))
    );

    this.workshopsForForm$ = this.planningData$.pipe(
      map(data => data.workshops.map(w => ({
        id: w.id,
        label: w.name
      })))
    );
  }

  onTargetsChange(targets: WorkshopProductTarget[]): void {
    this.targets = targets;
  }

  calculatePlan(planningData: MaterialPlanningData): void {
    this.error = null;
    this.planningResult = null;

    try {
      // Determine workshop IDs (prefer [1,2], fallback to first two)
      let workshopIds: number[];
      if (planningData.workshops.some(w => w.id === 1) && planningData.workshops.some(w => w.id === 2)) {
        workshopIds = [1, 2];
      } else {
        const sortedWorkshops = [...planningData.workshops].sort((a, b) => a.id - b.id);
        if (sortedWorkshops.length < 2) {
          throw new Error('Mindestens 2 Werkstätten erforderlich');
        }
        workshopIds = [sortedWorkshops[0].id, sortedWorkshops[1].id];
      }

      // Determine central workshop (prefer 2, fallback to second workshop)
      const centralWorkshopId = workshopIds.includes(2) ? 2 : workshopIds[1];

      // Call engine
      this.planningResult = planGlobalMaterials(
        this.targets,
        planningData.bom,
        planningData.stockByWorkshopAndMaterial,
        {
          centralWorkshopId,
          workshopIds,
          openOrdersByMaterialId: planningData.openOrdersByMaterialId
        }
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Fehler bei der Berechnung';
      console.error('Planning error:', err);
    }
  }

  adoptTransferTodos(planningData: MaterialPlanningData): void {
    if (!this.planningResult) {
      return;
    }

    const newTodos: TransferTodo[] = this.planningResult.transferSuggestions.map(suggestion => {
      const material = planningData.lookups.materialById[suggestion.materialId];
      const fromWorkshop = planningData.lookups.workshopById[suggestion.fromWorkshopId];
      const toWorkshop = planningData.lookups.workshopById[suggestion.toWorkshopId];

      // Check if todo already exists (same material, from, to)
      const existingTodo = this.transferTodos.find(
        t => t.materialId === suggestion.materialId &&
             t.fromWorkshopId === suggestion.fromWorkshopId &&
             t.toWorkshopId === suggestion.toWorkshopId
      );

      if (existingTodo) {
        // Update quantity instead of creating duplicate
        existingTodo.quantity = suggestion.quantity;
        return null;
      }

      return {
        id: generateTodoId(),
        materialId: suggestion.materialId,
        materialName: material?.bezeichnung || `Material ${suggestion.materialId}`,
        fromWorkshopId: suggestion.fromWorkshopId,
        fromWorkshopName: fromWorkshop?.name || `Workshop ${suggestion.fromWorkshopId}`,
        toWorkshopId: suggestion.toWorkshopId,
        toWorkshopName: toWorkshop?.name || `Workshop ${suggestion.toWorkshopId}`,
        quantity: suggestion.quantity,
        done: false
      };
    }).filter((todo): todo is TransferTodo => todo !== null);

    this.transferTodos = [...this.transferTodos, ...newTodos];
  }

  toggleTodoDone(todoId: string): void {
    const todo = this.transferTodos.find(t => t.id === todoId);
    if (todo) {
      todo.done = !todo.done;
    }
  }

  deleteTodo(todoId: string): void {
    this.transferTodos = this.transferTodos.filter(t => t.id !== todoId);
  }

  createOrderFromPlan(): void {
    if (!this.planningResult) {
      this.snackBar.open('Kein Plan verfügbar', 'Schließen', { duration: 3000 });
      return;
    }

    this.isCreatingOrder = true;
    this.error = null;

    this.actionsService.createOrderFromPlan(this.planningResult.materials).subscribe({
      next: (order) => {
        this.snackBar.open(
          `Bestellung #${order.id} erfolgreich angelegt (${order.items.length} Positionen)`,
          'Schließen',
          { duration: 5000 }
        );
        this.isCreatingOrder = false;
        // Reload data to refresh openOrders
        this.reloadPlanningData();
      },
      error: (err) => {
        this.error = `Fehler beim Anlegen der Bestellung: ${err.message || err}`;
        this.snackBar.open(this.error, 'Schließen', { duration: 5000 });
        this.isCreatingOrder = false;
        console.error('Create order error:', err);
      }
    });
  }

  createTransfersFromTodos(): void {
    const openTodos = this.transferTodos.filter(t => !t.done);

    if (openTodos.length === 0) {
      this.snackBar.open('Keine offenen Transfer-ToDos vorhanden', 'Schließen', { duration: 3000 });
      return;
    }

    this.isCreatingTransfers = true;
    this.error = null;

    this.actionsService.createTransfersFromTodos(openTodos).subscribe({
      next: (transfers) => {
        // Mark todos as done and optionally store transfer IDs
        openTodos.forEach((todo, index) => {
          todo.done = true;
          // Optionally: todo.backendTransferId = transfers[index]?.id;
        });

        this.snackBar.open(
          `${transfers.length} Transfer(s) erfolgreich angelegt`,
          'Schließen',
          { duration: 5000 }
        );
        this.isCreatingTransfers = false;
      },
      error: (err) => {
        this.error = `Fehler beim Anlegen der Transfers: ${err.message || err}`;
        this.snackBar.open(this.error, 'Schließen', { duration: 5000 });
        this.isCreatingTransfers = false;
        console.error('Create transfers error:', err);
      }
    });
  }

  private reloadPlanningData(): void {
    this.planningData$ = this.dataService.loadAll().pipe(
      shareReplay(1)
    );

    // Optionally: recalculate plan automatically
    this.planningData$.subscribe(data => {
      if (this.targets.length > 0) {
        this.calculatePlan(data);
      }
    });
  }
}
