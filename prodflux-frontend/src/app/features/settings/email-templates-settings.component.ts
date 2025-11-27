import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';

import {
  EmailTemplateService,
  EmailTemplate,
  EmailTemplateCreate,
  Placeholder
} from '../dashboard/email-template.service';

@Component({
  selector: 'app-email-templates-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatSnackBarModule,
    MatExpansionModule,
  ],
  template: `
    <mat-card class="settings-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>email</mat-icon>
          E-Mail Templates verwalten
        </mat-card-title>
        <mat-card-subtitle>
          Templates für automatische Versand-Emails an Kunden
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Placeholder Info -->
        <mat-expansion-panel class="placeholders-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>help_outline</mat-icon>
              Verfügbare Platzhalter
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="placeholders-grid">
            <div class="placeholder-item" *ngFor="let p of placeholders">
              <code>{{'{{'}}{{ p.key }}{{'}}'}}</code>
              <span>{{ p.description }}</span>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Template Form -->
        <div class="template-form">
          <h3>{{ editingTemplate ? 'Template bearbeiten' : 'Neues Template erstellen' }}</h3>

          <form (ngSubmit)="saveTemplate()" #templateForm="ngForm">
            <div class="form-row">
              <mat-form-field appearance="outline" class="medium-field">
                <mat-label>Sprache</mat-label>
                <mat-select [(ngModel)]="formData.language" name="language" required>
                  <mat-option *ngFor="let lang of languages" [value]="lang[0]">
                    {{ lang[1] }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="medium-field">
                <mat-label>Typ</mat-label>
                <mat-select [(ngModel)]="formData.template_type" name="template_type" required>
                  <mat-option *ngFor="let type of templateTypes" [value]="type[0]">
                    {{ type[1] }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="grow">
                <mat-label>Template Name</mat-label>
                <input matInput [(ngModel)]="formData.name" name="name" required
                       placeholder="z.B. Standard Versandbenachrichtigung" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Betreff</mat-label>
              <input matInput [(ngModel)]="formData.subject" name="subject" required
                     placeholder="z.B. [SD-Link] Deine Bestellung ist unterwegs!" />
              <mat-hint>Kann Platzhalter wie {{'{{'}}first_name{{'}}'}} enthalten</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-Mail Text</mat-label>
              <textarea matInput [(ngModel)]="formData.body" name="body" required
                        rows="10" placeholder="Hallo {{'{{'}}first_name{{'}}'}},

der Adapter ist auf dem Weg zu Dir..."></textarea>
              <mat-hint>Kann Platzhalter wie {{'{{'}}first_name{{'}}'}}, {{'{{'}}order_number{{'}}'}} enthalten</mat-hint>
            </mat-form-field>

            <div class="form-row toggles">
              <mat-slide-toggle [(ngModel)]="formData.is_active" name="is_active">
                Aktiv
              </mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="formData.is_default" name="is_default">
                Standard-Template für diese Sprache
              </mat-slide-toggle>
            </div>

            <div class="form-actions">
              <button mat-button type="button" *ngIf="editingTemplate" (click)="cancelEdit()">
                Abbrechen
              </button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="!templateForm.valid">
                <mat-icon>{{ editingTemplate ? 'save' : 'add' }}</mat-icon>
                {{ editingTemplate ? 'Speichern' : 'Template erstellen' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Templates List -->
        <div class="templates-list">
          <h3>Vorhandene Templates</h3>

          <table mat-table [dataSource]="templates" class="mat-elevation-z1 full-width-table">
            <ng-container matColumnDef="language">
              <th mat-header-cell *matHeaderCellDef>Sprache</th>
              <td mat-cell *matCellDef="let t">
                <span class="language-badge">{{ t.language_display }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let t">
                {{ t.name }}
                <mat-chip *ngIf="t.is_default" color="primary" selected>Standard</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Typ</th>
              <td mat-cell *matCellDef="let t">{{ t.template_type_display }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let t">
                <mat-icon [class.active]="t.is_active" [class.inactive]="!t.is_active">
                  {{ t.is_active ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Aktionen</th>
              <td mat-cell *matCellDef="let t">
                <button mat-icon-button color="primary" (click)="editTemplate(t)"
                        matTooltip="Bearbeiten">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteTemplate(t)"
                        matTooltip="Löschen">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <div class="no-templates" *ngIf="templates.length === 0">
            <mat-icon>inbox</mat-icon>
            <p>Keine E-Mail Templates vorhanden.</p>
            <p>Erstellen Sie Ihr erstes Template oben.</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .settings-card {
      mat-card-header {
        margin-bottom: 24px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;

          mat-icon {
            color: #1976d2;
          }
        }
      }
    }

    .placeholders-panel {
      margin-bottom: 24px;
      background: #fafafa;

      mat-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          color: #666;
        }
      }

      .placeholders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 12px;
        padding: 16px 0;

        .placeholder-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;

          code {
            background: #e3f2fd;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            color: #1565c0;
            white-space: nowrap;
          }

          span {
            color: #666;
            font-size: 13px;
          }
        }
      }
    }

    .template-form {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }

      .form-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 16px;

        .medium-field {
          min-width: 150px;
        }

        .grow {
          flex: 1;
          min-width: 200px;
        }

        &.toggles {
          gap: 32px;
          margin-top: 8px;
        }
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;

        button {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }

    .templates-list {
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }

      .full-width-table {
        width: 100%;

        .language-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #e3f2fd;
          color: #1565c0;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
        }

        mat-chip {
          font-size: 10px;
          min-height: 20px;
          padding: 0 8px;
          margin-left: 8px;
        }

        mat-icon.active {
          color: #2e7d32;
        }

        mat-icon.inactive {
          color: #c62828;
        }
      }

      .no-templates {
        text-align: center;
        padding: 48px 24px;
        color: #666;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #ccc;
          margin-bottom: 16px;
        }

        p {
          margin: 0;
          &:first-of-type {
            font-weight: 500;
            color: #333;
          }
        }
      }
    }
  `]
})
export class EmailTemplatesSettingsComponent implements OnInit {
  private emailTemplateService = inject(EmailTemplateService);
  private snackBar = inject(MatSnackBar);

