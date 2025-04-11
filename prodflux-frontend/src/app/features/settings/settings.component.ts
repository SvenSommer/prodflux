// src/app/features/settings/settings.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { WorkshopsService, Workshop } from './workshop.services';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
})
export class SettingsComponent {
  private workshopsService = inject(WorkshopsService);

  workshops: Workshop[] = [];
  newWorkshopName = '';
  editingWorkshop: Workshop | null = null;

  ngOnInit() {
    this.load();
  }

  load() {
    this.workshopsService.getAll().subscribe(ws => this.workshops = ws);
  }

  save() {
    const payload = { name: this.newWorkshopName };
    const request = this.editingWorkshop
      ? this.workshopsService.update(this.editingWorkshop.id, payload)
      : this.workshopsService.create(payload);

    request.subscribe(() => {
      this.newWorkshopName = '';
      this.editingWorkshop = null;
      this.load();
    });
  }

  edit(w: Workshop) {
    this.editingWorkshop = w;
    this.newWorkshopName = w.name;
  }

  delete(id: number) {
    if (confirm('Wirklich löschen?')) {
      this.workshopsService.delete(id).subscribe(() => this.load());
    }
  }
}
