import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-followups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Follow-ups & Notifications</h1>
        <p>Track system alerts, assignment events, and scheduled lead interactions</p>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">notifications_active</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Active Reminders</span>
          <span class="metric-value">{{ reminders.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-red">
          <span class="material-icons-outlined">priority_high</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">High Priority Alerts</span>
          <span class="metric-value">{{ getHighPriorityCount() }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">today</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Actions Due Today</span>
          <span class="metric-value">{{ getDueTodayCount() }}</span>
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
            placeholder="Search by subject, description, lead or agent..." 
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="priorityFilter">
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <!-- Reminders Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 30%;">Notification / Subject</th>
              <th style="width: 35%;">Message</th>
              <th style="width: 20%;">Relations</th>
              <th style="width: 10%;">Scheduled Date</th>
              <th style="width: 5%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reminder of getFilteredReminders(); let i = index">
              <td>
                <div class="contact-info flex align-center gap-3">
                  <span class="row-index">{{ i + 1 }}</span>
                  <div class="reminder-icon-circle" [ngClass]="getPriorityClass(reminder.priority)">
                    <span class="material-icons-outlined" style="font-size: 18px;">
                      {{ reminder.priority === 'High' ? 'notifications_active' : 'notifications' }}
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <span class="lead-name font-bold">{{ reminder.subject }}</span>
                    <span class="badge mt-1" [ngClass]="getReminderBadgeClass(reminder.priority)">{{ reminder.priority }} Priority</span>
                  </div>
                </div>
              </td>
              <td class="text-secondary font-sm" style="line-height: 1.4;">{{ reminder.reminderMessage }}</td>
              <td>
                <div class="flex flex-col gap-1">
                  <span class="font-sm" *ngIf="reminder.lead">
                    👤 Lead: <strong>{{ reminder.lead.fullName }}</strong>
                  </span>
                  <span class="font-sm" *ngIf="reminder.assignedTo">
                    💼 Agent: <strong>{{ reminder.assignedTo.fullName }}</strong>
                  </span>
                </div>
              </td>
              <td class="text-secondary font-xs font-bold">{{ reminder.reminderDatetime | date:'medium' }}</td>
              <td class="text-right">
                <button 
                  class="btn btn-secondary btn-xs flex align-center gap-1 btn-success-hover"
                  (click)="completeReminder(reminder.id)"
                >
                  <span class="material-icons-outlined font-sm">check_circle</span> Complete
                </button>
              </td>
            </tr>
            <tr *ngIf="getFilteredReminders().length === 0">
              <td colspan="5" class="text-center py-8 text-secondary">
                <div class="empty-state">
                  <span class="material-icons-outlined empty-icon text-secondary" style="font-size: 36px;">done_all</span>
                  <h3 class="mt-2">All caught up!</h3>
                  <p class="font-sm">No pending follow-ups or alerts matching the criteria.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .reminder-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-round);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .reminder-icon-circle.priority-high {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--color-high);
    }

    .reminder-icon-circle.priority-medium {
      background-color: rgba(234, 179, 8, 0.1);
      color: var(--color-medium);
    }

    .reminder-icon-circle.priority-low {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--color-new);
    }

    .btn-success-hover:hover {
      background-color: rgba(16, 185, 129, 0.1);
      border-color: var(--color-qualified);
      color: var(--color-qualified);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon {
      color: var(--color-qualified) !important;
    }
  `]
})
export class FollowupsComponent implements OnInit {
  private crmService = inject(CrmService);

  reminders: any[] = [];
  searchQuery = '';
  priorityFilter = 'all';

  ngOnInit() {
    this.loadReminders();
  }

  loadReminders() {
    this.crmService.getReminders().subscribe({
      next: (data) => {
        this.reminders = data;
      },
      error: (err) => {
        console.error('Failed to load reminders:', err);
      }
    });
  }

  getFilteredReminders() {
    return this.reminders.filter(rem => {
      const query = this.searchQuery.toLowerCase();
      const matchesSearch = 
        rem.subject.toLowerCase().includes(query) ||
        (rem.reminderMessage && rem.reminderMessage.toLowerCase().includes(query)) ||
        (rem.lead && rem.lead.fullName.toLowerCase().includes(query)) ||
        (rem.assignedTo && rem.assignedTo.fullName.toLowerCase().includes(query));

      if (this.priorityFilter !== 'all') {
        return matchesSearch && rem.priority === this.priorityFilter;
      }
      return matchesSearch;
    });
  }

  getHighPriorityCount(): number {
    return this.reminders.filter(r => r.priority === 'High').length;
  }

  getDueTodayCount(): number {
    const todayStr = new Date().toDateString();
    return this.reminders.filter(r => {
      if (!r.reminderDatetime) return false;
      return new Date(r.reminderDatetime).toDateString() === todayStr;
    }).length;
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  getReminderBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
  }

  completeReminder(id: number) {
    this.crmService.completeReminder(id).subscribe({
      next: () => {
        this.loadReminders();
      },
      error: (err) => {
        console.error('Failed to complete reminder:', err);
      }
    });
  }
}
