import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Opportunities Pipeline</h1>
        <p>Manage qualified opportunity stages, expected closure dates, and agent assignments</p>
      </div>
    </header>

    <!-- Pipeline Metrics Panel -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">trending_up</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Pipeline Value</span>
          <span class="metric-value">ETB {{ stats.pipelineValue | number:'1.0-0' }}</span>
          <span class="metric-subtext">{{ stats.activeCount }} active deals</span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">emoji_events</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Closed Won</span>
          <span class="metric-value">ETB {{ stats.wonValue | number:'1.0-0' }}</span>
          <span class="metric-subtext">{{ stats.wonCount }} deals closed</span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-red">
          <span class="material-icons-outlined">thumb_down</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Closed Lost</span>
          <span class="metric-value">ETB {{ stats.lostValue | number:'1.0-0' }}</span>
          <span class="metric-subtext">{{ stats.lostCount }} deals lost</span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-orange">
          <span class="material-icons-outlined">insights</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Avg Probability</span>
          <span class="metric-value">{{ stats.avgProbability | number:'1.0-1' }}%</span>
          <span class="metric-subtext">Weighted Win Rate</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace Area -->
    <div class="agents-workspace card">
      
      <!-- Filter Bar -->
      <div class="filter-bar flex justify-between align-center gap-4">
        
        <!-- Search box -->
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by name, code, title..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()"
          />
        </div>

        <!-- Dropdowns -->
        <div class="flex align-center gap-3">
          <select [(ngModel)]="filters.stageId" (change)="loadOpportunities()">
            <option [value]="0">All Stages</option>
            <option *ngFor="let stage of metadata?.stages" [value]="stage.id">{{ stage.stageName }}</option>
          </select>

          <select [(ngModel)]="filters.agentId" (change)="loadOpportunities()">
            <option [value]="0">All Agents</option>
            <option *ngFor="let a of metadata?.agents" [value]="a.id">{{ a.fullName }}</option>
          </select>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Opportunity Title</th>
              <th>Linked Customer</th>
              <th>Pipeline Stage</th>
              <th>Est. Value (ETB)</th>
              <th>Win %</th>
              <th>Assigned Agent</th>
              <th>Expected Close</th>
              <th style="width: 60px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let opp of opportunities" class="clickable-row" (click)="openDetailsDrawer(opp)">
              <td class="lead-code-cell">
                <span class="font-bold">{{ opp.opportunityCode }}</span>
              </td>
              <td>
                <div class="font-bold text-main">{{ opp.title }}</div>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="font-bold text-main">{{ opp.lead?.fullName }}</span>
                  <span class="text-secondary font-xs">{{ opp.lead?.primaryPhone }}</span>
                </div>
              </td>
              <td>
                <span class="badge" [style.background-color]="opp.opportunityStage?.colorCode + '15'" [style.color]="opp.opportunityStage?.colorCode" [style.border]="'1px solid ' + opp.opportunityStage?.colorCode + '30'">
                  {{ opp.opportunityStage?.stageName }}
                </span>
              </td>
              <td class="font-bold text-main">
                {{ opp.estimatedValue | number:'1.0-0' }}
              </td>
              <td>
                <div class="flex align-center gap-2">
                  <span class="font-bold font-xs">{{ opp.probabilityPercent | number:'1.0-0' }}%</span>
                  <div style="width: 60px; height: 6px; background-color: var(--border-color); border-radius: var(--radius-round); overflow: hidden;">
                    <div [style.width.%]="opp.probabilityPercent" [style.background-color]="opp.opportunityStage?.colorCode || '#7c3aed'" style="height: 100%;"></div>
                  </div>
                </div>
              </td>
              <td>
                <span class="font-semibold text-main">{{ opp.assignedSalesAgent?.fullName || 'Unassigned' }}</span>
              </td>
              <td>
                <span>{{ opp.expectedCloseDate ? (opp.expectedCloseDate | date:'mediumDate') : '-' }}</span>
              </td>
              <td>
                <button class="header-icon-btn text-brand" (click)="$event.stopPropagation(); openDetailsDrawer(opp)">
                  <span class="material-icons-outlined">visibility</span>
                </button>
              </td>
            </tr>
            <tr *ngIf="opportunities.length === 0">
              <td colspan="9" class="text-center text-secondary py-8 italic">
                No active opportunities found matching the criteria.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table Pagination Footer -->
        <div class="table-footer flex justify-between align-center border-top">
          <span class="pagination-info">Showing {{ opportunities.length }} of {{ totalOpportunities }} opportunities</span>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" [disabled]="filters.page <= 1" (click)="prevPage()">Prev</button>
            <button class="btn btn-secondary btn-sm" [disabled]="(filters.page * filters.limit) >= totalOpportunities" (click)="nextPage()">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. Slide-out Opportunity Details Drawer -->
    <div class="details-drawer-overlay" *ngIf="showDrawer" (click)="closeDetailsDrawer()">
      <div class="details-drawer" (click)="$event.stopPropagation()">
        
        <!-- Drawer Header -->
        <div class="drawer-header flex justify-between align-center">
          <div class="flex align-center gap-3">
            <div class="drawer-avatar bg-info" style="background-color: var(--brand-primary); color: white;">
              {{ getInitials(selectedOppDetails?.title) }}
            </div>
            <div class="flex flex-col">
              <h2>{{ selectedOppDetails?.title }}</h2>
              <div class="flex align-center gap-2">
                <span class="badge" [style.background-color]="selectedOppDetails?.opportunityStage?.colorCode + '15'" [style.color]="selectedOppDetails?.opportunityStage?.colorCode" [style.border]="'1px solid ' + selectedOppDetails?.opportunityStage?.colorCode + '30'">
                  {{ selectedOppDetails?.opportunityStage?.stageName }}
                </span>
                <span class="lead-code-cell font-xs font-semibold">{{ selectedOppDetails?.opportunityCode }}</span>
              </div>
            </div>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeDetailsDrawer()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="drawer-body">
          
          <!-- Quick Status Actions -->
          <div class="drawer-actions flex gap-3 flex-wrap">
            <div class="action-select flex flex-col flex-1" style="min-width: 140px;">
              <label>Update Stage</label>
              <select 
                [ngModel]="selectedOppDetails?.opportunityStage?.id" 
                (ngModelChange)="onUpdateStage($event)"
              >
                <option *ngFor="let st of metadata?.stages" [value]="st.id">{{ st.stageName }}</option>
              </select>
            </div>

            <!-- Won / Lost buttons -->
            <div class="flex gap-2 align-end flex-1" style="min-width: 180px;">
              <button 
                *ngIf="!selectedOppDetails?.isWon && !selectedOppDetails?.isLost"
                class="btn btn-success flex-1 flex align-center justify-center gap-1 btn-sm" 
                (click)="onMarkWon()"
                style="height: 38px;"
              >
                <span class="material-icons-outlined font-sm">emoji_events</span> Win Deal
              </button>
              <button 
                *ngIf="!selectedOppDetails?.isWon && !selectedOppDetails?.isLost"
                class="btn btn-secondary flex-1 flex align-center justify-center gap-1 btn-sm" 
                (click)="openCloseLostModal()"
                style="height: 38px; color: var(--color-lost); border-color: var(--color-lost);"
              >
                <span class="material-icons-outlined font-sm">thumb_down</span> Lose Deal
              </button>
              <div *ngIf="selectedOppDetails?.isWon" class="badge-success text-center py-2 px-4 w-full rounded font-bold uppercase text-xs" style="background-color: rgba(16, 185, 129, 0.1); color: rgb(16, 185, 129); border: 1px solid rgba(16, 185, 129, 0.2);">
                🎉 CLOSED WON DEAL
              </div>
              <div *ngIf="selectedOppDetails?.isLost" class="badge-lost text-center py-2 px-4 w-full rounded font-bold uppercase text-xs" style="background-color: rgba(239, 68, 68, 0.1); color: rgb(239, 68, 68); border: 1px solid rgba(239, 68, 68, 0.2);">
                CLOSED LOST DEAL
              </div>
            </div>
          </div>

          <!-- View Original Lead Link -->
          <div class="drawer-section" style="margin-bottom: 16px;">
            <a routerLink="/leads" [queryParams]="{ search: selectedOppDetails?.lead?.leadCode }" class="btn btn-secondary flex align-center justify-center gap-2" style="width: 100%; padding: 10px; color: var(--brand-primary); border-color: var(--brand-primary);">
              <span class="material-icons-outlined">person</span>
              View Original Lead: <strong>{{ selectedOppDetails?.lead?.leadCode }}</strong>
            </a>
          </div>

          <!-- Opportunity Profile Grid -->
          <div class="drawer-section">
            <h3>Deal Information</h3>
            <div class="profile-details-grid">
              <div class="detail-item">
                <span class="label">Customer Name</span>
                <span class="val">{{ selectedOppDetails?.lead?.fullName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Customer Phone</span>
                <span class="val">{{ selectedOppDetails?.lead?.primaryPhone }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Assigned Agent</span>
                <span class="val">{{ selectedOppDetails?.assignedSalesAgent?.fullName || 'Unassigned' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Estimated Value</span>
                <span class="val">ETB {{ selectedOppDetails?.estimatedValue | number }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Win Probability</span>
                <span class="val">{{ selectedOppDetails?.probabilityPercent }}%</span>
              </div>
              <div class="detail-item">
                <span class="label">Expected Close</span>
                <span class="val">{{ selectedOppDetails?.expectedCloseDate ? (selectedOppDetails.expectedCloseDate | date:'mediumDate') : '-' }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedOppDetails?.isLost">
                <span class="label" style="color: var(--color-lost);">Loss Reason</span>
                <span class="val" style="color: var(--color-lost);">{{ selectedOppDetails?.lossReason?.reasonName }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedOppDetails?.isWon || selectedOppDetails?.isLost">
                <span class="label">Close Date</span>
                <span class="val">{{ selectedOppDetails?.actualCloseDate | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <!-- Remarks / Scope notes -->
          <div class="drawer-section" *ngIf="selectedOppDetails?.remarks">
            <h3>Inquiry & Closing Remarks</h3>
            <div class="remarks-box">
              {{ selectedOppDetails?.remarks }}
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
          </div>

          <!-- Tab Content 1: Timeline -->
          <div class="tab-content" *ngIf="activeTab === 'timeline'">
            
            <!-- Log Activity Form -->
            <div class="log-activity-form">
              <h4>Log Interaction Activity</h4>
              <div class="flex gap-3 margin-y-2">
                <select [(ngModel)]="newActivity.activityType" class="activity-type-select">
                  <option value="Meeting">In-Person Meeting</option>
                  <option value="Call">Phone Call</option>
                  <option value="Proposal">Price Proposal</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Site Visit">Site Visit</option>
                </select>
                <input type="text" placeholder="Subject (e.g. Completed site tour)" [(ngModel)]="newActivity.subject" />
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

              <div class="flex justify-end gap-2 mt-2">
                <button class="btn btn-primary btn-sm" (click)="onLogActivity()">Log Activity</button>
              </div>
            </div>

            <!-- Activity Timeline list -->
            <div class="activity-timeline">
              <div class="timeline-item" *ngFor="let act of selectedOppDetails?.activities">
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

          <!-- Tab Content 2: Notes -->
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
              <div class="note-card" *ngFor="let n of selectedOppDetails?.notes">
                <p class="note-text">{{ n.note }}</p>
                <div class="note-meta flex justify-between">
                  <span>Logged by User</span>
                  <span>{{ n.createdAt | date:'short' }}</span>
                </div>
              </div>
              <div *ngIf="selectedOppDetails?.notes?.length === 0" class="text-center py-6 text-secondary font-sm italic">
                No internal notes logged yet.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- 2. Close Lost Dialog Modal -->
    <div class="modal-overlay" *ngIf="showCloseLostModal" (click)="closeCloseLostModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        
        <div class="modal-header flex justify-between align-center">
          <h2>Mark Opportunity as Lost</h2>
          <button class="header-icon-btn close-btn" (click)="closeCloseLostModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitCloseLost($event)">
            
            <div class="form-group flex flex-col">
              <label>Select Loss Reason *</label>
              <select [(ngModel)]="closeLostData.lossReasonId" name="lossReasonId" required>
                <option [value]="0">Select reason</option>
                <option *ngFor="let reason of metadata?.lossReasons" [value]="reason.id">{{ reason.reasonName }}</option>
              </select>
            </div>

            <div class="form-group flex flex-col">
              <label>Remarks / Competitor Details</label>
              <textarea [(ngModel)]="closeLostData.remarks" name="remarks" placeholder="Provide details on why the opportunity was lost..." rows="3"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeCloseLostModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="closeLostData.lossReasonId === 0">
                Confirm Lost Deal
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  `
})
export class OpportunitiesComponent implements OnInit {
  private crmService = inject(CrmService);

  opportunities: any[] = [];
  totalOpportunities = 0;
  metadata: any = null;

  // Pipeline Metrics
  stats = {
    pipelineValue: 0,
    activeCount: 0,
    wonValue: 0,
    wonCount: 0,
    lostValue: 0,
    lostCount: 0,
    avgProbability: 0
  };

  // Search / Filters
  filters = {
    search: '',
    stageId: 0,
    agentId: 0,
    page: 1,
    limit: 8
  };
  searchTimeout: any;

  // Drawer details
  showDrawer = false;
  selectedOppDetails: any = null;
  activeTab = 'timeline';

  // Log activity
  newActivity = {
    activityType: 'Meeting',
    subject: '',
    description: '',
    performedBy: 1,
    outcome: '',
    nextActionDate: ''
  };
  scheduleFollowup = false;
  newNoteText = '';

  // Close Lost modal overlay
  showCloseLostModal = false;
  closeLostData = {
    lossReasonId: 0,
    remarks: ''
  };

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.filters.search = params['search'];
      }
      this.loadMetadata();
      this.loadOpportunities();
    });
  }

  loadMetadata() {
    this.crmService.getOpportunityMetadata().subscribe({
      next: (res) => {
        this.metadata = res;
      },
      error: (err) => console.error('Error fetching opportunity metadata:', err)
    });
  }

  loadOpportunities() {
    this.crmService.getOpportunities(this.filters).subscribe({
      next: (res) => {
        this.opportunities = res.data;
        this.totalOpportunities = res.total;
        this.calculateStats();

        // Auto-open drawer if search finds exactly one opportunity
        if (this.filters.search && this.opportunities.length === 1) {
          this.openDetailsDrawer(this.opportunities[0]);
        }
      },
      error: (err) => console.error('Error fetching opportunities:', err)
    });
  }

  calculateStats() {
    // We can fetch aggregates from the loaded listing or compile it directly
    // Let's compute statistics dynamically for better responsiveness
    let pipeline = 0;
    let active = 0;
    let won = 0;
    let wonC = 0;
    let lost = 0;
    let lostC = 0;
    let totalProb = 0;

    // To prevent pagination-specific calculation skew, let's load all to calculate stats if needed
    // or calculate directly on current dataset. For simplicity, we calculate on the list
    this.opportunities.forEach(opp => {
      const est = Number(opp.estimatedValue) || 0;
      const prob = Number(opp.probabilityPercent) || 0;

      if (opp.isWon) {
        won += est;
        wonC++;
      } else if (opp.isLost) {
        lost += est;
        lostC++;
      } else {
        pipeline += est;
        active++;
        totalProb += prob;
      }
    });

    this.stats = {
      pipelineValue: pipeline,
      activeCount: active,
      wonValue: won,
      wonCount: wonC,
      lostValue: lost,
      lostCount: lostC,
      avgProbability: active > 0 ? (totalProb / active) : 0
    };
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadOpportunities();
    }, 400);
  }

  prevPage() {
    if (this.filters.page > 1) {
      this.filters.page--;
      this.loadOpportunities();
    }
  }

  nextPage() {
    if ((this.filters.page * this.filters.limit) < this.totalOpportunities) {
      this.filters.page++;
      this.loadOpportunities();
    }
  }

  getInitials(title: string): string {
    if (!title) return 'OP';
    return title.split(' ').map(t => t[0]).slice(0, 2).join('').toUpperCase();
  }

  openDetailsDrawer(opp: any) {
    this.activeTab = 'timeline';
    this.loadOpportunityDetails(opp.id);
  }

  loadOpportunityDetails(id: number) {
    this.crmService.getOpportunityDetails(id).subscribe({
      next: (res) => {
        this.selectedOppDetails = res;
        this.showDrawer = true;
      },
      error: (err) => console.error('Error loading opportunity details:', err)
    });
  }

  closeDetailsDrawer() {
    this.showDrawer = false;
    this.selectedOppDetails = null;
  }

  onUpdateStage(stageId: any) {
    if (!this.selectedOppDetails) return;
    this.crmService.updateOpportunityStage(this.selectedOppDetails.id, +stageId).subscribe({
      next: () => {
        this.loadOpportunityDetails(this.selectedOppDetails.id);
        this.loadOpportunities();
      },
      error: (err) => console.error('Error updating stage:', err)
    });
  }

  onMarkWon() {
    if (!this.selectedOppDetails) return;
    // Find Closed Won stage ID
    const wonStage = this.metadata?.stages?.find((s: any) => s.stageName === 'Closed Won');
    if (wonStage) {
      this.onUpdateStage(wonStage.id);
    }
  }

  openCloseLostModal() {
    this.closeLostData = {
      lossReasonId: 0,
      remarks: ''
    };
    this.showCloseLostModal = true;
  }

  closeCloseLostModal() {
    this.showCloseLostModal = false;
  }

  onSubmitCloseLost(event: Event) {
    event.preventDefault();
    if (!this.selectedOppDetails || this.closeLostData.lossReasonId === 0) return;

    const payload = {
      lossReasonId: +this.closeLostData.lossReasonId,
      remarks: this.closeLostData.remarks
    };

    this.crmService.closeOpportunityLost(this.selectedOppDetails.id, payload).subscribe({
      next: () => {
        this.closeCloseLostModal();
        this.loadOpportunityDetails(this.selectedOppDetails.id);
        this.loadOpportunities();
      },
      error: (err) => console.error('Error closing opportunity as lost:', err)
    });
  }

  onLogActivity() {
    if (!this.selectedOppDetails || !this.newActivity.subject) return;

    const payload: any = { ...this.newActivity };
    if (!this.scheduleFollowup) {
      delete payload.nextActionDate;
    }

    this.crmService.addOpportunityActivity(this.selectedOppDetails.id, payload).subscribe({
      next: () => {
        this.newActivity = {
          activityType: 'Meeting',
          subject: '',
          description: '',
          performedBy: 1,
          outcome: '',
          nextActionDate: ''
        };
        this.scheduleFollowup = false;
        this.loadOpportunityDetails(this.selectedOppDetails.id);
      },
      error: (err) => console.error('Error logging activity:', err)
    });
  }

  onAddNote() {
    if (!this.selectedOppDetails || !this.newNoteText.trim()) return;

    this.crmService.addOpportunityNote(this.selectedOppDetails.id, this.newNoteText).subscribe({
      next: () => {
        this.newNoteText = '';
        this.loadOpportunityDetails(this.selectedOppDetails.id);
      },
      error: (err) => console.error('Error adding internal note:', err)
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'Meeting': return 'groups';
      case 'Call': return 'phone';
      case 'Proposal': return 'file_present';
      case 'WhatsApp': return 'chat';
      case 'Site Visit': return 'home_work';
      case 'System': return 'settings';
      default: return 'history';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'Meeting': return 'timeline-icon-meeting';
      case 'Call': return 'timeline-icon-call';
      case 'Proposal': return 'timeline-icon-proposal';
      case 'WhatsApp': return 'timeline-icon-whatsapp';
      case 'Site Visit': return 'timeline-icon-visit';
      case 'System': return 'timeline-icon-system';
      default: return '';
    }
  }
}
