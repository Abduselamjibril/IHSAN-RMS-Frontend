import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="brand-header">
          <div class="logo-circle">I</div>
          <h2>IHSAN REMS</h2>
          <p>Real Estate Management System Security Portal</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div *ngIf="errorMessage()" class="alert-danger animate-fade-in">
            <span class="material-icons-outlined font-sm">error_outline</span>
            {{ errorMessage() }}
          </div>

          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-wrapper">
              <span class="material-icons-outlined input-icon">person</span>
              <input 
                type="text" 
                id="username" 
                name="username" 
                [(ngModel)]="username" 
                required 
                placeholder="Enter your username"
                class="form-control"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <span class="material-icons-outlined input-icon">lock</span>
              <input 
                type="password" 
                id="password" 
                name="password" 
                [(ngModel)]="password" 
                required 
                placeholder="Enter your password"
                class="form-control"
              >
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="!loginForm.valid || isLoading()">
            <span *ngIf="!isLoading()">Sign In</span>
            <span *ngIf="isLoading()" class="loading-dots">Authenticating...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100vw;
      background: linear-gradient(135deg, #0e0a24 0%, #17113a 100%);
      font-family: 'Outfit', sans-serif;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      background-color: #1c1543;
      border: 1px solid rgba(124, 58, 237, 0.15);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .brand-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-circle {
      width: 54px;
      height: 54px;
      background: linear-gradient(135deg, #7c3aed 0%, #4c3a93 100%);
      color: white;
      font-weight: 800;
      font-size: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      margin: 0 auto 16px auto;
      box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
    }

    .brand-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .brand-header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #8c85b5;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: #9c97c1;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      font-size: 20px;
      color: #6a6396;
    }

    .form-control {
      width: 100%;
      padding: 12px 14px 12px 42px;
      border-radius: var(--radius-md);
      border: 1px solid #2d2460;
      background-color: #130d30;
      color: white;
      font-size: 14px;
      outline: none;
      transition: all 0.25s;
    }

    .form-control:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
      background-color: #0f0a28;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 10px;
    }

    .alert-danger {
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #ef4444;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    @keyframes zoomIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({
      username: this.username,
      password: this.password,
      browserName: navigator.userAgent.split(' ')[0] || 'Browser',
      deviceType: 'Desktop'
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Authentication failed. Please verify credentials.');
      }
    });
  }
}
