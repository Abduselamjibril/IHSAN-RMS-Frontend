import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { environment } from '../../config';

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
      <div class="app-header-actions flex gap-2">
        <button class="btn btn-secondary flex align-center gap-1" (click)="triggerExpiryCheck()" [disabled]="isCheckingExpiry">
          <span class="material-icons-outlined font-sm" [class.spin-animation]="isCheckingExpiry">schedule_send</span>
          {{ isCheckingExpiry ? 'Checking...' : 'Check Expiry Alerts' }}
        </button>
        <button class="btn btn-primary flex align-center gap-1" (click)="openUploadModal()">
          <span class="material-icons-outlined font-sm">cloud_upload</span> Upload Document
        </button>
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
          <span class="metric-value">{{ documents.length }}</span>
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
        <div class="metric-icon bg-red">
          <span class="material-icons-outlined">report_problem</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Expired Documents</span>
          <span class="metric-value">{{ getExpiredCount() }}</span>
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
            placeholder="Search by code, category, or lead name..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="filters.category" (change)="loadDocuments()">
            <option value="all">All Categories</option>
            <option value="Passport">Passport</option>
            <option value="National ID">National ID</option>
            <option value="Contract">Contract</option>
            <option value="Payment Receipt">Payment Receipt</option>
            <option value="KYC">KYC</option>
            <option value="Signed Agreement">Signed Agreement</option>
          </select>

          <select [(ngModel)]="filters.leadId" (change)="loadDocuments()">
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
              <th style="width: 15%;">Doc Code</th>
              <th style="width: 15%;">Category</th>
              <th style="width: 25%;">Linked Lead</th>
              <th style="width: 10%;">Version</th>
              <th style="width: 15%;">Expiry Date</th>
              <th style="width: 12%;">Status</th>
              <th style="width: 8%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doc of documents; let i = index" class="clickable-row" (click)="openPreviewDrawer(doc)">
              <td>
                <div class="contact-info flex align-center gap-2">
                  <span class="row-index font-xs font-semibold">{{ i + 1 }}</span>
                  <span class="lead-code-cell font-bold">{{ doc.documentCode }}</span>
                </div>
              </td>
              <td class="font-bold text-main">{{ doc.category }}</td>
              <td>
                <div class="contact-info flex align-center gap-2" *ngIf="doc.lead">
                  <div class="table-avatar" style="width: 24px; height: 24px; font-size: 10px;">{{ getInitials(doc.lead.fullName) }}</div>
                  <div class="flex flex-col">
                    <span class="agent-name font-bold font-sm">{{ doc.lead.fullName }}</span>
                    <span class="text-muted font-xs">{{ doc.lead.leadCode }}</span>
                  </div>
                </div>
                <span class="text-secondary italic" *ngIf="!doc.lead">-</span>
              </td>
              <td>
                <span class="badge badge-low">v{{ doc.versions?.length || 1 }}</span>
              </td>
              <td class="text-secondary font-xs font-bold">
                {{ doc.expiryDate ? (doc.expiryDate | date:'mediumDate') : '-' }}
              </td>
              <td>
                <span class="badge" [ngClass]="doc.isExpired ? 'badge-high' : 'badge-new'">
                  {{ doc.isExpired ? 'Expired' : 'Active' }}
                </span>
              </td>
              <td class="text-right" (click)="$event.stopPropagation()">
                <div class="flex justify-end gap-2">
                  <a 
                    [href]="getDownloadUrl(doc)" 
                    target="_blank" 
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    title="Download Current Version"
                  >
                    <span class="material-icons-outlined font-sm">download</span>
                  </a>
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1" 
                    (click)="openReplaceModal(doc)"
                    title="Upload New Version (Replace)"
                  >
                    <span class="material-icons-outlined font-sm">difference</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="documents.length === 0">
              <td colspan="7" class="text-center py-8 text-secondary">
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

    <!-- Upload Document Modal -->
    <div class="modal-overlay" *ngIf="showUploadModal" (click)="closeUploadModal()">
      <div class="modal-container doc-modal" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Upload Customer Document</h2>
          <button class="header-icon-btn close-btn" (click)="closeUploadModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitUpload($event)">
            
            <div class="form-group flex flex-col">
              <label>Select Lead *</label>
              <select [(ngModel)]="uploadData.leadId" name="leadId" required>
                <option [value]="0">Select lead</option>
                <option *ngFor="let l of allLeads" [value]="l.id">{{ l.fullName }} ({{ l.leadCode }})</option>
              </select>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Document Category *</label>
                <select [(ngModel)]="uploadData.category" name="category" required>
                  <option value="Passport">Passport</option>
                  <option value="National ID">National ID</option>
                  <option value="Contract">Contract</option>
                  <option value="Payment Receipt">Payment Receipt</option>
                  <option value="KYC">KYC</option>
                  <option value="Signed Agreement">Signed Agreement</option>
                </select>
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Expiry Date</label>
                <input type="date" [(ngModel)]="uploadData.expiryDate" name="expiryDate" />
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Role Access Restrictions</label>
              <select [(ngModel)]="uploadData.accessRole" name="accessRole">
                <option value="Sales">Sales Agent & Managers</option>
                <option value="Legal">Legal Department Only</option>
                <option value="Manager">Managers Only</option>
              </select>
            </div>

            <div class="form-group flex flex-col">
              <label>Select File *</label>
              <input type="file" (change)="onFileSelected($event)" required />
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeUploadModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="uploadData.leadId === 0 || !selectedFile">
                Upload Document
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Replace / Upload New Version Modal -->
    <div class="modal-overlay" *ngIf="showReplaceModal" (click)="closeReplaceModal()">
      <div class="modal-container doc-modal" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Upload New Document Version (Replace)</h2>
          <button class="header-icon-btn close-btn" (click)="closeReplaceModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="font-sm text-secondary mb-3">
            Uploading a new version for document: <strong>{{ selectedDoc?.documentCode }}</strong> ({{ selectedDoc?.category }}). 
            This will increment the version number to <strong>v{{ (selectedDoc?.versions?.length || 1) + 1 }}</strong>.
          </p>
          <form class="modal-form" (submit)="onSubmitReplace($event)">
            <div class="form-group flex flex-col">
              <label>Select New File *</label>
              <input type="file" (change)="onFileSelected($event)" required />
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeReplaceModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!selectedFile">
                Upload Version
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Expiry Check Result Modal Overlay -->
    <div class="modal-overlay" *ngIf="showExpiryModal" (click)="closeExpiryModal()">
      <div class="modal-container picker-modal" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Expiry Check Result</h2>
          <button class="header-icon-btn close-btn" (click)="closeExpiryModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body flex flex-col align-center gap-4 py-6 text-center" style="display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem 0; text-align: center;">
          <div class="reminder-icon-circle priority-high" style="width: 64px; height: 64px; background-color: rgba(76, 58, 147, 0.1); color: var(--brand-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons-outlined" style="font-size: 36px;">assignment_late</span>
          </div>
          <div>
            <h3 class="font-bold text-main" style="font-size: 1.1rem; margin-bottom: 6px; font-weight: 700; color: #0f172a;">Check Completed</h3>
            <p class="font-sm text-secondary" style="line-height: 1.5; color: #475569; font-size: 0.875rem;">
              Checked all document expiration dates.<br/>
              <span [style.color]="expiredCount > 0 ? 'var(--color-high)' : ''" style="font-weight: 600;">
                {{ expiredCount }} documents marked as expired
              </span><br/>
              <span [style.color]="warningCount > 0 ? 'var(--color-medium)' : ''" style="font-weight: 600;">
                {{ warningCount }} upcoming expiry alerts logged
              </span>
            </p>
          </div>
          <div class="flex justify-center mt-2 w-full" style="display: flex; justify-content: center; width: 100%;">
            <button class="btn btn-primary" (click)="closeExpiryModal()" style="min-width: 120px; background: #5b46b8; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">Got it</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview & Detail Slide-out Drawer -->
    <div class="details-drawer-overlay" *ngIf="showDrawer" (click)="closePreviewDrawer()">
      <div class="details-drawer" (click)="$event.stopPropagation()">
        
        <!-- Drawer Header -->
        <div class="drawer-header flex justify-between align-center">
          <div class="flex align-center gap-3">
            <div class="drawer-avatar bg-info" style="background-color: var(--brand-primary); color: white;">
              DOC
            </div>
            <div class="flex flex-col">
              <h2>{{ selectedDocDetails?.documentCode }}</h2>
              <div class="flex align-center gap-2">
                <span class="badge" [ngClass]="selectedDocDetails?.isExpired ? 'badge-high' : 'badge-new'">
                  {{ selectedDocDetails?.category }} • {{ selectedDocDetails?.isExpired ? 'Expired' : 'Active' }}
                </span>
                <span class="lead-code-cell font-xs font-semibold">Lead: {{ selectedDocDetails?.lead?.fullName }}</span>
              </div>
            </div>
          </div>
          <button class="header-icon-btn close-btn" (click)="closePreviewDrawer()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="drawer-body">
          
          <!-- Image File Preview (if image) -->
          <div class="file-preview-card border mb-4 p-2 flex justify-center align-center bg-main" *ngIf="isImageFile(getCurrentVersionFile(selectedDocDetails))">
            <img 
              [src]="env.serverUrl + getCurrentVersionFile(selectedDocDetails)?.filePath" 
              alt="Document Preview" 
              style="max-width: 100%; max-height: 250px; border-radius: var(--radius-sm);"
            />
          </div>
          <!-- PDF/Generic Preview Icon -->
          <div class="file-preview-card border mb-4 p-8 flex flex-col justify-center align-center bg-main text-secondary" *ngIf="!isImageFile(getCurrentVersionFile(selectedDocDetails))">
            <span class="material-icons-outlined" style="font-size: 54px; color: var(--brand-primary);">picture_as_pdf</span>
            <p class="font-xs font-bold mt-2">{{ getCurrentVersionFile(selectedDocDetails)?.fileName }}</p>
            <p class="font-xxs mt-1">{{ (getCurrentVersionFile(selectedDocDetails)?.fileSize / 1024) | number:'1.0-1' }} KB • {{ getCurrentVersionFile(selectedDocDetails)?.mimeType }}</p>
          </div>

          <!-- Document Profile Grid -->
          <div class="drawer-section">
            <h3>Document Parameters</h3>
            <div class="profile-details-grid">
              <div class="detail-item">
                <span class="label">Customer Name</span>
                <span class="val">{{ selectedDocDetails?.lead?.fullName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Document Category</span>
                <span class="val">{{ selectedDocDetails?.category }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Access Restrictions</span>
                <span class="val">{{ selectedDocDetails?.accessRole || 'Sales' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Expiration Date</span>
                <span class="val font-bold" [style.color]="selectedDocDetails?.isExpired ? 'var(--color-high)' : ''">
                  {{ selectedDocDetails?.expiryDate ? (selectedDocDetails.expiryDate | date:'mediumDate') : 'No expiry set' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Drawer Tabs -->
          <div class="drawer-tabs flex gap-4 mt-4">
            <button class="drawer-tab-btn" [class.active]="activeTab === 'versions'" (click)="activeTab = 'versions'">
              Version History
            </button>
            <button class="drawer-tab-btn" [class.active]="activeTab === 'audit'" (click)="activeTab = 'audit'">
              Security Access Logs
            </button>
          </div>

          <!-- Tab Content 1: Versions list -->
          <div class="tab-content mt-3" *ngIf="activeTab === 'versions'">
            <div class="versions-history-timeline flex flex-col gap-3">
              <div *ngFor="let ver of docVersions" class="border p-3 rounded flex justify-between align-center bg-main">
                <div class="flex align-center gap-3">
                  <div class="badge badge-low font-bold" style="font-size: 11px;">v{{ ver.versionNumber }}</div>
                  <div class="flex flex-col">
                    <span class="font-bold text-main font-xs text-ellipsis" style="max-width: 200px;" [title]="ver.fileName">{{ ver.fileName }}</span>
                    <span class="text-secondary font-xxs mt-1">Uploaded: {{ ver.uploadedAt | date:'medium' }}</span>
                  </div>
                </div>
                
                <a 
                  [href]="env.serverUrl + ver.filePath" 
                  target="_blank" 
                  class="btn btn-secondary btn-xs flex align-center gap-1"
                  style="padding: 6px 10px;"
                >
                  <span class="material-icons-outlined font-xs">download</span> Download
                </a>
              </div>
            </div>
          </div>

          <!-- Tab Content 2: Audit logs -->
          <div class="tab-content mt-3" *ngIf="activeTab === 'audit'">
            <div class="access-logs-list flex flex-col gap-2">
              <div *ngFor="let log of docAccessLogs" class="flex justify-between align-center p-2 font-xs border-bottom">
                <div class="flex align-center gap-2">
                  <span class="material-icons-outlined text-secondary" style="font-size: 16px;">
                    {{ log.action === 'Upload' || log.action === 'Replace' ? 'cloud_upload' : 'visibility' }}
                  </span>
                  <span>Action: <strong>{{ log.action }}</strong></span>
                </div>
                <span class="text-secondary font-xxs">By User • {{ log.accessedAt | date:'medium' }}</span>
              </div>
              <div *ngIf="docAccessLogs.length === 0" class="text-center py-6 text-secondary font-xs italic">
                No access audit records recorded yet.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
    }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .metric-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .bg-yellow { background-color: var(--color-medium); }
    .bg-red { background-color: var(--color-high); }
    .bg-indigo { background-color: var(--brand-primary); }

    .doc-modal {
      width: 500px;
      max-width: 90%;
    }

    .file-preview-card {
      border-radius: var(--radius-md);
      min-height: 120px;
    }

    .font-xxs {
      font-size: 9.5px;
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

    .btn-danger-hover:hover {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: var(--color-high);
      color: var(--color-high);
    }

    .spin-animation {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .picker-modal {
      width: 400px;
    }
  `]
})
export class DocumentsComponent implements OnInit {
  env = environment;
  private crmService = inject(CrmService);

  documents: any[] = [];
  uniqueLeads: any[] = [];
  allLeads: any[] = [];
  
  filters = {
    search: '',
    category: 'all',
    leadId: 0
  };

  searchTimeout: any;

  // Actions states
  isCheckingExpiry = false;
  showUploadModal = false;
  showReplaceModal = false;
  showExpiryModal = false;
  expiredCount = 0;
  warningCount = 0;
  selectedDoc: any = null;
  selectedFile: File | null = null;

  // Create document payload
  uploadData = {
    leadId: 0,
    category: 'Passport',
    expiryDate: '',
    accessRole: 'Sales'
  };

  // Preview Drawer
  showDrawer = false;
  selectedDocDetails: any = null;
  docVersions: any[] = [];
  docAccessLogs: any[] = [];
  activeTab = 'versions';

  ngOnInit() {
    this.loadDocuments();
    this.loadDropdownLeads();
    this.loadAllLeads();
  }

  loadDocuments() {
    this.crmService.getCustomerDocuments(this.filters).subscribe({
      next: (res) => {
        this.documents = res.data;
      },
      error: (err) => console.error('Error fetching customer documents:', err)
    });
  }

  loadDropdownLeads() {
    this.crmService.getCustomerDocuments({}).subscribe({
      next: (res) => {
        const leadMap = new Map();
        res.data.forEach((doc: any) => {
          if (doc.lead && !leadMap.has(doc.lead.id)) {
            leadMap.set(doc.lead.id, doc.lead);
          }
        });
        this.uniqueLeads = Array.from(leadMap.values());
      },
      error: (err) => console.error('Error populating leads filter:', err)
    });
  }

  loadAllLeads() {
    this.crmService.getLeads({ limit: 1000 }).subscribe({
      next: (res) => this.allLeads = res.data,
      error: (err) => console.error('Failed to load leads list:', err)
    });
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadDocuments();
    }, 400);
  }

  getTotalStorageUsed(): string {
    let sumBytes = 0;
    this.documents.forEach(doc => {
      if (doc.versions) {
        doc.versions.forEach((v: any) => sumBytes += Number(v.fileSize || 0));
      }
    });
    return (sumBytes / (1024 * 1024)).toFixed(2);
  }

  getExpiredCount(): number {
    return this.documents.filter(d => d.isExpired).length;
  }

  getUploadsTodayCount(): number {
    const todayStr = new Date().toDateString();
    let sum = 0;
    this.documents.forEach(doc => {
      if (doc.versions) {
        const matching = doc.versions.filter((v: any) => new Date(v.uploadedAt).toDateString() === todayStr);
        sum += matching.length;
      }
    });
    return sum;
  }

  getInitials(name: string): string {
    if (!name) return 'LD';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getDownloadUrl(doc: any): string {
    const file = this.getCurrentVersionFile(doc);
    return file ? `${this.env.serverUrl}${file.filePath}` : '#';
  }

  getCurrentVersionFile(doc: any): any {
    if (!doc || !doc.versions || doc.versions.length === 0) return null;
    // Sort and get max version number
    return doc.versions.reduce((max: any, v: any) => (v.versionNumber > max.versionNumber ? v : max), doc.versions[0]);
  }

  isImageFile(file: any): boolean {
    if (!file || !file.mimeType) return false;
    return file.mimeType.startsWith('image/');
  }

  // Preview Drawer actions
  openPreviewDrawer(doc: any) {
    this.activeTab = 'versions';
    this.crmService.getDocumentDetails(doc.id).subscribe({
      next: (data) => {
        this.selectedDocDetails = data;
        this.showDrawer = true;
        this.loadDrawerSubData(data.id);
      },
      error: (err) => console.error('Failed to load document details:', err)
    });
  }

  loadDrawerSubData(id: number) {
    this.crmService.getDocumentVersions(id).subscribe({
      next: (vers) => this.docVersions = vers
    });
    this.crmService.getDocumentAccessLogs(id).subscribe({
      next: (logs) => this.docAccessLogs = logs
    });
  }

  closePreviewDrawer() {
    this.showDrawer = false;
    this.selectedDocDetails = null;
  }

  // Upload actions
  openUploadModal() {
    this.uploadData = {
      leadId: 0,
      category: 'Passport',
      expiryDate: '',
      accessRole: 'Sales'
    };
    this.selectedFile = null;
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onSubmitUpload(event: Event) {
    event.preventDefault();
    if (this.uploadData.leadId === 0 || !this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('category', this.uploadData.category);
    if (this.uploadData.expiryDate) {
      formData.append('expiryDate', this.uploadData.expiryDate);
    }
    formData.append('accessRole', this.uploadData.accessRole);

    this.crmService.uploadCustomerDocument(this.uploadData.leadId, formData).subscribe({
      next: () => {
        this.closeUploadModal();
        this.loadDocuments();
        this.loadDropdownLeads();
      },
      error: (err) => console.error('Failed to upload document:', err)
    });
  }

  // Replace / New Version actions
  openReplaceModal(doc: any) {
    this.selectedDoc = doc;
    this.selectedFile = null;
    this.showReplaceModal = true;
  }

  closeReplaceModal() {
    this.showReplaceModal = false;
    this.selectedDoc = null;
  }

  onSubmitReplace(event: Event) {
    event.preventDefault();
    if (!this.selectedDoc || !this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.crmService.uploadNewDocumentVersion(this.selectedDoc.id, formData).subscribe({
      next: () => {
        this.closeReplaceModal();
        this.loadDocuments();
      },
      error: (err) => console.error('Failed to upload replacement version:', err)
    });
  }

  closeExpiryModal() {
    this.showExpiryModal = false;
  }

  triggerExpiryCheck() {
    this.isCheckingExpiry = true;
    this.crmService.triggerDocumentExpiryCheck().subscribe({
      next: (res) => {
        this.isCheckingExpiry = false;
        this.expiredCount = res.expiredCount || 0;
        this.warningCount = res.warningCount || 0;
        this.showExpiryModal = true;
        this.loadDocuments();
      },
      error: (err) => {
        this.isCheckingExpiry = false;
        console.error('Failed to check expirations:', err);
      }
    });
  }
}
