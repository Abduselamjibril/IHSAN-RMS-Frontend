import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Documents Workspace</h1>
        <p>Review, search, and download all file attachments and documents uploaded for leads</p>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">folder_open</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Documents</span>
          <span class="metric-value">{{ attachments.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-yellow">
          <span class="material-icons-outlined">sd_card</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Storage Used</span>
          <span class="metric-value">{{ getTotalStorageUsed() }} MB</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">cloud_upload</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Uploaded Today</span>
          <span class="metric-value">{{ getUploadsTodayCount() }}</span>
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
            placeholder="Search by filename or lead name..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="filters.leadId" (change)="loadAttachments()">
            <option [value]="0">All Leads</option>
            <option *ngFor="let lead of uniqueLeads" [value]="lead.id">{{ lead.fullName }}</option>
          </select>
        </div>
      </div>

      <!-- Documents Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 35%;">Document Name</th>
              <th style="width: 25%;">Linked Lead</th>
              <th style="width: 12%;">Size</th>
              <th style="width: 13%;">Mime Type</th>
              <th style="width: 10%;">Uploaded At</th>
              <th style="width: 5%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let att of attachments; let i = index">
              <td>
                <div class="contact-info flex align-center gap-3">
                  <span class="row-index">{{ i + 1 }}</span>
                  <div class="doc-icon-circle">
                    <span class="material-icons-outlined" style="font-size: 20px; color: var(--brand-primary);">
                      description
                    </span>
                  </div>
                  <div class="flex flex-col" style="max-width: 260px;">
                    <span class="lead-name font-bold text-ellipsis" [title]="att.fileName">{{ att.fileName }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info flex align-center gap-2" *ngIf="att.communication?.lead">
                  <div class="table-avatar" style="width: 24px; height: 24px; font-size: 10px;">{{ getInitials(att.communication.lead.fullName) }}</div>
                  <div class="flex flex-col">
                    <span class="agent-name font-bold font-sm">{{ att.communication.lead.fullName }}</span>
                    <span class="text-muted font-xs">{{ att.communication.lead.leadCode }}</span>
                  </div>
                </div>
                <span class="text-secondary italic" *ngIf="!att.communication?.lead">-</span>
              </td>
              <td class="text-secondary font-sm">
                {{ (att.fileSize / 1024) | number:'1.0-1' }} KB
              </td>
              <td>
                <span class="badge badge-new" style="font-size: 10px;">{{ att.mimeType || 'unknown' }}</span>
              </td>
              <td class="text-secondary font-sm">
                {{ att.uploadedAt | date:'mediumDate' }}
              </td>
              <td class="text-right">
                <a 
                  [href]="'http://localhost:3000' + att.filePath" 
                  target="_blank" 
                  class="btn btn-secondary btn-xs flex align-center gap-1"
                  style="display: inline-flex;"
                >
                  <span class="material-icons-outlined font-sm">download</span> Download
                </a>
              </td>
            </tr>
            <tr *ngIf="attachments.length === 0">
              <td colspan="6" class="text-center py-8 text-secondary">
                <div class="empty-state">
                  <span class="material-icons-outlined text-secondary" style="font-size: 36px;">cloud_off</span>
                  <h3 class="mt-2">No documents found</h3>
                  <p class="font-sm text-secondary">There are no documents uploaded matching your filters.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .doc-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background-color: rgba(124, 58, 237, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
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
export class DocumentsComponent implements OnInit {
  private crmService = inject(CrmService);

  attachments: any[] = [];
  uniqueLeads: any[] = [];
  filters = {
    search: '',
    leadId: 0
  };

  searchTimeout: any;

  ngOnInit() {
    this.loadAttachments();
    this.loadDropdownLeads();
  }

  loadAttachments() {
    this.crmService.getAllAttachments(this.filters).subscribe({
      next: (res) => {
        this.attachments = res.data;
      },
      error: (err) => console.error('Error fetching lead attachments:', err)
    });
  }

  loadDropdownLeads() {
    this.crmService.getAllAttachments({}).subscribe({
      next: (res) => {
        const leadMap = new Map();
        res.data.forEach((att: any) => {
          const lead = att.communication?.lead;
          if (lead && !leadMap.has(lead.id)) {
            leadMap.set(lead.id, lead);
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
      this.loadAttachments();
    }, 400);
  }

  getTotalStorageUsed(): string {
    const totalBytes = this.attachments.reduce((sum, att) => sum + Number(att.fileSize || 0), 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }

  getUploadsTodayCount(): number {
    const todayStr = new Date().toDateString();
    return this.attachments.filter(att => {
      if (!att.uploadedAt) return false;
      return new Date(att.uploadedAt).toDateString() === todayStr;
    }).length;
  }

  getInitials(name: string): string {
    if (!name) return 'LD';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
