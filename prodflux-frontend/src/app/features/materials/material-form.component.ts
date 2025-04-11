import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MaterialsService } from './materials.service';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './material-form.component.html',
})
export class MaterialFormComponent {
  private materialsService = inject(MaterialsService);
  private router = inject(Router);

  isEdit = false; // 👈 wichtig für die gemeinsame Template-Nutzung

  material = {
    bezeichnung: '',
    hersteller_bezeichnung: '',
    preis_brutto: 0,
    quelle: '',
    bestell_nr: ''
  };

  onSubmit() {
    this.materialsService.createMaterial(this.material).subscribe(() => {
      alert('Material erfolgreich erstellt');
      this.router.navigate(['/materials']);
    });
  }
}
