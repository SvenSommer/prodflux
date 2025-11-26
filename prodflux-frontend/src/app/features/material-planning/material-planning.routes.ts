import { Routes } from '@angular/router';

export const materialPlanningRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./material-planner-page/material-planner-page.component')
      .then(m => m.MaterialPlannerPageComponent)
  }
];
