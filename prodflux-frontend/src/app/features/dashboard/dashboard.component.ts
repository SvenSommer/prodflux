// src/app/features/dashboard/dashboard.component.ts
import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  template: `
    <app-navbar></app-navbar>
    <main class="p-4">
      <router-outlet></router-outlet>
    </main>
  `
})
export class DashboardComponent {}
