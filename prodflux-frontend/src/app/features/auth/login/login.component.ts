import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: [environment.production ? '' : 'rh'],
      password: [environment.production ? '' : 'meqban-seVny5-kofvyq'],
    });
  }

  submit() {
    const { username, password } = this.loginForm.value;
    this.authService.login(username, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.error = 'Login fehlgeschlagen',
    });
  }
}
