import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { MaterialsListComponent } from './features/materials/materials-list.component';
import { MaterialFormComponent } from './features/materials/material-form.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'materials', component: MaterialsListComponent, canActivate: [authGuard] },
  { path: 'materials/new', component: MaterialFormComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
