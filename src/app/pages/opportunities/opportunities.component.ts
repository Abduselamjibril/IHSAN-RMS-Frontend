import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { customAlert, customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="app-header flex justify-between align-center">
      <div class="app-title-section">
        <h1>Opportunities Pipeline</h1>
        <p>Manage qualified opportunity stages, expected closure dates, and agent assignments</p>
      </div>
      <div class="flex align-center gap-2">
        <button class="btn" [class.btn-primary]="currentView === 'list'" [class.btn-secondary]="currentView !== 'list'" (click)="currentView = 'list'">
          <span class="material-icons-outlined">view_list</span> List View
        </button>
        <button class="btn" [class.btn-primary]="currentView === 'kanban'" [class.btn-secondary]="currentView !== 'kanban'" (click)="currentView = 'kanban'">
          <span class="material-icons-outlined">view_kanban</span> Kanban View
        </button>
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
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by name, code, title..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()"
          />
        </div>

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

      <!-- List View Table Container -->
      <div class="table-container" *ngIf="currentView === 'list'">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Customer</th>
              <th>Interested Property</th>
              <th>Value</th>
              <th>Stage</th>
              <th>Assigned Agent</th>
              <th>Expected Close</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let opp of opportunities" (click)="openDetailsDrawer(opp)" class="clickable-row">
              <td>
                <div class="flex align-center gap-3">
                  <div class="avatar-circle">
                    {{ getInitials(opp.title) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-main">{{ opp.title }}</span>
                    <span class="text-secondary font-xs">{{ opp.opportunityCode }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="font-bold text-main">{{ opp.lead?.fullName || 'N/A' }}</span>
              </td>
              <td>
                <span class="badge badge-secondary font-xs">{{ opp.lead?.interestedPropertyType || 'Unspecified' }}</span>
              </td>
              <td>
                <span class="font-bold text-indigo">ETB {{ opp.estimatedValue | number }}</span>
              </td>
              <td>
                <span class="badge" [style.background-color]="opp.opportunityStage?.colorCode + '22'" [style.color]="opp.opportunityStage?.colorCode">
                  {{ opp.opportunityStage?.stageName }} ({{ opp.probabilityPercent }}%)
                </span>
              </td>
              <td>
                <span class="font-bold text-main">{{ opp.assignedSalesAgent?.fullName || 'Unassigned' }}</span>
              </td>
              <td>
                <span class="text-secondary font-sm">{{ opp.expectedCloseDate ? (opp.expectedCloseDate | date:'mediumDate') : '-' }}</span>
              </td>
              <td>
                <button class="btn btn-secondary btn-xs" (click)="$event.stopPropagation(); openDetailsDrawer(opp)">
                  Details
                </button>
              </td>
            </tr>

            <tr *ngIf="opportunities.length === 0">
              <td colspan="8" class="text-center py-8 text-secondary">
                No opportunities found matching your filters.
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination-bar flex justify-between align-center padding-3">
          <span class="text-secondary font-sm">
            Showing {{ opportunities.length }} of {{ totalOpportunities }} opportunities
          </span>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" [disabled]="filters.page === 1" (click)="prevPage()">Prev</button>
            <button class="btn btn-secondary btn-sm" [disabled]="(filters.page * filters.limit) >= totalOpportunities" (click)="nextPage()">Next</button>
          </div>
        </div>
      </div>

      <!-- Kanban View Container -->
      <div class="kanban-board-container p-4 overflow-x-auto" *ngIf="currentView === 'kanban'">
        <div class="kanban-flex-row flex gap-4" style="min-width: 1400px; align-items: flex-start;">
          <div *ngFor="let stage of metadata?.stages" class="kanban-column card p-3" style="width: 280px; min-height: 500px; background: var(--bg-surface-secondary); border-radius: var(--radius-md);">
            <div class="kanban-column-header flex justify-between align-center mb-3 pb-2 border-b">
              <h3 class="font-bold font-sm flex align-center gap-2" [style.color]="stage.colorCode">
                <span class="stage-dot" [style.background-color]="stage.colorCode" style="width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                {{ stage.stageName }}
              </h3>
              <span class="badge badge-secondary font-xs font-bold">{{ getOpportunitiesByStage(stage.id).length }}</span>
            </div>

            <div class="kanban-cards-list flex flex-col gap-3">
              <div 
                *ngFor="let opp of getOpportunitiesByStage(stage.id)" 
                class="kanban-card card p-3 cursor-pointer hover:shadow-md transition-all"
                (click)="openDetailsDrawer(opp)"
                style="background: var(--bg-surface-main); border-left: 4px solid;"
                [style.border-left-color]="stage.colorCode">
                
                <div class="flex justify-between align-center mb-2">
                  <span class="font-xs font-bold text-secondary">{{ opp.opportunityCode }}</span>
                  <span class="font-xs font-bold text-indigo">ETB {{ opp.estimatedValue | number }}</span>
                </div>

                <h4 class="font-bold font-sm mb-1 text-main">{{ opp.title }}</h4>
                <p class="font-xs text-secondary mb-2 flex align-center gap-1">
                  <span class="material-icons-outlined font-xs">person</span> {{ opp.lead?.fullName || 'N/A' }}
                </p>

                <div class="flex justify-between align-center font-xs text-secondary mt-2 pt-2 border-t">
                  <span class="badge badge-secondary font-xs" *ngIf="opp.lead?.interestedPropertyType">
                    {{ opp.lead?.interestedPropertyType }}
                  </span>
                  <span class="font-xs text-main font-bold">
                    {{ opp.assignedSalesAgent?.fullName ? (opp.assignedSalesAgent.fullName.split(' ')[0]) : 'Unassigned' }}
                  </span>
                </div>
              </div>

              <div *ngIf="getOpportunitiesByStage(stage.id).length === 0" class="text-center py-6 text-secondary font-xs italic">
                No deals in this stage
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Details Drawer Overlay -->
    <div class="drawer-overlay" *ngIf="showDrawer" (click)="closeDetailsDrawer()">
      <div class="drawer-container" (click)="$event.stopPropagation()">
        
        <div class="drawer-header flex justify-between align-center">
          <div>
            <h2>{{ selectedOppDetails?.title }}</h2>
            <span class="text-secondary font-xs">Code: {{ selectedOppDetails?.opportunityCode }}</span>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeDetailsDrawer()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="drawer-body">
          
          <!-- Stage Progress Selector & Controls -->
          <div class="drawer-section bg-main p-4 border-radius-md mb-4">
            <label class="font-bold font-sm text-secondary">Pipeline Stage Control</label>
            <div class="flex align-center gap-3 mt-2 flex-wrap">
              <select [ngModel]="selectedOppDetails?.opportunityStage?.id" (change)="onUpdateStage($any($event.target).value)" class="flex-1 p-2 border-radius-md">
                <option *ngFor="let s of metadata?.stages" [value]="s.id">{{ s.stageName }} ({{ s.probabilityPercent }}%)</option>
              </select>

              <button class="btn btn-success btn-sm" (click)="onMarkWon()" *ngIf="!selectedOppDetails?.isWon">
                <span class="material-icons-outlined font-sm">emoji_events</span> Mark Won
              </button>

              <button class="btn btn-danger btn-sm" (click)="openCloseLostModal()" *ngIf="!selectedOppDetails?.isLost">
                <span class="material-icons-outlined font-sm">thumb_down</span> Mark Lost
              </button>

              <button class="btn btn-primary btn-sm" (click)="openReopenModal()" *ngIf="selectedOppDetails?.isLost">
                <span class="material-icons-outlined font-sm">replay</span> Reopen Opportunity
              </button>
            </div>
          </div>

          <!-- Deal Information -->
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
                <span class="label">Interested Property</span>
                <span class="val font-bold text-indigo">{{ selectedOppDetails?.lead?.interestedPropertyType || 'Unspecified' }}</span>
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
                <span class="label">Expected Close</span>
                <span class="val">{{ selectedOppDetails?.expectedCloseDate ? (selectedOppDetails.expectedCloseDate | date:'mediumDate') : '-' }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedOppDetails?.isLost">
                <span class="label" style="color: var(--color-lost);">Loss Reason</span>
                <span class="val" style="color: var(--color-lost);">{{ selectedOppDetails?.lossReason?.reasonName || 'Closed Lost' }}</span>
              </div>
            </div>
          </div>

          <!-- Remarks / Scope notes -->
          <div class="drawer-section" *ngIf="selectedOppDetails?.remarks">
            <h3>Inquiry & Closing Remarks</h3>
            <div class="remarks-box p-3 bg-secondary border-radius-md font-sm">
              {{ selectedOppDetails?.remarks }}
            </div>
          </div>

          <!-- Drawer Tabs -->
          <div class="drawer-tabs flex gap-4 mt-4">
            <button class="drawer-tab-btn" [class.active]="activeTab === 'timeline'" (click)="activeTab = 'timeline'">
              Timeline & Activities
            </button>
            <button class="drawer-tab-btn" [class.active]="activeTab === 'notes'" (click)="activeTab = 'notes'">
              Internal Notes
            </button>
          </div>

          <!-- Tab Content 1: Timeline -->
          <div class="tab-content mt-3" *ngIf="activeTab === 'timeline'">
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

              <!-- Location Field for Meetings & Site Visits (TC-1.28 & TC-1.29) -->
              <div class="margin-y-2" *ngIf="newActivity.activityType === 'Meeting' || newActivity.activityType === 'In-Person Meeting' || newActivity.activityType === 'Site Visit'">
                <input 
                  type="text" 
                  placeholder="📍 Location / Address (e.g. Head Office / Site 2)" 
                  [(ngModel)]="newActivity.location" 
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 13px; outline: none; background: var(--bg-main); color: var(--text-main);" 
                />
              </div>

              <textarea placeholder="Write interaction outcome notes here..." [(ngModel)]="newActivity.description" rows="3"></textarea>
              
              <div class="followup-scheduling flex align-center justify-between gap-3 margin-y-2">
                <div class="flex align-center gap-2">
                  <input type="checkbox" id="scheduleFollowup" [(ngModel)]="scheduleFollowup" />
                  <label for="scheduleFollowup">Schedule next follow-up action</label>
                </div>
                <input type="datetime-local" *ngIf="scheduleFollowup" [(ngModel)]="newActivity.nextActionDate" />
              </div>

              <div class="flex justify-end gap-2 mt-2">
                <button class="btn btn-primary btn-sm" (click)="onLogActivity()">Log Activity</button>
              </div>
            </div>

            <!-- Activity Timeline list -->
            <div class="activity-timeline mt-4">
              <div class="timeline-item flex gap-3 mb-3" *ngFor="let act of selectedOppDetails?.activities">
                <span class="material-icons-outlined timeline-icon" [ngClass]="getActivityIconClass(act.activityType)">
                  {{ getActivityIcon(act.activityType) }}
                </span>
                <div class="timeline-body flex-1 p-2 border-radius-md bg-secondary">
                  <div class="timeline-header flex justify-between">
                    <span class="timeline-subject font-bold font-sm">{{ act.subject }}</span>
                    <span class="timeline-date font-xs text-secondary">{{ act.activityDate | date:'short' }}</span>
                  </div>
                  <p class="timeline-desc font-xs mt-1 text-secondary">{{ act.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Content 2: Notes -->
          <div class="tab-content mt-3" *ngIf="activeTab === 'notes'">
            <div class="add-note-form flex flex-col gap-2">
              <textarea placeholder="Write internal team note..." [(ngModel)]="newNoteText" rows="3"></textarea>
              <div class="flex justify-end">
                <button class="btn btn-primary btn-sm" (click)="onAddNote()">Add Note</button>
              </div>
            </div>

            <div class="notes-list flex flex-col gap-2 mt-3">
              <div class="note-card p-3 border-radius-md bg-secondary" *ngFor="let n of selectedOppDetails?.notes">
                <p class="note-text font-sm">{{ n.note }}</p>
                <div class="note-meta text-secondary font-xs mt-2 flex justify-between">
                  <span>Logged by Team Member</span>
                  <span>{{ n.createdAt | date:'short' }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Close Lost Modal Overlay -->
    <div class="modal-overlay" *ngIf="showCloseLostModal" (click)="closeCloseLostModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header flex justify-between align-center">
          <h2>Mark Opportunity as Lost</h2>
          <button class="header-icon-btn close-btn" (click)="closeCloseLostModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body p-4">
          <form (submit)="onSubmitCloseLost($event)" class="flex flex-col gap-3">
            <div class="form-group flex flex-col gap-1">
              <label class="font-bold font-sm">Select Loss Reason *</label>
              <select [(ngModel)]="closeLostData.lossReasonId" name="lossReasonId" required class="p-2 border-radius-md">
                <option [value]="0">Select reason</option>
                <option *ngFor="let reason of metadata?.lossReasons" [value]="reason.id">{{ reason.reasonName }}</option>
              </select>
            </div>

            <div class="form-group flex flex-col gap-1">
              <label class="font-bold font-sm">Remarks / Competitor Details</label>
              <textarea [(ngModel)]="closeLostData.remarks" name="remarks" placeholder="Provide details on why the opportunity was lost..." rows="3" class="p-2 border-radius-md"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-3">
              <button type="button" class="btn btn-secondary" (click)="closeCloseLostModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="closeLostData.lossReasonId === 0">
                Confirm Lost Deal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Reopen Opportunity Modal Overlay -->
    <div class="modal-overlay" *ngIf="showReopenModal" (click)="closeReopenModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header flex justify-between align-center">
          <h2>Reopen Lost Opportunity</h2>
          <button class="header-icon-btn close-btn" (click)="closeReopenModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body p-4">
          <form (submit)="onSubmitReopen($event)" class="flex flex-col gap-3">
            <div class="form-group flex flex-col gap-1">
              <label class="font-bold font-sm">Reopen Reason *</label>
              <textarea [(ngModel)]="reopenReason" name="reopenReason" required placeholder="Explain why this lost deal is being reopened..." rows="3" class="p-2 border-radius-md"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-3">
              <button type="button" class="btn btn-secondary" (click)="closeReopenModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!reopenReason.trim()">
                Reopen Deal
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
  private route = inject(ActivatedRoute);

  currentView: 'list' | 'kanban' = 'list';
  opportunities: any[] = [];
  totalOpportunities = 0;
  metadata: any = null;

  stats = {
    pipelineValue: 0,
    activeCount: 0,
    wonValue: 0,
    wonCount: 0,
    lostValue: 0,
    lostCount: 0,
    avgProbability: 0
  };

  filters = {
    search: '',
    stageId: 0,
    agentId: 0,
    page: 1,
    limit: 100
  };
  searchTimeout: any;

  showDrawer = false;
  selectedOppDetails: any = null;
  activeTab = 'timeline';

  newActivity: any = {
    activityType: 'Meeting',
    subject: '',
    description: '',
    location: '',
    performedBy: 1,
    outcome: '',
    nextActionDate: ''
  };
  scheduleFollowup = false;
  newNoteText = '';

  showCloseLostModal = false;
  closeLostData = {
    lossReasonId: 0,
    remarks: ''
  };

  showReopenModal = false;
  reopenReason = '';

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
      error: (err) => console.error('Error fetching metadata:', err)
    });
  }

  loadOpportunities() {
    this.crmService.getOpportunities(this.filters).subscribe({
      next: (res) => {
        this.opportunities = res.data;
        this.totalOpportunities = res.total;
        this.calculateStats();

        if (this.filters.search && this.opportunities.length === 1 && this.currentView === 'list') {
          this.openDetailsDrawer(this.opportunities[0]);
        }
      },
      error: (err) => console.error('Error fetching opportunities:', err)
    });
  }

  getOpportunitiesByStage(stageId: number): any[] {
    return this.opportunities.filter(o => o.opportunityStage?.id === stageId);
  }

  calculateStats() {
    let pipeline = 0;
    let active = 0;
    let won = 0;
    let wonC = 0;
    let lost = 0;
    let lostC = 0;
    let totalProb = 0;

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
      error: (err) => console.error('Error loading details:', err)
    });
  }

  closeDetailsDrawer() {
    this.showDrawer = false;
    this.selectedOppDetails = null;
  }

  onUpdateStage(stageId: any) {
    if (!this.selectedOppDetails) return;
    const targetStage = this.metadata?.stages?.find((s: any) => s.id === +stageId);
    if (!targetStage) return;

    // TC-2.08: Reopening a Lost Opportunity via dropdown requires a reason
    if (this.selectedOppDetails.isLost) {
      this.openReopenModal();
      return;
    }

    // TC-2.05: Changing stage to 'Closed Lost' via dropdown requires reason & notes
    if (targetStage.stageName === 'Closed Lost' || targetStage.stageName === 'Lost' || (targetStage.isClosed && targetStage.probabilityPercent === 0)) {
      this.openCloseLostModal();
      return;
    }

    // TC-2.04: Check stage transition validation (confirm jump directly to Won)
    if (targetStage.stageName === 'Closed Won' || targetStage.stageName === 'Won' || targetStage.probabilityPercent === 100) {
      customConfirm(
        `⚠️ Confirm Stage Transition: Are you sure you want to transition '${this.selectedOppDetails.title}' directly to '${targetStage.stageName}'?`,
        'Confirm Stage Advance'
      ).then((confirmed: boolean) => {
        if (confirmed) {
          this.executeStageUpdate(+stageId);
        } else {
          this.loadOpportunityDetails(this.selectedOppDetails.id);
        }
      });
      return;
    }

    this.executeStageUpdate(+stageId);
  }

  executeStageUpdate(stageId: number) {
    this.crmService.updateOpportunityStage(this.selectedOppDetails.id, stageId).subscribe({
      next: () => {
        this.loadOpportunityDetails(this.selectedOppDetails.id);
        this.loadOpportunities();
      },
      error: (err) => console.error('Error updating stage:', err)
    });
  }

  onMarkWon() {
    if (!this.selectedOppDetails) return;
    const wonStage = this.metadata?.stages?.find((s: any) => s.stageName === 'Won' || s.stageName === 'Closed Won');
    if (wonStage) {
      this.onUpdateStage(wonStage.id);
    }
  }

  openCloseLostModal() {
    this.closeLostData = { lossReasonId: 0, remarks: '' };
    this.showCloseLostModal = true;
  }

  closeCloseLostModal() {
    this.showCloseLostModal = false;
  }

  onSubmitCloseLost(event: Event) {
    event.preventDefault();
    if (!this.selectedOppDetails || this.closeLostData.lossReasonId === 0) return;

    this.crmService.closeOpportunityLost(this.selectedOppDetails.id, this.closeLostData).subscribe({
      next: () => {
        this.closeCloseLostModal();
        this.loadOpportunityDetails(this.selectedOppDetails.id);
        this.loadOpportunities();
      },
      error: (err) => console.error('Error closing as lost:', err)
    });
  }

  openReopenModal() {
    this.reopenReason = '';
    this.showReopenModal = true;
  }

  closeReopenModal() {
    this.showReopenModal = false;
  }

  onSubmitReopen(event: Event) {
    event.preventDefault();
    if (!this.selectedOppDetails || !this.reopenReason.trim()) return;

    this.crmService.reopenOpportunity(this.selectedOppDetails.id, this.reopenReason.trim()).subscribe({
      next: () => {
        this.closeReopenModal();
        this.loadOpportunityDetails(this.selectedOppDetails.id);
        this.loadOpportunities();
      },
      error: (err) => {
        console.error('Error reopening opportunity:', err);
        customAlert(err.error?.message || 'Failed to reopen opportunity.', 'Error');
      }
    });
  }

  onLogActivity() {
    if (!this.selectedOppDetails || !this.newActivity.subject) return;

    let finalDesc = this.newActivity.description || '';
    if (this.newActivity.location && this.newActivity.location.trim()) {
      finalDesc = finalDesc ? `${finalDesc} (Location: ${this.newActivity.location.trim()})` : `Location: ${this.newActivity.location.trim()}`;
    }

    const payload: any = { ...this.newActivity, description: finalDesc };
    if (!this.scheduleFollowup) delete payload.nextActionDate;

    this.crmService.addOpportunityActivity(this.selectedOppDetails.id, payload).subscribe({
      next: () => {
        this.newActivity = { activityType: 'Meeting', subject: '', description: '', location: '', performedBy: 1, outcome: '', nextActionDate: '' };
        this.scheduleFollowup = false;
        this.loadOpportunityDetails(this.selectedOppDetails.id);
      },
      error: (err: any) => console.error('Error logging activity:', err)
    });
  }

  onAddNote() {
    if (!this.selectedOppDetails || !this.newNoteText.trim()) return;
    this.crmService.addOpportunityNote(this.selectedOppDetails.id, this.newNoteText).subscribe({
      next: () => {
        this.newNoteText = '';
        this.loadOpportunityDetails(this.selectedOppDetails.id);
      },
      error: (err) => console.error('Error adding note:', err)
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'Meeting': return 'groups';
      case 'Call': return 'phone';
      case 'Proposal': return 'file_present';
      case 'WhatsApp': return 'chat';
      case 'Site Visit': return 'home_work';
      default: return 'history';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'Meeting': return 'timeline-icon-meeting';
      case 'Call': return 'timeline-icon-call';
      case 'Proposal': return 'timeline-icon-proposal';
      default: return '';
    }
  }
}
