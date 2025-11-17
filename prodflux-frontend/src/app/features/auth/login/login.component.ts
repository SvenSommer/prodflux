import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string | null = null;
  isLoading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: [environment.production ? '' : 'rh', [Validators.required]],
      password: [environment.production ? '' : 'meqban-seVny5-kofvyq', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // If already logged in, redirect to dashboard
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  submit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;

      const { username, password } = this.loginForm.value;
      this.authService.login(username, password).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.error = 'Benutzername oder Passwort ist falsch';
          console.error('Login error:', error);
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
