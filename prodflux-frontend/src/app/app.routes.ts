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
  // Public routes
  {
    path: 'login',
    component: LoginComponent
  },

  // Protected routes - all require authentication
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/shopbridge-orders.component').then(m => m.ShopbridgeOrdersComponent)
      },

      // MATERIALIEN - alle geschützt
      {
        path: 'materials',
        component: MaterialsListComponent
      },
      {
        path: 'materials/new',
        component: MaterialFormComponent
      },
      {
        path: 'materials/:id',
        loadComponent: () => import('./features/materials/material-detail.component').then(m => m.MaterialDetailComponent)
      },
      {
        path: 'materials/:id/edit',
        component: MaterialFormComponent
      },

      // PRODUKTE - alle geschützt
      {
        path: 'products',
        component: ProductsListComponent
      },
      {
        path: 'products/new',
        component: ProductFormComponent
      },
      {
        path: 'products/:id/edit',
        component: ProductFormComponent
      },
      {
        path: 'products/:id',
        component: ProductDetailComponent
      },

      // EINSTELLUNGEN - geschützt
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },

      // LIEFERUNGEN - alle geschützt
      {
        path: 'deliveries',
        loadComponent: () => import('./features/deliveries/deliveries-list.component').then(m => m.DeliveriesListComponent)
      },
      {
        path: 'deliveries/new',
        loadComponent: () => import('./features/deliveries/delivery-form.component').then(m => m.DeliveryFormComponent)
      },
      {
        path: 'deliveries/:id/edit',
        loadComponent: () => import('./features/deliveries/delivery-form.component').then(m => m.DeliveryFormComponent)
      },
      {
        path: 'deliveries/:id',
        loadComponent: () => import('./features/deliveries/delivery-detail.component').then(m => m.DeliveryDetailComponent)
      },

      // TRANSFERS - alle geschützt
      {
        path: 'transfers',
        loadComponent: () => import('./features/transfers/transfers-list.component').then(m => m.TransfersListComponent)
      },
      {
        path: 'transfers/new',
        loadComponent: () => import('./features/transfers/transfer-form.component').then(m => m.TransferFormComponent)
      },
      {
        path: 'transfers/:id',
        loadComponent: () => import('./features/transfers/transfer-detail.component').then(m => m.TransferDetailComponent)
      },
      {
        path: 'transfers/:id/edit',
        loadComponent: () => import('./features/transfers/transfer-form.component').then(m => m.TransferFormComponent)
      },

      // BESTELLUNGEN - alle geschützt
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders-list.component').then(m => m.OrdersListComponent)
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./features/orders/order-form.component').then(m => m.OrderFormComponent)
      },
      {
        path: 'orders/:id/edit',
        loadComponent: () => import('./features/orders/order-form.component').then(m => m.OrderFormComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail.component').then(m => m.OrderDetailComponent)
      },

      // WERKSTATTEN - geschützt
      {
        path: 'workshops/:id',
        loadComponent: () => import('./features/workshops/workshop-detail.component').then(m => m.WorkshopDetailComponent)
      },

      // MATERIALPLANUNG - geschützt
      {
        path: 'material-planner',
        loadChildren: () => import('./features/material-planning/material-planning.routes').then(m => m.materialPlanningRoutes)
      },

      // Fallback für leere Route
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback für unbekannte Routen - redirect zu login falls nicht authentifiziert
  {
    path: '**',
    redirectTo: 'login'
  }
];
