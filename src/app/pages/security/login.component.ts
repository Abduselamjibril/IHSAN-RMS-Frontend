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
      <div class="login-backdrop-orb orb-one"></div>
      <div class="login-backdrop-orb orb-two"></div>
      <div class="login-card">
        <!-- Standard Login View -->
        <div *ngIf="!mustChangePassword()">
          <div class="brand-header">
            <img class="login-logo" src="/IHSAN LOGO 2.jpg" alt="IHSAN Properties and Business Services">
            <span class="portal-label">SECURE MANAGEMENT PORTAL</span>
            <h2>Welcome back</h2>
            <p>Sign in to IHSAN Properties & Business Services.</p>
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

        <!-- Forced Password Change View -->
        <div *ngIf="mustChangePassword()">
          <div class="brand-header">
            <img class="login-logo" src="/IHSAN LOGO 2.jpg" alt="IHSAN Properties and Business Services">
            <span class="portal-label" style="color: #ef4444;">SECURITY POLICY ENFORCEMENT</span>
            <h2 style="font-size: 22px; margin-top: 8px;">Reset Password</h2>
            <p>First login detected. Please set a secure password.</p>
          </div>

          <form (ngSubmit)="onChangePassword()" #changeForm="ngForm" class="login-form">
            <div *ngIf="changePasswordError()" class="alert-danger animate-fade-in">
              <span class="material-icons-outlined font-sm">error_outline</span>
              {{ changePasswordError() }}
            </div>

            <div class="form-group">
              <label for="newPassword">New Password</label>
              <div class="input-wrapper">
                <span class="material-icons-outlined input-icon">lock</span>
                <input 
                  type="password" 
                  id="newPassword" 
                  name="newPassword" 
                  [(ngModel)]="newPassword" 
                  required 
                  placeholder="At least 8 characters"
                  class="form-control"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <div class="input-wrapper">
                <span class="material-icons-outlined input-icon">lock_reset</span>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  [(ngModel)]="confirmPassword" 
                  required 
                  placeholder="Verify new password"
                  class="form-control"
                >
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="!changeForm.valid || isLoading()">
              <span *ngIf="!isLoading()">Update Password & Enter Portal</span>
              <span *ngIf="isLoading()" class="loading-dots">Updating Password...</span>
            </button>
          </form>
        </div>
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
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 10% 10%, #0b4a86 0%, transparent 30%), linear-gradient(135deg, #020b1e 0%, #062752 55%, #03142e 100%);
      font-family: var(--font-family);
    }

    .login-card {
      width: 100%;
      position: relative;
      z-index: 1;
      max-width: 440px;
      padding: 38px 40px 40px;
      background: rgba(6, 27, 57, .88);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(127, 193, 242, .25);
      border-radius: 22px;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.4);
      animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .brand-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-logo {
      width: 82px;
      height: 82px;
      object-fit: cover;
      object-position: center 20%;
      display: block;
      margin: 0 auto 15px;
      border: 2px solid rgba(244, 199, 100, .78);
      border-radius: 20px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, .35);
    }
    .portal-label {
      color: #f4c764;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.2px;
    }

    .brand-header h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .brand-header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #b4cee6;
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
      color: #bdd3e9;
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
      color: #77b9ee;
    }

    .form-control {
      width: 100%;
      padding: 12px 14px 12px 42px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(126, 181, 229, .28);
      background-color: rgba(1, 14, 35, .72);
      color: white;
      font-size: 14px;
      outline: none;
      transition: all 0.25s;
    }

    .form-control:focus {
      border-color: #38a4eb;
      box-shadow: 0 0 0 3px rgba(56, 164, 235, 0.16);
      background-color: #03152f;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 10px;
    }
    .btn-primary { background: linear-gradient(135deg, #087fce, #075eac); box-shadow: 0 10px 20px rgba(5, 121, 202, .25); }
    .btn-primary:hover { background: linear-gradient(135deg, #1093e3, #0870c0); }
    .login-backdrop-orb { position: absolute; border-radius: 50%; filter: blur(2px); opacity: .42; }
    .orb-one { width: 310px; height: 310px; background: #0d8ade; left: -140px; bottom: -100px; }
    .orb-two { width: 230px; height: 230px; background: #dca52d; right: -100px; top: -85px; opacity: .2; }

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
    @media (max-width: 520px) { .login-card { margin: 18px; padding: 30px 24px; } }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  // Forced password change variables
  mustChangePassword = signal(false);
  newPassword = '';
  confirmPassword = '';
  changePasswordError = signal<string | null>(null);

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
      next: (res) => {
        this.isLoading.set(false);
        if (res?.user?.forcePasswordChange) {
          this.mustChangePassword.set(true);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Authentication failed. Please verify credentials.');
      }
    });
  }

  onChangePassword() {
    if (!this.newPassword || this.newPassword.length < 8) {
      this.changePasswordError.set('New password must be at least 8 characters long.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.changePasswordError.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.changePasswordError.set(null);

    const userId = this.authService.currentUser()?.userId;

    if (!userId) {
      this.changePasswordError.set('Session user identity not found. Please log in again.');
      this.isLoading.set(false);
      return;
    }

    this.authService.updatePassword(userId, this.newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.changePasswordError.set(err.error?.message || 'Failed to update password. Please try again.');
      }
    });
  }
}
