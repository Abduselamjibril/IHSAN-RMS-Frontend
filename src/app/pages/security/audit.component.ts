import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../config';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Security Audit Logs</h1>
        <p>Monitor user transactions, inspect database mutations, and track login session history</p>
      </div>
    </header>

    <!-- Tab navigation -->
    <div class="flex gap-4 border-bottom pb-2 margin-b-6">
      <button class="btn" [class.btn-primary]="activeTab === 'audit'" [class.btn-secondary]="activeTab !== 'audit'" (click)="setTab('audit')">
        User Activity Trail
      </button>
      <button class="btn" [class.btn-primary]="activeTab === 'login'" [class.btn-secondary]="activeTab !== 'login'" (click)="setTab('login')">
        Login Session Logs
      </button>
    </div>

    <!-- Tab 1: User Activity Trail -->
    <div *ngIf="activeTab === 'audit'" class="card p-6">
      <h3 class="margin-b-4">Transaction History Logs</h3>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 20%;">User</th>
              <th style="width: 15%;">Module</th>
              <th style="width: 15%;">Entity Scope</th>
              <th style="width: 15%;">Action</th>
              <th style="width: 15%;">Timestamp</th>
              <th style="width: 10%;">IP Address</th>
              <th style="width: 10%;" class="text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of auditLogs">
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main" style="font-size: 13px;">
                    {{ log.user?.firstName }} {{ log.user?.lastName }}
                  </span>
                  <span class="text-xs text-secondary font-mono">{{ log.user?.username }}</span>
                </div>
              </td>
              <td>
                <span class="type-pill" style="font-size: 10px; padding: 2px 6px;">{{ log.moduleName }}</span>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main" style="font-size: 13px;">{{ log.entityName }}</span>
                  <span class="text-xs text-secondary">ID: {{ log.entityId }}</span>
                </div>
              </td>
              <td>
                <span 
                  class="badge" 
                  [class.badge-qualified]="log.actionTypeId === 'CREATE' || log.actionTypeId === 'APPROVE'"
                  [class.badge-high]="log.actionTypeId === 'DELETE' || log.actionTypeId === 'REJECT'"
                  [class.badge-lost]="log.actionTypeId === 'UPDATE'"
                  style="text-transform: uppercase;"
                >
                  {{ log.actionTypeId }}
                </span>
              </td>
              <td>
                <span class="text-xs text-main">{{ log.activityDate | date:'medium' }}</span>
              </td>
              <td>
                <span class="font-mono text-xs text-secondary">{{ log.ipAddress }}</span>
              </td>
              <td class="text-right">
                <button 
                  class="icon-btn text-indigo" 
                  [disabled]="!log.details?.length" 
                  (click)="viewDetails(log)"
                  title="View Modifications"
                >
                  <span class="material-icons-outlined font-sm">analytics</span>
                </button>
              </td>
            </tr>
            <tr *ngIf="!auditLogs.length">
              <td colspan="7" class="text-center text-secondary py-8">
                No activity logs recorded.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Login Session Logs -->
    <div *ngIf="activeTab === 'login'" class="card p-6">
      <h3 class="margin-b-4">Login Attempt Session History</h3>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">User Credentials</th>
              <th style="width: 20%;">Login Timestamp</th>
              <th style="width: 20%;">Client IP Address</th>
              <th style="width: 20%;">Device OS / Browser</th>
              <th style="width: 15%;" class="text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of loginHistory">
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main" style="font-size: 13px;">{{ log.username }}</span>
                  <span class="text-xs text-secondary" *ngIf="log.user">
                    {{ log.user.firstName }} {{ log.user.lastName }}
                  </span>
                </div>
              </td>
              <td>
                <span class="text-xs text-main">{{ log.loginDate | date:'medium' }}</span>
              </td>
              <td>
                <span class="font-mono text-xs text-secondary">{{ log.ipAddress || '127.0.0.1' }}</span>
              </td>
              <td>
                <span class="text-xs text-main">{{ log.deviceName }}</span>
              </td>
              <td class="text-right">
                <span 
                  class="badge" 
                  [class.badge-qualified]="log.loginResultId === 'SUCCESS'"
                  [class.badge-lost]="log.loginResultId === 'FAILED'"
                  [class.badge-high]="log.loginResultId === 'LOCKED'"
                  style="text-transform: uppercase;"
                >
                  {{ log.loginResultId }}
                </span>
              </td>
            </tr>
            <tr *ngIf="!loginHistory.length">
              <td colspan="5" class="text-center text-secondary py-8">
                No login history records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Field modifications details dialog -->
    <div class="modal-overlay" *ngIf="selectedLog">
      <div class="modal-container card" style="max-width: 500px; width: 90%;">
        <div class="modal-header">
          <h2>Field Modifications Details</h2>
          <button class="close-btn" (click)="closeDetails()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body flex flex-col gap-4">
          <p class="text-secondary text-sm">
            Mutations recorded for entity <strong>{{ selectedLog.entityName }}</strong> (ID: {{ selectedLog.entityId }}) in module <strong>{{ selectedLog.moduleName }}</strong>:
          </p>

          <div class="table-container">
            <table class="leads-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Original Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let det of selectedLog.details">
                  <td><strong class="text-main" style="font-size: 12px;">{{ det.fieldName }}</strong></td>
                  <td><span class="text-secondary text-xs font-mono" style="text-decoration: line-through;">{{ det.oldValue }}</span></td>
                  <td><span class="text-indigo text-xs font-mono font-semibold">{{ det.newValue }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closeDetails()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .type-pill {
      background-color: rgba(124,58,237,0.1);
      color: var(--brand-primary);
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
  `]
})
export class AuditComponent implements OnInit {
  private http = inject(HttpClient);
  private apiBase = environment.apiBase;

  activeTab = 'audit';
  auditLogs: any[] = [];
  loginHistory: any[] = [];

  selectedLog: any = null;

  ngOnInit() {
    this.loadAuditLogs();
    this.loadLoginHistory();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'audit') this.loadAuditLogs();
    if (tab === 'login') this.loadLoginHistory();
  }

  loadAuditLogs() {
    this.http.get<any[]>(`${this.apiBase}/security/audit-logs`).subscribe({
      next: (res) => this.auditLogs = res,
      error: (err) => console.error('Failed to load audit logs', err)
    });
  }

  loadLoginHistory() {
    this.http.get<any[]>(`${this.apiBase}/security/login-history`).subscribe({
      next: (res) => this.loginHistory = res,
      error: (err) => console.error('Failed to load login history logs', err)
    });
  }

  viewDetails(log: any) {
    this.selectedLog = log;
  }

  closeDetails() {
    this.selectedLog = null;
  }
}
