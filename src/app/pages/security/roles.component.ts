import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { customConfirm } from '../../utils/confirm';

interface PermissionMatrixRow {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  groupName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Role & Permission Matrix</h1>
        <p>Define enterprise security roles, configure granular permissions, and map access privileges</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openRoleModal()">
          <span class="material-icons-outlined">add_moderator</span> Create New Role
        </button>
      </div>
    </header>

    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 24px; padding-bottom: 40px;">
      <!-- Left sidebar: Roles list -->
      <div class="card p-4" style="background-color: var(--bg-card); display: flex; flex-direction: column; gap: 12px; height: fit-content;">
        <h3 style="font-size: 14px; text-transform: uppercase; tracking-wider: 0.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">Security Roles</h3>
        
        <div class="flex flex-col gap-2">
          <div 
            *ngFor="let r of roles" 
            (click)="selectRole(r)" 
            [class.active-role]="selectedRole?.roleId === r.roleId"
            class="role-item-card transition-hover"
          >
            <div class="flex align-center gap-3">
              <span class="material-icons-outlined" [style.color]="selectedRole?.roleId === r.roleId ? 'white' : 'var(--brand-primary)'">
                security
              </span>
              <div class="flex flex-col">
                <span class="font-semibold" style="font-size: 13px;">{{ r.roleName }}</span>
                <span class="text-xs" style="opacity: 0.7;">{{ r.roleCode }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Permissions Matrix -->
      <div class="card p-6" *ngIf="selectedRole">
        <div class="flex justify-between items-center border-bottom pb-3 margin-b-4">
          <div>
            <span class="text-indigo text-xs uppercase tracking-wider font-semibold">Configuring Access Control Map</span>
            <h2>{{ selectedRole.roleName }} Matrix</h2>
            <p class="text-secondary text-xs" style="margin-top: 4px;">{{ selectedRole.description || 'No description provided.' }}</p>
          </div>
          <button class="btn btn-primary" (click)="savePermissions()">
            <span class="material-icons-outlined">save</span> Save Matrix Changes
          </button>
        </div>

        <div class="table-container" style="max-height: 60vh; overflow-y: auto;">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 40%;">Permission Capability</th>
                <th style="width: 10%;" class="text-center">Read / View</th>
                <th style="width: 10%;" class="text-center">Create</th>
                <th style="width: 10%;" class="text-center">Edit</th>
                <th style="width: 10%;" class="text-center">Delete</th>
                <th style="width: 10%;" class="text-center">Approve</th>
                <th style="width: 10%;" class="text-center">Export</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let g of groups">
                <!-- Group Header Row -->
                <tr style="background-color: rgba(124,58,237,0.05); font-weight: 700;">
                  <td colspan="7" class="text-indigo" style="font-size: 13px; letter-spacing: 0.5px;">
                    {{ g.groupName }}
                  </td>
                </tr>
                <!-- Permission Row -->
                <tr *ngFor="let row of getRowsForGroup(g.groupName)">
                  <td>
                    <div class="flex flex-col">
                      <span class="font-semibold text-main" style="font-size: 13px;">{{ row.permissionCode }}</span>
                      <span class="text-xs text-muted">{{ row.permissionName }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="row.canView" style="width: 16px; height: 16px; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="row.canCreate" style="width: 16px; height: 16px; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="row.canEdit" style="width: 16px; height: 16px; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="row.canDelete" style="width: 16px; height: 16px; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="row.canApprove" style="width: 16px; height: 16px; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="row.canExport" style="width: 16px; height: 16px; cursor: pointer;">
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- No Role Selected State -->
      <div class="card p-8 text-center flex flex-col align-center justify-center" *ngIf="!selectedRole" style="height: 300px;">
        <span class="material-icons-outlined text-muted" style="font-size: 48px; margin-bottom: 12px;">admin_panel_settings</span>
        <h3 class="text-main">No Role Selected</h3>
        <p class="text-secondary text-sm">Please select a security role from the left menu to configure its access privileges matrix.</p>
      </div>
    </div>

    <!-- Create Role Modal -->
    <div class="modal-overlay" *ngIf="showRoleModal">
      <div class="modal-container card" style="max-width: 450px; width: 90%;">
        <div class="modal-header">
          <h2>Create Security Role</h2>
          <button class="close-btn" (click)="closeRoleModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <form (ngSubmit)="saveRole()" #roleForm="ngForm">
          <div class="modal-body flex flex-col gap-4">
            <div class="form-group">
              <label for="roleCode">Role Code / Key *</label>
              <input 
                type="text" 
                id="roleCode" 
                name="roleCode" 
                [(ngModel)]="roleFormModel.roleCode" 
                required 
                placeholder="e.g. FINANCE_MGR" 
                class="form-control"
              >
            </div>

            <div class="form-group">
              <label for="roleName">Role Display Name *</label>
              <input 
                type="text" 
                id="roleName" 
                name="roleName" 
                [(ngModel)]="roleFormModel.roleName" 
                required 
                placeholder="e.g. Finance Manager" 
                class="form-control"
              >
            </div>

            <div class="form-group">
              <label for="description">Role Description</label>
              <textarea 
                id="description" 
                name="description" 
                [(ngModel)]="roleFormModel.description" 
                placeholder="Describe role scope and permissions" 
                class="form-control"
                style="height: 80px; resize: none;"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeRoleModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!roleForm.valid">Save Role</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .role-item-card {
      padding: 12px 16px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      background-color: var(--bg-main);
      color: var(--text-main);
    }
    .role-item-card.active-role {
      background: linear-gradient(135deg, var(--brand-primary) 0%, #2f2070 100%);
      color: white;
      border-color: var(--brand-primary);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
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
  `]
})
export class RolesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api';

  roles: any[] = [];
  groups: any[] = [];
  matrixRows: PermissionMatrixRow[] = [];

  selectedRole: any = null;
  showRoleModal = false;
  roleFormModel: any = {};

  ngOnInit() {
    this.loadRoles();
    this.loadPermissionGroups();
  }

  loadRoles() {
    this.http.get<any[]>(`${this.apiBase}/roles`).subscribe({
      next: (res) => {
        this.roles = res;
        if (res.length > 0 && !this.selectedRole) {
          this.selectRole(res[0]);
        }
      },
      error: (err) => console.error('Failed to load roles', err)
    });
  }

  loadPermissionGroups() {
    this.http.get<any[]>(`${this.apiBase}/permissions/groups`).subscribe({
      next: (res) => this.groups = res,
      error: (err) => console.error('Failed to load permission groups', err)
    });
  }

  selectRole(role: any) {
    this.selectedRole = role;
    this.matrixRows = [];

    // Load active mapped permissions
    this.http.get<any[]>(`${this.apiBase}/roles/${role.roleId}/permissions`).subscribe({
      next: (activePerms) => {
        const activeMap = new Map<string, any>();
        for (const ap of activePerms) {
          activeMap.set(ap.permission?.permissionCode, ap);
        }

        // Build flat matrix
        const rows: PermissionMatrixRow[] = [];
        for (const g of this.groups) {
          for (const p of g.permissions || []) {
            const mapped = activeMap.get(p.permissionCode);
            rows.push({
              permissionId: p.permissionId,
              permissionCode: p.permissionCode,
              permissionName: p.permissionName,
              groupName: g.groupName,
              canView: mapped ? mapped.canView : false,
              canCreate: mapped ? mapped.canCreate : false,
              canEdit: mapped ? mapped.canEdit : false,
              canDelete: mapped ? mapped.canDelete : false,
              canApprove: mapped ? mapped.canApprove : false,
              canExport: mapped ? mapped.canExport : false,
            });
          }
        }
        this.matrixRows = rows;
      },
      error: (err) => console.error('Failed to load role permissions mapping', err)
    });
  }

  getRowsForGroup(groupName: string): PermissionMatrixRow[] {
    return this.matrixRows.filter((r) => r.groupName === groupName);
  }

  openRoleModal() {
    this.roleFormModel = {
      roleCode: '',
      roleName: '',
      description: ''
    };
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
  }

  saveRole() {
    this.http.post(`${this.apiBase}/roles`, this.roleFormModel).subscribe({
      next: () => {
        this.loadRoles();
        this.closeRoleModal();
      },
      error: (err) => console.error('Failed to create role', err)
    });
  }

  savePermissions() {
    if (!this.selectedRole) return;
    const payload = {
      permissions: this.matrixRows.map((r) => ({
        permissionId: r.permissionId,
        canView: r.canView,
        canCreate: r.canCreate,
        canEdit: r.canEdit,
        canDelete: r.canDelete,
        canApprove: r.canApprove,
        canExport: r.canExport
      }))
    };

    this.http.post(`${this.apiBase}/roles/${this.selectedRole.roleId}/permissions`, payload).subscribe({
      next: () => {
        // Simple success alert
        customConfirm('Security matrix saved successfully.', 'Matrix Synced');
      },
      error: (err) => console.error('Failed to save permissions matrix', err)
    });
  }
}
