import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { MaterialsListComponent } from './features/materials/materials-list.component';
import { MaterialFormComponent } from './features/materials/material-form.component';
import { ProductsListComponent } from './features/products/products-list.component';
import { ProductDetailComponent } from './features/products/product-detail.component';
import { ProductFormComponent } from './features/products/product-form.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/stats.component').then(m => m.StatsComponent) },

      // MATERIAL
      { path: 'materials', component: MaterialsListComponent },
      { path: 'materials/:id/edit', component: MaterialFormComponent },
      { path: 'materials/new', component: MaterialFormComponent },

      // PRODUKTE
      { path: 'products', component: ProductsListComponent, canActivate: [authGuard] },
      { path: 'products/new', component: ProductFormComponent, canActivate: [authGuard] },
      { path: 'products/:id/edit', component: ProductFormComponent, canActivate: [authGuard] },
      { path: 'products/:id', component: ProductDetailComponent, canActivate: [authGuard] },

      // EINSTELLUNGEN
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), canActivate: [authGuard] },

      // LIEFERUNGEN
      { path: 'deliveries', loadComponent: () => import('./features/deliveries/deliveries-list.component').then(m => m.DeliveriesListComponent), canActivate: [authGuard] },
      { path: 'deliveries/:id', loadComponent: () => import('./features/deliveries/delivery-detail.component').then(m => m.DeliveryDetailComponent) },
      { path: 'deliveries/new', loadComponent: () => import('./features/deliveries/delivery-form.component').then(m => m.DeliveryFormComponent), canActivate: [authGuard] },
      { path: 'deliveries/:id/edit', loadComponent: () => import('./features/deliveries/delivery-form.component').then(m => m.DeliveryFormComponent), canActivate: [authGuard] },

      // WERKSTATTEN
      { path: 'workshops/:id', loadComponent: () => import('./features/workshops/workshop-detail.component').then(m => m.WorkshopDetailComponent), canActivate: [authGuard] },
    ]
  },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
