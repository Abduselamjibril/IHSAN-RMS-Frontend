import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { FinanceService } from '../../services/finance.service';

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
              <span class="text-secondary font-xs">Customer: {{ plan.contract?.customer?.fullName }} ({{ plan.contract?.customer?.primaryPhone }})</span>
            </div>
            <div class="flex align-center gap-3">
              <span class="badge badge-qualified font-xs">Freq: {{ plan.installmentFrequency }}</span>
              <span class="badge badge-indigo font-xs">{{ plan.numberOfInstallments }} Installments</span>
              <span class="font-bold text-main font-mono">Valuation: ETB {{ plan.totalContractAmount | number }}</span>
            </div>
          </div>

          <div class="flex justify-between gap-4 font-xs text-secondary margin-b-3" style="margin-bottom: 12px;">
            <span>Initial Down Payment: <strong>ETB {{ plan.downPayment | number }}</strong></span>
            <span>Created: <strong>{{ plan.createdAt | date:'mediumDate' }}</strong></span>
          </div>

          <!-- Schedule lines table -->
          <div class="table-container">
            <table class="leads-table" style="font-size: 13px;">
              <thead>
                <tr>
                  <th>Seq #</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sch of plan.schedules">
                  <td class="font-mono">#{{ sch.installmentNo }}</td>
                  <td>
                    <span [style.color]="isOverdue(sch) ? 'var(--color-lost)' : 'inherit'" [style.font-weight]="isOverdue(sch) ? 'bold' : 'normal'">
                      {{ sch.dueDate | date:'mediumDate' }}
                      <span *ngIf="isOverdue(sch)" class="badge badge-overdue" style="font-size: 10px; margin-left: 4px;">OVERDUE</span>
                    </span>
                  </td>
                  <td class="font-mono">ETB {{ sch.installmentAmount | number }}</td>
                  <td class="font-mono text-success">ETB {{ sch.paidAmount | number }}</td>
                  <td class="font-mono text-danger">ETB {{ sch.outstandingAmount | number }}</td>
                  <td>
                    <span class="badge" [ngClass]="getScheduleStatusBadge(sch.status)">
                      {{ sch.status }}
                    </span>
                  </td>
                  <td>{{ sch.paymentDate ? (sch.paymentDate | date:'mediumDate') : '-' }}</td>
                  <td style="text-align: right;">
                    <!-- TC-5.27 & TC-5.28: Send Reminder Action -->
                    <button 
                      class="btn btn-primary btn-sm flex align-center gap-1"
                      (click)="openReminderModal(plan, sch)"
                      *ngIf="sch.status !== 'PAID'"
                      style="padding: 4px 10px; font-size: 11px; display: inline-flex;"
                      title="Send Multi-Channel Payment Reminder"
                    >
                      <span class="material-icons-outlined" style="font-size: 14px;">notifications_active</span>
                      <span>Remind</span>
                    </button>
                    <span *ngIf="sch.status === 'PAID'" class="text-success font-xs flex align-center justify-end gap-1">
                      <span class="material-icons-outlined" style="font-size: 16px;">check_circle</span> Settled
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TC-5.27 & TC-5.28: SEND REMINDER MODAL     -->
    <!-- ========================================== -->
    <div class="modal-overlay" *ngIf="showReminderModal" (click)="closeReminderModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 580px;">
        <div class="modal-header flex justify-between align-center" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; padding: 16px 20px; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: #38bdf8;">notifications_active</span>
            <h2 style="color: white; margin: 0; font-size: 17px;">Dispatch Payment Reminder Notice</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeReminderModal()" style="color: white; background: rgba(255,255,255,0.15); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none;">
            <span class="material-icons-outlined" style="font-size: 20px;">close</span>
          </button>
        </div>

        <div class="modal-body" style="padding: 24px;">
          <div class="p-3 mb-3 bg-card border rounded" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div class="grid grid-cols-2 gap-3 font-xs">
              <div>
                <span class="text-secondary block">Customer</span>
                <strong>{{ selectedReminderPlan?.contract?.customer?.fullName }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Contract Number</span>
                <strong class="font-mono">{{ selectedReminderPlan?.contract?.contractNo }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Installment Sequence</span>
                <strong>Installment #{{ selectedReminderSchedule?.installmentNo }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Amount Due</span>
                <strong class="font-mono text-danger" style="font-size: 14px;">ETB {{ selectedReminderSchedule?.installmentAmount | number }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Due Date</span>
                <strong>📅 {{ selectedReminderSchedule?.dueDate | date:'mediumDate' }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Customer Phone</span>
                <span>{{ selectedReminderPlan?.contract?.customer?.primaryPhone || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <form (submit)="onSubmitSendReminder($event)">
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Dispatch Notification Channel *</label>
              <select [(ngModel)]="reminderData.channelCode" name="rChannel" required style="padding: 10px 14px; font-size: 14px;">
                <option value="EMAIL_TELEGRAM">Multi-Channel: Email (HTML Notice) + Telegram (Instant DM)</option>
                <option value="EMAIL">Email Channel Only (Official Letterhead Notice)</option>
                <option value="TELEGRAM">Telegram Channel Only (Instant DM)</option>
              </select>
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Personalized Note / Payment Instructions (Optional)</label>
              <textarea [(ngModel)]="reminderData.customNote" name="rNote" placeholder="e.g. Please use CBE Account #100028918239 and send bank receipt to your agent..." rows="3" style="padding: 10px 14px; font-size: 13px;"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeReminderModal()">Cancel</button>
              <button type="submit" class="btn btn-primary flex align-center gap-1" [disabled]="isSendingReminder">
                <span class="material-icons-outlined" style="font-size: 16px;">send</span>
                <span>{{ isSendingReminder ? 'Dispatching...' : 'Send Reminder Notice' }}</span>
              </button>
            </div>
          </form>
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

            <!-- Record Payment Checkbox -->
            <div class="form-group" style="margin: 16px 0; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="recordPayment" [(ngModel)]="newPlan.recordPayment" name="recordPayment" style="width: auto; cursor: pointer;" />
              <label for="recordPayment" style="margin: 0; font-weight: bold; cursor: pointer; color: var(--brand-primary);">Record Down Payment Payment now (will submit a pending payment to Collections Ledger)</label>
            </div>

            <!-- Conditional Down Payment Recording Fields -->
            <div *ngIf="newPlan.recordPayment" class="card p-3 border mb-3" style="background-color: rgba(255, 255, 255, 0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-color); padding: 12px; margin-bottom: 16px;">
              <h4 style="margin-bottom: 12px; font-size: 13px;" class="text-main">Down Payment Receipt Details</h4>
              
              <div class="form-row flex gap-3">
                <!-- Payment Method * -->
                <div class="form-group flex-1 flex flex-col">
                  <label>Payment Method * [REQUIRED]</label>
                  <select [(ngModel)]="newPlan.paymentMethodId" name="paymentMethodId" [required]="newPlan.recordPayment" (change)="onPaymentMethodChange()">
                    <option [value]="0">-- Select Method --</option>
                    <option *ngFor="let m of paymentMethods" [value]="m.id">
                      {{ m.paymentMethodName }}
                    </option>
                  </select>
                </div>

                <!-- Payment Reference -->
                <div class="form-group flex-1 flex flex-col">
                  <label>Payment Reference / Voucher ID</label>
                  <input type="text" [(ngModel)]="newPlan.paymentReference" name="paymentReference" placeholder="e.g. VCH-98219" />
                </div>
              </div>

              <div class="form-row flex gap-3" style="margin-top: 8px;">
                <!-- Payment Date * -->
                <div class="form-group flex-1 flex flex-col">
                  <label>Payment Date * [REQUIRED]</label>
                  <input type="date" [(ngModel)]="newPlan.paymentDate" name="paymentDate" [required]="newPlan.recordPayment" />
                </div>

                <!-- Bank Name -->
                <div class="form-group flex-1 flex flex-col" *ngIf="showBankFields()">
                  <label>Bank Name * [REQUIRED]</label>
                  <input type="text" [(ngModel)]="newPlan.bankName" name="bankName" placeholder="e.g. Commercial Bank" [required]="newPlan.recordPayment && showBankFields()" />
                </div>
              </div>

              <div class="form-row flex gap-3" style="margin-top: 8px;">
                <!-- Transaction Reference -->
                <div class="form-group flex-1 flex flex-col" *ngIf="showTxFields()">
                  <label>Transaction Reference ID * [REQUIRED]</label>
                  <input type="text" [(ngModel)]="newPlan.transactionReference" name="transactionReference" placeholder="e.g. FT26081829" [required]="newPlan.recordPayment && showTxFields()" />
                </div>

                <!-- Cheque Number -->
                <div class="form-group flex-1 flex flex-col" *ngIf="showChequeFields()">
                  <label>Cheque Number * [REQUIRED]</label>
                  <input type="text" [(ngModel)]="newPlan.chequeNumber" name="chequeNumber" placeholder="e.g. CHQ-00129" [required]="newPlan.recordPayment && showChequeFields()" />
                </div>
              </div>

              <div class="form-group flex flex-col" style="margin-top: 8px;">
                <label>Payment Remarks</label>
                <input type="text" [(ngModel)]="newPlan.remarks" name="remarks" placeholder="Optional payment remarks" />
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
  `,
  styles: [`
    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-partial { background-color: rgba(59, 130, 246, 0.15); color: var(--color-new); }
    .badge-paid { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-overdue { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
  `]
})
export class InstallmentsComponent implements OnInit {
  private salesService = inject(SalesService);
  private financeService = inject(FinanceService);

  plans: any[] = [];
  contracts: any[] = [];
  paymentMethods: any[] = [];

  successMessage = '';
  errorMessage = '';

  showCreateModal = false;

  // Phase 4 Reminder State
  showReminderModal = false;
  selectedReminderPlan: any = null;
  selectedReminderSchedule: any = null;
  isSendingReminder = false;
  reminderData = {
    channelCode: 'EMAIL_TELEGRAM',
    customNote: ''
  };

  newPlan = {
    contractId: 0,
    totalContractAmount: 0,
    downPayment: 0,
    installmentFrequency: 'MONTHLY',
    numberOfInstallments: 12,
    recordPayment: false,
    paymentMethodId: 0,
    paymentReference: '',
    paymentDate: '',
    bankName: '',
    transactionReference: '',
    chequeNumber: '',
    remarks: ''
  };

  ngOnInit() {
    this.loadPlans();
    this.loadContracts();
    this.loadPaymentMethods();
    this.newPlan.paymentDate = new Date().toISOString().split('T')[0];
  }

  loadPlans() {
    this.salesService.getInstallmentPlans().subscribe({
      next: (res) => this.plans = res,
      error: (err) => console.error('Error fetching installment plans', err)
    });
  }

  loadContracts() {
    this.salesService.getContracts().subscribe({
      next: (res) => {
        this.contracts = res.filter((c: any) => 
          c.status === 'ACTIVE' && 
          !this.plans.some(p => Number(p.contract?.id) === Number(c.id))
        );
      },
      error: (err) => console.error('Error fetching contracts', err)
    });
  }

  loadPaymentMethods() {
    this.financeService.getPaymentMethods().subscribe({
      next: (res) => this.paymentMethods = res,
      error: (err) => console.error('Error fetching payment methods', err)
    });
  }

  onContractChange() {
    if (this.newPlan.contractId === 0) return;
    const contract = this.contracts.find(c => c.id == this.newPlan.contractId);
    if (contract) {
      this.newPlan.totalContractAmount = Number(contract.contractAmount);
      this.newPlan.downPayment = Math.round(this.newPlan.totalContractAmount * 0.1);
    }
  }

  onPaymentMethodChange() {
    this.newPlan.bankName = '';
    this.newPlan.transactionReference = '';
    this.newPlan.chequeNumber = '';
  }

  getSelectedPaymentMethodCode(): string {
    if (this.newPlan.paymentMethodId === 0) return '';
    const m = this.paymentMethods.find(x => x.id == this.newPlan.paymentMethodId);
    return m ? m.paymentMethodCode : '';
  }

  showBankFields(): boolean {
    const code = this.getSelectedPaymentMethodCode();
    return code === 'BANK' || code === 'CHEQUE';
  }

  showTxFields(): boolean {
    const code = this.getSelectedPaymentMethodCode();
    return code === 'BANK' || code === 'MOBILE' || code === 'TELEBIRR' || code === 'CHAPA';
  }

  showChequeFields(): boolean {
    const code = this.getSelectedPaymentMethodCode();
    return code === 'CHEQUE';
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

  isOverdue(schedule: any): boolean {
    if (schedule.status === 'PAID') return false;
    const due = new Date(schedule.dueDate).getTime();
    const now = new Date().getTime();
    return due < now;
  }

  // --- Phase 4 Reminder Handlers ---
  openReminderModal(plan: any, schedule: any) {
    this.selectedReminderPlan = plan;
    this.selectedReminderSchedule = schedule;
    this.reminderData = {
      channelCode: plan.contract?.customer?.primaryPhone ? 'EMAIL_TELEGRAM' : 'EMAIL',
      customNote: `Reminder: Installment #${schedule.installmentNo} of ETB ${Number(schedule.installmentAmount).toLocaleString()} is scheduled for payment on ${new Date(schedule.dueDate).toLocaleDateString()}.`
    };
    this.showReminderModal = true;
    this.isSendingReminder = false;
  }

  closeReminderModal() {
    this.showReminderModal = false;
    this.selectedReminderPlan = null;
    this.selectedReminderSchedule = null;
    this.isSendingReminder = false;
  }

  onSubmitSendReminder(event: Event) {
    event.preventDefault();
    if (!this.selectedReminderSchedule) return;

    this.isSendingReminder = true;
    this.salesService.sendInstallmentReminder(this.selectedReminderSchedule.id, this.reminderData).subscribe({
      next: (res) => {
        this.isSendingReminder = false;
        this.closeReminderModal();
        this.successMessage = res.message || `Installment reminder dispatched successfully!`;
        setTimeout(() => this.successMessage = '', 6000);
      },
      error: (err) => {
        this.isSendingReminder = false;
        console.error('Error sending installment reminder', err);
        this.errorMessage = err.error?.message || 'Failed to dispatch installment reminder.';
        setTimeout(() => this.errorMessage = '', 6000);
      }
    });
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
      numberOfInstallments: 12,
      recordPayment: false,
      paymentMethodId: 0,
      paymentReference: '',
      paymentDate: new Date().toISOString().split('T')[0],
      bankName: '',
      transactionReference: '',
      chequeNumber: '',
      remarks: ''
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  onSubmitPlan(event: Event) {
    event.preventDefault();
    if (this.newPlan.contractId === 0 || !this.newPlan.downPayment || !this.newPlan.installmentFrequency || !this.newPlan.numberOfInstallments) return;

    const payload: any = {
      contractId: +this.newPlan.contractId,
      totalContractAmount: +this.newPlan.totalContractAmount,
      downPayment: +this.newPlan.downPayment,
      installmentFrequency: this.newPlan.installmentFrequency,
      numberOfInstallments: +this.newPlan.numberOfInstallments,
      recordPayment: this.newPlan.recordPayment
    };

    if (this.newPlan.recordPayment) {
      payload.paymentMethodId = +this.newPlan.paymentMethodId;
      payload.paymentReference = this.newPlan.paymentReference;
      payload.paymentDate = this.newPlan.paymentDate;
      payload.bankName = this.newPlan.bankName;
      payload.transactionReference = this.newPlan.transactionReference;
      payload.chequeNumber = this.newPlan.chequeNumber;
      payload.remarks = this.newPlan.remarks;
    }

    this.salesService.generateInstallmentPlan(payload).subscribe({
      next: (res) => {
        this.successMessage = `Installment plan generated successfully! ${this.newPlan.recordPayment ? 'Down payment recorded for verification.' : 'Ledger synchronized.'}`;
        this.loadPlans();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating installment plan', err);
        this.errorMessage = err.error?.message || 'Failed to generate installment plan.';
      }
    });
  }
}
