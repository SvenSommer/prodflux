// src/app/features/dashboard/shopbridge-orders.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ShopbridgeOrdersSummary,
  ShopbridgeOrdersService,
  ORDER_STATUS_MAP
} from './shopbridgeorder.service';

interface FlattenedOrder {
  orderId: number;
  productName: string;
  productShortName: string;
  prodfluxId: number | null;
  prodfluxName: string | null;
  wcProductName: string;
  wcSku: string;
  matchType: string | null;
  quantity: number;
  status: string;
  statusLabel: string;
  statusColor: string;
  statusIcon: string;
  total: string;
  currency: string;
  customerName: string;
  customerCountry: string;
  customerCity: string;
  countryFlag: string;
  dateCreated: string;
}

interface StatusFilter {
  key: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

@Component({
  selector: 'app-shopbridge-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './shopbridge-orders.component.html',
  styleUrls: ['./shopbridge-orders.component.scss']
})
export class ShopbridgeOrdersComponent implements OnInit {
  private service = inject(ShopbridgeOrdersService);

  data: ShopbridgeOrdersSummary | null = null;
  loading = true;
  error: string | null = null;

  // Filters
  activeStatusFilter: string | null = null;
  statusFilters: StatusFilter[] = [];

  // Flattened orders for table display
  allOrders: FlattenedOrder[] = [];
  filteredOrders: FlattenedOrder[] = [];

  // Product mapping - maps WooCommerce product names to short names
  productNameMapping: Record<string, string> = {
    'SD-Link Adapter für Porsche PCM 3.0': 'PCM 3.0',
    'SD-Link Adapter für Porsche PCM 3.1': 'PCM 3.1',
    'SD-Link Adapter für Porsche CDR-31': 'CDR-31',
    'SD-Link Adapter für Porsche CDR-30': 'CDR-30',
    'SD-Link Adapter': 'SD-Link',
    // Add more mappings as needed
  };

  // Country to flag emoji mapping
  countryFlags: Record<string, string> = {
    'DE': '🇩🇪', 'AT': '🇦🇹', 'CH': '🇨🇭', 'NL': '🇳🇱', 'BE': '🇧🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'PT': '🇵🇹', 'PL': '🇵🇱',
    'GB': '🇬🇧', 'UK': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦', 'AU': '🇦🇺',
    'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'CZ': '🇨🇿',
    'HU': '🇭🇺', 'RO': '🇷🇴', 'GR': '🇬🇷', 'LU': '🇱🇺', 'IE': '🇮🇪',
  };

  // Table columns
  displayedColumns = ['orderId', 'customer', 'location', 'product', 'quantity', 'status', 'total', 'actions'];

  ngOnInit(): void {
    this.loadOrders('all'); // Load all orders by default
  }

  loadOrders(status?: string): void {
    this.loading = true;
    this.error = null;

    this.service.getOrders(status || 'all').subscribe({
      next: (data) => {
        this.data = data;
        this.processOrders();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error = 'Fehler beim Laden der Bestellungen';
        this.loading = false;
      }
    });
  }

  private processOrders(): void {
    if (!this.data) return;

    const orders: FlattenedOrder[] = [];
    const statusCounts: Record<string, number> = {};

    // Flatten the product-based structure into order rows
    Object.entries(this.data.products).forEach(([productName, info]) => {
      info.orders.forEach(order => {
        const statusInfo = ORDER_STATUS_MAP[order.status] || {
          label: order.status,
          color: '#666',
          icon: 'help'
        };

        // Use Prodflux name if available, otherwise WooCommerce name
        const displayName = info.prodflux_name || productName;

        orders.push({
          orderId: order.order_id,
          productName: displayName,
          productShortName: displayName, // Already mapped by backend
          prodfluxId: info.prodflux_id,
          prodfluxName: info.prodflux_name,
          wcProductName: order.wc_product_name || productName,
          wcSku: order.wc_sku || '',
          matchType: order.match_type,
          quantity: order.quantity,
          status: order.status,
          statusLabel: statusInfo.label,
          statusColor: statusInfo.color,
          statusIcon: statusInfo.icon,
          total: order.total,
          currency: order.currency,
          customerName: order.customer_name || 'Unbekannt',
          customerCountry: order.customer_country || '',
          customerCity: order.customer_city || '',
          countryFlag: this.getCountryFlag(order.customer_country || ''),
          dateCreated: order.date_created || ''
        });

        // Count by status
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });
    });

    // Sort by order ID descending (newest first)
    orders.sort((a, b) => b.orderId - a.orderId);

    this.allOrders = orders;
    this.filteredOrders = orders;

    // Build status filters
    this.statusFilters = Object.entries(statusCounts).map(([status, count]) => {
      const statusInfo = ORDER_STATUS_MAP[status] || {
        label: status,
        color: '#666',
        icon: 'help'
      };
      return {
        key: status,
        label: statusInfo.label,
        icon: statusInfo.icon,
        color: statusInfo.color,
        count
      };
    });

    // Sort filters by count descending
    this.statusFilters.sort((a, b) => b.count - a.count);
  }

  private getShortProductName(fullName: string): string {
    // Check direct mapping first
    if (this.productNameMapping[fullName]) {
      return this.productNameMapping[fullName];
    }

    // Try to extract meaningful short name
    // Pattern: "SD-Link Adapter für Porsche XXX" -> "XXX"
    const match = fullName.match(/für\s+(?:Porsche\s+)?(.+)$/i);
    if (match) {
      return match[1].trim();
    }

    // Fallback: take last part after "für" or return truncated
    if (fullName.length > 25) {
      return fullName.substring(0, 22) + '...';
    }
    return fullName;
  }

  setStatusFilter(status: string | null): void {
    this.activeStatusFilter = status;

    if (status === null) {
      this.filteredOrders = this.allOrders;
    } else {
      this.filteredOrders = this.allOrders.filter(o => o.status === status);
    }
  }

  // Statistics
  get totalOrders(): number {
    return this.data?.order_count || 0;
  }

  get totalAdapters(): number {
    return this.data?.adapter_count.total || 0;
  }

  get uniqueOrderIds(): number {
    const ids = new Set(this.allOrders.map(o => o.orderId));
    return ids.size;
  }

  get productStats(): { name: string; shortName: string; count: number }[] {
    if (!this.data) return [];

    return Object.entries(this.data.products)
      .map(([name, info]) => ({
        name,
        shortName: this.getShortProductName(name),
        count: info.total_quantity
      }))
      .sort((a, b) => b.count - a.count);
  }

  formatCurrency(value: string, currency: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return `${value} ${currency}`;

    return num.toLocaleString('de-DE', {
      style: 'currency',
      currency: currency
    });
  }

  refresh(): void {
    this.activeStatusFilter = null;
    this.loading = true;
    this.error = null;

    // Invalidate cache and reload fresh data from WooCommerce
    this.service.invalidateCache().subscribe({
      next: () => {
        this.loadOrders('all');
      },
      error: (err) => {
        console.error('Error invalidating cache:', err);
        // Still try to load orders even if cache invalidation fails
        this.loadOrders('all');
      }
    });
  }

  private getCountryFlag(countryCode: string): string {
    return this.countryFlags[countryCode.toUpperCase()] || '🌍';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE');
  }
}
