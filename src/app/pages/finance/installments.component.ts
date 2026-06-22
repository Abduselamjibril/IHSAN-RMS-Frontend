import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-finance-installments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Installment Schedules & Penalties</h1>
        <p>Reschedule installment timelines, run daily late fees sweeps, configure grace periods, and process penalty waivers</p>
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

    <!-- Tabs -->
    <div class="flex gap-4" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'schedules'" 
        (click)="activeTab = 'schedules'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'schedules' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'schedules' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Schedules & Rescheduling
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'penalties'" 
        (click)="activeTab = 'penalties'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'penalties' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'penalties' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Penalty Configurations & Sweeper
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'waivers'" 
        (click)="activeTab = 'waivers'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'waivers' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'waivers' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Accrued Penalties & Waivers Log
      </button>
    </div>

    <!-- Tab 1: Schedules & Rescheduling -->
    <div *ngIf="activeTab === 'schedules'">
      <div class="card glass-card" style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 16px;">Active Schedules Timeline</h3>
        <div *ngIf="plans.length === 0" class="text-center py-6 text-secondary italic">
          No installment schedules synchronized.
        </div>

        <div class="plans-accordion flex flex-col gap-4">
          <div *ngFor="let plan of plans" class="card border p-4 bg-card" style="border-radius: var(--radius-md); background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
            <div class="flex justify-between align-center border-bottom pb-2" style="border-bottom: 1px solid var(--border-color); margin-bottom: 12px;">
              <div class="flex flex-col">
                <span class="font-bold text-main" style="font-size: 15px;">Contract No: {{ plan.contract?.contractNo }}</span>
                <span class="text-secondary font-xs">Customer Profile: {{ plan.contract?.customer?.fullName }}</span>
              </div>
              <div class="flex align-center gap-3">
                <span class="badge badge-indigo font-xs">{{ plan.numberOfInstallments }} Payments</span>
                <span class="font-bold text-main font-mono">Valuation: ETB {{ plan.totalContractAmount | number }}</span>
              </div>
            </div>

            <!-- Nested Timeline Schedules -->
            <div class="table-container shadow-none" style="border: 1px solid var(--border-color); background: transparent;">
              <table class="nested-table" style="font-size: 12px; width: 100%;">
                <thead>
                  <tr>
                    <th>Installment No</th>
                    <th>Due Date</th>
                    <th>Installment Amount</th>
                    <th>Penalty Amount</th>
                    <th>Paid Amount</th>
                    <th>Outstanding Amount</th>
                    <th>Status</th>
                    <th>Last Date Paid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sch of plan.schedules">
                    <td class="font-mono">#{{ sch.installmentNo }}</td>
                    <td>{{ sch.dueDate | date:'mediumDate' }}</td>
                    <td class="font-mono">ETB {{ sch.installmentAmount | number }}</td>
                    <td class="font-mono text-danger">ETB {{ sch.penaltyAmount | number }}</td>
                    <td class="font-mono text-success">ETB {{ sch.paidAmount | number }}</td>
                    <td class="font-mono text-danger font-bold">ETB {{ sch.outstandingAmount | number }}</td>
                    <td>
                      <span class="badge" [ngClass]="getScheduleStatusBadge(sch.status)">
                        {{ sch.status }}
                      </span>
                    </td>
                    <td>{{ sch.paymentDate ? (sch.paymentDate | date:'mediumDate') : '-' }}</td>
                    <td>
                      <button 
                        *ngIf="sch.status !== 'PAID'"
                        class="btn btn-secondary btn-xs flex align-center gap-1"
                        (click)="openRescheduleModal(sch)"
                        style="padding: 4px 8px; font-size: 11px;"
                      >
                        <span class="material-icons-outlined" style="font-size: 12px;">edit_calendar</span>
                        Reschedule
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Penalty Configuration & Sweeper -->
    <div *ngIf="activeTab === 'penalties'">
      <div class="grid gap-6" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Left: Rule Config Form -->
        <div class="card glass-card">
          <h3 style="margin-bottom: 16px;">Configure Penalty Policy</h3>
          
          <form class="modal-form" (submit)="onSubmitPenaltyConfig($event)">
            <!-- Grace Period Days -->
            <div class="form-group flex flex-col">
              <label>Grace Period Days * [REQUIRED]</label>
              <input type="number" [(ngModel)]="newPenaltyConfig.gracePeriodDays" name="gracePeriodDays" required placeholder="e.g. 10" />
            </div>

            <!-- Penalty Type * -->
            <div class="form-group flex flex-col">
              <label>Penalty Rate Calculation Basis * [REQUIRED]</label>
              <select [(ngModel)]="newPenaltyConfig.penaltyType" name="penaltyType" required>
                <option value="PERCENTAGE">Percentage (%) of Installment Amount</option>
                <option value="FIXED">Fixed Amount (ETB) per Incident</option>
                <option value="MONTHLY">Monthly Interest Percentage (%)</option>
              </select>
            </div>

            <!-- Percentage-specific field -->
            <div class="form-group flex flex-col" *ngIf="newPenaltyConfig.penaltyType === 'PERCENTAGE'">
              <label>Penalty Percentage (%) * [REQUIRED]</label>
              <input type="number" step="0.01" [(ngModel)]="newPenaltyConfig.penaltyPercentage" name="penaltyPercentage" placeholder="e.g. 2.50" required />
            </div>

            <!-- Fixed-specific field -->
            <div class="form-group flex flex-col" *ngIf="newPenaltyConfig.penaltyType === 'FIXED'">
              <label>Fixed Penalty Amount (ETB) * [REQUIRED]</label>
              <input type="number" [(ngModel)]="newPenaltyConfig.fixedPenaltyAmount" name="fixedPenaltyAmount" placeholder="e.g. 5000" required />
            </div>

            <!-- Monthly-specific field -->
            <div class="form-group flex flex-col" *ngIf="newPenaltyConfig.penaltyType === 'MONTHLY'">
              <label>Monthly Interest Rate (%) * [REQUIRED]</label>
              <input type="number" step="0.01" [(ngModel)]="newPenaltyConfig.monthlyPenaltyRate" name="monthlyPenaltyRate" placeholder="e.g. 1.50" required />
            </div>

            <!-- Project specific (Optional) -->
            <div class="form-group flex flex-col">
              <label>Link to Specific Project ID (Optional)</label>
              <input type="number" [(ngModel)]="newPenaltyConfig.projectId" name="projectId" placeholder="Leave empty for all projects" />
            </div>

            <!-- Active Status -->
            <div class="form-group flex align-center gap-2" style="margin-top: 12px;">
              <input type="checkbox" id="isActiveConfig" [(ngModel)]="newPenaltyConfig.isActive" name="isActive" />
              <label for="isActiveConfig">Set as Active Default Policy</label>
            </div>

            <div style="margin-top: 24px;">
              <button type="submit" class="btn btn-primary" [disabled]="!newPenaltyConfig.penaltyType">
                Deploy Penalty Policy
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Active Config & Sweeper Run -->
        <div class="card glass-card flex flex-col justify-between">
          <div>
            <h3 style="margin-bottom: 16px;">Active Policies & Scheduler</h3>
            
            <div class="table-container shadow-none mb-4" style="border: 1px solid var(--border-color); background: transparent;">
              <table class="nested-table" style="font-size: 12px; width: 100%;">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Rate/Value</th>
                    <th>Grace Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let cfg of penaltyConfigs">
                    <td>{{ cfg.penaltyType }}</td>
                    <td>
                      <span *ngIf="cfg.penaltyType === 'PERCENTAGE'">{{ cfg.penaltyPercentage }}%</span>
                      <span *ngIf="cfg.penaltyType === 'FIXED'">ETB {{ cfg.fixedPenaltyAmount | number }}</span>
                      <span *ngIf="cfg.penaltyType === 'MONTHLY'">{{ cfg.monthlyPenaltyRate }}% / mo</span>
                    </td>
                    <td>{{ cfg.gracePeriodDays }} Days</td>
                    <td>
                      <span class="badge" [ngClass]="cfg.isActive ? 'badge-success' : 'badge-disabled'">
                        {{ cfg.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button 
                        type="button"
                        class="btn btn-secondary btn-xs text-danger" 
                        (click)="onDeleteConfig(cfg.id)"
                        style="padding: 4px 6px; font-size: 10px; border-color: rgba(239, 68, 68, 0.2); display: inline-flex; align-items: center; justify-content: center;"
                        title="Delete policy"
                      >
                        <span class="material-icons-outlined" style="font-size: 14px;">delete</span>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="penaltyConfigs.length === 0">
                    <td colspan="5" class="text-center py-4 text-secondary">No policies registered.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card p-4 border" style="background-color: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border-color: rgba(124, 58, 237, 0.2);">
            <h4 style="margin-bottom: 8px;" class="text-main flex align-center gap-1">
              <span class="material-icons-outlined text-warning" style="font-size: 20px;">info</span>
              Late Fees Sweeper Engine
            </h4>
            <p class="text-secondary font-xs mb-3">
              The system automatically processes overdue accounts daily. You can manually run the sweeper engine right now to apply pending penalties.
            </p>
            <button class="btn btn-primary w-full flex align-center justify-center gap-2" (click)="triggerSweeper()">
              <span class="material-icons-outlined">play_circle</span>
              Execute Sweep Calculations
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Waivers Log -->
    <div *ngIf="activeTab === 'waivers'">
      <div class="card glass-card">
        <h3 style="margin-bottom: 16px;">Penalty Accruals Ledger</h3>

        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Customer / Contract</th>
                <th>Installment No</th>
                <th>Accrual Date</th>
                <th>Accrued Penalty</th>
                <th>Status</th>
                <th>Waiver Reason</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of penaltyTransactions">
                <td class="font-mono font-bold">#PT-{{ tx.id }}</td>
                <td>
                  <div class="flex flex-col">
                    <span class="text-main font-bold">{{ tx.installment?.contract?.customer?.fullName }}</span>
                    <span class="text-secondary font-xs">{{ tx.installment?.contract?.contractNo }}</span>
                  </div>
                </td>
                <td class="font-mono">Installment #{{ tx.installment?.installmentNo }}</td>
                <td>{{ tx.penaltyDate | date:'mediumDate' }}</td>
                <td class="font-mono font-bold text-danger">ETB {{ tx.penaltyAmount | number }}</td>
                <td>
                  <span class="badge" [ngClass]="tx.waived ? 'badge-success' : 'badge-disabled'">
                    {{ tx.waived ? 'Waived' : 'Accrued' }}
                  </span>
                </td>
                <td class="italic text-secondary font-xs" style="max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                  {{ tx.waiverReason || '-' }}
                </td>
                <td class="text-center">
                  <button 
                    *ngIf="!tx.waived"
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="openWaiveModal(tx)"
                    style="padding: 4px 8px; font-size: 11px; color: var(--color-qualified); border-color: rgba(16, 185, 129, 0.2);"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">check_circle</span>
                    Waive Fee
                  </button>
                  <span *ngIf="tx.waived" class="text-secondary font-xs italic">Waived by User #{{ tx.waivedBy }}</span>
                </td>
              </tr>
              <tr *ngIf="penaltyTransactions.length === 0">
                <td colspan="8" class="text-center py-6 text-secondary">
                  No penalty transactions generated.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Reschedule Modal -->
    <div class="modal-overlay" *ngIf="showRescheduleModal" (click)="closeRescheduleModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Reschedule Installment Due Date</h2>
          <button class="header-icon-btn close-btn" (click)="closeRescheduleModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitReschedule($event)">
            <div class="form-group flex flex-col">
              <label>Installment Reference</label>
              <input type="text" [value]="'Installment #' + selectedSchedule?.installmentNo + ' - ' + selectedSchedule?.contract?.contractNo" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-group flex flex-col">
              <label>Adjust Due Date * [REQUIRED]</label>
              <input type="date" [(ngModel)]="rescheduleDate" name="rescheduleDate" required />
            </div>

            <div class="form-group flex flex-col">
              <label>Adjust Installment Amount (ETB) * [REQUIRED]</label>
              <input type="number" [(ngModel)]="rescheduleAmount" name="rescheduleAmount" required placeholder="e.g. 50000" />
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeRescheduleModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!rescheduleDate || !rescheduleAmount">
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Waiver Modal -->
    <div class="modal-overlay" *ngIf="showWaiveModal" (click)="closeWaiveModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Waive Accrued Late Penalty Fee</h2>
          <button class="header-icon-btn close-btn" (click)="closeWaiveModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <p class="text-secondary" style="margin-bottom: 16px;">
            Are you sure you want to waive the penalty of <strong class="text-main">ETB {{ selectedTx?.penaltyAmount | number }}</strong> 
            accrued on <strong class="text-main">{{ selectedTx?.penaltyDate | date:'mediumDate' }}</strong> for 
            <strong class="text-main">{{ selectedTx?.installment?.contract?.customer?.fullName }}</strong>?
          </p>

          <form class="modal-form" (submit)="onSubmitWaiver($event)">
            <div class="form-group flex flex-col">
              <label>Reason for Waiver * [REQUIRED]</label>
              <textarea [(ngModel)]="waiverReason" name="waiverReason" placeholder="Describe explanation / authorization rationale..." required rows="3"></textarea>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeWaiveModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!waiverReason">
                Authorize Waiver
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nested-table {
      width: 100%;
      margin: 0;
      border-collapse: collapse;
    }
    .nested-table th {
      background-color: var(--bg-main) !important;
      font-size: 11px;
      padding: 8px 10px;
      text-align: left;
    }
    .nested-table td {
      padding: 8px 10px;
    }
    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-partial { background-color: rgba(59, 130, 246, 0.15); color: var(--color-new); }
    .badge-paid { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-overdue { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-indigo { background-color: var(--brand-primary-fade); color: var(--brand-primary); }
    .badge-success { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-disabled { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .text-success { color: var(--color-qualified) !important; }
    .text-danger { color: var(--color-lost) !important; }
    .text-warning { color: var(--color-contacted) !important; }
    .w-full { width: 100%; }
  `]
})
export class FinanceInstallmentsComponent implements OnInit {
  private financeService = inject(FinanceService);
  private salesService = inject(SalesService);

  activeTab = 'schedules';
  plans: any[] = [];
  penaltyConfigs: any[] = [];
  penaltyTransactions: any[] = [];

  successMessage = '';
  errorMessage = '';

  // Modals
  showRescheduleModal = false;
  showWaiveModal = false;

  selectedSchedule: any = null;
  rescheduleDate = '';
  rescheduleAmount = 0;

  selectedTx: any = null;
  waiverReason = '';

  newPenaltyConfig = {
    projectId: undefined,
    gracePeriodDays: 10,
    penaltyType: 'PERCENTAGE',
    penaltyPercentage: 2.0,
    fixedPenaltyAmount: undefined,
    monthlyPenaltyRate: undefined,
    isActive: true
  };

  ngOnInit() {
    this.loadPlans();
    this.loadPenaltyConfigs();
    this.loadPenaltyTransactions();
  }

  loadPlans() {
    this.salesService.getInstallmentPlans().subscribe({
      next: (res) => this.plans = res,
      error: (err) => console.error('Error fetching plans', err)
    });
  }

  loadPenaltyConfigs() {
    this.financeService.getPenaltyConfigs().subscribe({
      next: (res) => this.penaltyConfigs = res,
      error: (err) => console.error('Error fetching configs', err)
    });
  }

  onDeleteConfig(id: number) {
    if (!confirm('Are you sure you want to delete this penalty configuration?')) return;
    this.financeService.deletePenaltyConfig(id).subscribe({
      next: (res) => {
        this.loadPenaltyConfigs();
      },
      error: (err) => console.error('Error deleting configuration', err)
    });
  }

  loadPenaltyTransactions() {
    this.financeService.getPenaltyTransactions().subscribe({
      next: (res) => this.penaltyTransactions = res,
      error: (err) => console.error('Error fetching penalty txs', err)
    });
  }

  getScheduleStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PARTIAL': return 'badge-partial';
      case 'PAID': return 'badge-paid';
      case 'OVERDUE': return 'badge-overdue';
      default: return '';
    }
  }

  openRescheduleModal(sch: any) {
    this.selectedSchedule = sch;
    this.rescheduleDate = new Date(sch.dueDate).toISOString().split('T')[0];
    this.rescheduleAmount = Number(sch.installmentAmount);
    this.showRescheduleModal = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
  }

  onSubmitReschedule(event: Event) {
    event.preventDefault();
    if (!this.selectedSchedule || !this.rescheduleDate || !this.rescheduleAmount) return;

    this.financeService.rescheduleInstallment(this.selectedSchedule.id, this.rescheduleDate, +this.rescheduleAmount).subscribe({
      next: () => {
        this.successMessage = `Installment #${this.selectedSchedule.installmentNo} was rescheduled. Timelines updated successfully!`;
        this.loadPlans();
        this.closeRescheduleModal();
      },
      error: (err) => {
        console.error('Error rescheduling', err);
        this.errorMessage = err.error?.message || 'Failed to reschedule installment.';
      }
    });
  }

  onSubmitPenaltyConfig(event: Event) {
    event.preventDefault();
    if (!this.newPenaltyConfig.penaltyType) return;

    const payload: any = {
      gracePeriodDays: +this.newPenaltyConfig.gracePeriodDays,
      penaltyType: this.newPenaltyConfig.penaltyType,
      isActive: this.newPenaltyConfig.isActive
    };

    if (this.newPenaltyConfig.projectId) {
      payload.projectId = +this.newPenaltyConfig.projectId;
    }
    if (this.newPenaltyConfig.penaltyType === 'PERCENTAGE') {
      payload.penaltyPercentage = +this.newPenaltyConfig.penaltyPercentage;
    } else if (this.newPenaltyConfig.penaltyType === 'FIXED') {
      payload.fixedPenaltyAmount = +(this.newPenaltyConfig.fixedPenaltyAmount ?? 0);
    } else if (this.newPenaltyConfig.penaltyType === 'MONTHLY') {
      payload.monthlyPenaltyRate = +(this.newPenaltyConfig.monthlyPenaltyRate ?? 0);
    }

    this.financeService.createPenaltyConfig(payload).subscribe({
      next: () => {
        this.successMessage = 'Penalty rate calculation policy deployed successfully!';
        this.loadPenaltyConfigs();
        this.newPenaltyConfig = {
          projectId: undefined,
          gracePeriodDays: 10,
          penaltyType: 'PERCENTAGE',
          penaltyPercentage: 2.0,
          fixedPenaltyAmount: undefined,
          monthlyPenaltyRate: undefined,
          isActive: true
        };
      },
      error: (err) => {
        console.error('Error creating config', err);
        this.errorMessage = err.error?.message || 'Failed to deploy penalty config.';
      }
    });
  }

  triggerSweeper() {
    this.successMessage = '';
    this.errorMessage = '';
    this.financeService.runDailyPenaltySweeper().subscribe({
      next: (res) => {
        this.successMessage = res.remarks || 'Daily sweep calculations complete.';
        this.loadPlans();
        this.loadPenaltyTransactions();
      },
      error: (err) => {
        console.error('Error sweeping', err);
        this.errorMessage = err.error?.message || 'Daily sweeper sweep execution failed.';
      }
    });
  }

  openWaiveModal(tx: any) {
    this.selectedTx = tx;
    this.waiverReason = '';
    this.showWaiveModal = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeWaiveModal() {
    this.showWaiveModal = false;
  }

  onSubmitWaiver(event: Event) {
    event.preventDefault();
    if (!this.selectedTx || !this.waiverReason) return;

    this.financeService.waivePenalty(this.selectedTx.id, { waiverReason: this.waiverReason }).subscribe({
      next: () => {
        this.successMessage = `Penalty waiver approved and fee credited back.`;
        this.loadPlans();
        this.loadPenaltyTransactions();
        this.closeWaiveModal();
      },
      error: (err) => {
        console.error('Error waiving penalty', err);
        this.errorMessage = err.error?.message || 'Waiver authorization failed.';
        this.closeWaiveModal();
      }
    });
  }
}
