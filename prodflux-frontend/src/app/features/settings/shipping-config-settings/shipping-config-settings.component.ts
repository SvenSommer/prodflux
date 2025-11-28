import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  ShippingConfigService,
  ShippingCountryConfig,
  ShippingConfigDefaults,
} from '../shipping-config.service';

interface FormData {
  country_code: string;
  country_name: string;
  shipping_type: 'dhl_product' | 'external_link';
  dhl_product: string;
  external_link: string;
  external_link_label: string;
  notes: string;
  is_active: boolean;
}

// Country flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪',
  AT: '🇦🇹',
  CH: '🇨🇭',
  BE: '🇧🇪',
  CZ: '🇨🇿',
  DK: '🇩🇰',
  ES: '🇪🇸',
  FR: '🇫🇷',
  GB: '🇬🇧',
  IT: '🇮🇹',
  LU: '🇱🇺',
  NL: '🇳🇱',
  PL: '🇵🇱',
  SE: '🇸🇪',
};

@Component({
  selector: 'app-shipping-config-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './shipping-config-settings.component.html',
  styleUrls: ['./shipping-config-settings.component.scss'],
})
export class ShippingConfigSettingsComponent implements OnInit {
  private shippingConfigService = inject(ShippingConfigService);
  private snackBar = inject(MatSnackBar);

  configs: ShippingCountryConfig[] = [];
  defaults: ShippingConfigDefaults | null = null;
  editingConfig: ShippingCountryConfig | null = null;
  loading = true;

  displayedColumns = ['country', 'shipping_type', 'product', 'status', 'actions'];

  formData: FormData = this.getEmptyFormData();

  ngOnInit(): void {
    this.loadData();
  }

  private getEmptyFormData(): FormData {
    return {
      country_code: '',
      country_name: '',
      shipping_type: 'dhl_product',
      dhl_product: 'V62WP',
      external_link: 'https://www.dhl.de/de/privatkunden.html',
      external_link_label: 'Manuell versenden',
      notes: '',
      is_active: true,
    };
  }

  loadData(): void {
    this.loading = true;

    // Load defaults
    this.shippingConfigService.getDefaults().subscribe({
      next: (defaults) => {
        this.defaults = defaults;
      },
      error: (err) => {
        console.error('Error loading defaults:', err);
      },
    });

    // Load existing configs
    this.shippingConfigService.getAll().subscribe({
      next: (configs) => {
        this.configs = configs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading configs:', err);
        this.loading = false;
        this.snackBar.open('Fehler beim Laden der Konfigurationen', 'Schließen', {
          duration: 5000,
        });
      },
    });
  }

  get availableCountries(): { code: string; name: string }[] {
    if (!this.defaults) return [];

    const configuredCodes = this.configs.map((c) => c.country_code);

    // If editing, include the current country
    if (this.editingConfig) {
      return this.defaults.default_countries;
    }

    // Filter out already configured countries
    return this.defaults.default_countries.filter(
      (c) => !configuredCodes.includes(c.code)
    );
  }

  onCountryChange(countryCode: string): void {
    const country = this.defaults?.default_countries.find(
      (c) => c.code === countryCode
    );
    if (country) {
      this.formData.country_name = country.name;

      // Auto-select appropriate product based on country
      if (countryCode === 'DE') {
        this.formData.dhl_product = 'V62WP'; // Warenpost National
      } else if (['CH', 'GB'].includes(countryCode)) {
        // Suggest external link for CH and GB
        this.formData.shipping_type = 'external_link';
        this.formData.external_link = 'https://www.dhl.de/de/privatkunden.html';
        this.formData.external_link_label = 'DHL Privatkunden öffnen';
      } else {
        this.formData.dhl_product = 'V66WPI'; // Warenpost International
      }
    }
  }

  onShippingTypeChange(type: 'dhl_product' | 'external_link'): void {
    if (type === 'external_link' && !this.formData.external_link) {
      this.formData.external_link =
        this.defaults?.default_external_link ||
        'https://www.dhl.de/de/privatkunden.html';
      this.formData.external_link_label = 'Manuell versenden';
    }
  }

  isFormValid(): boolean {
    if (!this.formData.country_code) return false;

    if (this.formData.shipping_type === 'dhl_product') {
      return !!this.formData.dhl_product;
    } else {
      return !!this.formData.external_link;
    }
  }

  saveConfig(): void {
    if (!this.isFormValid()) return;

    const payload: Partial<ShippingCountryConfig> = {
      country_code: this.formData.country_code,
      country_name: this.formData.country_name,
      shipping_type: this.formData.shipping_type,
      is_active: this.formData.is_active,
      notes: this.formData.notes || null,
    };

    if (this.formData.shipping_type === 'dhl_product') {
      payload.dhl_product = this.formData.dhl_product;
      payload.external_link = null;
      payload.external_link_label = null;
    } else {
      payload.dhl_product = null;
      payload.external_link = this.formData.external_link;
      payload.external_link_label =
        this.formData.external_link_label || 'Manuell versenden';
    }

    const request = this.editingConfig
      ? this.shippingConfigService.update(this.editingConfig.id, payload)
      : this.shippingConfigService.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.editingConfig
            ? 'Konfiguration aktualisiert'
            : 'Konfiguration erstellt',
          'OK',
          { duration: 3000 }
        );
        this.cancelEdit();
        this.loadData();
      },
      error: (err) => {
        console.error('Error saving config:', err);
        this.snackBar.open('Fehler beim Speichern', 'Schließen', {
          duration: 5000,
        });
      },
    });
  }

  editConfig(config: ShippingCountryConfig): void {
    this.editingConfig = config;
    this.formData = {
      country_code: config.country_code,
      country_name: config.country_name,
      shipping_type: config.shipping_type,
      dhl_product: config.dhl_product || 'V62WP',
      external_link:
        config.external_link || 'https://www.dhl.de/de/privatkunden.html',
      external_link_label: config.external_link_label || 'Manuell versenden',
      notes: config.notes || '',
      is_active: config.is_active,
    };
  }

  cancelEdit(): void {
    this.editingConfig = null;
    this.formData = this.getEmptyFormData();
  }

  deleteConfig(config: ShippingCountryConfig): void {
    if (
      confirm(
        `Konfiguration für "${config.country_name}" wirklich löschen?`
      )
    ) {
      this.shippingConfigService.delete(config.id).subscribe({
        next: () => {
          this.snackBar.open('Konfiguration gelöscht', 'OK', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          console.error('Error deleting config:', err);
          this.snackBar.open('Fehler beim Löschen', 'Schließen', {
            duration: 5000,
          });
        },
      });
    }
  }

  getCountryFlag(countryCode: string): string {
    return COUNTRY_FLAGS[countryCode] || '🏳️';
  }

  getProductIcon(productCode: string): string {
    switch (productCode) {
      case 'V62WP':
        return 'mail';
      case 'V66WPI':
        return 'public';
      case 'V62KP':
        return 'inventory_2';
      case 'V01PAK':
        return 'local_shipping';
      default:
        return 'package';
    }
  }
}
