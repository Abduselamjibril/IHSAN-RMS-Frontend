import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-communications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Communications Workspace</h1>
        <p>View, search, and review all internal customer notes and logger entries</p>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">chat_bubble_outline</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Notes Logged</span>
          <span class="metric-value">{{ notes.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">today</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Notes Logged Today</span>
          <span class="metric-value">{{ getNotesTodayCount() }}</span>
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
            placeholder="Search by note content or lead name..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="filters.leadId" (change)="loadNotes()">
            <option [value]="0">All Leads</option>
            <option *ngFor="let lead of uniqueLeads" [value]="lead.id">{{ lead.fullName }}</option>
          </select>
        </div>
      </div>

      <!-- Notes Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">Lead</th>
              <th style="width: 50%;">Internal Note</th>
              <th style="width: 15%;">Logged At</th>
              <th style="width: 10%;">Author</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let n of notes; let i = index">
              <td>
                <div class="contact-info flex align-center gap-3">
                  <span class="row-index">{{ i + 1 }}</span>
                  <div class="table-avatar">{{ getInitials(n.lead?.fullName) }}</div>
                  <div class="flex flex-col">
                    <span class="lead-name font-bold">{{ n.lead?.fullName || 'Unknown' }}</span>
                    <span class="lead-phone text-muted font-xs">{{ n.lead?.leadCode }}</span>
                  </div>
                </div>
              </td>
              <td style="white-space: pre-wrap; line-height: 1.5; color: var(--text-main); font-size: 13.5px; padding-right: 16px;">
                {{ n.note }}
              </td>
              <td class="text-secondary font-sm">
                {{ n.createdAt | date:'medium' }}
              </td>
              <td class="text-secondary font-sm">
                <span class="badge badge-contacted" style="font-size: 10px;">User Logged</span>
              </td>
            </tr>
            <tr *ngIf="notes.length === 0">
              <td colspan="4" class="text-center py-8 text-secondary">
                <div class="empty-state">
                  <span class="material-icons-outlined text-secondary" style="font-size: 36px;">comment_bank</span>
                  <h3 class="mt-2">No notes found</h3>
                  <p class="font-sm text-secondary">There are no internal notes matching your filters.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class CommunicationsComponent implements OnInit {
  private crmService = inject(CrmService);

  notes: any[] = [];
  uniqueLeads: any[] = [];
  filters = {
    search: '',
    leadId: 0
  };

  searchTimeout: any;

  ngOnInit() {
    this.loadNotes();
    this.loadDropdownLeads();
  }

  loadNotes() {
    this.crmService.getAllLeadNotes(this.filters).subscribe({
      next: (res) => {
        this.notes = res.data;
      },
      error: (err) => console.error('Error fetching lead notes:', err)
    });
  }

  loadDropdownLeads() {
    // Fetch unique leads list by fetching all notes first
    this.crmService.getAllLeadNotes({}).subscribe({
      next: (res) => {
        const leadMap = new Map();
        res.data.forEach((n: any) => {
          if (n.lead && !leadMap.has(n.lead.id)) {
            leadMap.set(n.lead.id, n.lead);
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
      this.loadNotes();
    }, 400);
  }

  getNotesTodayCount(): number {
    const todayStr = new Date().toDateString();
    return this.notes.filter(n => {
      if (!n.createdAt) return false;
      return new Date(n.createdAt).toDateString() === todayStr;
    }).length;
  }

  getInitials(name: string): string {
    if (!name) return 'LD';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
