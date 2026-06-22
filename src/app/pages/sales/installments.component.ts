import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Installments Ledger</h1>
        <p>Define installment schedules, track outstanding receivables, and log buyer payments</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">calendar_month</span>
          Generate Schedule
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

    <!-- Installment plans display list -->
    <div class="card glass-card" style="margin-bottom: 24px;">
      <h3 style="margin-bottom: 16px;">Active Installment Schedules</h3>
      <div *ngIf="plans.length === 0" class="text-center py-6 text-secondary italic">
        No installment plans generated yet. Click "Generate Schedule" above to link a contract payment ledger.
      </div>

      <div class="plans-accordion flex flex-col gap-4">
        <div *ngFor="let plan of plans" class="card border p-4 bg-card" style="border-radius: var(--radius-md);">
          <div class="flex justify-between align-center border-bottom pb-2" style="border-bottom: 1px solid var(--border-color); margin-bottom: 12px;">
            <div class="flex flex-col">
              <span class="font-bold text-main" style="font-size: 15px;">Contract: {{ plan.contract?.contractNo }}</span>
              <span class="text-secondary font-xs">Customer: {{ plan.contract?.customer?.fullName }}</span>
            </div>
            <div class="flex align-center gap-3">
              <span class="badge badge-qualified font-xs">Freq: {{ plan.installmentFrequency }}</span>
              <span class="badge badge-indigo font-xs">{{ plan.numberOfInstallments }} Installments</span>
              <span class="font-bold text-main font-mono">Valuation: ETB {{ plan.totalContractAmount | number }}</span>
            </div>
          </div>

          <div class="flex justify-between gap-4 font-xs text-secondary margin-b-3" style="margin-bottom: 12px;">
            <span>Down Payment Paid: <strong>ETB {{ plan.downPayment | number }}</strong></span>
            <span>Accrued Installments Remaining: <strong>ETB {{ (plan.totalContractAmount - plan.downPayment) | number }}</strong></span>
          </div>

          <!-- Schedules Grid/Table inside the Plan -->
          <div class="table-container shadow-none" style="border: 1px solid var(--border-color);">
            <table class="nested-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Due Date</th>
                  <th>Installment Amount</th>
                  <th>Paid Amount</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sch of plan.schedules">
                  <td class="font-mono">#{{ sch.installmentNo }}</td>
                  <td>{{ sch.dueDate | date:'mediumDate' }}</td>
                  <td class="font-mono">ETB {{ sch.installmentAmount | number }}</td>
                  <td class="font-mono text-success">ETB {{ sch.paidAmount | number }}</td>
                  <td class="font-mono text-danger">ETB {{ sch.outstandingAmount | number }}</td>
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
                      (click)="openPayModal(sch)"
                      style="padding: 4px 8px; font-size: 10px;"
                    >
                      <span class="material-icons-outlined" style="font-size: 12px;">payment</span>
                      <span>Collect</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate Schedule Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Generate Installment Plan</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitPlan($event)">
            <!-- Contract Reference * (shows active contracts) -->
            <div class="form-group flex flex-col">
              <label>Select Contract Reference * [REQUIRED]</label>
              <select [(ngModel)]="newPlan.contractId" name="contractId" required (change)="onContractChange()">
                <option [value]="0">-- Select Contract --</option>
                <option *ngFor="let c of contracts" [value]="c.id">
                  {{ c.contractNo }} - {{ c.customer?.fullName }} (ETB {{ c.contractAmount | number }} contract)
                </option>
              </select>
            </div>

            <!-- Total Contract Amount * (auto-fills, read-only) -->
            <div class="form-group flex flex-col">
              <label>Total Valuation Contract Amount (ETB) * [REQUIRED] [READ-ONLY]</label>
              <input type="number" [value]="newPlan.totalContractAmount" readonly style="background-color: var(--bg-main); font-weight: bold;" />
            </div>

            <!-- Down Payment * -->
            <div class="form-group flex flex-col">
              <label>Down Payment (ETB) * [REQUIRED]</label>
              <input type="number" [(ngModel)]="newPlan.downPayment" name="downPayment" required placeholder="e.g. 100000" />
            </div>

            <div class="form-row flex gap-3">
              <!-- Payment Frequency * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Payment Frequency * [REQUIRED]</label>
                <select [(ngModel)]="newPlan.installmentFrequency" name="installmentFrequency" required>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <!-- Installments Count * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Installments Count * [REQUIRED]</label>
                <input type="number" [(ngModel)]="newPlan.numberOfInstallments" name="numberOfInstallments" required placeholder="e.g. 12" />
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="newPlan.contractId === 0 || !newPlan.downPayment || !newPlan.installmentFrequency || !newPlan.numberOfInstallments"
              >
                Generate Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Collect Payment Modal -->
    <div class="modal-overlay" *ngIf="showPayModal" (click)="closePayModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Record Installment Payment</h2>
          <button class="header-icon-btn close-btn" (click)="closePayModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitPayment($event)">
            <div class="form-group flex flex-col">
              <label>Installment Reference</label>
              <input type="text" [value]="'Installment #' + selectedSchedule?.installmentNo + ' - Outstanding: ETB ' + selectedSchedule?.outstandingAmount" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-group flex flex-col">
              <label>Outstanding Amount Remaining (ETB) * [REQUIRED] [READ-ONLY]</label>
              <input type="number" [value]="selectedSchedule?.outstandingAmount" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-group flex flex-col">
              <label>Amount Collected / Paid (ETB) * [REQUIRED]</label>
              <input type="number" [(ngModel)]="payAmount" name="payAmount" required placeholder="e.g. 50000" [max]="selectedSchedule?.outstandingAmount" />
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closePayModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!payAmount || payAmount <= 0">
                Log Payment
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
    .badge-qualified { background-color: rgba(16, 185, 129, 0.1); color: var(--color-qualified); }
  `]
})
export class InstallmentsComponent implements OnInit {
  private salesService = inject(SalesService);

  plans: any[] = [];
  contracts: any[] = [];

  successMessage = '';
  errorMessage = '';

  showCreateModal = false;
  showPayModal = false;

  selectedSchedule: any = null;
  payAmount = 0;

  newPlan = {
    contractId: 0,
    totalContractAmount: 0,
    downPayment: 0,
    installmentFrequency: 'MONTHLY',
    numberOfInstallments: 12
  };

  ngOnInit() {
    this.loadPlans();
    this.loadContracts();
  }

  loadPlans() {
    this.salesService.getInstallmentPlans().subscribe({
      next: (res) => this.plans = res,
      error: (err) => console.error('Error fetching plans', err)
    });
  }

  loadContracts() {
    this.salesService.getContracts().subscribe({
      next: (res) => {
        this.contracts = res.filter((c: any) => c.status === 'ACTIVE');
      },
      error: (err) => console.error('Error fetching contracts', err)
    });
  }

  onContractChange() {
    if (this.newPlan.contractId === 0) return;
    const contract = this.contracts.find(c => c.id == this.newPlan.contractId);
    if (contract) {
      this.newPlan.totalContractAmount = Number(contract.contractAmount);
      // Auto-set down payment as 10%
      this.newPlan.downPayment = Math.round(this.newPlan.totalContractAmount * 0.1);
    }
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

  openCreateModal() {
    this.showCreateModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.newPlan = {
      contractId: 0,
      totalContractAmount: 0,
      downPayment: 0,
      installmentFrequency: 'MONTHLY',
      numberOfInstallments: 12
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openPayModal(sch: any) {
    this.selectedSchedule = sch;
    this.showPayModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.payAmount = Number(sch.outstandingAmount);
  }

  closePayModal() {
    this.showPayModal = false;
  }

  onSubmitPlan(event: Event) {
    event.preventDefault();
    if (this.newPlan.contractId === 0 || !this.newPlan.downPayment || !this.newPlan.installmentFrequency || !this.newPlan.numberOfInstallments) return;

    const payload = {
      contractId: +this.newPlan.contractId,
      totalContractAmount: +this.newPlan.totalContractAmount,
      downPayment: +this.newPlan.downPayment,
      installmentFrequency: this.newPlan.installmentFrequency,
      numberOfInstallments: +this.newPlan.numberOfInstallments
    };

    this.salesService.generateInstallmentPlan(payload).subscribe({
      next: (res) => {
        this.successMessage = `Installment scheduling generated with ${payload.numberOfInstallments} payments. Ledger synchronized!`;
        this.loadPlans();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating installment plan', err);
        this.errorMessage = err.error?.message || 'Failed to generate installment plan.';
      }
    });
  }

  onSubmitPayment(event: Event) {
    event.preventDefault();
    if (!this.selectedSchedule || !this.payAmount || this.payAmount <= 0) return;

    this.salesService.payInstallment(this.selectedSchedule.id, +this.payAmount).subscribe({
      next: (res) => {
        this.successMessage = `Payment collected. Accrued balance updated!`;
        this.loadPlans();
        this.closePayModal();
      },
      error: (err) => {
        console.error('Error logging payment', err);
        this.errorMessage = err.error?.message || 'Failed to record payment.';
      }
    });
  }
}
