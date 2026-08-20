import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Sales Commissions & Payouts</h1>
        <p>Configure sales representative payout percentage rules, approve agent commissions, and monitor financial analytics</p>
      </div>
      <div class="app-header-actions flex gap-3">
        <button class="btn btn-secondary flex align-center gap-1" (click)="loadCommissions()">
          <span class="material-icons-outlined font-sm">refresh</span>
          <span>Refresh</span>
        </button>
        <button class="btn btn-primary flex align-center gap-1" (click)="openCreateRuleModal()">
          <span class="material-icons-outlined font-sm">add</span>
          <span>Configure Commission Rule</span>
        </button>
      </div>
    </header>

    <!-- Success Alert -->
    <div class="alert alert-success" *ngIf="successMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-qualified); color: var(--color-qualified); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">check_circle</span>
      <strong>Success:</strong>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <div class="alert alert-danger" *ngIf="errorMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">error_outline</span>
      <strong>Error:</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Main Tabs -->
    <div class="flex gap-4" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'ledger'" 
        (click)="setTab('ledger')"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent; cursor: pointer; background: transparent;"
        [style.border-bottom-color]="activeTab === 'ledger' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'ledger' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Commission Ledger
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'reports'" 
        (click)="setTab('reports')"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent; cursor: pointer; background: transparent;"
        [style.border-bottom-color]="activeTab === 'reports' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'reports' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Commission Reports & Analytics
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'rules'" 
        (click)="setTab('rules')"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent; cursor: pointer; background: transparent;"
        [style.border-bottom-color]="activeTab === 'rules' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'rules' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Payout Rules Configuration
      </button>
    </div>

    <!-- TAB 1: Commission Ledger Tab -->
    <div class="card glass-card" *ngIf="activeTab === 'ledger'">
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Payout Ref</th>
              <th>Contract Reference</th>
              <th>Customer</th>
              <th>Sales Representative</th>
              <th>Applied Rule</th>
              <th>Contract Sale Amount</th>
              <th>Commission Amount</th>
              <th>Status</th>
              <th>Date Generated</th>
              <th style="text-align: center;">Finance Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let comm of commissions">
              <td class="font-mono font-bold text-main">#PAY-0{{ comm.id }}</td>
              <td class="font-mono">{{ comm.contract?.contractNo }}</td>
              <td>{{ comm.contract?.customer?.fullName || '-' }}</td>
              <td>
                <div class="font-medium text-main">{{ comm.salesRep?.fullName }}</div>
                <div class="text-secondary font-xs">{{ comm.salesRep?.email || comm.salesRep?.phone }}</div>
              </td>
              <td>
                <span class="badge badge-indigo">
                  {{ comm.commissionRule?.commissionName || 'Standard' }} ({{ comm.commissionRule?.commissionValue }}{{ comm.commissionRule?.commissionType === 'PERCENTAGE' ? '%' : ' ETB' }})
                </span>
              </td>
              <td class="font-mono">ETB {{ comm.saleAmount | number }}</td>
              <td class="font-mono font-bold text-success">ETB {{ comm.commissionAmount | number }}</td>
              <td>
                <span class="badge" [ngClass]="getCommissionStatusBadge(comm.status)">
                  {{ comm.status }}
                </span>
              </td>
              <td>{{ comm.createdAt | date:'mediumDate' }}</td>
              <td>
                <div class="flex gap-2 justify-center" style="display: flex; gap: 8px; justify-content: center;">
                  <!-- TC-5.35: Finance Review Workflow Buttons -->
                  <button 
                    *ngIf="['CALCULATED', 'PENDING', 'PENDING_APPROVAL'].includes(comm.status)" 
                    class="btn btn-primary btn-sm flex align-center gap-1"
                    (click)="openFinanceReviewModal(comm, 'APPROVE')"
                    title="Finance Officer Approval"
                  >
                    <span class="material-icons-outlined font-sm">check_circle</span>
                    <span>Approve</span>
                  </button>

                  <button 
                    *ngIf="['CALCULATED', 'PENDING', 'PENDING_APPROVAL'].includes(comm.status)" 
                    class="btn btn-danger btn-sm flex align-center gap-1"
                    (click)="openFinanceReviewModal(comm, 'REJECT')"
                    title="Reject Commission Payout"
                  >
                    <span class="material-icons-outlined font-sm">cancel</span>
                    <span>Reject</span>
                  </button>

                  <button 
                    *ngIf="comm.status === 'APPROVED'" 
                    class="btn btn-sm flex align-center gap-1" 
                    style="background-color: var(--color-qualified); border-color: var(--color-qualified); color: white;"
                    (click)="changeStatus(comm.id, 'PAID')"
                  >
                    <span class="material-icons-outlined font-sm">payments</span>
                    <span>Mark Paid</span>
                  </button>

                  <button 
                    *ngIf="['APPROVED', 'PAID'].includes(comm.status)" 
                    class="btn btn-sm flex align-center gap-1" 
                    style="background-color: var(--color-lost); border-color: var(--color-lost); color: white;"
                    (click)="changeStatus(comm.id, 'REVERSED')"
                  >
                    <span class="material-icons-outlined font-sm">undo</span>
                    <span>Reverse</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="commissions.length === 0">
              <td colspan="10" class="text-center py-6 text-secondary">
                No commission payouts registered. Commissions are automatically calculated upon sales contract execution.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: Commission Reports & Analytics Tab (TC-5.36) -->
    <div *ngIf="activeTab === 'reports'" class="flex flex-col gap-4">
      
      <!-- Top KPI Summary Cards -->
      <div class="grid grid-cols-4 gap-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
        <div class="card glass-card p-4">
          <div class="text-secondary font-xs font-bold uppercase mb-1">Total Generated Commissions</div>
          <div class="font-mono text-xl font-bold text-main">ETB {{ reportData?.kpis?.totalCommission | number }}</div>
          <div class="text-secondary font-xs mt-1">{{ reportData?.kpis?.totalCount || 0 }} total contracts linked</div>
        </div>
        <div class="card glass-card p-4">
          <div class="text-secondary font-xs font-bold uppercase mb-1">Approved for Payout</div>
          <div class="font-mono text-xl font-bold text-primary" style="color: var(--color-new);">ETB {{ reportData?.kpis?.approvedCommission | number }}</div>
          <div class="text-secondary font-xs mt-1">Verified by Finance Officers</div>
        </div>
        <div class="card glass-card p-4">
          <div class="text-secondary font-xs font-bold uppercase mb-1">Pending Review</div>
          <div class="font-mono text-xl font-bold" style="color: var(--color-contacted);">ETB {{ reportData?.kpis?.pendingCommission | number }}</div>
          <div class="text-secondary font-xs mt-1">Awaiting approval release</div>
        </div>
        <div class="card glass-card p-4">
          <div class="text-secondary font-xs font-bold uppercase mb-1">Settled / Paid Payouts</div>
          <div class="font-mono text-xl font-bold text-success" style="color: var(--color-qualified);">ETB {{ reportData?.kpis?.paidCommission | number }}</div>
          <div class="text-secondary font-xs mt-1">Disbursed to sales reps</div>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="card glass-card p-4">
        <div class="flex gap-4 align-center flex-wrap">
          <!-- Sales Agent Filter -->
          <div class="flex-1 flex flex-col" style="min-width: 180px;">
            <label class="font-xs font-bold text-secondary mb-1">Sales Representative</label>
            <select [(ngModel)]="reportFilters.agentId" (change)="loadReport()">
              <option [value]="undefined">All Sales Agents</option>
              <option *ngFor="let agent of agents" [value]="agent.id">{{ agent.fullName }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="flex-1 flex flex-col" style="min-width: 140px;">
            <label class="font-xs font-bold text-secondary mb-1">Commission Status</label>
            <select [(ngModel)]="reportFilters.status" (change)="loadReport()">
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>

          <!-- Start Date -->
          <div class="flex-1 flex flex-col" style="min-width: 140px;">
            <label class="font-xs font-bold text-secondary mb-1">From Date</label>
            <input type="date" [(ngModel)]="reportFilters.startDate" (change)="loadReport()" />
          </div>

          <!-- End Date -->
          <div class="flex-1 flex flex-col" style="min-width: 140px;">
            <label class="font-xs font-bold text-secondary mb-1">To Date</label>
            <input type="date" [(ngModel)]="reportFilters.endDate" (change)="loadReport()" />
          </div>

          <!-- Reset Filter Button -->
          <div class="flex flex-col justify-end" style="height: 100%;">
            <label class="font-xs font-bold text-secondary mb-1">&nbsp;</label>
            <button class="btn btn-secondary flex align-center gap-1" (click)="resetReportFilters()">
              <span class="material-icons-outlined font-sm">clear_all</span>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filtered Results Table -->
      <div class="card glass-card">
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Payout Ref</th>
                <th>Contract Ref</th>
                <th>Customer</th>
                <th>Sales Representative</th>
                <th>Contract Valuation (ETB)</th>
                <th>Commission (ETB)</th>
                <th>Status</th>
                <th>Calculation Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let comm of reportData?.commissions">
                <td class="font-mono font-bold text-main">#PAY-0{{ comm.id }}</td>
                <td class="font-mono">{{ comm.contract?.contractNo }}</td>
                <td>{{ comm.contract?.customer?.fullName || '-' }}</td>
                <td>{{ comm.salesRep?.fullName }}</td>
                <td class="font-mono">ETB {{ comm.saleAmount | number }}</td>
                <td class="font-mono font-bold text-success">ETB {{ comm.commissionAmount | number }}</td>
                <td>
                  <span class="badge" [ngClass]="getCommissionStatusBadge(comm.status)">
                    {{ comm.status }}
                  </span>
                </td>
                <td>{{ comm.createdAt | date:'mediumDate' }}</td>
              </tr>
              <tr *ngIf="!reportData?.commissions || reportData?.commissions?.length === 0">
                <td colspan="8" class="text-center py-6 text-secondary">
                  No records match the selected report criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- TAB 3: Payout Rules Tab -->
    <div class="card glass-card" *ngIf="activeTab === 'rules'">
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Calculation Type</th>
              <th>Commission Value</th>
              <th>Date Created</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rule of rules">
              <td class="font-bold text-main">{{ rule.commissionName }}</td>
              <td>{{ rule.commissionType }}</td>
              <td class="font-mono font-bold">
                {{ rule.commissionValue }} {{ rule.commissionType === 'PERCENTAGE' ? '%' : 'ETB' }}
              </td>
              <td>{{ rule.createdAt | date:'mediumDate' }}</td>
              <td>
                <span class="badge" [ngClass]="rule.isActive ? 'badge-active' : 'badge-disabled'">
                  {{ rule.isActive ? 'Active' : 'Disabled' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="rules.length === 0">
              <td colspan="5" class="text-center py-6 text-secondary">
                No custom commission rules registered. Standard 2% default will be applied.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TC-5.35: Finance Review Modal (Approve / Reject) -->
    <div class="modal-overlay" *ngIf="showReviewModal" (click)="closeFinanceReviewModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 520px;">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" [style.color]="reviewAction === 'APPROVE' ? 'var(--color-qualified)' : 'var(--color-lost)'">
              {{ reviewAction === 'APPROVE' ? 'verified' : 'highlight_off' }}
            </span>
            <h2>{{ reviewAction === 'APPROVE' ? 'Authorize Commission Payout' : 'Reject Commission Request' }}</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeFinanceReviewModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="p-3 mb-3 bg-card border rounded">
            <div class="grid grid-cols-2 gap-2 font-xs">
              <div>
                <span class="text-secondary block">Payout Ref</span>
                <strong class="font-mono">#PAY-0{{ selectedReviewCommission?.id }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Contract No</span>
                <strong class="font-mono">{{ selectedReviewCommission?.contract?.contractNo }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Sales Representative</span>
                <strong>{{ selectedReviewCommission?.salesRep?.fullName }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Calculated Commission</span>
                <strong class="font-mono text-success">ETB {{ selectedReviewCommission?.commissionAmount | number }}</strong>
              </div>
            </div>
          </div>

          <form (submit)="onSubmitFinanceReview($event)">
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Finance Review Notes {{ reviewAction === 'REJECT' ? '*' : '' }}</label>
              <textarea 
                [(ngModel)]="reviewRemarks" 
                name="revRemarks" 
                [required]="reviewAction === 'REJECT'" 
                placeholder="Enter authorization justification or audit notes..." 
                rows="3"
              ></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeFinanceReviewModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn" 
                [ngClass]="reviewAction === 'APPROVE' ? 'btn-primary' : 'btn-danger'"
              >
                {{ reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Commission Rule Modal -->
    <div class="modal-overlay" *ngIf="showCreateRuleModal" (click)="closeCreateRuleModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Configure Commission Rule</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateRuleModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitRule($event)">
            <!-- Rule Title * -->
            <div class="form-group flex flex-col">
              <label>Rule Title / Name * [REQUIRED]</label>
              <input type="text" [(ngModel)]="newRule.commissionName" name="commissionName" required placeholder="e.g. Agent 2% Commission Rule" />
            </div>

            <div class="form-row flex gap-3">
              <!-- Calculation Type * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Calculation Type * [REQUIRED]</label>
                <select [(ngModel)]="newRule.commissionType" name="commissionType" required>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (ETB)</option>
                </select>
              </div>

              <!-- Commission Value * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Commission Value * [REQUIRED]</label>
                <input type="number" [(ngModel)]="newRule.commissionValue" name="commissionValue" required placeholder="e.g. 2.0" />
              </div>
            </div>

            <!-- Enable Rule * -->
            <div class="form-group flex align-center gap-2" style="margin-top: 12px;">
              <input type="checkbox" id="isActive" [(ngModel)]="newRule.isActive" name="isActive" />
              <label for="isActive"><strong>Enable Rule * [REQUIRED]</strong></label>
            </div>
            <span class="text-secondary font-xs" style="margin-top: -6px; display: block; margin-bottom: 16px;">
              Enabled rules will be processed automatically on future contract executions.
            </span>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateRuleModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="!newRule.commissionName || !newRule.commissionType || !newRule.commissionValue"
              >
                Create Rule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-calculated { background-color: rgba(107, 114, 128, 0.15); color: #6b7280; }
    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-approved { background-color: rgba(59, 130, 246, 0.15); color: var(--color-new); }
    .badge-paid { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-rejected { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-reversed { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-active { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-disabled { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-indigo { background-color: var(--brand-primary-fade); color: var(--brand-primary); }
  `]
})
export class CommissionsComponent implements OnInit {
  private salesService = inject(SalesService);
  private crmService = inject(CrmService);

  activeTab = 'ledger';
  commissions: any[] = [];
  rules: any[] = [];
  agents: any[] = [];

  // TC-5.36: Reports State
  reportFilters: { agentId?: number; startDate?: string; endDate?: string; status: string } = {
    agentId: undefined,
    startDate: undefined,
    endDate: undefined,
    status: 'ALL',
  };
  reportData: any = {
    kpis: { totalCommission: 0, approvedCommission: 0, pendingCommission: 0, paidCommission: 0, totalCount: 0 },
    commissions: [],
  };

  // TC-5.35: Review Modal State
  showReviewModal = false;
  selectedReviewCommission: any = null;
  reviewAction: 'APPROVE' | 'REJECT' = 'APPROVE';
  reviewRemarks = '';

  successMessage = '';
  errorMessage = '';

  showCreateRuleModal = false;

  newRule = {
    commissionName: '',
    commissionType: 'PERCENTAGE',
    commissionValue: 2.0,
    isActive: true,
  };

  ngOnInit() {
    this.loadCommissions();
    this.loadRules();
    this.loadAgents();
    this.loadReport();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'reports') {
      this.loadReport();
    }
  }

  loadCommissions() {
    this.salesService.getCommissions().subscribe({
      next: (res) => {
        this.commissions = res;
        this.loadReport();
      },
      error: (err) => console.error('Error loading commissions', err),
    });
  }

  loadRules() {
    this.salesService.getCommissionRules().subscribe({
      next: (res) => this.rules = res,
      error: (err) => console.error('Error loading commission rules', err),
    });
  }

  loadAgents() {
    this.crmService.getAgents().subscribe({
      next: (res: any) => this.agents = res,
      error: (err: any) => console.error('Error loading sales agents', err),
    });
  }

  loadReport() {
    this.salesService.getCommissionsReport(this.reportFilters).subscribe({
      next: (res) => {
        this.reportData = res;
      },
      error: (err) => console.error('Error loading commissions report', err),
    });
  }

  resetReportFilters() {
    this.reportFilters = {
      agentId: undefined,
      startDate: undefined,
      endDate: undefined,
      status: 'ALL',
    };
    this.loadReport();
  }

  getCommissionStatusBadge(status: string): string {
    switch (status) {
      case 'CALCULATED': return 'badge-calculated';
      case 'PENDING':
      case 'PENDING_APPROVAL': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'PAID': return 'badge-paid';
      case 'REJECTED': return 'badge-rejected';
      case 'REVERSED': return 'badge-reversed';
      default: return '';
    }
  }

  // TC-5.35: Finance Review Modal Handlers
  openFinanceReviewModal(comm: any, action: 'APPROVE' | 'REJECT') {
    this.selectedReviewCommission = comm;
    this.reviewAction = action;
    this.reviewRemarks = action === 'APPROVE' ? 'Verified contract execution and 100% down payment deposit verified' : '';
    this.showReviewModal = true;
  }

  closeFinanceReviewModal() {
    this.showReviewModal = false;
    this.selectedReviewCommission = null;
    this.reviewRemarks = '';
  }

  onSubmitFinanceReview(event: Event) {
    event.preventDefault();
    if (!this.selectedReviewCommission) return;

    this.salesService.reviewCommission(this.selectedReviewCommission.id, {
      action: this.reviewAction,
      remarks: this.reviewRemarks || undefined,
      reviewerId: 1,
    }).subscribe({
      next: (res) => {
        this.successMessage = `Commission #${this.selectedReviewCommission.id} successfully ${this.reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED'}!`;
        this.loadCommissions();
        this.closeFinanceReviewModal();
      },
      error: (err) => {
        console.error('Error reviewing commission', err);
        this.errorMessage = err.error?.message || 'Failed to submit review.';
      },
    });
  }

  changeStatus(id: number, status: string) {
    this.successMessage = '';
    this.errorMessage = '';
    this.salesService.updateCommissionStatus(id, status).subscribe({
      next: () => {
        this.successMessage = `Commission status successfully updated to ${status}!`;
        this.loadCommissions();
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.errorMessage = err.error?.message || 'Failed to update commission status.';
      },
    });
  }

  openCreateRuleModal() {
    this.showCreateRuleModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.newRule = {
      commissionName: '',
      commissionType: 'PERCENTAGE',
      commissionValue: 2.0,
      isActive: true,
    };
  }

  closeCreateRuleModal() {
    this.showCreateRuleModal = false;
  }

  onSubmitRule(event: Event) {
    event.preventDefault();
    if (!this.newRule.commissionName || !this.newRule.commissionType || !this.newRule.commissionValue) return;

    const payload = {
      commissionName: this.newRule.commissionName,
      commissionType: this.newRule.commissionType,
      commissionValue: +this.newRule.commissionValue,
      isActive: this.newRule.isActive,
    };

    this.salesService.createCommissionRule(payload).subscribe({
      next: (res) => {
        this.successMessage = `Commission rule ${res.commissionName} successfully configured!`;
        this.loadRules();
        this.closeCreateRuleModal();
      },
      error: (err) => {
        console.error('Error creating commission rule', err);
        this.errorMessage = err.error?.message || 'Failed to create commission rule.';
      },
    });
  }
}
