import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MaterialsService, Material } from './materials.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-material-form',
  standalone: true,
  templateUrl: './material-form.component.html',
  styleUrls: ['./material-form.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class MaterialFormComponent {
  private route = inject(ActivatedRoute);
  private materialsService = inject(MaterialsService);
  private router = inject(Router);

  materialId: number | null = null;
  currentImageUrl: string | null = null;
  newImagePreview: string | null = null;

  material: {
    bezeichnung: string;
    hersteller_bezeichnung: string;
    bild: File | null;
  } = {
    bezeichnung: '',
    hersteller_bezeichnung: '',
    bild: null,
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.materialId = +idParam;
      this.materialsService.getMaterial(this.materialId).subscribe((data) => {
        this.material.bezeichnung = data.bezeichnung;
        this.material.hersteller_bezeichnung = data.hersteller_bezeichnung;
        this.currentImageUrl = data.bild_url || null;
        this.newImagePreview = null;
        this.material.bild = null; // leeren, da File nicht übergeben werden kann
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.material.bild = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.newImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    const formData = new FormData();
    formData.append('bezeichnung', this.material.bezeichnung);
    formData.append('hersteller_bezeichnung', this.material.hersteller_bezeichnung);
    if (this.material.bild) {
      formData.append('bild', this.material.bild);
    }

    const request = this.materialId
      ? this.materialsService.updateMaterialFormData(this.materialId, formData)
      : this.materialsService.createMaterialFormData(formData);

    request.subscribe(() => {
      this.router.navigate(['/materials']);
    });
  }
}
