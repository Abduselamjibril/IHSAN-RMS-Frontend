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

    <!-- Tabs -->
    <div class="flex gap-4" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'ledger'" 
        (click)="activeTab = 'ledger'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'ledger' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'ledger' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Collections Ledger
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'installments'" 
        (click)="activeTab = 'installments'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'installments' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'installments' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Installment Collection
      </button>
    </div>

    <!-- Tab 1: Payments Table Ledger -->
    <div class="card glass-card" *ngIf="activeTab === 'ledger'">
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
                    *ngIf="p.status === 'APPROVED' && receiptsMap[p.id]"
                    class="btn btn-xs btn-indigo flex align-center gap-1"
                    (click)="downloadReceiptPdf(receiptsMap[p.id], false)"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">file_download</span>
                    Download PDF
                  </button>
                  <button 
                    *ngIf="p.status === 'APPROVED' && receiptsMap[p.id]"
                    class="btn btn-xs btn-indigo flex align-center gap-1"
                    (click)="downloadReceiptPdf(receiptsMap[p.id], true)"
                    style="padding: 4px 8px; font-size: 11px; background-color: var(--color-qualified); border-color: var(--color-qualified); color: white;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">print</span>
                    Print
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

    <!-- Tab 2: Installment Collection -->
    <div *ngIf="activeTab === 'installments'" class="grid gap-6 animate-fade-in" style="display: grid; grid-template-columns: 1fr; gap: 24px;">
      <div class="card glass-card" *ngFor="let plan of plans">
        <div class="flex justify-between align-center border-bottom pb-3 mb-3" style="border-bottom: 1px solid var(--border-color);">
          <div>
            <h3 class="text-main">Plan Reference: #IP-0{{ plan.id }}</h3>
            <p class="text-secondary font-xs">Contract No: {{ plan.contract?.contractNo }} | Customer: {{ plan.contract?.customer?.fullName }}</p>
          </div>
          <div class="flex gap-2 font-mono font-bold text-main">
            <span>Valuation: ETB {{ plan.totalContractAmount | number }}</span>
            <span class="text-secondary">|</span>
            <span class="text-success">Down Paid: ETB {{ plan.downPayment | number }}</span>
          </div>
        </div>

        <div class="table-container shadow-none" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
          <table class="leads-table" style="font-size: 12px; width: 100%;">
            <thead>
              <tr>
                <th style="padding: 10px 14px !important;">No</th>
                <th style="padding: 10px 14px !important;">Due Date</th>
                <th style="padding: 10px 14px !important;">Installment Amount</th>
                <th style="padding: 10px 14px !important;">Paid Amount</th>
                <th style="padding: 10px 14px !important;">Outstanding Balance</th>
                <th style="padding: 10px 14px !important;">Status</th>
                <th style="padding: 10px 14px !important;">Payment Date</th>
                <th style="padding: 10px 14px !important;" class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sch of plan.schedules" style="cursor: default;">
                <td class="font-mono" style="padding: 10px 14px !important;">#{{ sch.installmentNo }}</td>
                <td style="padding: 10px 14px !important;">{{ sch.dueDate | date:'mediumDate' }}</td>
                <td class="font-mono" style="padding: 10px 14px !important;">ETB {{ sch.installmentAmount | number }}</td>
                <td class="font-mono text-success" style="padding: 10px 14px !important;">ETB {{ sch.paidAmount | number }}</td>
                <td class="font-mono text-danger" style="padding: 10px 14px !important;">ETB {{ sch.outstandingAmount | number }}</td>
                <td style="padding: 10px 14px !important;">
                  <span class="badge" [ngClass]="getScheduleStatusBadge(sch.status)">
                    {{ sch.status }}
                  </span>
                </td>
                <td style="padding: 10px 14px !important;">{{ sch.paymentDate ? (sch.paymentDate | date:'mediumDate') : '-' }}</td>
                <td style="padding: 10px 14px !important;" class="text-center">
                  <ng-container *ngIf="sch.status !== 'PAID'">
                    <button 
                      *ngIf="!hasPendingPayment(plan.contract?.id, sch.installmentNo)"
                      class="btn btn-secondary btn-xs flex align-center gap-1"
                      (click)="collectForSchedule(plan, sch)"
                      style="padding: 4px 8px; font-size: 10px; margin: 0 auto;"
                    >
                      <span class="material-icons-outlined" style="font-size: 12px;">payment</span>
                      <span>Collect</span>
                    </button>
                    <span *ngIf="hasPendingPayment(plan.contract?.id, sch.installmentNo)" class="text-secondary font-xs italic flex align-center justify-center gap-1" style="color: var(--color-contacted) !important; font-weight: 500;">
                      <span class="material-icons-outlined" style="font-size: 14px;">hourglass_empty</span>
                      Pending Approval
                    </span>
                  </ng-container>
                  <span *ngIf="sch.status === 'PAID'" class="text-secondary font-xs italic">Paid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card glass-card text-center py-6 text-secondary" *ngIf="plans.length === 0">
        No active installment schedules generated yet. Generate schedule plans under Sales module first.
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
  plans: any[] = [];

  successMessage = '';
  errorMessage = '';

  activeTab = 'ledger';
  receiptsMap: Record<number, any> = {};
  orgSettings = {
    companyName: 'IHSAN Properties & Business Service PLC',
    tinNumber: '',
    vatNumber: '',
    primaryColor: '#4F46E5',
    secondaryColor: '#1E293B',
    fontFamily: 'Helvetica',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    logoPath: '',
    companySealPath: '',
    headerImagePath: '',
    footerImagePath: '',
    authorizedSignatoryName: '',
    authorizedSignatoryTitle: ''
  };
  savedSignatureUrl = '';
  selectedTemplate: any = null;
  templates: any[] = [];
  templateStructure: any[] = [];
  templateTheme = {
    primaryColor: '#4F46E5',
    fontFamily: 'Helvetica',
    padding: 20
  };
  filterStatus = '';
  targetInstallmentNo: number | null = null;

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
    this.loadPlans();
    this.loadReceipts();
    this.loadSettings();
    this.loadSignature();
    this.loadTemplates();
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
    this.targetInstallmentNo = null;
    
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

    if (this.targetInstallmentNo !== null) {
      this.newPayment.remarks = `[Installment #${this.targetInstallmentNo}] ${this.newPayment.remarks || ''}`.trim();
    }

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
        this.loadPlans();
        this.loadReceipts();
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
        this.loadPlans();
        this.loadReceipts();
        this.closeReverseModal();
      },
      error: (err) => {
        console.error('Error reversing payment', err);
        this.errorMessage = err.error?.message || 'Reversal failed.';
        this.closeReverseModal();
      }
    });
  }

  loadPlans() {
    this.salesService.getInstallmentPlans().subscribe({
      next: (res) => this.plans = res,
      error: (err) => console.error('Error fetching plans', err)
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

  collectForSchedule(plan: any, schedule: any) {
    this.openCreateModal();
    this.targetInstallmentNo = schedule.installmentNo;
    this.newPayment.contractId = plan.contract?.id;
    
    const resolveContract = () => {
      const contract = this.contracts.find(c => c.id == this.newPayment.contractId);
      if (contract && contract.customer) {
        this.selectedContractCustomerName = contract.customer.fullName;
        this.newPayment.customerId = contract.customer.id;
      }
    };
    
    if (this.contracts && this.contracts.length > 0) {
      resolveContract();
    } else {
      this.salesService.getContracts().subscribe({
        next: (res) => {
          this.contracts = res.filter((c: any) => c.status === 'ACTIVE');
          resolveContract();
        }
      });
    }
    
    this.newPayment.paymentAmount = Number(schedule.outstandingAmount);
  }

  hasPendingPayment(contractId: number, installmentNo?: number): boolean {
    if (!contractId || !this.payments) return false;
    if (installmentNo) {
      const matchTag = `[Installment #${installmentNo}]`;
      return this.payments.some(p => 
        Number(p.contract?.id) === Number(contractId) && 
        p.status === 'PENDING' && 
        p.remarks && p.remarks.includes(matchTag)
      );
    }
    return this.payments.some(p => Number(p.contract?.id) === Number(contractId) && p.status === 'PENDING');
  }

  loadReceipts() {
    this.financeService.getReceipts().subscribe({
      next: (res) => {
        this.receiptsMap = {};
        res.forEach((r: any) => {
          if (r.payment && r.payment.id) {
            this.receiptsMap[r.payment.id] = r;
          }
        });
      },
      error: (err) => console.error('Error fetching receipts', err)
    });
  }

  loadSettings() {
    this.financeService.getSettings().subscribe({
      next: (res) => {
        if (res) {
          this.orgSettings = {
            companyName: res.companyName || 'IHSAN Properties & Business Service PLC',
            tinNumber: res.tinNumber || '',
            vatNumber: res.vatNumber || '',
            primaryColor: res.primaryColor || '#4F46E5',
            secondaryColor: res.secondaryColor || '#1E293B',
            fontFamily: res.fontFamily || 'Helvetica',
            companyAddress: res.companyAddress || '',
            companyPhone: res.companyPhone || '',
            companyEmail: res.companyEmail || '',
            logoPath: res.logoPath || '',
            companySealPath: res.companySealPath || '',
            headerImagePath: res.headerImagePath || '',
            footerImagePath: res.footerImagePath || '',
            authorizedSignatoryName: res.authorizedSignatoryName || '',
            authorizedSignatoryTitle: res.authorizedSignatoryTitle || ''
          };
        }
      },
      error: (err) => console.error('Error fetching settings', err)
    });
  }

  loadSignature() {
    this.financeService.getUserSignature().subscribe({
      next: (res) => {
        if (res && res.signaturePngPath) {
          this.savedSignatureUrl = 'http://localhost:3000' + res.signaturePngPath;
        } else {
          this.savedSignatureUrl = '';
        }
      },
      error: (err) => console.error('Error fetching signature', err)
    });
  }

  loadTemplates() {
    this.financeService.getReceiptTemplates().subscribe({
      next: (res) => {
        this.templates = res;
        if (res.length > 0) {
          const defaultT = res.find((t: any) => t.isDefault) || res[0];
          this.selectedTemplate = defaultT;
          if (defaultT && defaultT.templateContent) {
            try {
              const parsed = JSON.parse(defaultT.templateContent);
              this.templateTheme = parsed.theme || { primaryColor: '#4F46E5', fontFamily: 'Helvetica', padding: 20 };
              this.templateStructure = parsed.structure || [];
            } catch (e) {
              this.loadDefaultStructure();
            }
          } else {
            this.loadDefaultStructure();
          }
        }
      },
      error: (err) => console.error('Error fetching templates', err)
    });
  }

  loadDefaultStructure() {
    this.templateTheme = {
      primaryColor: '#4F46E5',
      fontFamily: 'Helvetica',
      padding: 20
    };
    this.templateStructure = [
      { id: 'block-1', type: 'header_image', maxHeight: 80, objectFit: 'contain' },
      { id: 'block-2', type: 'title', text: 'OFFICIAL RECEIPT', align: 'center', fontSize: 20 },
      { id: 'block-3', type: 'paragraph', text: 'This is an official confirmation of the payment received from {{customer_name}} under contract {{contract_no}}.', align: 'left', fontSize: 12 },
      { 
        id: 'block-4', 
        type: 'table', 
        style: 'bordered', 
        rows: [
          { label: 'Receipt Number', value: '{{receipt_no}}' },
          { label: 'Payment Date', value: '{{payment_date}}' },
          { label: 'Contract Number', value: '{{contract_no}}' },
          { label: 'Payment Method', value: '{{payment_method}}' }
        ] 
      },
      { 
        id: 'block-5', 
        type: 'table', 
        style: 'bordered', 
        rows: [
          { label: 'Amount Received', value: 'ETB {{payment_amount}}' },
          { label: 'Remaining Outstanding Balance', value: 'ETB {{outstanding_balance}}' }
        ] 
      },
      { id: 'block-6', type: 'signatures', layout: 'double_sign_seal', sealSize: 70 },
      { id: 'block-7', type: 'footer_image', maxHeight: 50, objectFit: 'contain', text: 'Receipt verified. Thank you for choosing IHSAN.' }
    ];
  }

  compileTokenText(text: string, receipt: any, settings: any): string {
    if (!text || !receipt) return text || '';
    let result = text;
    const tokens: Record<string, string> = {
      'receipt_no': receipt.receiptNumber || '',
      'receipt_number': receipt.receiptNumber || '',
      'payment_ref': receipt.payment?.paymentReference || '',
      'payment_reference': receipt.payment?.paymentReference || '',
      'customer_name': receipt.payment?.customer?.fullName || '',
      'customer_fullname': receipt.payment?.customer?.fullName || '',
      'contract_no': receipt.payment?.contract?.contractNo || '',
      'contract_number': receipt.payment?.contract?.contractNo || '',
      'payment_amount': Number(receipt.payment?.paymentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      'payment_method': receipt.payment?.paymentMethod?.paymentMethodName || '',
      'payment_date': receipt.payment?.paymentDate ? new Date(receipt.payment.paymentDate).toLocaleDateString() : new Date(receipt.receiptDate).toLocaleDateString(),
      'outstanding_balance': Number((receipt.payment?.contract?.contractAmount || 0) - (receipt.payment?.paymentAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      'tin_number': settings?.tinNumber || '',
      'vat_number': settings?.vatNumber || '',
    };

    Object.keys(tokens).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), tokens[key]);
    });
    return result;
  }

  downloadReceiptPdf(r: any, autoPrint = true) {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to download/print the receipt PDF.');
      return;
    }

    const template = r.receiptTemplate || this.selectedTemplate || { qrEnabled: true };
    const font = this.orgSettings.fontFamily || 'Helvetica';
    
    const resolveUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
      return 'http://localhost:3000' + (url.startsWith('/') ? '' : '/') + url;
    };

    let structure = this.templateStructure;
    let theme = this.templateTheme;
    
    const activeTemplate = r.receiptTemplate || this.selectedTemplate;
    if (activeTemplate && activeTemplate.templateContent) {
      try {
        const parsed = JSON.parse(activeTemplate.templateContent);
        if (parsed.structure) structure = parsed.structure;
        if (parsed.theme) theme = parsed.theme;
      } catch (e) {
        console.error('Failed to parse template content', e);
      }
    }

    let blocksHtml = '';
    
    structure.forEach((block: any, idx: number) => {
      const isFirst = idx === 0;
      const isLast = idx === structure.length - 1;

      const isHeaderFill = block.type === 'header_image' && this.orgSettings.headerImagePath && (block.objectFit === 'fill' || block.objectFit === 'cover');
      const isFooterFill = block.type === 'footer_image' && this.orgSettings.footerImagePath && (block.objectFit === 'fill' || block.objectFit === 'cover');
      const isHeaderFooterFill = isHeaderFill || isFooterFill;

      const padLeft = isHeaderFooterFill ? '0' : 'var(--sheet-padding)';
      const padRight = isHeaderFooterFill ? '0' : 'var(--sheet-padding)';
      const padTop = isFirst ? (isHeaderFooterFill ? '0' : 'var(--sheet-padding)') : '0';
      const padBottom = isLast ? (isHeaderFooterFill ? '0' : 'var(--sheet-padding)') : '0';
      
      const marginTop = isLast ? 'auto' : '0';

      const paddingStyle = `padding-left: ${padLeft}; padding-right: ${padRight}; padding-top: ${padTop}; padding-bottom: ${padBottom}; margin: 0; margin-top: ${marginTop}; box-sizing: border-box;`;

      let blockContent = '';

      if (block.type === 'header_image') {
        if (this.orgSettings.headerImagePath) {
          blockContent = `
            <div style="min-height: ${block.maxHeight}px; width: 100%; display: flex; justify-content: center; align-items: center;">
              <img src="${resolveUrl(this.orgSettings.headerImagePath)}" crossorigin="anonymous" style="max-height: ${block.maxHeight}px; height: ${block.maxHeight}px; object-fit: ${block.objectFit}; width: 100%; display: block;" />
            </div>
          `;
        } else {
          const logoHtml = this.orgSettings.logoPath ? `<img src="${resolveUrl(this.orgSettings.logoPath)}" crossorigin="anonymous" style="height: 50px; width: 50px; object-fit: contain; border-radius: 4px;" />` : `<div style="height: 50px; width: 50px; border-radius: 4px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #94a3b8; border: 1px solid #cbd5e1;">L</div>`;
          blockContent = `
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${logoHtml}
                <div style="text-align: left;">
                  <h2 style="font-size: 14px; font-weight: bold; margin: 0; color: #0f172a; text-transform: uppercase;">${this.orgSettings.companyName || 'IHSAN PROPERTIES PLC'}</h2>
                  <div style="font-size: 9px; color: #64748b; margin-top: 2px;">TIN: ${this.orgSettings.tinNumber || '0000000000'} | VAT: ${this.orgSettings.vatNumber || '00000-0'}</div>
                </div>
              </div>
              <div style="text-align: right; font-size: 8px; color: #64748b; line-height: 1.4;">
                <div>${this.orgSettings.companyAddress || 'Bole, Addis Ababa'}</div>
                <div>Tel: ${this.orgSettings.companyPhone || '+251-11'}</div>
                <div>Email: ${this.orgSettings.companyEmail || 'info@ihsan.com'}</div>
              </div>
            </div>
          `;
        }
      } else if (block.type === 'title') {
        const titleText = this.compileTokenText(block.text, r, this.orgSettings);
        blockContent = `
          <div style="text-align: ${block.align}; font-size: ${block.fontSize}px; color: ${this.orgSettings.primaryColor || '#4F46E5'}; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
            ${titleText}
          </div>
        `;
      } else if (block.type === 'paragraph') {
        const bodyText = this.compileTokenText(block.text, r, this.orgSettings);
        blockContent = `
          <div style="text-align: ${block.align}; font-size: ${block.fontSize}px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
            ${bodyText}
          </div>
        `;
      } else if (block.type === 'table') {
        if (block.style === 'bordered') {
          let rowsHtml = '';
          block.rows.forEach((row: any) => {
            rowsHtml += `
              <div style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px;">
                <div style="flex: 1; font-weight: bold; color: #475569;">${this.compileTokenText(row.label, r, this.orgSettings)}</div>
                <div style="flex: 1; text-align: right; color: #0f172a;">${this.compileTokenText(row.value, r, this.orgSettings)}</div>
              </div>
            `;
          });
          blockContent = `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; border-color: ${this.orgSettings.primaryColor || '#4F46E5'}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="display: flex; font-weight: bold; border-bottom: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px; background: ${(this.orgSettings.primaryColor || '#4F46E5') + '15'}; border-color: ${this.orgSettings.primaryColor || '#4F46E5'};">
                <div style="flex: 1; color: #0f172a;">Description Element</div>
                <div style="flex: 1; text-align: right; color: #0f172a;">Value Details</div>
              </div>
              ${rowsHtml}
            </div>
          `;
        } else {
          let rowsHtml = '';
          block.rows.forEach((row: any) => {
            rowsHtml += `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 6px 4px; font-size: 11px;">
                <span style="font-weight: bold; color: #475569;">${this.compileTokenText(row.label, r, this.orgSettings)}</span>
                <span style="color: #0f172a;">${this.compileTokenText(row.value, r, this.orgSettings)}</span>
              </div>
            `;
          });
          blockContent = `
            <div style="width: 100%;">
              <div style="border-top: 3px solid ${this.orgSettings.primaryColor || '#4F46E5'}; margin-bottom: 4px;"></div>
              ${rowsHtml}
            </div>
          `;
        }
      } else if (block.type === 'signatures') {
        if (block.layout === 'double_sign_seal') {
          const sealImg = this.orgSettings.companySealPath ? `<img src="${resolveUrl(this.orgSettings.companySealPath)}" crossorigin="anonymous" style="max-height: ${block.sealSize}px; object-fit: contain;" />` : `<div style="height: ${block.sealSize}px; width: ${block.sealSize}px; border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>`;
          const sigImg = this.savedSignatureUrl ? `<img src="${resolveUrl(this.savedSignatureUrl)}" crossorigin="anonymous" style="max-height: 50px; max-width: 100%; object-fit: contain;" />` : `<div style="font-family: 'Courier New', Courier, monospace; font-style: italic; font-size: 14px; font-weight: bold; color: #1e3a8a;">${this.orgSettings.authorizedSignatoryName || 'Abebe Manager'}</div>`;
          blockContent = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
              <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 150px;">
                <div style="height: ${block.sealSize}px; width: ${block.sealSize}px; display: flex; align-items: center; justify-content: center;">
                  ${sealImg}
                </div>
                <div style="font-size: 9px; margin-top: 4px; color: #64748b; font-weight: bold;">Corporate Seal Stamp</div>
              </div>
              <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 180px;">
                <div style="height: 60px; display: flex; align-items: center; justify-content: center; width: 100%; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;">
                  ${sigImg}
                </div>
                <div style="font-size: 8px; color: #475569; font-weight: bold;">${this.orgSettings.authorizedSignatoryTitle || 'General Manager'}</div>
              </div>
            </div>
          `;
        } else {
          const sealImg = this.orgSettings.companySealPath ? `<img src="${resolveUrl(this.orgSettings.companySealPath)}" crossorigin="anonymous" style="max-height: ${block.sealSize}px; object-fit: contain;" />` : `<div style="height: ${block.sealSize}px; width: ${block.sealSize}px; border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>`;
          blockContent = `
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;">
              <div style="height: ${block.sealSize}px; width: ${block.sealSize}px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
                ${sealImg}
              </div>
              <div style="font-size: 9px; color: #64748b; font-weight: bold;">${this.orgSettings.authorizedSignatoryTitle || 'Authorized CFO Signatory'}</div>
            </div>
          `;
        }
      } else if (block.type === 'footer_image') {
        if (this.orgSettings.footerImagePath) {
          blockContent = `
            <div style="width: 100%;">
              <img src="${resolveUrl(this.orgSettings.footerImagePath)}" crossorigin="anonymous" style="max-height: ${block.maxHeight}px; height: ${block.maxHeight}px; object-fit: ${block.objectFit}; width: 100%; display: block;" />
            </div>
          `;
        } else if (block.text) {
          blockContent = `
            <div style="font-size: 10px; color: #64748b; text-align: center; line-height: 1.5; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
              ${this.compileTokenText(block.text, r, this.orgSettings)}
            </div>
          `;
        }
      }

      blocksHtml += `
        <div style="${paddingStyle} width: 100%;">
          ${blockContent}
        </div>
      `;
    });

    const qrCodeHtml = '';

    const htmlContent = `
      <html>
        <head>
          <title>Receipt ${r.receiptNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
            
            body {
              background: #f1f5f9;
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              font-family: '${font}', sans-serif;
              color: #1e293b;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .a4-sheet {
              --sheet-padding: ${theme.padding || 20}px;
              background: white;
              width: 210mm;
              min-height: 297mm;
              padding: 0;
              box-sizing: border-box;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }

            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                background: white;
                padding: 0;
                margin: 0;
              }
              .a4-sheet {
                --sheet-padding: 15mm;
                box-shadow: none;
                border: none;
                width: 210mm;
                height: 297mm;
                padding: 0;
                box-sizing: border-box;
                overflow: hidden;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="a4-sheet">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 20px; width: 100%;">
              ${blocksHtml}
            </div>
            ${qrCodeHtml}
          </div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            document.fonts.ready.then(() => {
              const images = Array.from(document.querySelectorAll('img'));
              const promises = images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve;
                });
              });
              
              Promise.all(promises).then(() => {
                setTimeout(() => {
                  ${autoPrint ? `
                  window.print();
                  ` : `
                  const element = document.querySelector('.a4-sheet');
                  const opt = {
                    margin:       0,
                    filename:     'Receipt-${r.receiptNumber}.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2.5, useCORS: true, logging: false },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                  };
                  html2pdf().from(element).set(opt).save().then(() => {
                    setTimeout(() => window.close(), 1000);
                  }).catch(err => {
                    console.error(err);
                    window.print();
                  });
                  `}
                }, 500);
              });
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
