// src/app/features/dashboard/stats.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Willkommen im Dashboard</h2>
    <p>Hier könnten aktuelle Produktionszahlen, Materialverbräuche oder Warnungen erscheinen.</p>
  `
})
export class StatsComponent {}
