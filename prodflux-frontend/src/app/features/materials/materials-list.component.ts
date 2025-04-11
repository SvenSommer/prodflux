import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialsService, Material } from './materials.service';
import { RouterModule } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-materials-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './materials-list.component.html',
  styleUrls: ['./materials-list.component.scss'],
})
export class MaterialsListComponent {
  private materialsService = inject(MaterialsService);
  materials$!: Observable<Material[]>;

  ngOnInit() {
    this.loadMaterials();
  }

  loadMaterials() {
    this.materials$ = this.materialsService.getMaterials();
  }

  delete(id: number) {
    if (confirm('Material wirklich löschen?')) {
      this.materialsService.deleteMaterial(id).subscribe(() => {
        this.loadMaterials(); // Refresh Liste
      });
    }
  }
}
