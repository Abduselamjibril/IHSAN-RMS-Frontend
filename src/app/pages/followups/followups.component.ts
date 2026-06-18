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
      <div class="app-header-actions">
        <button class="btn btn-secondary flex align-center gap-1" (click)="triggerEscalationsCheck()" [disabled]="isEscalating">
          <span class="material-icons-outlined font-sm" [class.spin-animation]="isEscalating">warning_amber</span>
          {{ isEscalating ? 'Checking...' : 'Check Escalations' }}
        </button>
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
          <span class="metric-label">Overdue / Escalated</span>
          <span class="metric-value">{{ getEscalatedCount() }}</span>
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
          <select [(ngModel)]="statusFilter">
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Snoozed">Snoozed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      <!-- Reminders Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">Notification / Subject</th>
              <th style="width: 30%;">Message</th>
              <th style="width: 15%;">Relations</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 12%;">Scheduled Date</th>
              <th style="width: 8%;" class="text-right">Actions</th>
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
                  <span class="font-xs" *ngIf="reminder.lead">
                    👤 Lead: <strong>{{ reminder.lead.fullName }}</strong>
                  </span>
                  <span class="font-xs" *ngIf="reminder.assignedTo">
                    💼 Agent: <strong>{{ reminder.assignedTo.fullName }}</strong>
                  </span>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="getStatusBadgeClass(reminder.status)">
                  {{ reminder.status || 'Pending' }}
                </span>
              </td>
              <td class="text-secondary font-xs font-bold" [style.color]="isOverdue(reminder) ? 'var(--color-high)' : ''">
                {{ reminder.reminderDatetime | date:'medium' }}
                <div class="text-red font-xxs font-semibold mt-1" *ngIf="isOverdue(reminder) && !reminder.isCompleted">
                  ⚠️ OVERDUE
                </div>
              </td>
              <td class="text-right">
                <div class="flex gap-1 justify-end">
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1 btn-success-hover"
                    (click)="completeReminder(reminder.id)"
                    title="Mark as Done"
                  >
                    <span class="material-icons-outlined font-xs">check_circle</span>
                  </button>
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="openSnoozeModal(reminder)"
                    title="Snooze Reminder"
                  >
                    <span class="material-icons-outlined font-xs">snooze</span>
                  </button>
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="openRescheduleModal(reminder)"
                    title="Reschedule Reminder"
                  >
                    <span class="material-icons-outlined font-xs">today</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="getFilteredReminders().length === 0">
              <td colspan="6" class="text-center py-8 text-secondary">
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

    <!-- Snooze Reminder Modal -->
    <div class="modal-overlay" *ngIf="showSnoozeModal" (click)="closeSnoozeModal()">
      <div class="modal-container picker-modal" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Snooze Reminder</h2>
          <button class="header-icon-btn close-btn" (click)="closeSnoozeModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body flex flex-col gap-3">
          <p class="font-sm text-secondary">Snooze the reminder: "<strong>{{ selectedReminder?.subject }}</strong>"</p>
          <div class="flex gap-2 justify-stretch">
            <button class="btn btn-secondary flex-1" (click)="snooze(30)">30 Min</button>
            <button class="btn btn-secondary flex-1" (click)="snooze(60)">1 Hour</button>
            <button class="btn btn-secondary flex-1" (click)="snooze(1440)">1 Day</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reschedule Reminder Modal -->
    <div class="modal-overlay" *ngIf="showRescheduleModal" (click)="closeRescheduleModal()">
      <div class="modal-container picker-modal" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Reschedule Reminder</h2>
          <button class="header-icon-btn close-btn" (click)="closeRescheduleModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body flex flex-col gap-3">
          <p class="font-sm text-secondary">Reschedule: "<strong>{{ selectedReminder?.subject }}</strong>"</p>
          <div class="form-group flex flex-col">
            <label>New Date & Time *</label>
            <input type="datetime-local" [(ngModel)]="rescheduleDatetime" class="datetime-input" />
          </div>
          <div class="flex justify-end gap-2 mt-2">
            <button class="btn btn-secondary" (click)="closeRescheduleModal()">Cancel</button>
            <button class="btn btn-primary" (click)="reschedule()" [disabled]="!rescheduleDatetime">Save Date</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Escalation Result Modal Overlay -->
    <div class="modal-overlay" *ngIf="showEscalationModal" (click)="closeEscalationModal()">
      <div class="modal-container picker-modal" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Escalation Check Result</h2>
          <button class="header-icon-btn close-btn" (click)="closeEscalationModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body flex flex-col align-center gap-4 py-6 text-center" style="display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem 0; text-align: center;">
          <div class="reminder-icon-circle priority-high" style="width: 64px; height: 64px; background-color: rgba(239, 68, 68, 0.1); color: var(--color-high); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons-outlined" style="font-size: 36px;">warning_amber</span>
          </div>
          <div>
            <h3 class="font-bold text-main" style="font-size: 1.1rem; margin-bottom: 6px; font-weight: 700; color: #0f172a;">Check Completed</h3>
            <p class="font-sm text-secondary" style="line-height: 1.5; color: #475569; font-size: 0.875rem;">
              Checked all overdue follow-ups on the server.<br/>
              <strong>{{ escalatedRemindersCount }}</strong> reminders were automatically escalated to manager alerts.
            </p>
          </div>
          <div class="flex justify-center mt-2 w-full" style="display: flex; justify-content: center; width: 100%;">
            <button class="btn btn-primary" (click)="closeEscalationModal()" style="min-width: 120px; background: #5b46b8; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">Got it</button>
          </div>
        </div>
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

    .picker-modal {
      width: 400px;
    }

    .datetime-input {
      padding: 10px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 13px;
      outline: none;
    }

    .datetime-input:focus {
      border-color: var(--brand-primary);
    }

    .font-xxs {
      font-size: 9px;
    }

    .badge-snoozed {
      background-color: rgba(234, 179, 8, 0.08);
      color: var(--color-medium);
      border: 1px solid rgba(234, 179, 8, 0.15);
    }

    .badge-rescheduled {
      background-color: rgba(168, 85, 247, 0.08);
      color: #a855f7;
      border: 1px solid rgba(168, 85, 247, 0.15);
    }

    .badge-escalated {
      background-color: rgba(239, 68, 68, 0.08);
      color: var(--color-high);
      border: 1px solid rgba(239, 68, 68, 0.15);
    }

    .spin-animation {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class FollowupsComponent implements OnInit {
  private crmService = inject(CrmService);

  reminders: any[] = [];
  searchQuery = '';
  priorityFilter = 'all';
  statusFilter = 'all';

  isEscalating = false;

  // Modals
  showSnoozeModal = false;
  showRescheduleModal = false;
  showEscalationModal = false;
  escalatedRemindersCount = 0;
  selectedReminder: any = null;
  rescheduleDatetime = '';

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

      const matchesPriority = this.priorityFilter === 'all' || rem.priority === this.priorityFilter;
      
      const remStatus = rem.status || 'Pending';
      const matchesStatus = this.statusFilter === 'all' || remStatus === this.statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }

  getEscalatedCount(): number {
    return this.reminders.filter(r => r.status === 'Escalated').length;
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Snoozed': return 'badge-snoozed';
      case 'Rescheduled': return 'badge-rescheduled';
      case 'Escalated': return 'badge-escalated';
      default: return 'badge-contacted';
    }
  }

  isOverdue(reminder: any): boolean {
    if (!reminder.reminderDatetime) return false;
    return new Date(reminder.reminderDatetime).getTime() < new Date().getTime();
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

  openSnoozeModal(reminder: any) {
    this.selectedReminder = reminder;
    this.showSnoozeModal = true;
  }

  closeSnoozeModal() {
    this.showSnoozeModal = false;
    this.selectedReminder = null;
  }

  snooze(minutes: number) {
    if (!this.selectedReminder) return;
    this.crmService.snoozeReminder(this.selectedReminder.id, minutes).subscribe({
      next: () => {
        this.closeSnoozeModal();
        this.loadReminders();
      },
      error: (err) => console.error('Failed to snooze reminder:', err)
    });
  }

  openRescheduleModal(reminder: any) {
    this.selectedReminder = reminder;
    this.rescheduleDatetime = '';
    this.showRescheduleModal = true;
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.selectedReminder = null;
  }

  reschedule() {
    if (!this.selectedReminder || !this.rescheduleDatetime) return;
    this.crmService.rescheduleReminder(this.selectedReminder.id, this.rescheduleDatetime).subscribe({
      next: () => {
        this.closeRescheduleModal();
        this.loadReminders();
      },
      error: (err) => console.error('Failed to reschedule reminder:', err)
    });
  }

  closeEscalationModal() {
    this.showEscalationModal = false;
  }

  triggerEscalationsCheck() {
    this.isEscalating = true;
    this.crmService.triggerEscalationsCheck().subscribe({
      next: (res) => {
        this.isEscalating = false;
        this.escalatedRemindersCount = res.escalatedCount || 0;
        this.showEscalationModal = true;
        this.loadReminders();
      },
      error: (err) => {
        this.isEscalating = false;
        console.error('Failed to trigger escalations check:', err);
      }
    });
  }
}
