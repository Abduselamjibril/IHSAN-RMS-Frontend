import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { environment } from '../../config';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MarketingService } from '../../services/marketing.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Leads Workspace</h1>
        <p>Manage real estate leads, inquiries, and agent assignments</p>
      </div>
      <div class="app-header-actions">
        <!-- Export Button -->
        <a [href]="getExportCsvUrl()" class="btn btn-secondary" *ngIf="authService.hasPermission('crm.leads.export', 'export')">
          <span class="material-icons-outlined">file_download</span>
          Export CSV
        </a>
        <button class="btn btn-primary" (click)="openCreateModal()" *ngIf="authService.hasPermission('crm.leads.create', 'create')">
          <span class="material-icons-outlined">add</span>
          New Lead
        </button>
      </div>
    </header>

    <!-- Filter Workspace Grid -->
    <div class="leads-workspace-grid">
      
      <!-- List Area -->
      <div class="leads-list-area card">
        
        <!-- Filter Bar -->
        <div class="filter-bar flex justify-between align-center gap-4">
          
          <!-- Search box -->
          <div class="search-box">
            <span class="material-icons-outlined">search</span>
            <input 
              type="text" 
              placeholder="Search by name, phone, email..." 
              [(ngModel)]="filters.search"
              (ngModelChange)="onSearchChange()" 
            />
          </div>

          <!-- Select filters -->
          <div class="flex align-center gap-3">
            <!-- Date range filters -->
            <div class="flex align-center gap-2 date-filter-group">
              <div class="date-input-wrapper">
                <label>From</label>
                <input type="date" [(ngModel)]="filters.dateFrom" (change)="loadLeads()" />
              </div>
              <div class="date-input-wrapper">
                <label>To</label>
                <input type="date" [(ngModel)]="filters.dateTo" (change)="loadLeads()" />
              </div>
            </div>

            <select [(ngModel)]="filters.sourceId" (change)="loadLeads()">
              <option [value]="0">All Sources</option>
              <option *ngFor="let s of metadata?.sources" [value]="s.id">{{ s.sourceName }}</option>
            </select>

            <select [(ngModel)]="filters.agentId" (change)="loadLeads()">
              <option [value]="0">All Agents</option>
              <option *ngFor="let a of metadata?.agents" [value]="a.id">{{ a.fullName }}</option>
            </select>
          </div>
        </div>

        <!-- Status Filter Tabs -->
        <div class="status-tabs-row flex gap-2">
          <button 
            class="status-tab" 
            [class.active]="filters.statusId === 0" 
            (click)="selectStatus(0)"
          >
            All Leads
          </button>
          <button 
            *ngFor="let st of metadata?.statuses" 
            class="status-tab" 
            [class.active]="filters.statusId === st.id" 
            (click)="selectStatus(st.id)"
          >
            <span class="status-tab-dot" [style.background-color]="st.colorCode"></span>
            {{ st.statusName }}
          </button>
        </div>

        <!-- Leads Table -->
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 35%;">Lead</th>
                <th style="width: 15%;">Source</th>
                <th style="width: 15%;">Status</th>
                <th style="width: 20%;">• Assigned To</th>
                <th style="width: 15%;">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of leads; let i = index" (click)="openDetailsDrawer(l)" [class.selected]="selectedLead?.id === l.id">
                <td>
                  <div class="contact-info flex align-center gap-3">
                    <span class="row-index">{{ i + 1 }}</span>
                    <div class="table-avatar">{{ getInitials(l.fullName) }}</div>
                    <div class="flex flex-col">
                      <span class="lead-name">{{ l.fullName }}</span>
                      <span class="lead-phone">{{ l.primaryPhone }} <span class="text-muted font-xs" style="margin-left: 6px;">• {{ l.leadCode }}</span></span>
                    </div>
                    <span *ngIf="l.isDuplicate" class="duplicate-tag">Duplicate</span>
                  </div>
                </td>
                <td style="font-weight: 500; color: var(--text-main);">{{ l.leadSource?.sourceName || '-' }}</td>
                <td>
                  <span class="badge" [ngClass]="getBadgeClass(l.leadStatus?.statusName)">
                    {{ l.leadStatus?.statusName || 'New' }}
                  </span>
                </td>
                <td>
                  <div class="agent-col flex align-center gap-2" *ngIf="l.assignedSalesAgent">
                    <div class="table-avatar" style="width: 24px; height: 24px; font-size: 9px; background-color: var(--brand-primary); color: white;">
                      {{ getInitials(l.assignedSalesAgent.fullName) }}
                    </div>
                    <span class="agent-name">{{ l.assignedSalesAgent.fullName }}</span>
                  </div>
                  <span class="text-secondary italic" *ngIf="!l.assignedSalesAgent">Unassigned</span>
                </td>
                <td class="text-secondary font-sm">
                  {{ l.lastContactedAt ? (l.lastContactedAt | date:'mediumDate') : 'Never' }}
                </td>
              </tr>
              <tr *ngIf="leads.length === 0">
                <td colspan="6" class="text-center py-6 text-secondary">
                  No leads found matching the filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination flex justify-between align-center">
          <span class="pagination-info">Showing {{ leads.length }} of {{ totalLeads }} leads</span>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" [disabled]="filters.page <= 1" (click)="prevPage()">Prev</button>
            <button class="btn btn-secondary btn-sm" [disabled]="(filters.page * filters.limit) >= totalLeads" (click)="nextPage()">Next</button>
          </div>
        </div>

      </div>

    </div>

    <!-- 1. Slide-out Lead Details Drawer -->
    <div class="details-drawer-overlay" *ngIf="showDrawer" (click)="closeDetailsDrawer()">
      <div class="details-drawer" (click)="$event.stopPropagation()">
        
        <!-- Drawer Header -->
        <div class="drawer-header flex justify-between align-center">
          <div class="flex align-center gap-3">
            <div class="drawer-avatar">{{ getInitials(selectedLeadDetails?.fullName) }}</div>
            <div class="flex flex-col">
              <h2>{{ selectedLeadDetails?.fullName }}</h2>
              <div class="flex align-center gap-2">
                <span class="badge" [ngClass]="getBadgeClass(selectedLeadDetails?.leadStatus?.statusName)">
                  {{ selectedLeadDetails?.leadStatus?.statusName }}
                </span>
                <span *ngIf="selectedLeadDetails?.isDuplicate" class="duplicate-tag">Duplicate</span>
              </div>
            </div>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeDetailsDrawer()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="drawer-body">
          
          <!-- Reassignment and Status Quick Actions -->
          <div class="drawer-actions flex gap-3">
            <div class="action-select flex flex-col">
              <label>Lead Status</label>
              <select 
                [ngModel]="selectedLeadDetails?.leadStatus?.id" 
                (ngModelChange)="onUpdateLeadStatus($event)"
              >
                <option *ngFor="let st of metadata?.statuses" [value]="st.id">{{ st.statusName }}</option>
              </select>
            </div>

            <div class="action-select flex flex-col">
              <label>Assigned Agent</label>
              <select 
                [ngModel]="selectedLeadDetails?.assignedSalesAgent?.id" 
                (ngModelChange)="onAssignSalesAgent($event)"
              >
                <option [value]="0">Unassigned</option>
                <option *ngFor="let a of metadata?.agents" [value]="a.id">{{ a.fullName }}</option>
              </select>
            </div>
          </div>

          <!-- Convert to Opportunity Button if status is Qualified -->
          <div class="drawer-section" *ngIf="selectedLeadDetails?.leadStatus?.statusName === 'Qualified'" style="margin-bottom: 16px;">
            <button class="btn btn-primary flex align-center justify-center gap-2" style="width: 100%; padding: 10px;" (click)="openConvertModal()">
              <span class="material-icons-outlined">trending_up</span>
              Convert to Opportunity
            </button>
          </div>

          <!-- View Converted Opportunity Link if Converted -->
          <div class="drawer-section" *ngIf="selectedLeadDetails?.opportunity" style="margin-bottom: 16px;">
            <a routerLink="/opportunities" [queryParams]="{ search: selectedLeadDetails?.opportunity?.opportunityCode }" class="btn btn-secondary flex align-center justify-center gap-2" style="width: 100%; padding: 10px; color: var(--brand-primary); border-color: var(--brand-primary);">
              <span class="material-icons-outlined">trending_up</span>
              View Converted Opportunity: <strong>{{ selectedLeadDetails?.opportunity?.opportunityCode }}</strong>
            </a>
          </div>

          <!-- Marketing Campaign Attribution Section -->
          <div class="drawer-section" style="margin-bottom: 16px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.02);">
            <h3 style="font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--brand-primary);">
              <span class="material-icons-outlined">campaign</span>
              Campaign Attribution
            </h3>
            
            <!-- Display Existing Attribution -->
            <div *ngIf="leadAttribution" class="flex flex-col gap-2 font-sm" style="background: var(--brand-primary-fade); padding: 12px; border-radius: var(--radius-sm); border-left: 4px solid var(--brand-primary);">
              <div>Campaign: <strong style="color: var(--text-main);">{{ leadAttribution.campaign?.campaignName }}</strong></div>
              <div class="flex justify-between" style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                <span>Score: <strong>{{ leadAttribution.leadScore }}</strong></span>
                <span>Prob: <strong>{{ leadAttribution.conversionProbability }}%</strong></span>
                <span>Cost: <strong>ETB {{ leadAttribution.acquisitionCost | number }}</strong></span>
              </div>
            </div>

            <!-- Create/Edit Attribution Form -->
            <div *ngIf="!leadAttribution" class="flex flex-col gap-3">
              <div class="flex flex-col gap-1">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Select Marketing Campaign *</label>
                <select [(ngModel)]="attributionForm.campaignId" style="width: 100%; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main);">
                  <option [value]="0">-- Select Campaign --</option>
                  <option *ngFor="let camp of campaigns" [value]="camp.id">{{ camp.campaignName }}</option>
                </select>
              </div>
              
              <div class="grid grid-cols-3 gap-2">
                <div class="flex flex-col gap-1">
                  <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Lead Score</label>
                  <input type="number" [(ngModel)]="attributionForm.leadScore" style="width: 100%; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main);" />
                </div>
                <div class="flex flex-col gap-1">
                  <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Probability (%)</label>
                  <input type="number" [(ngModel)]="attributionForm.conversionProbability" style="width: 100%; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main);" />
                </div>
                <div class="flex flex-col gap-1">
                  <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Cost (ETB)</label>
                  <input type="number" [(ngModel)]="attributionForm.acquisitionCost" style="width: 100%; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main);" />
                </div>
              </div>
              
              <div class="flex justify-end">
                <button type="button" class="btn btn-primary btn-sm flex align-center gap-1" [disabled]="attributionForm.campaignId === 0" (click)="onSaveAttribution()">
                  <span class="material-icons-outlined font-sm">link</span>
                  <span>Link Campaign</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Contact Profile -->
          <div class="drawer-section">
            <h3>Lead Information</h3>
            <div class="profile-details-grid">
              <div class="detail-item">
                <span class="label">Primary Phone</span>
                <span class="val">{{ selectedLeadDetails?.primaryPhone }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Secondary Phone</span>
                <span class="val">{{ selectedLeadDetails?.secondaryPhone || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Primary Email</span>
                <span class="val">{{ selectedLeadDetails?.primaryEmail || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Secondary Email</span>
                <span class="val">{{ selectedLeadDetails?.secondaryEmail || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Gender</span>
                <span class="val">{{ selectedLeadDetails?.gender || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Preferred Contact</span>
                <span class="val">{{ selectedLeadDetails?.preferredContactMethod || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Nationality</span>
                <span class="val">{{ selectedLeadDetails?.nationality || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">City of Residence</span>
                <span class="val">{{ selectedLeadDetails?.city || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Country of Residence</span>
                <span class="val">{{ selectedLeadDetails?.country || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Lead Source</span>
                <span class="val">{{ selectedLeadDetails?.leadSource?.sourceName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Property Interest</span>
                <span class="val">{{ selectedLeadDetails?.interestedPropertyType || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Budget Range</span>
                <span class="val">
                  {{ selectedLeadDetails?.budgetMin ? ('ETB ' + (selectedLeadDetails.budgetMin | number)) : '-' }} - 
                  {{ selectedLeadDetails?.budgetMax ? ('ETB ' + (selectedLeadDetails.budgetMax | number)) : '-' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Inquiry Remarks -->
          <div class="drawer-section" *ngIf="selectedLeadDetails?.remarks">
            <h3>Inquiry Remarks</h3>
            <div class="remarks-box">
              {{ selectedLeadDetails?.remarks }}
            </div>
          </div>

          <!-- Additional Contacts List in Details -->
          <div class="drawer-section" *ngIf="selectedLeadDetails?.contacts?.length > 0">
            <h3>Additional Contacts</h3>
            <div class="contacts-grid flex flex-col gap-2">
              <div *ngFor="let contact of selectedLeadDetails?.contacts" class="contact-card-simple border bg-main">
                <div class="flex flex-col">
                  <span class="contact-card-name">{{ contact.contactName }}</span>
                  <span class="text-secondary font-xs italic">{{ contact.relationshipType }}</span>
                </div>
                <div class="flex flex-col align-end font-xs text-secondary">
                  <span>{{ contact.phone || '-' }}</span>
                  <span>{{ contact.email || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Drawer Tabs -->
          <div class="drawer-tabs flex gap-4">
            <button class="drawer-tab-btn" [class.active]="activeTab === 'timeline'" (click)="activeTab = 'timeline'">
              Timeline & Activities
            </button>
            <button class="drawer-tab-btn" [class.active]="activeTab === 'notes'" (click)="activeTab = 'notes'">
              Internal Notes
            </button>
            <button class="drawer-tab-btn" [class.active]="activeTab === 'attachments'" (click)="activeTab = 'attachments'">
              Attachments ({{ leadAttachments.length }})
            </button>
          </div>

          <!-- Drawer Tab Content 1: Timeline -->
          <div class="tab-content" *ngIf="activeTab === 'timeline'">
            
            <!-- Log Interaction Form -->
            <div class="log-activity-form">
              <h4>Log Interaction</h4>
              <div class="flex gap-3 margin-y-2">
                <select [(ngModel)]="newActivity.activityType" class="activity-type-select">
                  <option value="Call">Phone Call</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meeting">Meeting</option>
                </select>
                <input type="text" placeholder="Interaction Subject (e.g. Discussed pricing)" [(ngModel)]="newActivity.subject" />
              </div>
              <textarea placeholder="Write interaction outcome notes here..." [(ngModel)]="newActivity.description" rows="3"></textarea>
              
              <!-- Next Action Followup -->
              <div class="followup-scheduling flex align-center justify-between gap-3 margin-y-2">
                <div class="flex align-center gap-2">
                  <input type="checkbox" id="scheduleFollowup" [(ngModel)]="scheduleFollowup" />
                  <label for="scheduleFollowup">Schedule next follow-up action</label>
                </div>
                <input 
                  type="datetime-local" 
                  *ngIf="scheduleFollowup" 
                  [(ngModel)]="newActivity.nextActionDate" 
                />
              </div>

              <div class="flex justify-end gap-2">
                <button class="btn btn-primary btn-sm" (click)="onLogActivity()">Log Activity</button>
              </div>
            </div>

            <!-- Activity Timeline list -->
            <div class="activity-timeline">
              <div class="timeline-item" *ngFor="let act of selectedLeadDetails?.activities">
                <span class="material-icons-outlined timeline-icon" [ngClass]="getActivityIconClass(act.activityType)">
                  {{ getActivityIcon(act.activityType) }}
                </span>
                <div class="timeline-body">
                  <div class="timeline-header flex justify-between">
                    <span class="timeline-subject">{{ act.subject }}</span>
                    <span class="timeline-date">{{ act.activityDate | date:'short' }}</span>
                  </div>
                  <p class="timeline-text">{{ act.description }}</p>
                  <span class="timeline-outcome" *ngIf="act.outcome">Outcome: {{ act.outcome }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Drawer Tab Content 2: Notes -->
          <div class="tab-content" *ngIf="activeTab === 'notes'">
            <!-- Add Note Form -->
            <div class="log-activity-form" style="margin-bottom: 16px; border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md);">
              <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 6px;">Add Internal Note</h4>
              <textarea placeholder="Write internal note details..." [(ngModel)]="newNoteText" rows="3" style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 12px; outline: none; resize: vertical; margin-bottom: 8px; font-family: inherit; font-size: 13px;"></textarea>
              <div class="flex justify-end">
                <button class="btn btn-primary btn-sm" [disabled]="!newNoteText.trim()" (click)="onAddNote()">Save Note</button>
              </div>
            </div>

            <div class="notes-list">
              <div class="note-card" *ngFor="let n of selectedLeadDetails?.notes">
                <p class="note-text">{{ n.note }}</p>
                <div class="note-meta flex justify-between">
                  <span>Logged by User</span>
                  <span>{{ n.createdAt | date:'short' }}</span>
                </div>
              </div>
              
              <div *ngIf="selectedLeadDetails?.notes?.length === 0" class="text-center py-6 text-secondary font-sm italic">
                No internal notes logged yet.
              </div>
            </div>
          </div>

          <!-- Drawer Tab Content 3: Attachments -->
          <div class="tab-content" *ngIf="activeTab === 'attachments'">
            <!-- File Uploader -->
            <div class="attachment-upload-form flex flex-col gap-2">
              <label class="font-bold font-sm">Upload New Document</label>
              <div class="flex gap-2 align-center">
                <input type="file" (change)="onFileSelected($event)" #fileInput style="display: none;" />
                <button type="button" class="btn btn-secondary flex align-center gap-1 btn-sm" (click)="fileInput.click()">
                  <span class="material-icons-outlined font-sm">file_upload</span> Select File
                </button>
                <span class="selected-filename text-secondary font-xs" *ngIf="selectedFile">{{ selectedFile.name }}</span>
                <span class="selected-filename text-secondary font-xs italic" *ngIf="!selectedFile">No file chosen</span>
              </div>
              <div class="flex justify-end gap-2 mt-2" *ngIf="selectedFile">
                <button type="button" class="btn btn-secondary btn-sm" (click)="selectedFile = null">Cancel</button>
                <button type="button" class="btn btn-primary btn-sm" (click)="onUploadFile()">Upload</button>
              </div>
            </div>

            <!-- Attachments List -->
            <div class="attachments-list flex flex-col gap-2 mt-3">
              <div *ngFor="let att of leadAttachments" class="attachment-card border bg-main">
                <div class="flex align-center gap-3">
                  <span class="material-icons-outlined text-secondary">description</span>
                  <div class="flex flex-col">
                    <span class="font-bold font-sm text-main attachment-title" [title]="att.fileName">{{ att.fileName }}</span>
                    <span class="text-secondary font-xs">{{ (att.fileSize / 1024) | number:'1.0-1' }} KB • {{ att.uploadedAt | date:'short' }}</span>
                  </div>
                </div>
                <a [href]="env.serverUrl + att.filePath" target="_blank" class="btn btn-secondary btn-xs flex align-center gap-1">
                  <span class="material-icons-outlined font-sm">download</span> Download
                </a>
              </div>
              
              <div *ngIf="leadAttachments.length === 0" class="text-center py-6 text-secondary font-sm italic">
                No attachments uploaded yet.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- 2. Create Lead Modal Overlay -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        
        <div class="modal-header flex justify-between align-center">
          <h2>Register New Lead</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitCreateLead($event)">
            
            <!-- Warning Alert for Duplicates -->
            <div class="alert alert-warning flex align-center gap-3" *ngIf="duplicateWarning">
              <span class="material-icons-outlined">warning</span>
              <div>
                <strong>Warning: Duplicate detected!</strong> A lead with the phone 
                <strong>{{ newLeadData.primaryPhone }}</strong> already exists in the system. 
                You can still save this to track it as a multi-inquiry.
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Full Customer Name *</label>
              <input type="text" [(ngModel)]="newLeadData.fullName" name="fullName" required placeholder="Enter full name" />
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Primary Phone *</label>
                <input 
                  type="text" 
                  [(ngModel)]="newLeadData.primaryPhone" 
                  (ngModelChange)="checkDuplicatePhone()"
                  name="primaryPhone" 
                  required 
                  placeholder="e.g. +251..." 
                />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Secondary Phone</label>
                <input 
                  type="text" 
                  [(ngModel)]="newLeadData.secondaryPhone" 
                  name="secondaryPhone" 
                  placeholder="Secondary phone" 
                />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Primary Email</label>
                <input type="email" [(ngModel)]="newLeadData.primaryEmail" name="primaryEmail" placeholder="customer@email.com" />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Secondary Email</label>
                <input type="email" [(ngModel)]="newLeadData.secondaryEmail" name="secondaryEmail" placeholder="secondary@email.com" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Gender</label>
                <select [(ngModel)]="newLeadData.gender" name="gender">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Preferred Contact Method</label>
                <select [(ngModel)]="newLeadData.preferredContactMethod" name="preferredContactMethod">
                  <option value="">Select Method</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telegram">Telegram</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Nationality</label>
                <input type="text" [(ngModel)]="newLeadData.nationality" name="nationality" placeholder="e.g. Ethiopian" />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Country of Residence</label>
                <input type="text" [(ngModel)]="newLeadData.country" name="country" placeholder="e.g. Ethiopia" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>City of Residence</label>
                <input type="text" [(ngModel)]="newLeadData.city" name="city" placeholder="e.g. Addis Ababa" />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Interested Property / Project Type</label>
                <input type="text" [(ngModel)]="newLeadData.interestedPropertyType" name="interestedPropertyType" placeholder="e.g. 3 Bedroom Apartment" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Budget Minimum (ETB)</label>
                <input type="number" [(ngModel)]="newLeadData.budgetMin" name="budgetMin" placeholder="Min budget" />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Budget Maximum (ETB)</label>
                <input type="number" [(ngModel)]="newLeadData.budgetMax" name="budgetMax" placeholder="Max budget" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Lead Source *</label>
                <select [(ngModel)]="newLeadData.leadSourceId" name="leadSourceId" required>
                  <option [value]="0">Select Lead Source</option>
                  <option *ngFor="let s of metadata?.sources" [value]="s.id">{{ s.sourceName }}</option>
                </select>
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Assign to Sales Agent</label>
                <select [(ngModel)]="newLeadData.assignedSalesAgentId" name="assignedSalesAgentId">
                  <option [value]="0">Select Agent</option>
                  <option *ngFor="let a of metadata?.agents" [value]="a.id">{{ a.fullName }}</option>
                </select>
              </div>
            </div>

            <!-- Additional Contacts Form Section -->
            <div class="additional-contacts-section">
              <div class="flex justify-between align-center pb-2 mb-3" style="border-bottom: 1px solid var(--border-color);">
                <span class="section-subtitle flex align-center gap-2">
                  <span class="material-icons-outlined text-secondary">contact_phone</span>
                  Additional Contacts
                </span>
                <button type="button" class="btn btn-secondary btn-sm flex align-center gap-1" (click)="addContactRow()">
                  <span class="material-icons-outlined font-sm">add</span> Add Contact
                </button>
              </div>

              <div class="contact-rows flex flex-col gap-3">
                <div *ngFor="let contact of newLeadData.contacts; let i = index" class="contact-row flex flex-col gap-2 p-3 bg-main border relative">
                  <button type="button" class="delete-row-btn absolute top-2 right-2" (click)="removeContactRow(i)" style="background: none; border: none; cursor: pointer; color: var(--color-lost);">
                    <span class="material-icons-outlined font-sm">delete</span>
                  </button>
                  
                  <div class="form-row flex gap-2">
                    <div class="form-group flex-1 flex flex-col">
                      <label>Contact Name *</label>
                      <input type="text" [(ngModel)]="contact.contactName" name="contactName_{{i}}" required placeholder="Name" style="padding: 6px 10px;" />
                    </div>
                    <div class="form-group flex-1 flex flex-col">
                      <label>Relationship *</label>
                      <select [(ngModel)]="contact.relationshipType" name="relationshipType_{{i}}" required style="padding: 6px 10px; min-width: 100px;">
                        <option value="Spouse">Spouse</option>
                        <option value="Partner">Partner</option>
                        <option value="Lawyer">Lawyer</option>
                        <option value="Agent">Agent</option>
                        <option value="Relative">Relative</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-row flex gap-2">
                    <div class="form-group flex-1 flex flex-col">
                      <label>Phone</label>
                      <input type="text" [(ngModel)]="contact.phone" name="phone_{{i}}" placeholder="Phone" style="padding: 6px 10px;" />
                    </div>
                    <div class="form-group flex-1 flex flex-col">
                      <label>Email</label>
                      <input type="email" [(ngModel)]="contact.email" name="email_{{i}}" placeholder="Email" style="padding: 6px 10px;" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Inquiry Remarks / Internal Notes</label>
              <textarea [(ngModel)]="newLeadData.remarks" name="remarks" placeholder="Enter inquiry details, call logs, or preferences..." rows="3"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newLeadData.fullName || !newLeadData.primaryPhone || newLeadData.leadSourceId === 0">
                Save Registered Lead
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>

    <!-- 3. Convert Lead to Opportunity Modal Overlay -->
    <div class="modal-overlay" *ngIf="showConvertModal" (click)="closeConvertModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        
        <div class="modal-header flex justify-between align-center">
          <h2>Convert Lead to Opportunity</h2>
          <button class="header-icon-btn close-btn" (click)="closeConvertModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitConvertOpportunity($event)">
            
            <div class="form-group flex flex-col">
              <label>Opportunity Title *</label>
              <input type="text" [(ngModel)]="convertData.title" name="title" required placeholder="Opportunity Title" />
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Estimated Value (ETB) *</label>
                <input type="number" [(ngModel)]="convertData.estimatedValue" name="estimatedValue" required placeholder="Estimated value" />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Expected Close Date *</label>
                <input type="date" [(ngModel)]="convertData.expectedCloseDate" name="expectedCloseDate" required />
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Inquiry Remarks / Conversion Notes</label>
              <textarea [(ngModel)]="convertData.remarks" name="remarks" placeholder="Enter conversion notes..." rows="3"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeConvertModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!convertData.title || !convertData.estimatedValue || !convertData.expectedCloseDate">
                Convert to Opportunity
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class LeadsComponent implements OnInit {
  env = environment;
  private crmService = inject(CrmService);
  private marketingService = inject(MarketingService);
  public authService = inject(AuthService);

  campaigns: any[] = [];
  leadAttribution: any = null;
  attributionForm = {
    campaignId: 0,
    leadScore: 85,
    conversionProbability: 75,
    acquisitionCost: 5000
  };

  metadata: any = null;
  leads: any[] = [];
  totalLeads = 0;

  // Search & Filter state
  filters = {
    search: '',
    statusId: 0,
    sourceId: 0,
    agentId: 0,
    budgetMin: '',
    budgetMax: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 8
  };

  searchTimeout: any;

  // Details Drawer state
  showDrawer = false;
  selectedLead: any = null;
  selectedLeadDetails: any = null;
  activeTab = 'timeline';
  leadAttachments: any[] = [];
  selectedFile: File | null = null;

  // Convert Lead Modal state
  showConvertModal = false;
  convertData = {
    title: '',
    estimatedValue: 0,
    expectedCloseDate: '',
    remarks: ''
  };

  // Create Lead Modal state
  showCreateModal = false;
  duplicateWarning = false;
  newLeadData = {
    fullName: '',
    gender: '',
    primaryPhone: '',
    secondaryPhone: '',
    primaryEmail: '',
    secondaryEmail: '',
    nationality: '',
    city: '',
    country: '',
    preferredContactMethod: '',
    budgetMin: null,
    budgetMax: null,
    interestedPropertyType: '',
    leadSourceId: 0,
    assignedSalesAgentId: 0,
    remarks: '',
    contacts: [] as any[]
  };

  // Log Activity Form state
  newActivity = {
    activityType: 'Call',
    subject: '',
    description: '',
    performedBy: 1,
    outcome: '',
    nextActionDate: ''
  };
  scheduleFollowup = false;
  newNoteText = '';

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.filters.search = params['search'];
      }
      this.loadMetadata();
      this.loadLeads();
      this.loadCampaigns();
    });
  }

  loadCampaigns() {
    this.marketingService.getCampaigns().subscribe({
      next: (res) => this.campaigns = res,
      error: (err) => console.error('Error fetching campaigns:', err)
    });
  }

  loadMetadata() {
    this.crmService.getMetadata().subscribe({
      next: (res) => {
        this.metadata = res;
      },
      error: (err) => console.error('Error fetching metadata:', err)
    });
  }

  loadLeads() {
    this.crmService.getLeads(this.filters).subscribe({
      next: (res) => {
        this.leads = res.data;
        this.totalLeads = res.total;

        // Auto-open drawer if search finds exactly one lead
        if (this.filters.search && this.leads.length === 1) {
          this.openDetailsDrawer(this.leads[0]);
        }
      },
      error: (err) => console.error('Error loading leads:', err)
    });
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadLeads();
    }, 400);
  }

  selectStatus(statusId: number) {
    this.filters.statusId = statusId;
    this.filters.page = 1;
    this.loadLeads();
  }

  prevPage() {
    if (this.filters.page > 1) {
      this.filters.page--;
      this.loadLeads();
    }
  }

  nextPage() {
    if ((this.filters.page * this.filters.limit) < this.totalLeads) {
      this.filters.page++;
      this.loadLeads();
    }
  }

  getInitials(name: string): string {
    if (!name) return 'LD';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getBadgeClass(statusName: string): string {
    switch (statusName) {
      case 'New': return 'badge-new';
      case 'Contacted': return 'badge-contacted';
      case 'Qualified': return 'badge-qualified';
      case 'Proposal Sent': return 'badge-proposal';
      case 'Converted': return 'badge-converted';
      case 'Lost': return 'badge-lost';
      default: return 'badge-new';
    }
  }

  getExportCsvUrl(): string {
    return this.crmService.getExportUrl(this.filters);
  }

  // Create Modal Actions
  openCreateModal() {
    this.showCreateModal = true;
    this.duplicateWarning = false;
    this.newLeadData = {
      fullName: '',
      gender: '',
      primaryPhone: '',
      secondaryPhone: '',
      primaryEmail: '',
      secondaryEmail: '',
      nationality: '',
      city: '',
      country: '',
      preferredContactMethod: '',
      budgetMin: null,
      budgetMax: null,
      interestedPropertyType: '',
      leadSourceId: 0,
      assignedSalesAgentId: 0,
      remarks: '',
      contacts: [] as any[]
    };
  }

  addContactRow() {
    this.newLeadData.contacts.push({
      contactName: '',
      relationshipType: 'Spouse',
      phone: '',
      email: '',
      isPrimary: false,
      notes: ''
    });
  }

  removeContactRow(index: number) {
    this.newLeadData.contacts.splice(index, 1);
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  checkDuplicatePhone() {
    // Simple frontend detection: check if phone matches any lead in current list
    if (this.newLeadData.primaryPhone.length > 5) {
      const match = this.leads.find(l => l.primaryPhone === this.newLeadData.primaryPhone);
      this.duplicateWarning = !!match;
    } else {
      this.duplicateWarning = false;
    }
  }

  onSubmitCreateLead(event: Event) {
    event.preventDefault();
    
    // Quick validation
    if (this.newLeadData.leadSourceId === 0) return;

    // Build payload mapping 0 to null for selects
    const payload = {
      ...this.newLeadData,
      leadSourceId: +this.newLeadData.leadSourceId,
      assignedSalesAgentId: this.newLeadData.assignedSalesAgentId ? +this.newLeadData.assignedSalesAgentId : undefined
    };

    this.crmService.createLead(payload).subscribe({
      next: (res) => {
        this.closeCreateModal();
        this.loadLeads();
      },
      error: (err) => {
        console.error('Error creating lead:', err);
      }
    });
  }

  openConvertModal() {
    if (!this.selectedLeadDetails) return;
    const estVal = this.selectedLeadDetails.budgetMax || this.selectedLeadDetails.budgetMin || 0;
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    this.convertData = {
      title: `${this.selectedLeadDetails.fullName} - Bole Property Opportunity`,
      estimatedValue: +estVal,
      expectedCloseDate: thirtyDaysLater,
      remarks: this.selectedLeadDetails.remarks || ''
    };
    this.showConvertModal = true;
  }

  closeConvertModal() {
    this.showConvertModal = false;
  }

  onSubmitConvertOpportunity(event: Event) {
    event.preventDefault();
    if (!this.selectedLeadDetails) return;

    this.crmService.convertLeadToOpportunity(this.selectedLeadDetails.id, this.convertData).subscribe({
      next: (res) => {
        this.closeConvertModal();
        this.loadLeadDetails(this.selectedLeadDetails.id);
        this.loadLeads();
      },
      error: (err) => {
        console.error('Error converting lead to opportunity:', err);
      }
    });
  }

  // Slide-out Drawer Actions
  openDetailsDrawer(lead: any) {
    this.selectedLead = lead;
    this.activeTab = 'timeline';
    this.showDrawer = true;
    this.newActivity = {
      activityType: 'Call',
      subject: '',
      description: '',
      performedBy: 1,
      outcome: '',
      nextActionDate: ''
    };
    this.scheduleFollowup = false;
    this.loadLeadDetails(lead.id);
  }

  loadLeadDetails(id: number) {
    this.crmService.getLeadDetails(id).subscribe({
      next: (res) => {
        this.selectedLeadDetails = res;
      },
      error: (err) => console.error('Error fetching lead details:', err)
    });
    this.crmService.getAttachments(id).subscribe({
      next: (res) => {
        this.leadAttachments = res;
      },
      error: (err) => console.error('Error fetching attachments:', err)
    });
    this.marketingService.getMarketingLeads().subscribe({
      next: (res) => {
        this.leadAttribution = res.find((ml: any) => ml.lead && ml.lead.id === id);
        if (this.leadAttribution) {
          this.attributionForm.campaignId = this.leadAttribution.campaign?.id || 0;
          this.attributionForm.leadScore = this.leadAttribution.leadScore || 85;
          this.attributionForm.conversionProbability = this.leadAttribution.conversionProbability || 75;
          this.attributionForm.acquisitionCost = this.leadAttribution.acquisitionCost || 5000;
        } else {
          this.leadAttribution = null;
          this.attributionForm = {
            campaignId: 0,
            leadScore: 85,
            conversionProbability: 75,
            acquisitionCost: 5000
          };
        }
      },
      error: (err) => console.error('Error fetching marketing leads:', err)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onUploadFile() {
    if (!this.selectedLeadDetails || !this.selectedFile) return;

    this.crmService.uploadAttachment(this.selectedLeadDetails.id, this.selectedFile).subscribe({
      next: (res) => {
        this.selectedFile = null;
        this.loadLeadDetails(this.selectedLeadDetails.id); // reload details and list
      },
      error: (err) => console.error('Error uploading file:', err)
    });
  }

  closeDetailsDrawer() {
    this.showDrawer = false;
    this.selectedLead = null;
    this.selectedLeadDetails = null;
  }

  onUpdateLeadStatus(statusId: any) {
    if (!this.selectedLeadDetails) return;
    this.crmService.updateStatus(this.selectedLeadDetails.id, +statusId).subscribe({
      next: (res) => {
        this.loadLeadDetails(this.selectedLeadDetails.id);
        this.loadLeads(); // refresh main table
      },
      error: (err) => console.error('Error changing status:', err)
    });
  }

  onAssignSalesAgent(agentId: any) {
    if (!this.selectedLeadDetails) return;
    this.crmService.assignAgent(this.selectedLeadDetails.id, +agentId).subscribe({
      next: (res) => {
        this.loadLeadDetails(this.selectedLeadDetails.id);
        this.loadLeads(); // refresh main table
      },
      error: (err) => console.error('Error assigning agent:', err)
    });
  }

  onLogActivity() {
    if (!this.selectedLeadDetails || !this.newActivity.description) return;

    const payload = {
      ...this.newActivity,
      outcome: this.newActivity.subject || 'Logged interaction',
      nextActionDate: this.scheduleFollowup ? this.newActivity.nextActionDate : undefined
    };

    this.crmService.addActivity(this.selectedLeadDetails.id, payload).subscribe({
      next: (res) => {
        this.newActivity = {
          activityType: 'Call',
          subject: '',
          description: '',
          performedBy: 1,
          outcome: '',
          nextActionDate: ''
        };
        this.scheduleFollowup = false;
        this.loadLeadDetails(this.selectedLeadDetails.id);
        this.loadLeads(); // refresh main table contacted state/followups
      },
      error: (err) => console.error('Error logging activity:', err)
    });
  }

  onAddNote() {
    if (!this.selectedLeadDetails || !this.newNoteText.trim()) return;
    this.crmService.addLeadNote(this.selectedLeadDetails.id, this.newNoteText).subscribe({
      next: () => {
        this.newNoteText = '';
        this.loadLeadDetails(this.selectedLeadDetails.id);
      },
      error: (err) => console.error('Error adding note:', err)
    });
  }

  onSaveAttribution() {
    if (!this.selectedLeadDetails || !this.attributionForm.campaignId) return;

    const payload = {
      leadId: this.selectedLeadDetails.id,
      campaignId: +this.attributionForm.campaignId,
      leadSourceId: this.selectedLeadDetails.leadSource?.id || 8, // fallback to Billboard
      leadScore: +this.attributionForm.leadScore,
      conversionProbability: +this.attributionForm.conversionProbability,
      acquisitionCost: +this.attributionForm.acquisitionCost
    };

    this.marketingService.trackMarketingLead(payload).subscribe({
      next: (res) => {
        this.loadLeadDetails(this.selectedLeadDetails.id);
      },
      error: (err) => console.error('Error saving marketing attribution:', err)
    });
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
