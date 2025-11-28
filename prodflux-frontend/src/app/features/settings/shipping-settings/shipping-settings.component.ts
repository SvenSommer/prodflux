import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { EmailTemplatesSettingsComponent } from '../email-templates-settings.component';
import { ShippingConfigSettingsComponent } from '../shipping-config-settings/shipping-config-settings.component';

@Component({
  selector: 'app-shipping-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    EmailTemplatesSettingsComponent,
    ShippingConfigSettingsComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>
          <mat-icon>local_shipping</mat-icon>
          Versandeinstellungen
        </h1>
      </div>

      <mat-tab-group animationDuration="0ms" class="settings-tabs">
        <!-- Versandkonfiguration Tab -->
        <mat-tab label="Versandkonfiguration">
          <div class="tab-content">
            <app-shipping-config-settings></app-shipping-config-settings>
          </div>
        </mat-tab>

        <!-- Email Templates Tab -->
        <mat-tab label="E-Mail Templates">
          <div class="tab-content">
            <app-email-templates-settings></app-email-templates-settings>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .page-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;

      h1 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 28px;
        font-weight: 500;
        color: #333;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #1976d2;
        }
      }
    }

    .settings-tabs {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .tab-content {
      padding: 24px;
    }

    ::ng-deep .mat-mdc-tab-body-wrapper {
      flex-grow: 1;
    }
  `]
})
export class ShippingSettingsComponent {}
