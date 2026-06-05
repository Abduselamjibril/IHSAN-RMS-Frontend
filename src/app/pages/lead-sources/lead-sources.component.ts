import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

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
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        
        <div class="modal-header flex justify-between align-center">
          <h2>{{ isEditMode ? 'Edit Lead Source' : 'Create New Lead Source' }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitSource($event)">
            
            <!-- Source Name -->
            <div class="form-group">
              <label>Source Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Telegram Channel, TikTok Ads" 
                [(ngModel)]="sourceForm.sourceName" 
                name="sourceName"
                required 
              />
            </div>

            <!-- Source Type -->
            <div class="form-group">
              <label>Source Type *</label>
              <select [(ngModel)]="sourceForm.sourceType" name="sourceType" required>
                <option value="Digital">Digital</option>
                <option value="Social Media">Social Media</option>
                <option value="Offline">Offline</option>
                <option value="Agent">Agent / Broker</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label>Description</label>
              <textarea 
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
  styles: []
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
    if (confirm('Are you sure you want to deactivate this lead source?')) {
      this.crmService.deleteLeadSource(id).subscribe({
        next: () => {
          this.loadLeadSources();
        },
        error: (err) => {
          console.error('Failed to deactivate lead source:', err);
        }
      });
    }
  }
}
