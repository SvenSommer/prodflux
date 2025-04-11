import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { MaterialsListComponent } from './features/materials/materials-list.component';
import { MaterialFormComponent } from './features/materials/material-form.component';
import { MaterialEditComponent } from './features/materials/material-edit.component';
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
      { path: 'materials', component: MaterialsListComponent },
      { path: 'materials/new', component: MaterialFormComponent },
      { path: 'materials/:id/edit', component: MaterialEditComponent },
      { path: 'products', component: ProductsListComponent, canActivate: [authGuard] },
      { path: 'products/new', component: ProductFormComponent, canActivate: [authGuard] },
      { path: 'products/:id/edit', component: ProductFormComponent, canActivate: [authGuard] },
      { path: 'products/:id', component: ProductDetailComponent, canActivate: [authGuard] },
    ]
  },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
