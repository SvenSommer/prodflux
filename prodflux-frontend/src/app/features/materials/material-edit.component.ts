import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialsService, Material } from './materials.service';

@Component({
  selector: 'app-material-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './material-form.component.html', // wir nutzen das gleiche Template wie beim Anlegen
})
export class MaterialEditComponent {
  private route = inject(ActivatedRoute);
  private materialsService = inject(MaterialsService);
  private router = inject(Router);

  material: Partial<Material> = {};
  materialId!: number;
  isEdit = true;

  ngOnInit() {
    this.materialId = Number(this.route.snapshot.paramMap.get('id'));
    this.materialsService.getMaterial(this.materialId).subscribe(data => {
      this.material = data;
    });
  }

  onSubmit() {
    this.materialsService.updateMaterial(this.materialId, this.material).subscribe(() => {
      alert('Material aktualisiert');
      this.router.navigate(['/materials']);
    });
  }
}
