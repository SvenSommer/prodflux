import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { WorkshopsService, Workshop } from '../../features/settings/workshop.services';
import { AuthService, User } from '../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  workshopsService = inject(WorkshopsService);
  authService = inject(AuthService);
  router = inject(Router);

  workshops: Workshop[] = [];
  openDropdown: string | null = null;
  currentUser$: Observable<User | null>;
  isLoggedIn$: Observable<boolean>;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

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

  logout(): void {
    this.authService.logout();
  }
}
