import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-log-interaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Log Lead Interaction</h1>
        <p>Log calls, meetings, or WhatsApp discussions and schedule follow-ups</p>
      </div>
    </header>

    <!-- Success / Error Banner -->
    <div class="alert alert-success flex align-center gap-3 margin-y-3" *ngIf="successMessage">
      <span class="material-icons-outlined">check_circle</span>
      <div>{{ successMessage }}</div>
    </div>
    <div class="alert alert-danger flex align-center gap-3 margin-y-3" *ngIf="errorMessage">
      <span class="material-icons-outlined">error_outline</span>
      <div>{{ errorMessage }}</div>
    </div>

    <!-- Side by Side Layout Grid -->
    <div class="log-workspace-grid">
      
      <!-- Left Column: Log Form -->
      <div class="form-column card">
        <h3 class="section-title">New Interaction Log</h3>
        
        <form (submit)="onSubmit($event)" class="interaction-form">
          <!-- Searchable Lead Autocomplete -->
          <div class="form-group flex flex-col relative">
            <label>Select Lead *</label>
            
            <!-- When NO lead is selected yet -->
            <div class="autocomplete-wrapper" *ngIf="!selectedLead">
              <span class="material-icons-outlined search-icon">search</span>
              <input 
                type="text" 
                placeholder="Search lead by name, phone or code..." 
                [(ngModel)]="leadSearchQuery" 
                (ngModelChange)="onSearchQueryChange()"
                name="leadSearch"
                autocomplete="off"
                (focus)="showSuggestions = true"
              />
              
              <!-- Suggestions list -->
              <ul class="suggestions-list border bg-card" *ngIf="showSuggestions && filteredLeads.length > 0">
                <li 
                  *ngFor="let l of filteredLeads" 
                  (click)="selectLead(l)"
                  class="suggestion-item flex align-center justify-between"
                >
                  <div class="flex flex-col">
                    <span class="font-bold font-sm">{{ l.fullName }}</span>
                    <span class="text-secondary font-xs">{{ l.primaryPhone }}</span>
                  </div>
                  <span class="badge badge-new font-xs">{{ l.leadCode }}</span>
                </li>
              </ul>
              
              <div *ngIf="showSuggestions && leadSearchQuery && filteredLeads.length === 0" class="no-suggestions border bg-card font-xs text-secondary italic p-2">
                No leads found matching "{{ leadSearchQuery }}"
              </div>
            </div>

            <!-- When a lead is selected -->
            <div class="selected-lead-card flex align-center justify-between p-3 border bg-main" *ngIf="selectedLead">
              <div class="flex align-center gap-3">
                <div class="table-avatar">{{ getInitials(selectedLead.fullName) }}</div>
                <div class="flex flex-col">
                  <span class="font-bold text-main">{{ selectedLead.fullName }}</span>
                  <span class="text-secondary font-xs">{{ selectedLead.primaryPhone }} • {{ selectedLead.leadCode }}</span>
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-xs" (click)="clearSelectedLead()">Change</button>
            </div>
          </div>

          <div class="form-row flex gap-3">
            <!-- Event Type -->
            <div class="form-group flex-1 flex flex-col">
              <label>Interaction Type *</label>
              <select [(ngModel)]="newActivity.activityType" name="activityType" required>
                <option value="Call">Phone Call</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS text</option>
                <option value="WhatsApp">WhatsApp log</option>
                <option value="Meeting">In-Person Meeting</option>
              </select>
            </div>

            <!-- Subject -->
            <div class="form-group flex-2 flex flex-col">
              <label>Subject *</label>
              <input 
                type="text" 
                placeholder="e.g. Discussed pricing details" 
                [(ngModel)]="newActivity.subject" 
                name="subject" 
                required 
              />
            </div>
          </div>

          <!-- Description / Remarks -->
          <div class="form-group flex flex-col">
            <label>Discussion Details & Notes *</label>
            <textarea 
              placeholder="Write what was discussed, customer preferences, or action items..." 
              [(ngModel)]="newActivity.description" 
              name="description" 
              rows="5"
              required
            ></textarea>
          </div>

          <!-- Follow-up Scheduling -->
          <div class="followup-box border p-3 bg-main">
            <div class="flex align-center gap-2">
              <input 
                type="checkbox" 
                id="scheduleFollowup" 
                [(ngModel)]="scheduleFollowup" 
                name="scheduleFollowup" 
              />
              <label for="scheduleFollowup" class="cursor-pointer font-bold font-sm">Schedule next follow-up action</label>
            </div>
            
            <div class="form-group flex flex-col mt-3" *ngIf="scheduleFollowup">
              <label>Follow-up Date & Time *</label>
              <input 
                type="datetime-local" 
                [(ngModel)]="newActivity.nextActionDate" 
                name="nextActionDate" 
                required 
              />
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              class="btn btn-secondary" 
              (click)="resetForm()"
            >
              Reset
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              [disabled]="!selectedLead || !newActivity.subject || !newActivity.description || (scheduleFollowup && !newActivity.nextActionDate)"
            >
              Log Interaction
            </button>
          </div>
        </form>
      </div>

      <!-- Right Column: Recent Activity Logs -->
      <div class="timeline-column card">
        <div class="flex justify-between align-center mb-3">
          <h3 class="section-title" style="margin-bottom: 0;">Recent Logs</h3>
          <button class="btn btn-secondary btn-xs" (click)="loadRecentLogs()">
            <span class="material-icons-outlined font-sm">refresh</span>
          </button>
        </div>
        
        <div class="timeline-list">
          <div class="timeline-item" *ngFor="let log of recentLogs">
            <div class="timeline-badge-circle" [ngClass]="getActivityIconClass(log.activityType)">
              <span class="material-icons-outlined" style="font-size: 16px;">
                {{ getActivityIcon(log.activityType) }}
              </span>
            </div>
            
            <div class="timeline-content">
              <div class="flex justify-between align-start">
                <span class="font-bold text-main font-sm">{{ log.subject }}</span>
                <span class="timeline-time">{{ log.activityDate | date:'shortTime' }}</span>
              </div>
              <span class="timeline-lead font-xs">
                👤 Lead: <strong>{{ log.lead?.fullName }}</strong>
              </span>
              <p class="timeline-desc">{{ log.description }}</p>
              <span class="badge badge-low mt-1" *ngIf="log.nextActionDate" style="font-size: 9px;">
                📅 Follow-up: {{ log.nextActionDate | date:'short' }}
              </span>
            </div>
          </div>
          
          <div *ngIf="recentLogs.length === 0" class="text-center py-6 text-secondary font-sm italic">
            No recent interactions logged yet.
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .log-workspace-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 24px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }
    
    .interaction-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .autocomplete-wrapper {
      position: relative;
    }
    
    .autocomplete-wrapper .search-icon {
      position: absolute;
      left: 12px;
      top: 10px;
      color: var(--text-muted);
      font-size: 20px;
    }
    
    .autocomplete-wrapper input {
      padding: 10px 14px 10px 40px;
      width: 100%;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      outline: none;
      transition: var(--transition-fast);
      background-color: var(--bg-main);
    }

    .autocomplete-wrapper input:focus {
      border-color: var(--brand-primary);
      background-color: white;
    }
    
    .suggestions-list {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 100%;
      max-height: 220px;
      overflow-y: auto;
      z-index: 200;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      list-style: none;
      padding: 4px 0;
    }
    
    .suggestion-item {
      padding: 8px 14px;
      cursor: pointer;
      transition: var(--transition-fast);
    }
    
    .suggestion-item:hover {
      background-color: var(--brand-primary-light);
    }
    
    .selected-lead-card {
      border-radius: var(--radius-md);
    }
    
    .followup-box {
      border-radius: var(--radius-md);
    }
    
    .cursor-pointer {
      cursor: pointer;
    }

    /* Timeline styling */
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      padding-left: 8px;
    }

    .timeline-item {
      display: flex;
      gap: 14px;
      position: relative;
    }

    .timeline-badge-circle {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-round);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 10;
    }

    .timeline-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }

    .timeline-item:last-child .timeline-content {
      border-bottom: none;
    }

    .timeline-time {
      font-size: 11px;
      color: var(--text-muted);
    }

    .timeline-lead {
      color: var(--text-secondary);
    }

    .timeline-desc {
      font-size: 12.5px;
      color: var(--text-main);
      line-height: 1.4;
      white-space: pre-wrap;
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
  `]
})
export class LogInteractionComponent implements OnInit {
  private crmService = inject(CrmService);

  allLeads: any[] = [];
  filteredLeads: any[] = [];
  recentLogs: any[] = [];

  leadSearchQuery = '';
  showSuggestions = false;
  selectedLead: any = null;

  scheduleFollowup = false;
  successMessage = '';
  errorMessage = '';

  newActivity = {
    activityType: 'Call',
    subject: '',
    description: '',
    nextActionDate: ''
  };

  ngOnInit() {
    this.loadLeads();
    this.loadRecentLogs();
  }

  loadLeads() {
    // Load leads list for autocomplete filter search
    this.crmService.getLeads({ limit: 1000 }).subscribe({
      next: (res) => {
        this.allLeads = res.data;
        this.filteredLeads = res.data;
      },
      error: (err) => console.error('Failed to load leads list:', err)
    });
  }

  loadRecentLogs() {
    // Get last 5 activity timeline logs across leads
    this.crmService.getAllActivities({}).subscribe({
      next: (res) => {
        this.recentLogs = res.data.slice(0, 5);
      },
      error: (err) => console.error('Failed to load recent activity timeline:', err)
    });
  }

  onSearchQueryChange() {
    this.showSuggestions = true;
    const query = this.leadSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredLeads = this.allLeads;
    } else {
      this.filteredLeads = this.allLeads.filter(l => 
        l.fullName.toLowerCase().includes(query) ||
        l.primaryPhone.toLowerCase().includes(query) ||
        l.leadCode.toLowerCase().includes(query)
      );
    }
  }

  selectLead(lead: any) {
    this.selectedLead = lead;
    this.leadSearchQuery = '';
    this.showSuggestions = false;
  }

  clearSelectedLead() {
    this.selectedLead = null;
    this.filteredLeads = this.allLeads;
    this.showSuggestions = false;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.selectedLead) return;

    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      activityType: this.newActivity.activityType,
      subject: this.newActivity.subject,
      description: this.newActivity.description,
      performedBy: 1,
      outcome: this.newActivity.subject,
      nextActionDate: this.scheduleFollowup ? this.newActivity.nextActionDate : undefined
    };

    this.crmService.addActivity(this.selectedLead.id, payload).subscribe({
      next: () => {
        this.successMessage = `Successfully logged interaction for ${this.selectedLead.fullName}!`;
        this.resetForm();
        this.loadRecentLogs();
        // Hide success banner after 4 seconds
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        console.error('Failed to log interaction:', err);
        this.errorMessage = 'An error occurred while logging the interaction. Please try again.';
      }
    });
  }

  resetForm() {
    this.newActivity = {
      activityType: 'Call',
      subject: '',
      description: '',
      nextActionDate: ''
    };
    this.scheduleFollowup = false;
    this.selectedLead = null;
    this.leadSearchQuery = '';
    this.showSuggestions = false;
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
