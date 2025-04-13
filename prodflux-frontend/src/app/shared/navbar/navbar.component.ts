// src/app/shared/navbar/navbar.component.ts
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
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
  router = inject(Router);
  workshops: Workshop[] = [];
  dropdownOpen = false;

  ngOnInit() {
    this.workshopsService.getAll().subscribe(ws => this.workshops = ws);

    // Dropdown automatisch schließen nach Navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.dropdownOpen = false;
      }
    });
  }

  toggleDropdown(event: MouseEvent) {
    event.preventDefault();
    this.dropdownOpen = !this.dropdownOpen;
  }
}
