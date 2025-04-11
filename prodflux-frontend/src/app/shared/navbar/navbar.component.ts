// src/app/shared/navbar/navbar.component.ts
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WorkshopsService, Workshop } from '../../features/settings/workshop.services';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  workshopsService = inject(WorkshopsService);
  workshops: Workshop[] = [];

  ngOnInit() {
    this.workshopsService.getAll().subscribe(ws => this.workshops = ws);
  }
}
