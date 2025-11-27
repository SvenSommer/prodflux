// src/app/features/dashboard/shopbridge-orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShopbridgeOrdersSummary, ShopbridgeOrdersService } from './shopbridgeorder.service';



@Component({
  selector: 'app-shopbridge-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shopbridge-orders.component.html',
  styleUrls: ['./shopbridge-orders.component.scss']
})
export class ShopbridgeOrdersComponent implements OnInit {
  data: ShopbridgeOrdersSummary | null = null;

  constructor(private service: ShopbridgeOrdersService) {}

  ngOnInit(): void {
    this.service.getOrders().subscribe(data => {
      this.data = data;
    });
  }

  get productEntries() {
    if (!this.data) return [];
    return Object.entries(this.data.products).map(([name, info]) => ({
      name,
      total_quantity: info.total_quantity,
      orders: info.orders
    }));
  }
}
