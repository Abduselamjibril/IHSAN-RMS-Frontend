import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>User Directory</h1>
        <p>Onboard and manage system users, edit profile variables, toggle lockouts, and reset credentials</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">person_add</span> Onboard User
        </button>
      </div>
    </header>

    <div class="leads-list-area card">
      <div class="flex justify-between items-center pb-3 border-bottom margin-b-3">
        <div class="header-search">
          <span class="material-icons-outlined">search</span>
          <input type="text" placeholder="Search by name or email..." [(ngModel)]="searchQuery" (input)="filterUsers()">
        </div>
      </div>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">User Information</th>
              <th style="width: 15%;">Employee Code</th>
              <th style="width: 15%;">Position / Dept</th>
              <th style="width: 15%;">Assigned Role</th>
              <th style="width: 15%;">Account Status</th>
              <th style="width: 15%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of filteredUsers">
              <td>
                <div class="flex align-center gap-3">
                  <div class="avatar" style="background-color: var(--brand-primary); color: white;">
                    {{ getInitials(u.firstName, u.lastName) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-semibold text-main">{{ u.firstName }} {{ u.lastName }}</span>
                    <span class="text-xs text-secondary">{{ u.emailAddress }}</span>
                  </div>
                </div>
              </td>
              <td>
                <strong class="font-mono text-xs text-main">{{ u.employeeCode }}</strong>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main" style="font-size: 13px;">{{ u.username }}</span>
                  <span class="text-xs text-muted">Branch ID: {{ u.branchId || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <span *ngFor="let ur of u.userRoles" class="type-pill margin-r-2" style="font-size: 10px; padding: 2px 6px;">
                  {{ ur.role?.roleName }}
                </span>
                <span *ngIf="!u.userRoles?.length" class="text-muted text-xs">No Role</span>
              </td>
              <td>
                <div class="flex align-center gap-2">
                  <span class="badge" [class.badge-qualified]="u.isActive" [class.badge-lost]="!u.isActive">
                    {{ u.isActive ? 'Active' : 'Inactive' }}
                  </span>
                  <span *ngIf="u.isLocked" class="badge badge-high" style="background-color: rgba(239,68,68,0.1); color: #ef4444;">
                    Locked
                  </span>
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  <button class="icon-btn text-indigo" (click)="openEditModal(u)" title="Edit Profile">
                    <span class="material-icons-outlined font-sm">edit</span>
                  </button>
                  <button class="icon-btn text-indigo" (click)="openResetModal(u)" title="Reset Password">
                    <span class="material-icons-outlined font-sm">vpn_key</span>
                  </button>
                  <button 
                    *ngIf="u.isActive" 
                    class="icon-btn text-danger" 
                    (click)="toggleStatus(u, false)" 
                    title="Deactivate Account"
                  >
                    <span class="material-icons-outlined font-sm">block</span>
                  </button>
                  <button 
                    *ngIf="!u.isActive" 
                    class="icon-btn text-qualified" 
                    (click)="toggleStatus(u, true)" 
                    title="Activate Account"
                  >
                    <span class="material-icons-outlined font-sm">check_circle_outline</span>
                  </button>
                  <button 
                    *ngIf="u.isLocked" 
                    class="icon-btn text-qualified" 
                    (click)="toggleLock(u, false)" 
                    title="Unlock Account"
                  >
                    <span class="material-icons-outlined font-sm">lock_open</span>
                  </button>
                  <button 
                    *ngIf="!u.isLocked && u.username !== 'admin'" 
                    class="icon-btn text-danger" 
                    (click)="toggleLock(u, true)" 
                    title="Lock Account"
                  >
                    <span class="material-icons-outlined font-sm">lock</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!filteredUsers.length">
              <td colspan="6" class="text-center text-secondary py-8">
                No users configured.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Onboard / Edit User Modal -->
    <div class="modal-overlay" *ngIf="showUserModal">
      <div class="modal-container card" style="max-width: 600px; width: 90%;">
        <div class="modal-header">
          <h2>{{ editMode ? 'Modify User Profile' : 'Onboard New System User' }}</h2>
          <button class="close-btn" (click)="closeUserModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <form (ngSubmit)="saveUser()" #userForm="ngForm">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="employeeCode">Employee ID Code *</label>
                <input 
                  type="text" 
                  id="employeeCode" 
                  name="employeeCode" 
                  [(ngModel)]="formModel.employeeCode" 
                  required 
                  [disabled]="editMode"
                  placeholder="e.g. EMP-0099" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="username">Username *</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  [(ngModel)]="formModel.username" 
                  required 
                  [disabled]="editMode"
                  placeholder="e.g. jdoe" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="firstName">First Name *</label>
                <input 
                  type="text" 
                  id="firstName" 
                  name="firstName" 
                  [(ngModel)]="formModel.firstName" 
                  required 
                  placeholder="First name" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="lastName">Last Name *</label>
                <input 
                  type="text" 
                  id="lastName" 
                  name="lastName" 
                  [(ngModel)]="formModel.lastName" 
                  required 
                  placeholder="Last name" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="emailAddress">Email Address *</label>
                <input 
                  type="email" 
                  id="emailAddress" 
                  name="emailAddress" 
                  [(ngModel)]="formModel.emailAddress" 
                  required 
                  placeholder="name@ihsanrems.com" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="phoneNumber">Phone Number</label>
                <input 
                  type="text" 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  [(ngModel)]="formModel.phoneNumber" 
                  placeholder="+251-9..." 
                  class="form-control"
                >
              </div>

              <div class="form-group" *ngIf="!editMode">
                <label for="password">Temp Password *</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  [(ngModel)]="formModel.password" 
                  required 
                  placeholder="Set temporary password" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="roleId">Assign Role *</label>
                <select id="roleId" name="roleId" [(ngModel)]="formModel.roleId" required class="form-control">
                  <option [ngValue]="null">-- Choose Role --</option>
                  <option *ngFor="let r of roles" [ngValue]="r.roleId">{{ r.roleName }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="branchId">Branch ID</label>
                <input 
                  type="number" 
                  id="branchId" 
                  name="branchId" 
                  [(ngModel)]="formModel.branchId" 
                  placeholder="Branch database index ID" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="departmentId">Department ID</label>
                <input 
                  type="number" 
                  id="departmentId" 
                  name="departmentId" 
                  [(ngModel)]="formModel.departmentId" 
                  placeholder="Department database index ID" 
                  class="form-control"
                >
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeUserModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!userForm.valid">Save User</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div class="modal-overlay" *ngIf="showResetModal">
      <div class="modal-container card" style="max-width: 400px; width: 90%;">
        <div class="modal-header">
          <h2>Reset User Credentials</h2>
          <button class="close-btn" (click)="closeResetModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <form (ngSubmit)="saveResetPassword()" #resetForm="ngForm">
          <div class="modal-body flex flex-col gap-4">
            <p class="text-secondary text-sm">
              Enter a new password credential configuration for <strong>{{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</strong>.
            </p>
            <div class="form-group">
              <label for="newPassword">New Password *</label>
              <input 
                type="password" 
                id="newPassword" 
                name="newPassword" 
                [(ngModel)]="resetPasswordModel" 
                required 
                placeholder="Enter new secure password" 
                class="form-control"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeResetModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!resetForm.valid">Reset Password</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      outline: none;
    }
    .form-control:focus {
      border-color: var(--brand-primary);
    }
    .type-pill {
      background-color: rgba(124,58,237,0.1);
      color: var(--brand-primary);
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
  `]
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api';

  users: any[] = [];
  filteredUsers: any[] = [];
  roles: any[] = [];

  searchQuery = '';
  showUserModal = false;
  showResetModal = false;
  editMode = false;

  selectedUser: any = null;
  formModel: any = {};
  resetPasswordModel = '';

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers() {
    this.http.get<any[]>(`${this.apiBase}/users`).subscribe({
      next: (res) => {
        this.users = res;
        this.filterUsers();
      },
      error: (err) => console.error('Failed to load system users', err)
    });
  }

  loadRoles() {
    this.http.get<any[]>(`${this.apiBase}/roles`).subscribe({
      next: (res) => this.roles = res,
      error: (err) => console.error('Failed to load system roles', err)
    });
  }

  filterUsers() {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.emailAddress.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }
  }

  getInitials(first: string, last: string): string {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  }

  openCreateModal() {
    this.editMode = false;
    this.formModel = {
      employeeCode: '',
      username: '',
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      phoneNumber: '',
      password: '',
      departmentId: null,
      branchId: null,
      roleId: null
    };
    this.showUserModal = true;
  }

  openEditModal(user: any) {
    this.editMode = true;
    this.selectedUser = user;
    this.formModel = {
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      departmentId: user.departmentId ? Number(user.departmentId) : null,
      branchId: user.branchId ? Number(user.branchId) : null,
      roleId: user.userRoles?.[0]?.roleId || null
    };
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
    this.selectedUser = null;
  }

  saveUser() {
    const payload = {
      ...this.formModel,
      roleIds: this.formModel.roleId ? [this.formModel.roleId] : []
    };

    if (this.editMode && this.selectedUser) {
      this.http.put(`${this.apiBase}/users/${this.selectedUser.userId}`, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeUserModal();
        },
        error: (err) => console.error('Failed to update user', err)
      });
    } else {
      this.http.post(`${this.apiBase}/users`, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeUserModal();
        },
        error: (err) => console.error('Failed to create user', err)
      });
    }
  }

  openResetModal(user: any) {
    this.selectedUser = user;
    this.resetPasswordModel = '';
    this.showResetModal = true;
  }

  closeResetModal() {
    this.showResetModal = false;
    this.selectedUser = null;
  }

  saveResetPassword() {
    if (!this.selectedUser) return;
    const payload = {
      password: this.resetPasswordModel
    };
    this.http.put(`${this.apiBase}/users/${this.selectedUser.userId}`, payload).subscribe({
      next: () => {
        this.closeResetModal();
      },
      error: (err) => console.error('Failed to reset user password', err)
    });
  }

  toggleStatus(user: any, activate: boolean) {
    const action = activate ? 'activate' : 'deactivate';
    customConfirm(`Are you sure you want to ${action} user ${user.firstName}?`, `${activate ? 'Activate' : 'Deactivate'} User`).then((approved) => {
      if (approved) {
        this.http.post(`${this.apiBase}/users/${user.userId}/${action}`, {}).subscribe({
          next: () => this.loadUsers(),
          error: (err) => console.error(`Failed to ${action} user`, err)
        });
      }
    });
  }

  toggleLock(user: any, lock: boolean) {
    const action = lock ? 'lock' : 'unlock';
    customConfirm(`Are you sure you want to ${action} user ${user.firstName}?`, `${lock ? 'Lock' : 'Unlock'} User`).then((approved) => {
      if (approved) {
        this.http.post(`${this.apiBase}/users/${user.userId}/${action}`, {}).subscribe({
          next: () => this.loadUsers(),
          error: (err) => console.error(`Failed to ${action} user`, err)
        });
      }
    });
  }
}
