import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-lead-sources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Lead Sources Workspace</h1>
        <p>Configure and manage customer referral channels and marketing campaigns</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          New Lead Source
        </button>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">share</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Sources</span>
          <span class="metric-value">{{ leadSources.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">check_circle</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Active Sources</span>
          <span class="metric-value">{{ getActiveCount() }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-orange">
          <span class="material-icons-outlined">campaign</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Marketing Channels</span>
          <span class="metric-value">{{ getMarketingCount() }}</span>
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
            placeholder="Search by source name, type, description..." 
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="statusFilter">
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      <!-- Lead Sources Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 30%;">Source Name</th>
              <th style="width: 20%;">Type</th>
              <th style="width: 35%;">Description</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 5%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let source of getFilteredSources(); let i = index">
              <td>
                <div class="contact-info flex align-center gap-3">
                  <span class="row-index">{{ i + 1 }}</span>
                  <div class="table-avatar" [style.background-color]="source.isActive ? '#4c3a93' : '#64748b'">
                    {{ getInitials(source.sourceName) }}
                  </div>
                  <span class="lead-name font-bold">{{ source.sourceName }}</span>
                </div>
              </td>
              <td>
                <span class="department-tag">{{ source.sourceType || 'Offline' }}</span>
              </td>
              <td class="text-secondary font-sm">{{ source.description || '-' }}</td>
              <td>
                <span class="badge" [class.badge-new]="source.isActive" [class.badge-lost]="!source.isActive">
                  {{ source.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex gap-2 justify-end">
                  <button class="btn btn-secondary btn-xs flex align-center" (click)="openEditModal(source)">
                    <span class="material-icons-outlined font-sm">edit</span> Edit
                  </button>
                  <button 
                    *ngIf="source.isActive" 
                    class="btn btn-secondary btn-xs flex align-center btn-danger-hover" 
                    (click)="deactivateSource(source.id)"
                  >
                    <span class="material-icons-outlined font-sm">block</span> Deactivate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="getFilteredSources().length === 0">
              <td colspan="5" class="text-center py-6 text-secondary">
                No lead sources found matching the criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal Dialog -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()" role="dialog" aria-modal="true" aria-labelledby="leadSourceModalTitle">
      <div class="modal-container" (click)="$event.stopPropagation()" tabindex="0">
        
        <div class="modal-header flex justify-between align-center">
          <h2 id="leadSourceModalTitle">{{ isEditMode ? 'Edit Lead Source' : 'Create New Lead Source' }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeModal()" aria-label="Close dialog">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitSource($event)">
            
            <!-- Source Name -->
            <div class="form-group">
              <label for="sourceNameInput">Source Name *</label>
              <input 
                id="sourceNameInput"
                type="text" 
                placeholder="e.g. Telegram Channel, TikTok Ads" 
                [(ngModel)]="sourceForm.sourceName" 
                name="sourceName"
                required 
              />
            </div>

            <!-- Source Type -->
            <div class="form-group">
              <label for="sourceTypeInput">Source Type *</label>
              <select id="sourceTypeInput" [(ngModel)]="sourceForm.sourceType" name="sourceType" required>
                <option value="Digital">Digital</option>
                <option value="Social Media">Social Media</option>
                <option value="Offline">Offline</option>
                <option value="Agent">Agent / Broker</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="descriptionInput">Description</label>
              <textarea 
                id="descriptionInput"
                placeholder="Enter description or campaign details..." 
                [(ngModel)]="sourceForm.description" 
                name="description"
                rows="3"
              ></textarea>
            </div>

            <!-- Status Checkbox (only in edit mode) -->
            <div class="form-group flex align-center gap-2" *ngIf="isEditMode">
              <input 
                type="checkbox" 
                id="isActive" 
                [(ngModel)]="sourceForm.isActive" 
                name="isActive" 
              />
              <label for="isActive">Lead Source is Active</label>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="!sourceForm.sourceName || !sourceForm.sourceType"
              >
                {{ isEditMode ? 'Save Changes' : 'Create Lead Source' }}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  `,
  styles: [``,
  `
    .margin-y-4 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
    .margin-0 { margin: 0; }
    .mt-4 { margin-top: 1rem; }
    .mt-2 { margin-top: 0.5rem; }
    .btn-danger-hover:hover {
      background-color: #fecaca !important;
      color: #dc2626 !important;
      border-color: #f87171 !important;
    }
    .department-tag {
      background-color: rgba(124, 58, 237, 0.08);
      color: #7c3aed;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Modal spacing & styling (match Agents) */
    .modal-overlay {
      position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
      background: rgba(15,23,42,0.5); z-index:60; padding: 1.5rem;
    }
    .modal-container {
      /* ensure dialog fits horizontally on all viewports */
      width: min(720px, calc(100% - 64px));
      max-width: 100%;
      background: #fff; border-radius: 12px; overflow: hidden;
      box-shadow: 0 12px 30px rgba(2,6,23,0.25); border: 1px solid rgba(15,23,42,0.06);
    }
    .modal-header { padding: 18px 22px; border-bottom: 1px solid rgba(15,23,42,0.04); }
    .modal-header h2 { margin:0; font-size:1.125rem; }
    .header-icon-btn { background:transparent; border:none; padding:6px; border-radius:8px; }

    .modal-body { padding: 18px 22px; }
    .modal-form { display:block; }
    .form-row { display:flex; gap:14px; align-items:flex-start; }
    .form-group { display:flex; flex-direction:column; gap:8px; margin-bottom:6px; flex:1; min-width:0; }
    .form-group label { font-size:0.88rem; color:#334155; }
    .form-group input[type="text"], .form-group textarea, .form-group select {
      width:100%; height:42px; padding:8px 12px; border-radius:8px; border:1px solid rgba(15,23,42,0.08); font-size:0.95rem;
      box-sizing: border-box;
    }
    .form-group textarea { height:auto; padding-top:10px; padding-bottom:10px; resize:vertical; }
    .form-group input[type="checkbox"] { width:18px; height:18px; }

    .modal-footer { padding: 14px 22px; border-top: 1px solid rgba(15,23,42,0.04); display:flex; justify-content:flex-end; gap:12px; }
    .btn-primary { background:#5b46b8; color:#fff; border-radius:8px; padding:10px 14px; }
    .btn-secondary { background:#fff; color:#0f172a; border:1px solid rgba(15,23,42,0.06); border-radius:8px; padding:10px 14px; }

    @media (max-width:640px) {
      .modal-container { width:100%; height:100%; border-radius:0; }
      .form-row { flex-direction:column; }
      .modal-body, .modal-header, .modal-footer { padding-left:14px; padding-right:14px; }
    }
  `]
})
export class LeadSourcesComponent implements OnInit {
  private crmService = inject(CrmService);

  leadSources: any[] = [];
  searchQuery = '';
  statusFilter = 'all';

  // Modal State
  showModal = false;
  isEditMode = false;
  selectedSourceId: number | null = null;

  sourceForm = {
    sourceName: '',
    sourceType: 'Digital',
    description: '',
    isActive: true
  };

  ngOnInit() {
    this.loadLeadSources();
  }

  loadLeadSources() {
    this.crmService.getLeadSources().subscribe({
      next: (data) => {
        this.leadSources = data;
      },
      error: (err) => {
        console.error('Failed to load lead sources:', err);
      }
    });
  }

  getFilteredSources() {
    return this.leadSources.filter(source => {
      const query = this.searchQuery.toLowerCase();
      const matchesSearch = 
        source.sourceName.toLowerCase().includes(query) ||
        (source.sourceType && source.sourceType.toLowerCase().includes(query)) ||
        (source.description && source.description.toLowerCase().includes(query));

      if (this.statusFilter === 'active') {
        return matchesSearch && source.isActive;
      } else if (this.statusFilter === 'inactive') {
        return matchesSearch && !source.isActive;
      }
      return matchesSearch;
    });
  }

  getActiveCount(): number {
    return this.leadSources.filter(s => s.isActive).length;
  }

  getMarketingCount(): number {
    return this.leadSources.filter(s => 
      s.isActive && (s.sourceType === 'Digital' || s.sourceType === 'Social Media')
    ).length;
  }

  getInitials(name: string): string {
    if (!name) return 'LS';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedSourceId = null;
    this.sourceForm = {
      sourceName: '',
      sourceType: 'Digital',
      description: '',
      isActive: true
    };
    this.showModal = true;
  }

  openEditModal(source: any) {
    this.isEditMode = true;
    this.selectedSourceId = source.id;
    this.sourceForm = {
      sourceName: source.sourceName,
      sourceType: source.sourceType || 'Digital',
      description: source.description || '',
      isActive: source.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmitSource(event: Event) {
    event.preventDefault();
    if (!this.sourceForm.sourceName || !this.sourceForm.sourceType) return;

    if (this.isEditMode && this.selectedSourceId !== null) {
      this.crmService.updateLeadSource(this.selectedSourceId, this.sourceForm).subscribe({
        next: () => {
          this.loadLeadSources();
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update lead source:', err);
        }
      });
    } else {
      this.crmService.createLeadSource(this.sourceForm).subscribe({
        next: () => {
          this.loadLeadSources();
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to create lead source:', err);
        }
      });
    }
  }

  deactivateSource(id: number) {
    customConfirm('Are you sure you want to deactivate this lead source?').then(confirmed => {
      if (confirmed) {
        this.crmService.deleteLeadSource(id).subscribe({
          next: () => {
            this.loadLeadSources();
          },
          error: (err) => {
            console.error('Failed to deactivate lead source:', err);
          }
        });
      }
    });
  }
}
