import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { environment } from '../../../../environments/environment';

export interface ProductSale {
  order_id: number;
  status: string;
  date_created: string;
  quantity: number;
  customer_name: string;
  customer_city: string;
  customer_country: string;
}

// ISO 3166-1 alpha-2 to flag emoji mapping
const COUNTRY_FLAGS: { [key: string]: string } = {
  'DE': '🇩🇪',
  'AT': '🇦🇹',
  'CH': '🇨🇭',
  'NL': '🇳🇱',
  'BE': '🇧🇪',
  'FR': '🇫🇷',
  'IT': '🇮🇹',
  'ES': '🇪🇸',
  'PT': '🇵🇹',
  'GB': '🇬🇧',
  'UK': '🇬🇧',
  'US': '🇺🇸',
  'CA': '🇨🇦',
  'PL': '🇵🇱',
  'CZ': '🇨🇿',
  'DK': '🇩🇰',
  'SE': '🇸🇪',
  'NO': '🇳🇴',
  'FI': '🇫🇮',
  'LU': '🇱🇺',
  'IE': '🇮🇪',
  'GR': '🇬🇷',
  'HU': '🇭🇺',
  'RO': '🇷🇴',
  'BG': '🇧🇬',
  'HR': '🇭🇷',
  'SI': '🇸🇮',
  'SK': '🇸🇰',
  'LT': '🇱🇹',
  'LV': '🇱🇻',
  'EE': '🇪🇪',
  'AU': '🇦🇺',
  'NZ': '🇳🇿',
  'JP': '🇯🇵',
  'CN': '🇨🇳',
  'KR': '🇰🇷',
  'IN': '🇮🇳',
  'BR': '🇧🇷',
  'MX': '🇲🇽',
  'AR': '🇦🇷',
  'ZA': '🇿🇦',
  'RU': '🇷🇺',
  'UA': '🇺🇦',
  'TR': '🇹🇷',
};

@Component({
  selector: 'app-product-sales-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './product-sales-card.component.html',
  styleUrls: ['./product-sales-card.component.scss']
})
export class ProductSalesCardComponent implements OnChanges {
  @Input() sales: ProductSale[] = [];

  displayedColumns: string[] = ['order_id', 'date', 'customer', 'quantity', 'status'];

  // Pagination
  pageSize = 10;
  currentPage = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sales']) {
      // Reset to first page when sales data changes
      this.currentPage = 0;
    }
  }

  // Pagination methods
  getPaginatedSales(): ProductSale[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.sales.slice(start, end);
  }

  getStartIndex(): number {
    return this.currentPage * this.pageSize;
  }

  getEndIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.sales.length);
  }

  getTotalPages(): number {
    return Math.ceil(this.sales.length / this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages() - 1) {
      this.currentPage++;
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // Country flag
  getCountryFlag(countryCode: string): string {
    if (!countryCode) return '';
    const code = countryCode.toUpperCase();
    return COUNTRY_FLAGS[code] || this.getFlagFromCode(code);
  }

  // Fallback: Generate flag emoji from country code
  private getFlagFromCode(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  // Utility methods
  getTotalQuantity(): number {
    return this.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'completed': 'Abgeschlossen',
      'processing': 'In Bearbeitung',
      'pending': 'Ausstehend',
      'on-hold': 'Wartend',
      'cancelled': 'Storniert',
      'refunded': 'Erstattet',
      'failed': 'Fehlgeschlagen'
    };
    return statusLabels[status] || status;
  }

  getOrderUrl(orderId: number): string {
    // sdlink.de WooCommerce admin URL
    return `${environment.woocommerceUrl}/wp-admin/post.php?post=${orderId}&action=edit`;
  }
}
