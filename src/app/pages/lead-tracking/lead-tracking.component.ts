import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-lead-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Lead Tracking Workspace</h1>
        <p>Monitor all status transitions, agent assignments, calls, and emails across all leads</p>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">analytics</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Logs</span>
          <span class="metric-value">{{ activities.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">bolt</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Logged Today</span>
          <span class="metric-value">{{ getActivitiesTodayCount() }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-yellow">
          <span class="material-icons-outlined">pending_actions</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">System Transitions</span>
          <span class="metric-value">{{ getSystemTransitionsCount() }}</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace Area -->
    <div class="agents-workspace card">
      
      <!-- Filter and Search Bar -->
      <div class="filter-bar flex justify-between align-center gap-4">
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by subject, description or lead..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="filters.activityType" (change)="loadActivities()">
            <option value="all">All Event Types</option>
            <option value="Call">Call Logs</option>
            <option value="Email">Emails</option>
            <option value="SMS">SMS texts</option>
            <option value="WhatsApp">WhatsApp logs</option>
            <option value="Meeting">Meetings</option>
            <option value="StatusChange">Status Changes</option>
            <option value="Assignment">Assignments</option>
            <option value="System">System logs</option>
          </select>

          <select [(ngModel)]="filters.leadId" (change)="loadActivities()">
            <option [value]="0">All Leads</option>
            <option *ngFor="let lead of uniqueLeads" [value]="lead.id">{{ lead.fullName }}</option>
          </select>
        </div>
      </div>

      <!-- Activities Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">Lead</th>
              <th style="width: 15%;">Event Type</th>
              <th style="width: 35%;">Action Details</th>
              <th style="width: 15%;">Date & Time</th>
              <th style="width: 10%;">Next Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let act of activities; let i = index">
              <td>
                <div class="contact-info flex align-center gap-3">
                  <span class="row-index">{{ i + 1 }}</span>
                  <div class="table-avatar">{{ getInitials(act.lead?.fullName) }}</div>
                  <div class="flex flex-col">
                    <span class="lead-name font-bold">{{ act.lead?.fullName || 'Unknown' }}</span>
                    <span class="lead-phone text-muted font-xs">{{ act.lead?.leadCode }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex align-center gap-2">
                  <div class="activity-badge-circle" [ngClass]="getActivityIconClass(act.activityType)">
                    <span class="material-icons-outlined" style="font-size: 16px;">
                      {{ getActivityIcon(act.activityType) }}
                    </span>
                  </div>
                  <span class="font-sm font-bold text-secondary">{{ act.activityType }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col gap-1" style="max-width: 320px; line-height: 1.4;">
                  <span class="font-bold text-main font-sm">{{ act.subject }}</span>
                  <span class="text-secondary font-xs text-ellipsis" [title]="act.description">{{ act.description }}</span>
                </div>
              </td>
              <td class="text-secondary font-sm">
                {{ act.activityDate | date:'medium' }}
              </td>
              <td>
                <span *ngIf="act.nextActionDate" class="badge badge-low" style="font-size: 10px; font-weight: 700;">
                  📅 {{ act.nextActionDate | date:'shortDate' }}
                </span>
                <span *ngIf="!act.nextActionDate" class="text-muted font-xs">-</span>
              </td>
            </tr>
            <tr *ngIf="activities.length === 0">
              <td colspan="5" class="text-center py-8 text-secondary">
                <div class="empty-state">
                  <span class="material-icons-outlined text-secondary" style="font-size: 36px;">history_toggle_off</span>
                  <h3 class="mt-2">No logs found</h3>
                  <p class="font-sm text-secondary">There are no lead activity logs matching your filters.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .activity-badge-circle {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-round);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .bg-call {
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
    
    .bg-email {
      background-color: rgba(168, 85, 247, 0.1);
      color: #a855f7;
    }
    
    .bg-meeting {
      background-color: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    
    .bg-system {
      background-color: rgba(148, 163, 184, 0.12);
      color: #64748b;
    }

    .text-ellipsis {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class LeadTrackingComponent implements OnInit {
  private crmService = inject(CrmService);

  activities: any[] = [];
  uniqueLeads: any[] = [];
  filters = {
    search: '',
    leadId: 0,
    activityType: 'all'
  };

  searchTimeout: any;

  ngOnInit() {
    this.loadActivities();
    this.loadDropdownLeads();
  }

  loadActivities() {
    this.crmService.getAllActivities(this.filters).subscribe({
      next: (res) => {
        this.activities = res.data;
      },
      error: (err) => console.error('Error fetching lead activities:', err)
    });
  }

  loadDropdownLeads() {
    this.crmService.getAllActivities({}).subscribe({
      next: (res) => {
        const leadMap = new Map();
        res.data.forEach((act: any) => {
          if (act.lead && !leadMap.has(act.lead.id)) {
            leadMap.set(act.lead.id, act.lead);
          }
        });
        this.uniqueLeads = Array.from(leadMap.values());
      },
      error: (err) => console.error('Error populating leads filter:', err)
    });
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadActivities();
    }, 400);
  }

  getActivitiesTodayCount(): number {
    const todayStr = new Date().toDateString();
    return this.activities.filter(act => {
      if (!act.activityDate) return false;
      return new Date(act.activityDate).toDateString() === todayStr;
    }).length;
  }

  getSystemTransitionsCount(): number {
    return this.activities.filter(act => 
      act.activityType === 'StatusChange' || 
      act.activityType === 'Assignment' || 
      act.activityType === 'System'
    ).length;
  }

  getInitials(name: string): string {
    if (!name) return 'LD';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'Call': return 'phone_in_talk';
      case 'Email': return 'email';
      case 'SMS': return 'textsms';
      case 'WhatsApp': return 'chat';
      case 'Meeting': return 'groups';
      case 'System': return 'info';
      case 'StatusChange': return 'swap_horiz';
      case 'Assignment': return 'assignment_ind';
      default: return 'info';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'Call': return 'bg-call';
      case 'Email': return 'bg-email';
      case 'Meeting': return 'bg-meeting';
      default: return 'bg-system';
    }
  }
}
