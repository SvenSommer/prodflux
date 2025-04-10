import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialsService, Material } from './materials.service';
import { RouterModule } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Component({
  selector: 'app-materials-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './materials-list.component.html',
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
