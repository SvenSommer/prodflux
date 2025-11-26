import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { debounceTime } from 'rxjs';
import { WorkshopProductTarget } from '../models/workshop-product-target';

interface ProductOption {
  id: number;
  label: string;
}

interface WorkshopOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-material-planner-targets-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './material-planner-targets-form.component.html',
  styleUrl: './material-planner-targets-form.component.scss'
})
export class MaterialPlannerTargetsFormComponent implements OnInit, OnChanges {
  @Input() products: ProductOption[] = [];
  @Input() workshops: WorkshopOption[] = [];
  @Output() targetsChange = new EventEmitter<WorkshopProductTarget[]>();

  form: FormGroup;
  displayedColumns: string[] = ['workshop', 'product', 'quantity', 'actions'];
  dataSource: AbstractControl[] = [];

  private initialRowAdded = false;

  // Dummy product options as fallback
  private readonly dummyProducts: ProductOption[] = [
    { id: 1, label: 'Produkt A' },
    { id: 2, label: 'Produkt B' },
    { id: 3, label: 'Produkt C' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      targets: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Use provided products or fall back to dummy data
    if (!this.products || this.products.length === 0) {
      this.products = this.dummyProducts;
    }

    // Add initial row if workshops are already available
    this.addInitialRowIfNeeded();

    // Subscribe to value changes with debounce
    this.form.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.emitTargets());
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Add initial row when workshops become available (for async scenario)
    if (changes['workshops']) {
      this.addInitialRowIfNeeded();
    }
  }

  private addInitialRowIfNeeded(): void {
    if (this.workshops.length > 0 && !this.initialRowAdded && this.targets.length === 0) {
      this.addTarget();
      this.initialRowAdded = true;
    }
  }

  get targets(): FormArray {
    return this.form.get('targets') as FormArray;
  }

  get availableProducts(): ProductOption[] {
    return this.products;
  }

  addTarget(): void {
    const defaultWorkshopId = this.workshops.length > 0 ? this.workshops[0].id : null;

    const targetGroup = this.fb.group({
      workshopId: [defaultWorkshopId, Validators.required],
      productId: [null, Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });

    this.targets.push(targetGroup);
    this.updateDataSource();
    this.emitTargets();
  }

  removeTarget(index: number): void {
    this.targets.removeAt(index);
    this.updateDataSource();
    this.emitTargets();
  }

  private updateDataSource(): void {
    this.dataSource = [...this.targets.controls];
  }

  private emitTargets(): void {
    const targets: WorkshopProductTarget[] = this.targets.controls
      .filter(control => control.valid)
      .map(control => ({
        workshopId: control.value.workshopId,
        productId: control.value.productId,
        quantity: control.value.quantity
      }));

    this.targetsChange.emit(targets);
  }
}
