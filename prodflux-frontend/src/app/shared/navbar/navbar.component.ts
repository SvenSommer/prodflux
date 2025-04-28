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
  openDropdown: string | null = null; // <-- WICHTIG: Welches Dropdown ist offen

  ngOnInit() {
    this.workshopsService.getAll().subscribe(ws => this.workshops = ws);

    // Dropdown schließen bei Navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.openDropdown = null;
      }
    });
  }

  toggleDropdown(dropdownName: string, event: MouseEvent) {
    event.preventDefault();
    if (this.openDropdown === dropdownName) {
      this.openDropdown = null;
    } else {
      this.openDropdown = dropdownName;
    }
  }

  isDropdownOpen(dropdownName: string): boolean {
    return this.openDropdown === dropdownName;
  }
}
