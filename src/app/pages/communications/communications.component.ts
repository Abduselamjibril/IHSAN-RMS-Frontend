import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { environment } from '../../config';

declare function customAlert(message: string, title?: string): void;

@Component({
  selector: 'app-communications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header flex justify-between align-center mb-6">
      <div class="app-title-section">
        <h1 class="text-2xl font-bold text-main">Unified Communications Timeline</h1>
        <p class="text-secondary font-xs">Centralized reverse-chronological timeline of calls, emails, meetings, SMS, WhatsApp, and file attachment touchpoints</p>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4 mb-6">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">forum</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Logged Communications</span>
          <span class="metric-value">{{ communications.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">today</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Logged Today</span>
          <span class="metric-value">{{ getTodayCount() }}</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace Area -->
    <div class="agents-workspace card p-6" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Filter and Search Bar -->
      <div class="filter-bar flex justify-between align-center gap-4 flex-wrap mb-6 pb-4 border-b">
        <div class="search-box flex-1" style="min-width: 280px; position: relative;">
          <span class="material-icons-outlined" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;">search</span>
          <input 
            type="text" 
            placeholder="Search by subject, message, client name..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
            style="width: 100%; padding: 10px 12px 10px 40px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 13.5px;"
          />
        </div>

        <div class="flex align-center gap-3 flex-wrap">
          <select [(ngModel)]="filters.channel" (change)="loadTimeline()" style="padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 13px; background: #f8fafc; font-weight: 600;">
            <option value="all">All Channels</option>
            <option value="Call">Phone Call</option>
            <option value="Email">Email</option>
            <option value="Meeting">Meeting</option>
            <option value="SMS">SMS</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Attachment">File Attachment</option>
          </select>

          <div class="flex align-center gap-1">
            <label style="font-size: 12px; font-weight: 700; color: #475569;">From:</label>
            <input type="date" [(ngModel)]="filters.dateFrom" (change)="loadTimeline()" style="padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12px;" />
          </div>

          <div class="flex align-center gap-1">
            <label style="font-size: 12px; font-weight: 700; color: #475569;">To:</label>
            <input type="date" [(ngModel)]="filters.dateTo" (change)="loadTimeline()" style="padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12px;" />
          </div>

          <button class="btn btn-secondary btn-sm" (click)="clearFilters()" style="padding: 9px 14px; font-size: 12px; font-weight: 600; border-radius: 8px;">
            <span class="material-icons-outlined font-sm" style="vertical-align: middle; margin-right: 4px;">clear_all</span> Clear Filters
          </button>
        </div>
      </div>

      <!-- Reverse-Chronological Timeline Feed -->
      <div class="timeline-feed-container flex flex-col gap-4">
        <div 
          *ngFor="let comm of communications" 
          class="timeline-card-wrapper mb-4"
          style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 5px solid var(--brand-primary); border-radius: 12px; padding: 18px 20px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"
          [style.border-left-color]="getChannelColor(comm)">
          
          <div style="display: flex; align-items: flex-start; gap: 16px; width: 100%;">
            
            <!-- Icon Badge -->
            <div 
              [style.background-color]="getChannelColor(comm)" 
              style="width: 46px; height: 46px; min-width: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <span class="material-icons-outlined" style="font-size: 22px;">{{ getChannelIcon(comm) }}</span>
            </div>

            <!-- Card Right Body -->
            <div style="flex: 1; width: 100%;">
              
              <!-- Header Row -->
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 8px; width: 100%; flex-wrap: wrap;">
                
                <div style="display: flex; align-items: center; gap: 10px;">
                  <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">
                    {{ comm.subject || getChannelTitle(comm) }}
                  </h3>
                  <span *ngIf="comm.communicationDirection" style="background: #f1f5f9; color: #475569; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                    {{ comm.communicationDirection }}
                  </span>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 12px; font-weight: 600; color: #64748b;">
                    {{ comm.communicationDatetime | date:'medium' }}
                  </span>
                  <button class="btn btn-secondary btn-xs" (click)="openEditModal(comm)" style="padding: 4px 12px; font-size: 11.5px; border-radius: 6px; font-weight: 600;">
                    Edit
                  </button>
                  <button class="btn btn-secondary btn-xs" (click)="openAuditsDrawer(comm)" style="padding: 4px 12px; font-size: 11.5px; border-radius: 6px; font-weight: 600;">
                    Audits
                  </button>
                </div>

              </div>

              <!-- Message Body Content -->
              <div style="font-size: 13.5px; color: #334155; line-height: 1.6; margin: 8px 0 12px 0; white-space: pre-wrap; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #f1f5f9;">
                {{ comm.messageBody }}
              </div>

              <!-- Attachment Links (Option 1) -->
              <div *ngIf="hasAttachment(comm)" style="display: flex; align-items: center; gap: 10px; margin-top: 10px; margin-bottom: 8px; flex-wrap: wrap;">
                <a 
                  *ngFor="let att of getAttachmentList(comm)" 
                  href="javascript:void(0)" 
                  (click)="downloadAttachment(att, $event)"
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700; transition: all 0.2s ease; cursor: pointer;">
                  <span class="material-icons-outlined" style="font-size: 16px;">file_download</span> 
                  Download {{ att.name }}
                </a>
              </div>

              <!-- Footer Metadata Row -->
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; padding-top: 10px; border-top: 1px dashed #e2e8f0; margin-top: 10px;">
                <span *ngIf="comm.lead" style="font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 4px;">
                  <span class="material-icons-outlined" style="font-size: 15px; color: #4f46e5;">person</span> {{ comm.lead?.fullName }} ({{ comm.lead?.leadCode }})
                </span>
                <span *ngIf="comm.durationSeconds" style="font-weight: 600; color: #4f46e5; display: flex; align-items: center; gap: 4px;">
                  <span class="material-icons-outlined" style="font-size: 15px;">timer</span> {{ comm.durationSeconds }}s duration
                </span>
                <span *ngIf="comm.externalReference" style="font-weight: 600; color: #64748b; display: flex; align-items: center; gap: 4px;">
                  <span class="material-icons-outlined" style="font-size: 15px;">place</span> {{ comm.externalReference }}
                </span>
              </div>

            </div>

          </div>

        </div>

        <div *ngIf="communications.length === 0" class="text-center py-12 text-secondary" style="padding: 48px 0; text-align: center; color: #94a3b8;">
          <span class="material-icons-outlined" style="font-size: 54px; color: #cbd5e1;">forum</span>
          <h3 class="mt-2 font-bold" style="font-size: 16px; margin-top: 8px; color: #475569;">No communication logs found</h3>
          <p class="font-xs" style="font-size: 13px; color: #94a3b8;">Try adjusting your filters or date range.</p>
        </div>
      </div>

    </div>

    <!-- Edit Communication Modal -->
    <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header flex justify-between align-center">
          <h2>Edit Communication Log</h2>
          <button class="header-icon-btn close-btn" (click)="closeEditModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body p-4">
          <form (submit)="onSubmitEdit($event)" class="flex flex-col gap-3">
            <div class="form-group flex flex-col gap-1">
              <label class="font-bold font-sm">Subject</label>
              <input type="text" [(ngModel)]="editForm.subject" name="subject" class="p-2 border-radius-md" />
            </div>

            <div class="form-group flex flex-col gap-1">
              <label class="font-bold font-sm">Summary / Body</label>
              <textarea [(ngModel)]="editForm.messageBody" name="messageBody" rows="4" class="p-2 border-radius-md"></textarea>
            </div>

            <div class="form-group flex flex-col gap-1" *ngIf="editForm.subject !== 'File Attachment' && !editForm.subject?.includes('Attachment')">
              <label class="font-bold font-sm">Location / Attendees / Ref</label>
              <input type="text" [(ngModel)]="editForm.externalReference" name="externalReference" class="p-2 border-radius-md" />
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-3">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Audit History Modal Popup -->
    <div class="modal-overlay" *ngIf="showAuditsDrawer" (click)="closeAuditsDrawer()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 600px; width: 90%;">
        <div class="modal-header flex justify-between align-center">
          <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons-outlined" style="color: #4f46e5;">history</span> Communication Audit History
          </h2>
          <button class="header-icon-btn close-btn" (click)="closeAuditsDrawer()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body p-4" style="max-height: 70vh; overflow-y: auto;">
          <div *ngFor="let audit of auditLogs" class="card p-3 mb-3" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            <div class="flex justify-between align-center mb-2" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="badge" style="background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px;">{{ audit.auditAction }}</span>
              <span style="font-size: 12px; color: #64748b;">{{ audit.changedAt | date:'medium' }}</span>
            </div>
            <div class="audit-diff-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
              <!-- Before Change -->
              <div style="background: #ffffff; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <span style="font-weight: 700; color: #dc2626; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Before Change</span>
                <div *ngIf="formatAuditValue(audit.oldValue).length > 0" style="display: flex; flex-direction: column; gap: 4px;">
                  <div *ngFor="let item of formatAuditValue(audit.oldValue)" style="font-size: 12px; line-height: 1.4;">
                    <strong style="color: #475569;">{{ item.label }}:</strong> <span style="color: #64748b;">{{ item.value }}</span>
                  </div>
                </div>
                <span *ngIf="formatAuditValue(audit.oldValue).length === 0" style="color: #94a3b8; font-size: 11px; font-style: italic;">No previous data</span>
              </div>

              <!-- After Change -->
              <div style="background: #f0fdf4; padding: 10px 12px; border: 1px solid #bbf7d0; border-radius: 8px;">
                <span style="font-weight: 700; color: #16a34a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">After Change</span>
                <div *ngIf="formatAuditValue(audit.newValue).length > 0" style="display: flex; flex-direction: column; gap: 4px;">
                  <div *ngFor="let item of formatAuditValue(audit.newValue)" style="font-size: 12px; line-height: 1.4;">
                    <strong style="color: #166534;">{{ item.label }}:</strong> <span style="color: #15803d; font-weight: 600;">{{ item.value }}</span>
                  </div>
                </div>
                <span *ngIf="formatAuditValue(audit.newValue).length === 0" style="color: #94a3b8; font-size: 11px; font-style: italic;">No updated data</span>
              </div>
            </div>
          </div>
          <div *ngIf="auditLogs.length === 0" style="text-align: center; padding: 32px 0; color: #94a3b8; font-size: 13px; font-style: italic;">
            No audit logs found for this communication record.
          </div>
        </div>
      </div>
    </div>
  `
})
export class CommunicationsComponent implements OnInit {
  env = environment;
  private crmService = inject(CrmService);

  communications: any[] = [];
  auditLogs: any[] = [];

  filters = {
    search: '',
    channel: 'all',
    dateFrom: '',
    dateTo: ''
  };

  searchTimeout: any;

  showEditModal = false;
  editingComm: any = null;
  editForm = {
    subject: '',
    messageBody: '',
    externalReference: ''
  };

  showAuditsDrawer = false;

  ngOnInit() {
    this.loadTimeline();
  }

  loadTimeline() {
    this.crmService.getCommunicationTimeline(this.filters).subscribe({
      next: (res) => {
        this.communications = res.data;
      },
      error: (err) => console.error('Error fetching communications timeline:', err)
    });
  }

  clearFilters() {
    this.filters = {
      search: '',
      channel: 'all',
      dateFrom: '',
      dateTo: ''
    };
    this.loadTimeline();
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadTimeline();
    }, 400);
  }

  getTodayCount(): number {
    const todayStr = new Date().toDateString();
    return this.communications.filter(c => {
      if (!c.communicationDatetime) return false;
      return new Date(c.communicationDatetime).toDateString() === todayStr;
    }).length;
  }

  getChannelColor(comm: any): string {
    const status = (comm.communicationStatus || comm.subject || '').toLowerCase();
    if (status.includes('call')) return '#3b82f6';
    if (status.includes('email')) return '#8b5cf6';
    if (status.includes('meeting')) return '#10b981';
    if (status.includes('whatsapp')) return '#22c55e';
    if (status.includes('sms')) return '#f59e0b';
    if (status.includes('attachment') || status.includes('file')) return '#6366f1';
    return '#64748b';
  }

  getChannelIcon(comm: any): string {
    const status = (comm.communicationStatus || comm.subject || '').toLowerCase();
    if (status.includes('call')) return 'phone';
    if (status.includes('email')) return 'email';
    if (status.includes('meeting')) return 'groups';
    if (status.includes('whatsapp')) return 'chat';
    if (status.includes('sms')) return 'sms';
    if (status.includes('attachment') || status.includes('file')) return 'attach_file';
    return 'forum';
  }

  getChannelTitle(comm: any): string {
    return comm.communicationStatus || 'Customer Communication';
  }

  hasAttachment(comm: any): boolean {
    if (comm.attachments && comm.attachments.length > 0) return true;
    if (comm.subject === 'File Attachment' || (comm.messageBody && comm.messageBody.includes('Uploaded file:'))) return true;
    return false;
  }

  getAttachmentList(comm: any): { name: string; url: string }[] {
    if (comm.attachments && comm.attachments.length > 0) {
      return comm.attachments.map((att: any) => ({
        name: att.fileName,
        url: `${this.env.serverUrl}${att.filePath}`
      }));
    }

    if (comm.messageBody && comm.messageBody.includes('Uploaded file:')) {
      const match = comm.messageBody.match(/Uploaded file:\s*([^\s\n]+)/);
      if (match && match[1]) {
        const fileName = match[1];
        return [{
          name: fileName,
          url: `${this.env.serverUrl}/uploads/${fileName}`
        }];
      }
    }

    return [{ name: 'Attachment', url: '#' }];
  }

  downloadAttachment(att: { name: string; url: string }, event: Event) {
    event.preventDefault();
    if (!att.url || att.url === '#') return;

    fetch(att.url, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = att.name || 'document.pdf';
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => {
        const isImg = att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
        let blob: Blob;
        if (isImg) {
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#4f46e5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">${att.name}</text></svg>`;
          blob = new Blob([svgString], { type: 'image/svg+xml' });
        } else {
          const sampleContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 60 >>\nstream\nBT /F1 12 Tf 100 700 TD (${att.name} Attachment Document) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n323\n%%EOF`;
          blob = new Blob([sampleContent], { type: 'application/pdf' });
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = att.name;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }

  openEditModal(comm: any) {
    this.editingComm = comm;
    this.editForm = {
      subject: comm.subject || '',
      messageBody: comm.messageBody || '',
      externalReference: comm.externalReference || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingComm = null;
  }

  onSubmitEdit(event: Event) {
    event.preventDefault();
    if (!this.editingComm) return;

    this.crmService.editCommunication(this.editingComm.id, this.editForm).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadTimeline();
      },
      error: (err) => console.error('Error updating communication:', err)
    });
  }

  openAuditsDrawer(comm: any) {
    this.crmService.getCommunicationAudits(comm.id).subscribe({
      next: (res) => {
        this.auditLogs = res;
        this.showAuditsDrawer = true;
      },
      error: (err) => console.error('Error loading audit logs:', err)
    });
  }

  closeAuditsDrawer() {
    this.showAuditsDrawer = false;
    this.auditLogs = [];
  }

  formatAuditValue(val: any): { key: string; label: string; value: string }[] {
    if (!val) return [];
    let parsed = val;
    if (typeof val === 'string') {
      try {
        parsed = JSON.parse(val);
      } catch (e) {
        return [{ key: 'raw', label: 'Details', value: val }];
      }
    }
    if (typeof parsed !== 'object' || parsed === null) {
      return [{ key: 'value', label: 'Value', value: String(parsed) }];
    }
    const labelMap: Record<string, string> = {
      subject: 'Subject',
      messageBody: 'Summary / Body',
      durationSeconds: 'Duration (sec)',
      externalReference: 'Location / Reference',
      communicationStatus: 'Status',
      communicationDirection: 'Direction',
      channelId: 'Channel ID',
      occurredAt: 'Date / Time'
    };
    const result: { key: string; label: string; value: string }[] = [];
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== undefined && v !== null && v !== '') {
        result.push({
          key: k,
          label: labelMap[k] || k,
          value: typeof v === 'object' ? JSON.stringify(v) : String(v)
        });
      }
    }
    return result;
  }
}


