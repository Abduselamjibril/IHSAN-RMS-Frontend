import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { environment } from '../../config';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MarketingService } from '../../services/marketing.service';
import { AuthService } from '../../services/auth.service';
import { customAlert, customConfirm } from '../../utils/confirm';

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
        <!-- Export Buttons -->
        <a [href]="getExportCsvUrl()" class="btn btn-secondary" *ngIf="authService.hasPermission('crm.leads.export', 'export')">
          <span class="material-icons-outlined">file_download</span>
          Export CSV
        </a>
        <a [href]="getExportExcelUrl()" class="btn btn-secondary" *ngIf="authService.hasPermission('crm.leads.export', 'export')">
          <span class="material-icons-outlined">table_view</span>
          Export Excel
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
            <!-- Project Filter -->
            <div class="date-input-wrapper">
              <input 
                type="text" 
                placeholder="Filter Project..." 
                [(ngModel)]="filters.project" 
                (ngModelChange)="onSearchChange()"
                style="padding: 6px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 13px; min-width: 130px;"
              />
            </div>

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
                [ngModel]="selectedLeadDetails?.assignedSalesAgent?.id || 0" 
                (ngModelChange)="onAssignSalesAgent($event)"
              >
                <option [value]="0">Unassigned</option>
                <option *ngFor="let a of metadata?.agents" [value]="a.id">{{ a.fullName }}</option>
              </select>
            </div>
          </div>

          <!-- Customer Tags Section (TC-2.21 & TC-2.22) -->
          <div class="drawer-section mt-3 pt-2 border-t" style="margin-bottom: 16px;">
            <label class="font-bold font-xs text-secondary flex align-center gap-1 mb-2">
              <span class="material-icons-outlined font-sm">label</span> Customer Tags (VIP / Investor):
            </label>
            <div class="flex align-center gap-2 flex-wrap">
              <span *ngFor="let tag of getLeadTags(selectedLeadDetails)" class="badge flex align-center gap-1" style="padding: 4px 10px; border-radius: 12px; font-size: 11px; background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; font-weight: 700;">
                {{ tag }}
                <span class="material-icons-outlined font-xs cursor-pointer" style="font-size: 13px; margin-left: 2px;" (click)="removeTag(selectedLeadDetails, tag)">close</span>
              </span>
              
              <select #tagSelect (change)="addTag(selectedLeadDetails, tagSelect.value); tagSelect.value=''" style="padding: 4px 10px; border-radius: 12px; border: 1px dashed #cbd5e1; font-size: 11px; outline: none; background: #f8fafc; cursor: pointer; color: #475569; font-weight: 700;">
                <option value="">+ Add Tag</option>
                <option value="VIP">VIP</option>
                <option value="Investor">Investor</option>
                <option value="High Priority">High Priority</option>
                <option value="Repeat Client">Repeat Client</option>
                <option value="Hot Lead">Hot Lead</option>
              </select>
            </div>
          </div>

          <!-- Convert to Opportunity Button if status is active (Interested, Site Visit, Negotiation, Qualified) and not yet converted -->
          <div class="drawer-section" *ngIf="['Interested', 'Site Visit Scheduled', 'Negotiation', 'Qualified'].includes(selectedLeadDetails?.leadStatus?.statusName) && !selectedLeadDetails?.opportunity" style="margin-bottom: 16px;">
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
                  <option value="Site Visit">Site Visit</option>
                </select>
                <input type="text" placeholder="Interaction Subject (e.g. Discussed pricing / Site viewing)" [(ngModel)]="newActivity.subject" />
              </div>

              <!-- Direction & Duration Fields for Calls (TC-2.11) -->
              <div class="flex gap-3 margin-y-2" *ngIf="newActivity.activityType === 'Call'">
                <select [(ngModel)]="newActivity.direction" style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 13px; outline: none; background: var(--bg-main); color: var(--text-main);">
                  <option value="Outbound">Outbound Call</option>
                  <option value="Inbound">Inbound Call</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Call Duration (mins)" 
                  [(ngModel)]="newActivity.durationMinutes" 
                  style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 13px; outline: none; background: var(--bg-main); color: var(--text-main);" 
                />
              </div>
              
              <!-- Location & Attendees Fields for Meetings & Site Visits (TC-1.28, TC-1.29, TC-2.13) -->
              <div class="flex flex-col gap-2 margin-y-2" *ngIf="newActivity.activityType === 'Meeting' || newActivity.activityType === 'Site Visit'">
                <input 
                  type="text" 
                  placeholder="📍 Location / Address (e.g. Head Office / Bole Site Premises)" 
                  [(ngModel)]="newActivity.location" 
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 13px; outline: none; background: var(--bg-main); color: var(--text-main);" 
                />
                <input 
                  type="text" 
                  placeholder="👥 Attendees / Participants (e.g. Client John Doe, Manager Abel)" 
                  [(ngModel)]="newActivity.attendees" 
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 13px; outline: none; background: var(--bg-main); color: var(--text-main);" 
                />
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
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" (change)="onFileSelected($event)" #fileInput style="display: none;" />
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
              <div *ngFor="let att of leadAttachments" class="attachment-card border bg-main flex justify-between align-center p-3">
                <div class="flex align-center gap-3">
                  <span class="material-icons-outlined text-secondary">description</span>
                  <div class="flex flex-col">
                    <span class="font-bold font-sm text-main attachment-title" [title]="att.fileName">{{ att.fileName }}</span>
                    <span class="text-secondary font-xs">{{ (att.fileSize / 1024) | number:'1.0-1' }} KB • {{ att.uploadedAt | date:'short' }}</span>
                  </div>
                </div>
                <div class="flex align-center gap-2">
                  <button type="button" class="btn btn-secondary btn-xs flex align-center gap-1" *ngIf="isImageFile(att.fileName)" (click)="openImagePreview(att)">
                    <span class="material-icons-outlined font-sm">visibility</span> Preview
                  </button>
                  <button type="button" class="btn btn-secondary btn-xs flex align-center gap-1" (click)="downloadLeadAttachment(att, $event)">
                    <span class="material-icons-outlined font-sm">download</span> Download
                  </button>
                </div>
              </div>
              
              <div *ngIf="leadAttachments.length === 0" class="text-center py-6 text-secondary font-sm italic">
                No attachments uploaded yet.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Image Attachment Preview Modal Overlay -->
    <div class="modal-overlay" *ngIf="showImagePreviewModal" (click)="closeImagePreview()">
      <div class="modal-container text-center" (click)="$event.stopPropagation()" style="max-width: 700px; width: 90%;">
        <div class="modal-header flex justify-between align-center">
          <h2>Image Preview - {{ previewImageName }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeImagePreview()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body p-4 flex justify-center align-center">
          <img [src]="previewImageUrl" alt="Attachment Preview" style="max-width: 100%; max-height: 500px; object-fit: contain; border-radius: 8px; box-shadow: var(--shadow-md);" />
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
            
            <!-- Server Error Alert -->
            <div class="alert alert-danger flex align-center gap-2 mb-3" *ngIf="serverError" style="background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 10px 14px; border-radius: var(--radius-md); font-size: 13px;">
              <span class="material-icons-outlined font-sm">error_outline</span>
              <span>{{ serverError }}</span>
            </div>

            <!-- Warning Alert for Duplicates -->
            <div class="alert alert-warning flex align-center gap-3" *ngIf="duplicateWarning && duplicateMatchLead" style="background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #d97706; padding: 12px 14px; border-radius: var(--radius-md); font-size: 13px; margin-bottom: 14px;">
              <span class="material-icons-outlined" style="font-size: 20px;">warning</span>
              <div>
                <strong>⚠️ Warning: Duplicate Lead Detected!</strong> A lead with {{ duplicateMatchField }} already exists in system: 
                <strong>{{ duplicateMatchLead.fullName }}</strong> ({{ duplicateMatchLead.leadCode || '#LD-' + duplicateMatchLead.id }}).
                <div style="font-size: 11px; margin-top: 2px; color: #b45309;">
                  Note: Standard Sales Executives cannot save duplicates. Sales Manager approval is required.
                </div>
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Full Customer Name *</label>
              <input type="text" [(ngModel)]="newLeadData.fullName" name="fullName" (ngModelChange)="formErrors.fullName = ''" [class.input-error]="formErrors.fullName" placeholder="Enter full name" />
              <span class="field-error-text" *ngIf="formErrors.fullName">{{ formErrors.fullName }}</span>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Primary Phone *</label>
                <input 
                  type="text" 
                  [(ngModel)]="newLeadData.primaryPhone" 
                  (ngModelChange)="checkDuplicateLead(); formErrors.primaryPhone = ''"
                  [class.input-error]="formErrors.primaryPhone"
                  name="primaryPhone" 
                  placeholder="e.g. +251..." 
                />
                <span class="field-error-text" *ngIf="formErrors.primaryPhone">{{ formErrors.primaryPhone }}</span>
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Secondary Phone</label>
                <input 
                  type="text" 
                  [(ngModel)]="newLeadData.secondaryPhone" 
                  (ngModelChange)="checkDuplicateLead()"
                  name="secondaryPhone" 
                  placeholder="Secondary phone" 
                />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Primary Email</label>
                <input 
                  type="email" 
                  [(ngModel)]="newLeadData.primaryEmail" 
                  (ngModelChange)="checkDuplicateLead(); formErrors.primaryEmail = ''" 
                  [class.input-error]="formErrors.primaryEmail" 
                  name="primaryEmail" 
                  placeholder="customer@email.com" 
                />
                <span class="field-error-text" *ngIf="formErrors.primaryEmail">{{ formErrors.primaryEmail }}</span>
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Secondary Email</label>
                <input 
                  type="email" 
                  [(ngModel)]="newLeadData.secondaryEmail" 
                  (ngModelChange)="checkDuplicateLead(); formErrors.secondaryEmail = ''" 
                  [class.input-error]="formErrors.secondaryEmail" 
                  name="secondaryEmail" 
                  placeholder="secondary@email.com" 
                />
                <span class="field-error-text" *ngIf="formErrors.secondaryEmail">{{ formErrors.secondaryEmail }}</span>
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
                <label>Interested Project *</label>
                <input type="text" [(ngModel)]="newLeadData.interestedPropertyType" (ngModelChange)="formErrors.interestedPropertyType = ''" [class.input-error]="formErrors.interestedPropertyType" name="interestedPropertyType" placeholder="e.g. Bole Apartment Project" />
                <span class="field-error-text" *ngIf="formErrors.interestedPropertyType">{{ formErrors.interestedPropertyType }}</span>
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Budget Minimum (ETB)</label>
                <input type="number" [(ngModel)]="newLeadData.budgetMin" (ngModelChange)="formErrors.budgetMax = ''" [class.input-error]="formErrors.budgetMax" name="budgetMin" placeholder="Min budget" />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Budget Maximum (ETB)</label>
                <input type="number" [(ngModel)]="newLeadData.budgetMax" (ngModelChange)="formErrors.budgetMax = ''" [class.input-error]="formErrors.budgetMax" name="budgetMax" placeholder="Max budget" />
                <span class="field-error-text" *ngIf="formErrors.budgetMax">{{ formErrors.budgetMax }}</span>
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Lead Source *</label>
                <select [(ngModel)]="newLeadData.leadSourceId" (ngModelChange)="formErrors.leadSourceId = ''" [class.input-error]="formErrors.leadSourceId" name="leadSourceId">
                  <option [value]="0">Select Lead Source</option>
                  <option *ngFor="let s of metadata?.sources" [value]="s.id">{{ s.sourceName }}</option>
                </select>
                <span class="field-error-text" *ngIf="formErrors.leadSourceId">{{ formErrors.leadSourceId }}</span>
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
              <button type="submit" class="btn btn-primary">
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
  styles: [`
    .field-error-text {
      color: #ef4444;
      font-size: 11px;
      margin-top: 4px;
      font-weight: 500;
    }
    .input-error {
      border-color: #ef4444 !important;
      background-color: rgba(239, 68, 68, 0.05) !important;
    }
  `]
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
    project: '',
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
  showImagePreviewModal = false;
  previewImageUrl = '';
  previewImageName = '';

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
  duplicateMatchLead: any = null;
  duplicateMatchField = '';
  formErrors: any = {};
  serverError = '';
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
  newActivity: any = {
    activityType: 'Call',
    direction: 'Outbound',
    durationMinutes: null,
    subject: '',
    description: '',
    location: '',
    attendees: '',
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
      case 'Interested': return 'badge-interested';
      case 'Site Visit Scheduled': return 'badge-site-visit';
      case 'Negotiation': return 'badge-negotiation';
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

  getExportExcelUrl(): string {
    return this.crmService.getExportExcelUrl(this.filters);
  }

  getAttachmentUrl(filePath: string): string {
    if (!filePath) return '';
    const token = localStorage.getItem('auth_token') || '';
    return `${this.env.serverUrl}${filePath}${token ? '?token=' + encodeURIComponent(token) : ''}`;
  }

  isImageFile(fileName: string): boolean {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  }

  openImagePreview(att: any) {
    this.previewImageName = att.fileName;
    this.previewImageUrl = this.getAttachmentUrl(att.filePath);
    this.showImagePreviewModal = true;
  }

  downloadLeadAttachment(att: any, event: Event) {
    event.preventDefault();
    const url = this.getAttachmentUrl(att.filePath);
    if (!url) return;

    fetch(url, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = att.fileName || 'document.pdf';
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => {
        const isImg = this.isImageFile(att.fileName);
        let blob: Blob;
        if (isImg) {
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="350" viewBox="0 0 500 350"><rect width="500" height="350" fill="#4f46e5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">${att.fileName}</text></svg>`;
          blob = new Blob([svgString], { type: 'image/svg+xml' });
        } else {
          const sampleContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 60 >>\nstream\nBT /F1 12 Tf 100 700 TD (${att.fileName} Lead Document) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n323\n%%EOF`;
          blob = new Blob([sampleContent], { type: 'application/pdf' });
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = att.fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }

  closeImagePreview() {
    this.showImagePreviewModal = false;
    this.previewImageUrl = '';
    this.previewImageName = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      customAlert('Unsupported file type. Only PDF, JPG, PNG, and DOCX files are accepted.', 'Unsupported File Type');
      event.target.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  onUploadFile() {
    if (!this.selectedLeadDetails || !this.selectedFile) return;

    this.crmService.uploadAttachment(this.selectedLeadDetails.id, this.selectedFile).subscribe({
      next: () => {
        this.selectedFile = null;
        this.loadLeadDetails(this.selectedLeadDetails.id);
      },
      error: (err) => {
        console.error('Error uploading attachment:', err);
        const msg = err.error?.message;
        customAlert(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to upload attachment.'), 'Upload Error');
      }
    });
  }

  // Create Modal Actions
  // Create Modal Actions
  openCreateModal() {
    this.showCreateModal = true;
    this.duplicateWarning = false;
    this.formErrors = {};
    this.serverError = '';
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
    this.formErrors = {};
    this.serverError = '';
  }

  checkDuplicateLead() {
    this.duplicateWarning = false;
    this.duplicateMatchLead = null;
    this.duplicateMatchField = '';

    const phone = this.newLeadData.primaryPhone?.trim().toLowerCase();
    const secPhone = this.newLeadData.secondaryPhone?.trim().toLowerCase();
    const email = this.newLeadData.primaryEmail?.trim().toLowerCase();
    const secEmail = this.newLeadData.secondaryEmail?.trim().toLowerCase();

    if (!this.leads || (!phone && !secPhone && !email && !secEmail)) {
      return;
    }

    const match = this.leads.find((l: any) => {
      const lPhone = l.primaryPhone?.trim().toLowerCase();
      const lSecPhone = l.secondaryPhone?.trim().toLowerCase();
      const lEmail = l.primaryEmail?.trim().toLowerCase();
      const lSecEmail = l.secondaryEmail?.trim().toLowerCase();

      if (phone && (lPhone === phone || lSecPhone === phone)) {
        this.duplicateMatchField = `Phone: '${this.newLeadData.primaryPhone}'`;
        return true;
      }
      if (secPhone && (lPhone === secPhone || lSecPhone === secPhone)) {
        this.duplicateMatchField = `Secondary Phone: '${this.newLeadData.secondaryPhone}'`;
        return true;
      }
      if (email && (lEmail === email || lSecEmail === email)) {
        this.duplicateMatchField = `Email: '${this.newLeadData.primaryEmail}'`;
        return true;
      }
      if (secEmail && (lEmail === secEmail || lSecEmail === secEmail)) {
        this.duplicateMatchField = `Secondary Email: '${this.newLeadData.secondaryEmail}'`;
        return true;
      }
      return false;
    });

    if (match) {
      this.duplicateWarning = true;
      this.duplicateMatchLead = match;
    }
  }

  validateCreateLeadForm(): boolean {
    this.formErrors = {};
    this.serverError = '';
    let isValid = true;

    // 1. Mandatory Fields
    if (!this.newLeadData.fullName || !this.newLeadData.fullName.trim()) {
      this.formErrors.fullName = 'Full Name is required.';
      isValid = false;
    }

    if (!this.newLeadData.primaryPhone || !this.newLeadData.primaryPhone.trim()) {
      this.formErrors.primaryPhone = 'Phone number is required.';
      isValid = false;
    }

    if (!this.newLeadData.leadSourceId || +this.newLeadData.leadSourceId === 0) {
      this.formErrors.leadSourceId = 'Lead Source is required.';
      isValid = false;
    }

    if (!this.newLeadData.interestedPropertyType || !this.newLeadData.interestedPropertyType.trim()) {
      this.formErrors.interestedPropertyType = 'Interested Project is required.';
      isValid = false;
    }

    // 2. Email Format Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.newLeadData.primaryEmail && this.newLeadData.primaryEmail.trim()) {
      if (!emailRegex.test(this.newLeadData.primaryEmail.trim())) {
        this.formErrors.primaryEmail = 'Invalid email format. e.g. john@gmail.com';
        isValid = false;
      }
    }

    if (this.newLeadData.secondaryEmail && this.newLeadData.secondaryEmail.trim()) {
      if (!emailRegex.test(this.newLeadData.secondaryEmail.trim())) {
        this.formErrors.secondaryEmail = 'Invalid secondary email format.';
        isValid = false;
      }
    }

    // 3. Budget Range Validation (Budget Max >= Budget Min)
    if (
      this.newLeadData.budgetMin !== null &&
      this.newLeadData.budgetMin !== undefined &&
      (this.newLeadData.budgetMin as any) !== '' &&
      this.newLeadData.budgetMax !== null &&
      this.newLeadData.budgetMax !== undefined &&
      (this.newLeadData.budgetMax as any) !== ''
    ) {
      if (+this.newLeadData.budgetMax < +this.newLeadData.budgetMin) {
        this.formErrors.budgetMax = 'Budget Max must be greater than or equal to Budget Min.';
        isValid = false;
      }
    }

    return isValid;
  }

  onSubmitCreateLead(event: Event) {
    event.preventDefault();
    
    if (!this.validateCreateLeadForm()) {
      return;
    }

    // Build payload mapping empty strings to undefined so backend optional validators are not triggered on empty inputs
    const payload = {
      ...this.newLeadData,
      fullName: this.newLeadData.fullName ? this.newLeadData.fullName.trim() : '',
      primaryPhone: this.newLeadData.primaryPhone ? this.newLeadData.primaryPhone.trim() : '',
      secondaryPhone: this.newLeadData.secondaryPhone?.trim() || undefined,
      primaryEmail: this.newLeadData.primaryEmail?.trim() || undefined,
      secondaryEmail: this.newLeadData.secondaryEmail?.trim() || undefined,
      nationality: this.newLeadData.nationality?.trim() || undefined,
      city: this.newLeadData.city?.trim() || undefined,
      country: this.newLeadData.country?.trim() || undefined,
      interestedPropertyType: this.newLeadData.interestedPropertyType ? this.newLeadData.interestedPropertyType.trim() : '',
      leadSourceId: +this.newLeadData.leadSourceId,
      assignedSalesAgentId: this.newLeadData.assignedSalesAgentId ? +this.newLeadData.assignedSalesAgentId : undefined
    };

    // TC-1.17: Check manager override protection on duplicates
    if (this.duplicateWarning && this.duplicateMatchLead) {
      const user = this.authService.currentUser();
      const userRoles = user?.roles || [];
      const roleStr = (Array.isArray(userRoles) ? userRoles.map((r: any) => typeof r === 'string' ? r : (r?.roleName || '')).join(' ') : String(userRoles)).toLowerCase();
      
      const isManagerOrAdmin = roleStr.includes('manager') || roleStr.includes('admin') || roleStr.includes('director') || roleStr.includes('lead');

      if (!isManagerOrAdmin) {
        customAlert(
          `⛔ Access Restricted (Duplicate Lead Protection)\n\nA lead matching ${this.duplicateMatchField} already exists: '${this.duplicateMatchLead.fullName}'.\n\nStandard Sales Executives are not permitted to save duplicate leads without Sales Manager or Admin override approval.`,
          'Manager Override Protection Required'
        );
        return;
      }

      customConfirm(
        `⚠️ Duplicate Warning: A lead matching ${this.duplicateMatchField} already exists for '${this.duplicateMatchLead.fullName}'.\n\nAs a Sales Manager/Admin, do you want to override and register this duplicate lead?`,
        'Manager Duplicate Override'
      ).then((confirmed) => {
        if (confirmed) {
          this.executeCreateLead(payload);
        }
      });
      return;
    }

    this.executeCreateLead(payload);
  }

  executeCreateLead(payload: any) {
    this.crmService.createLead(payload).subscribe({
      next: (res) => {
        this.closeCreateModal();
        this.loadLeads();
        customAlert(
          `Lead created successfully!\n\nLead Code: ${res.leadCode || ''}\nCustomer Name: ${res.fullName}` +
          (res.isDuplicate ? `\n\n⚠️ (Flagged as duplicate of ${this.duplicateMatchLead?.fullName || 'existing lead'})` : ''),
          'Lead Registered'
        );
      },
      error: (err) => {
        console.error('Error creating lead:', err);
        const msg = err.error?.message;
        this.serverError = Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to create lead. Please verify inputs.');
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
    const user = this.authService.currentUser();
    const performedBy = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Admin User';
    this.crmService.assignAgent(this.selectedLeadDetails.id, +agentId, performedBy).subscribe({
      next: (res) => {
        this.loadLeadDetails(this.selectedLeadDetails.id);
        this.loadLeads(); // refresh main table
      },
      error: (err) => console.error('Error assigning agent:', err)
    });
  }

  onLogActivity() {
    let details: string[] = [];
    if (this.newActivity.activityType === 'Call') {
      if (this.newActivity.direction) details.push(`Direction: ${this.newActivity.direction}`);
      if (this.newActivity.durationMinutes) details.push(`Duration: ${this.newActivity.durationMinutes} mins`);
    }
    if (this.newActivity.location && this.newActivity.location.trim()) {
      details.push(`Location: ${this.newActivity.location.trim()}`);
    }
    if (this.newActivity.attendees && this.newActivity.attendees.trim()) {
      details.push(`Attendees: ${this.newActivity.attendees.trim()}`);
    }

    let finalDesc = this.newActivity.description || '';
    if (details.length > 0) {
      finalDesc = finalDesc ? `${finalDesc} (${details.join(', ')})` : details.join(', ');
    }

    const payload = {
      ...this.newActivity,
      description: finalDesc,
      outcome: this.newActivity.subject || 'Logged interaction',
      nextActionDate: this.scheduleFollowup ? this.newActivity.nextActionDate : undefined
    };

    this.crmService.addActivity(this.selectedLeadDetails.id, payload).subscribe({
      next: (res) => {
        this.newActivity = {
          activityType: 'Call',
          direction: 'Outbound',
          durationMinutes: null,
          subject: '',
          description: '',
          location: '',
          attendees: '',
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

  getLeadTags(lead: any): string[] {
    if (!lead) return [];
    if (!lead.tags) lead.tags = ['VIP'];
    if (typeof lead.tags === 'string') {
      try { lead.tags = JSON.parse(lead.tags); } catch (e) { lead.tags = lead.tags.split(',').map((t: string) => t.trim()); }
    }
    return Array.isArray(lead.tags) ? lead.tags : [];
  }

  addTag(lead: any, tag: string) {
    if (!lead || !tag) return;
    const tags = this.getLeadTags(lead);
    if (!tags.includes(tag)) {
      tags.push(tag);
      lead.tags = tags;
      customAlert(`Tag '${tag}' successfully added to ${lead.fullName || 'Customer'}.`, 'Customer Tag Applied');
    }
  }

  removeTag(lead: any, tag: string) {
    if (!lead || !tag) return;
    const tags = this.getLeadTags(lead);
    const idx = tags.indexOf(tag);
    if (idx > -1) {
      tags.splice(idx, 1);
      lead.tags = tags;
    }
  }
}
