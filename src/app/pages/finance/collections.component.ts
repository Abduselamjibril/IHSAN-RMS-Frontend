import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Payment Collections</h1>
        <p>Record customer installment payments, manage verification workflows, and review allocations</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          Record Customer Payment
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

    <!-- Metrics Strip -->
    <div class="metrics-grid flex gap-4" style="margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
      <div class="card glass-card p-4 flex flex-col justify-between" style="min-height: 100px;">
        <span class="text-secondary font-xs font-bold uppercase">Total Collections</span>
        <span class="font-bold text-main font-mono" style="font-size: 24px; margin-top: 8px;">ETB {{ stats.totalCollections | number }}</span>
      </div>
      <div class="card glass-card p-4 flex flex-col justify-between" style="min-height: 100px;">
        <span class="text-secondary font-xs font-bold uppercase">Pending Verification</span>
        <span class="font-bold text-main font-mono text-warning" style="font-size: 24px; margin-top: 8px;">{{ pendingPaymentsCount }} Payments</span>
      </div>
      <div class="card glass-card p-4 flex flex-col justify-between" style="min-height: 100px;">
        <span class="text-secondary font-xs font-bold uppercase">Approved Cashflow</span>
        <span class="font-bold text-main font-mono text-success" style="font-size: 24px; margin-top: 8px;">ETB {{ approvedCollectionsAmount | number }}</span>
      </div>
    </div>

    <!-- Payments Table Ledger -->
    <div class="card glass-card">
      <div class="flex justify-between align-center" style="margin-bottom: 16px;">
        <h3>Collections Ledger</h3>
        <!-- Filters -->
        <div class="flex gap-2">
          <select [(ngModel)]="filterStatus" (change)="loadPayments()" class="font-xs" style="padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main);">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Ref / Tx ID</th>
              <th>Contract / Customer</th>
              <th>Method</th>
              <th>Payment Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payments">
              <td class="font-mono font-bold">#PAY-0{{ p.id }}</td>
              <td class="font-mono">
                <div class="flex flex-col">
                  <span class="text-main">{{ p.paymentReference }}</span>
                  <span class="text-secondary font-xs" *ngIf="p.transactionReference">Tx: {{ p.transactionReference }}</span>
                  <span class="text-secondary font-xs" *ngIf="p.chequeNumber">Chq: {{ p.chequeNumber }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="text-main font-bold">{{ p.contract?.contractNo }}</span>
                  <span class="text-secondary font-xs">{{ p.customer?.fullName }}</span>
                </div>
              </td>
              <td>
                <span class="badge badge-indigo font-xs">{{ p.paymentMethod?.paymentMethodName }}</span>
              </td>
              <td>{{ p.paymentDate | date:'mediumDate' }}</td>
              <td class="font-mono font-bold text-main">ETB {{ p.paymentAmount | number }}</td>
              <td>
                <span class="badge" [ngClass]="getStatusBadgeClass(p.status)">
                  {{ p.status }}
                </span>
              </td>
              <td class="text-center">
                <div class="flex justify-center gap-2">
                  <button 
                    *ngIf="p.status === 'PENDING'"
                    class="btn btn-xs btn-primary flex align-center gap-1"
                    (click)="openApproveModal(p, 'APPROVE')"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">check</span>
                    Approve
                  </button>
                  <button 
                    *ngIf="p.status === 'PENDING'"
                    class="btn btn-xs btn-secondary flex align-center gap-1"
                    (click)="openApproveModal(p, 'REJECT')"
                    style="padding: 4px 8px; font-size: 11px; color: var(--color-lost); border-color: rgba(239, 68, 68, 0.2);"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">close</span>
                    Reject
                  </button>
                  <button 
                    *ngIf="p.status === 'APPROVED'"
                    class="btn btn-xs btn-secondary flex align-center gap-1"
                    (click)="openReverseModal(p)"
                    style="padding: 4px 8px; font-size: 11px; color: #a855f7; border-color: rgba(168, 85, 247, 0.2);"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">history</span>
                    Reverse
                  </button>
                  <span *ngIf="p.status === 'REJECTED' || p.status === 'REVERSED'" class="text-secondary font-xs italic">No actions available</span>
                </div>
              </td>
            </tr>
            <tr *ngIf="payments.length === 0">
              <td colspan="8" class="text-center py-6 text-secondary">
                No payments registered in ledger.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Record Payment Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 650px;">
        <div class="modal-header flex justify-between align-center">
          <h2>Record Customer Payment</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitPayment($event)">
            <!-- Contract Selection * -->
            <div class="form-group flex flex-col">
              <label>Select Sales Contract * [REQUIRED]</label>
              <select [(ngModel)]="newPayment.contractId" name="contractId" required (change)="onContractChange()">
                <option [value]="0">-- Select Contract --</option>
                <option *ngFor="let c of contracts" [value]="c.id">
                  {{ c.contractNo }} - {{ c.customer?.fullName }} (ETB {{ c.contractAmount | number }})
                </option>
              </select>
            </div>

            <!-- Customer Field * [READ-ONLY] -->
            <div class="form-group flex flex-col">
              <label>Customer Profile Name * [READ-ONLY]</label>
              <input type="text" [value]="selectedContractCustomerName" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-row flex gap-3">
              <!-- Payment Method * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Payment Method * [REQUIRED]</label>
                <select [(ngModel)]="newPayment.paymentMethodId" name="paymentMethodId" required (change)="onPaymentMethodChange()">
                  <option [value]="0">-- Select Method --</option>
                  <option *ngFor="let m of paymentMethods" [value]="m.id">
                    {{ m.paymentMethodName }}
                  </option>
                </select>
              </div>

              <!-- Payment Reference -->
              <div class="form-group flex-1 flex flex-col">
                <label>Payment Reference / Voucher ID</label>
                <input type="text" [(ngModel)]="newPayment.paymentReference" name="paymentReference" placeholder="e.g. VCH-98219" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Payment Date * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Payment Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newPayment.paymentDate" name="paymentDate" required />
              </div>

              <!-- Payment Amount * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Payment Amount (ETB) * [REQUIRED]</label>
                <input type="number" [(ngModel)]="newPayment.paymentAmount" name="paymentAmount" required placeholder="e.g. 50000" />
              </div>
            </div>

            <!-- Conditional Method-Specific Fields -->
            <div class="card p-3 border mb-3" style="background-color: rgba(255, 255, 255, 0.02); border-radius: var(--radius-sm);" *ngIf="showBankFields() || showTxFields() || showChequeFields()">
              <h4 style="margin-bottom: 12px; font-size: 13px;" class="text-main">Payment Method Specific Details</h4>
              
              <div class="form-group flex flex-col" *ngIf="showBankFields()">
                <label>Bank Name * [REQUIRED FOR BANK/CHEQUE]</label>
                <input type="text" [(ngModel)]="newPayment.bankName" name="bankName" placeholder="e.g. Commercial Bank of Ethiopia" [required]="showBankFields()" />
              </div>

              <div class="form-row flex gap-3" style="margin-top: 8px;">
                <div class="form-group flex-1 flex flex-col" *ngIf="showTxFields()">
                  <label>Transaction Reference ID * [REQUIRED FOR DIGITAL]</label>
                  <input type="text" [(ngModel)]="newPayment.transactionReference" name="transactionReference" placeholder="e.g. FT26081829" [required]="showTxFields()" />
                </div>

                <div class="form-group flex-1 flex flex-col" *ngIf="showChequeFields()">
                  <label>Cheque Number * [REQUIRED FOR CHEQUE]</label>
                  <input type="text" [(ngModel)]="newPayment.chequeNumber" name="chequeNumber" placeholder="e.g. CHQ-8192083" [required]="showChequeFields()" />
                </div>
              </div>
            </div>

            <!-- Remarks -->
            <div class="form-group flex flex-col">
              <label>Internal Remarks / Audit Comments</label>
              <textarea [(ngModel)]="newPayment.remarks" name="remarks" placeholder="Add custom notes..." rows="3"></textarea>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="newPayment.contractId === 0 || newPayment.paymentMethodId === 0 || !newPayment.paymentDate || !newPayment.paymentAmount"
              >
                Submit Payment for Verification
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Approve/Reject Workflow Modal -->
    <div class="modal-overlay" *ngIf="showApproveModal" (click)="closeApproveModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>{{ workflowAction === 'APPROVE' ? 'Approve' : 'Reject' }} Payment</h2>
          <button class="header-icon-btn close-btn" (click)="closeApproveModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <p class="text-secondary" style="margin-bottom: 16px;">
            Are you sure you want to <strong>{{ workflowAction === 'APPROVE' ? 'approve and allocate' : 'reject' }}</strong> the payment of 
            <strong class="text-main">ETB {{ selectedPayment?.paymentAmount | number }}</strong> from <strong class="text-main">{{ selectedPayment?.customer?.fullName }}</strong>?
          </p>
          <div *ngIf="workflowAction === 'APPROVE'" class="alert alert-info py-2 font-xs mb-3" style="background-color: rgba(59, 130, 246, 0.08); border-radius: var(--radius-sm); border: 1px solid rgba(59, 130, 246, 0.2); color: #3b82f6;">
            <strong>Note:</strong> Approving this payment will trigger the FIFO engine to automatically allocate the funds to outstanding installment schedules.
          </div>

          <form class="modal-form" (submit)="onSubmitWorkflow($event)">
            <div class="form-group flex flex-col">
              <label>Reason / Comments</label>
              <textarea [(ngModel)]="workflowComment" name="workflowComment" placeholder="Provide reason or audit comment..." rows="3"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeApproveModal()">Cancel</button>
              <button type="submit" class="btn" [ngClass]="workflowAction === 'APPROVE' ? 'btn-primary' : 'btn-danger'">
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Reversal Modal -->
    <div class="modal-overlay" *ngIf="showReverseModal" (click)="closeReverseModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2 style="color: #a855f7;">Reverse Payment (Rollback)</h2>
          <button class="header-icon-btn close-btn" (click)="closeReverseModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="alert alert-danger font-xs mb-3" style="background-color: rgba(239, 68, 68, 0.08); border-radius: var(--radius-sm); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--color-lost);">
            <strong>WARNING:</strong> Reversing this payment will roll back all FIFO allocations, update schedule statuses to PENDING/PARTIAL, cancel the receipt, and recalculate customer balances.
          </div>
          <p class="text-secondary" style="margin-bottom: 16px;">
            Payment Reference: <strong class="text-main">{{ selectedPayment?.paymentReference }}</strong><br>
            Amount: <strong class="text-main">ETB {{ selectedPayment?.paymentAmount | number }}</strong>
          </p>

          <form class="modal-form" (submit)="onSubmitReversal($event)">
            <div class="form-group flex flex-col">
              <label>Reversal Reason * [REQUIRED]</label>
              <textarea [(ngModel)]="reversalComment" name="reversalComment" placeholder="Explain why the transaction is being reversed..." required rows="3"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeReverseModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" style="background-color: #a855f7; border-color: #a855f7;" [disabled]="!reversalComment">
                Execute Reversal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-warning { color: var(--color-contacted) !important; }
    .text-success { color: var(--color-qualified) !important; }
    .text-danger { color: var(--color-lost) !important; }
    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-approved { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-rejected { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-reversed { background-color: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .badge-indigo { background-color: var(--brand-primary-fade); color: var(--brand-primary); }
    .btn-danger {
      background-color: var(--color-lost);
      border-color: var(--color-lost);
      color: white;
    }
    .btn-danger:hover {
      background-color: #b91c1c;
      border-color: #b91c1c;
    }
  `]
})
export class CollectionsComponent implements OnInit {
  private financeService = inject(FinanceService);
  private salesService = inject(SalesService);

  payments: any[] = [];
  contracts: any[] = [];
  paymentMethods: any[] = [];

  successMessage = '';
  errorMessage = '';

  filterStatus = '';

  // Stats
  stats = {
    totalCollections: 0
  };
  pendingPaymentsCount = 0;
  approvedCollectionsAmount = 0;

  // Modal controls
  showCreateModal = false;
  showApproveModal = false;
  showReverseModal = false;

  selectedPayment: any = null;
  workflowAction: 'APPROVE' | 'REJECT' = 'APPROVE';
  workflowComment = '';
  reversalComment = '';

  newPayment = {
    paymentReference: '',
    contractId: 0,
    customerId: 0,
    paymentMethodId: 0,
    paymentDate: '',
    paymentAmount: 0,
    bankName: '',
    transactionReference: '',
    chequeNumber: '',
    remarks: ''
  };

  selectedContractCustomerName = '';

  ngOnInit() {
    this.loadPayments();
    this.loadContracts();
    this.loadPaymentMethods();
    this.loadSummaryStats();
  }

  loadPayments() {
    const params: any = {};
    if (this.filterStatus) {
      params.status = this.filterStatus;
    }
    this.financeService.getPayments(params).subscribe({
      next: (res) => {
        this.payments = res;
        this.pendingPaymentsCount = res.filter((p: any) => p.status === 'PENDING').length;
        this.approvedCollectionsAmount = res
          .filter((p: any) => p.status === 'APPROVED')
          .reduce((sum: number, p: any) => sum + Number(p.paymentAmount), 0);
      },
      error: (err) => console.error('Error fetching payments', err)
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

  loadPaymentMethods() {
    this.financeService.getPaymentMethods().subscribe({
      next: (res) => {
        this.paymentMethods = res;
      },
      error: (err) => console.error('Error fetching payment methods', err)
    });
  }

  loadSummaryStats() {
    this.financeService.getRevenueSummary().subscribe({
      next: (res) => {
        this.stats.totalCollections = res.totalCollections;
      },
      error: (err) => console.error('Error fetching revenue summary', err)
    });
  }

  onContractChange() {
    if (this.newPayment.contractId === 0) {
      this.selectedContractCustomerName = '';
      this.newPayment.customerId = 0;
      return;
    }
    const contract = this.contracts.find(c => c.id == this.newPayment.contractId);
    if (contract && contract.customer) {
      this.selectedContractCustomerName = contract.customer.fullName;
      this.newPayment.customerId = contract.customer.id;
    }
  }

  onPaymentMethodChange() {
    this.newPayment.bankName = '';
    this.newPayment.transactionReference = '';
    this.newPayment.chequeNumber = '';
  }

  getSelectedPaymentMethodCode(): string {
    if (this.newPayment.paymentMethodId === 0) return '';
    const m = this.paymentMethods.find(x => x.id == this.newPayment.paymentMethodId);
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      case 'REVERSED': return 'badge-reversed';
      default: return '';
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.selectedContractCustomerName = '';
    
    this.newPayment = {
      paymentReference: '',
      contractId: 0,
      customerId: 0,
      paymentMethodId: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentAmount: 0,
      bankName: '',
      transactionReference: '',
      chequeNumber: '',
      remarks: ''
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openApproveModal(p: any, action: 'APPROVE' | 'REJECT') {
    this.selectedPayment = p;
    this.workflowAction = action;
    this.workflowComment = action === 'APPROVE' ? 'Payment verified and approved.' : 'Verification failed.';
    this.showApproveModal = true;
  }

  closeApproveModal() {
    this.showApproveModal = false;
  }

  openReverseModal(p: any) {
    this.selectedPayment = p;
    this.reversalComment = '';
    this.showReverseModal = true;
  }

  closeReverseModal() {
    this.showReverseModal = false;
  }

  onSubmitPayment(event: Event) {
    event.preventDefault();
    if (this.newPayment.contractId === 0 || this.newPayment.paymentMethodId === 0) return;

    this.financeService.createPayment(this.newPayment).subscribe({
      next: (res) => {
        this.successMessage = `Payment recorded successfully with reference ${res.paymentReference}. Pending approval verification!`;
        this.loadPayments();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error recording payment', err);
        this.errorMessage = err.error?.message || 'Failed to record payment.';
      }
    });
  }

  onSubmitWorkflow(event: Event) {
    event.preventDefault();
    if (!this.selectedPayment) return;

    const stream$ = this.workflowAction === 'APPROVE' 
      ? this.financeService.approvePayment(this.selectedPayment.id, { approvalComment: this.workflowComment })
      : this.financeService.rejectPayment(this.selectedPayment.id, { approvalComment: this.workflowComment });

    stream$.subscribe({
      next: () => {
        this.successMessage = `Payment was successfully ${this.workflowAction === 'APPROVE' ? 'approved & allocated' : 'rejected'}!`;
        this.loadPayments();
        this.loadSummaryStats();
        this.closeApproveModal();
      },
      error: (err) => {
        console.error('Error updating workflow', err);
        this.errorMessage = err.error?.message || 'Workflow update failed.';
        this.closeApproveModal();
      }
    });
  }

  onSubmitReversal(event: Event) {
    event.preventDefault();
    if (!this.selectedPayment || !this.reversalComment) return;

    this.financeService.reversePayment(this.selectedPayment.id, this.reversalComment).subscribe({
      next: () => {
        this.successMessage = `Payment transaction reversed, ledger allocations rolled back.`;
        this.loadPayments();
        this.loadSummaryStats();
        this.closeReverseModal();
      },
      error: (err) => {
        console.error('Error reversing payment', err);
        this.errorMessage = err.error?.message || 'Reversal failed.';
        this.closeReverseModal();
      }
    });
  }
}