  templates: EmailTemplate[] = [];
  placeholders: Placeholder[] = [];
  languages: [string, string][] = [];
  templateTypes: [string, string][] = [];

  editingTemplate: EmailTemplate | null = null;

  formData: EmailTemplateCreate = {
    name: '',
    language: 'de',
    template_type: 'order_shipped',
    subject: '',
    body: '',
    is_active: true,
    is_default: false
  };

  displayedColumns = ['language', 'name', 'type', 'status', 'actions'];

  ngOnInit(): void {
    this.loadTemplates();
    this.loadPlaceholders();
    this.loadLanguagesAndTypes();
  }

  loadTemplates(): void {
    this.emailTemplateService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        this.snackBar.open('Fehler beim Laden der Templates', 'Schließen', {
          duration: 5000
        });
      }
    });
  }

  loadPlaceholders(): void {
    this.emailTemplateService.getPlaceholders().subscribe({
      next: (result) => {
        this.placeholders = result.placeholders;
      }
    });
  }

  loadLanguagesAndTypes(): void {
    this.emailTemplateService.getLanguagesAndTypes().subscribe({
      next: (result) => {
        this.languages = result.languages;
        this.templateTypes = result.template_types;
      }
    });
  }

  saveTemplate(): void {
    if (this.editingTemplate) {
      // Update existing
      this.emailTemplateService.updateTemplate(this.editingTemplate.id, this.formData).subscribe({
        next: () => {
          this.snackBar.open('Template aktualisiert', 'OK', { duration: 3000 });
          this.resetForm();
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Error updating template:', err);
          this.snackBar.open('Fehler beim Aktualisieren', 'Schließen', {
            duration: 5000
          });
        }
      });
    } else {
      // Create new
      this.emailTemplateService.createTemplate(this.formData).subscribe({
        next: () => {
          this.snackBar.open('Template erstellt', 'OK', { duration: 3000 });
          this.resetForm();
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Error creating template:', err);
          this.snackBar.open('Fehler beim Erstellen', 'Schließen', {
            duration: 5000
          });
        }
      });
    }
  }

  editTemplate(template: EmailTemplate): void {
    this.editingTemplate = template;
    this.formData = {
      name: template.name,
      language: template.language,
      template_type: template.template_type,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active,
      is_default: template.is_default
    };
  }

  deleteTemplate(template: EmailTemplate): void {
    if (confirm(`Template "${template.name}" wirklich löschen?`)) {
      this.emailTemplateService.deleteTemplate(template.id).subscribe({
        next: () => {
          this.snackBar.open('Template gelöscht', 'OK', { duration: 3000 });
          this.loadTemplates();
        },
        error: (err) => {
          console.error('Error deleting template:', err);
          this.snackBar.open('Fehler beim Löschen', 'Schließen', {
            duration: 5000
          });
        }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingTemplate = null;
    this.formData = {
      name: '',
      language: 'de',
      template_type: 'order_shipped',
      subject: '',
      body: '',
      is_active: true,
      is_default: false
    };
  }
}
