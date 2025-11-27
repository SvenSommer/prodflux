import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { ImportExportService } from './import-export.service';

@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
  ],
  templateUrl: './import-export.component.html',
  styleUrls: ['./import-export.component.scss'],
})
export class ImportExportComponent {
  private importExportService = inject(ImportExportService);
  private snackBar = inject(MatSnackBar);

  isExporting = false;
  isImporting = false;
  importMessages: string[] = [];
  showMessages = false;

  // Export Suppliers
  exportSuppliers(): void {
    this.isExporting = true;
    this.importExportService.exportSuppliers().subscribe({
      next: (response) => {
        const filename = `suppliers_export_${this.getDateString()}.json`;
        this.importExportService.downloadJson(response, filename);
        this.snackBar.open(
          `${response.count} Lieferanten exportiert`,
          'OK',
          { duration: 3000 }
        );
        this.isExporting = false;
      },
      error: (error) => {
        this.snackBar.open(
          'Fehler beim Exportieren: ' + error.message,
          'OK',
          { duration: 5000 }
        );
        this.isExporting = false;
      },
    });
  }

  // Export Orders
  exportOrders(): void {
    this.isExporting = true;
    this.importExportService.exportOrders().subscribe({
      next: (response) => {
        const filename = `orders_export_${this.getDateString()}.json`;
        this.importExportService.downloadJson(response, filename);
        this.snackBar.open(
          `${response.count} Bestellungen exportiert`,
          'OK',
          { duration: 3000 }
        );
        this.isExporting = false;
      },
      error: (error) => {
        this.snackBar.open(
          'Fehler beim Exportieren: ' + error.message,
          'OK',
          { duration: 5000 }
        );
        this.isExporting = false;
      },
    });
  }

  // Import Suppliers
  onImportSuppliers(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.isImporting = true;
    this.importMessages = [];
    this.showMessages = false;

    this.importExportService
      .readJsonFile(file)
      .then((jsonData) => {
        this.importExportService.importSuppliers(jsonData).subscribe({
          next: (response) => {
            this.importMessages = response.messages || [];
            this.showMessages = true;
            this.snackBar.open(
              `${response.created_count} Lieferanten importiert`,
              'OK',
              { duration: 5000 }
            );
            this.isImporting = false;
            // Reset input
            input.value = '';
          },
          error: (error) => {
            this.snackBar.open(
              'Fehler beim Importieren: ' +
                (error.error?.error || error.message),
              'OK',
              { duration: 5000 }
            );
            this.isImporting = false;
            input.value = '';
          },
        });
      })
      .catch((error) => {
        this.snackBar.open(error.message, 'OK', { duration: 5000 });
        this.isImporting = false;
        input.value = '';
      });
  }

  // Import Orders
  onImportOrders(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.isImporting = true;
    this.importMessages = [];
    this.showMessages = false;

    this.importExportService
      .readJsonFile(file)
      .then((jsonData) => {
        this.importExportService.importOrders(jsonData).subscribe({
          next: (response) => {
            this.importMessages = response.messages || [];
            this.showMessages = true;
            this.snackBar.open(
              `${response.created_count} Bestellungen importiert`,
              'OK',
              { duration: 5000 }
            );
            this.isImporting = false;
            input.value = '';
          },
          error: (error) => {
            this.snackBar.open(
              'Fehler beim Importieren: ' +
                (error.error?.error || error.message),
              'OK',
              { duration: 5000 }
            );
            this.isImporting = false;
            input.value = '';
          },
        });
      })
      .catch((error) => {
        this.snackBar.open(error.message, 'OK', { duration: 5000 });
        this.isImporting = false;
        input.value = '';
      });
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}
