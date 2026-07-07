import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrokerService } from '../../services/broker.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-broker-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Commission Payouts Ledger</h1>
        <p>Record disbursement payment runs, track historical vouchers, and print receipts</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openPaymentModal()">
          <span class="material-icons-outlined">account_balance_wallet</span> Disburse Payout
        </button>
      </div>
    </header>

    <div class="leads-workspace-grid flex flex-col gap-6" style="padding-bottom: 40px;">
      <!-- Payments List Card -->
      <div class="card p-6">
        <h3 class="margin-b-4">Disbursements Ledger</h3>
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 25%;">Broker Name</th>
                <th style="width: 20%;">Payment Ref</th>
                <th style="width: 15%;">Method</th>
                <th style="width: 15%;">Disbursed Amount</th>
                <th style="width: 15%;">Date</th>
                <th style="width: 10%;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of payments">
                <td>
                  <div class="flex flex-col">
                    <span class="font-semibold text-main">{{ item.broker?.brokerName }}</span>
                    <span class="text-xs text-muted">{{ item.broker?.brokerCode }}</span>
                  </div>
                </td>
                <td>
                  <span class="font-semibold text-secondary">{{ item.paymentReference }}</span>
                </td>
                <td>
                  <span class="type-pill" style="font-size: 11px;">{{ item.paymentMethodId }}</span>
                </td>
                <td>
                  <strong class="font-mono text-indigo">ETB {{ item.totalAmount | number:'1.2-2' }}</strong>
                </td>
                <td>
                  <span class="text-secondary">{{ item.paymentDate | date:'mediumDate' }}</span>
                </td>
                <td>
                  <span class="badge badge-qualified">{{ item.statusId }}</span>
                </td>
              </tr>
              <tr *ngIf="!payments.length">
                <td colspan="6" class="text-center text-secondary py-8">
                  No payout entries registered in ledger.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Disburse Payout Modal -->
    <div class="modal-overlay" *ngIf="showPaymentModal" (click)="closePaymentModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 600px;">
        <header class="modal-header">
          <h2>Record Disbursement Payment</h2>
          <button class="header-icon-btn close-btn" (click)="closePaymentModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="savePayment()" #payForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              
              <!-- Select Broker -->
              <div class="form-group col-span-2">
                <label for="payBrokerId">Select Broker *</label>
                <select id="payBrokerId" name="payBrokerId" [(ngModel)]="paymentFormModel.brokerId" required class="form-control" (change)="onBrokerSelect()">
                  <option [ngValue]="null" disabled selected>-- Choose Broker --</option>
                  <option *ngFor="let b of brokers" [ngValue]="b.id">{{ b.brokerName }} ({{ b.brokerCode }})</option>
                </select>
              </div>

              <!-- List of Approved commissions to pay -->
              <div class="form-group col-span-2" *ngIf="paymentFormModel.brokerId">
                <label style="font-weight: 600; margin-bottom: 8px;">Select Commissions to Pay *</label>
                <div class="flex flex-col gap-2 border p-3 rounded-md max-height-200" style="overflow-y: auto; background-color: var(--bg-main);">
                  <div *ngFor="let comm of approvedCommissions" class="flex justify-between items-center border p-3 rounded-md bg-glass" style="gap: 12px;">
                    <div class="flex align-center gap-3" style="flex: 1; min-width: 0;">
                      <input type="checkbox" [id]="'comm-' + comm.id" (change)="toggleCommissionSelection(comm)" [checked]="isCommissionSelected(comm)" style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;">
                      <label [for]="'comm-' + comm.id" style="margin-bottom: 0; cursor: pointer; display: flex; flex-direction: column; flex: 1; min-width: 0;">
                        <span class="font-semibold text-main" style="font-size: 13px; line-height: 1.4; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ comm.brokerSale?.property?.propertyName || 'N/A' }}</span>
                        <span class="text-muted" style="font-size: 11px; margin-top: 2px;">Sale Vol: ETB {{ comm.saleAmount | number:'1.2-2' }}</span>
                      </label>
                    </div>
                    <div class="text-right" style="flex-shrink: 0; min-width: 100px;">
                      <strong class="font-mono text-indigo" style="font-size: 14px;">ETB {{ comm.commissionAmount | number:'1.2-2' }}</strong>
                      <span class="text-muted" style="display: block; font-size: 10px; margin-top: 2px;">Earned Comm.</span>
                    </div>
                  </div>
                  <div *ngIf="!approvedCommissions.length" class="text-secondary py-3 text-center font-sm">
                    No approved outstanding commissions found for this broker.
                  </div>
                </div>
              </div>

              <!-- Disbursement details -->
              <div class="form-group">
                <label for="paymentReference">Payment Reference / Transaction ID *</label>
                <input type="text" id="paymentReference" name="paymentReference" [(ngModel)]="paymentFormModel.paymentReference" required placeholder="e.g. TXN-198273" class="form-control">
              </div>

              <div class="form-group">
                <label for="paymentMethodId">Payment Method *</label>
                <select id="paymentMethodId" name="paymentMethodId" [(ngModel)]="paymentFormModel.paymentMethodId" required class="form-control">
                  <option value="BANK_TRANSFER">Bank Transfer (EFT)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash Payment</option>
                </select>
              </div>

              <div class="form-group col-span-2">
                <label for="paymentDate">Disbursement Date *</label>
                <input type="date" id="paymentDate" name="paymentDate" [(ngModel)]="paymentFormModel.paymentDate" required class="form-control">
              </div>

              <!-- Total summary indicator -->
              <div class="form-group col-span-2 border-top pt-3 flex justify-between align-center" *ngIf="selectedCommissions.length > 0">
                <span class="font-semibold text-secondary">Total Payout Amount:</span>
                <strong class="font-mono text-indigo" style="font-size: 18px;">ETB {{ calculateTotalPayout() | number:'1.2-2' }}</strong>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closePaymentModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!payForm.valid || selectedCommissions.length === 0">Confirm Disbursement</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      outline: none;
    }
    .form-control:focus {
      border-color: var(--brand-primary);
    }
    .max-height-200 {
      max-height: 200px;
    }
    .type-pill {
      background-color: var(--brand-primary-light);
      color: var(--brand-primary);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
  `]
})
export class BrokerPaymentsComponent implements OnInit {
  private brokerService = inject(BrokerService);

  payments: any[] = [];
  brokers: any[] = [];
  approvedCommissions: any[] = [];
  selectedCommissions: any[] = [];

  showPaymentModal = false;

  paymentFormModel: any = {};

  ngOnInit() {
    this.loadPayments();
    this.loadBrokers();
  }

  loadPayments() {
    this.brokerService.getPayments().subscribe(res => {
      this.payments = res;
    });
  }

  loadBrokers() {
    this.brokerService.getBrokers().subscribe(res => {
      this.brokers = res.filter(b => b.statusId === 'ACTIVE');
    });
  }

  openPaymentModal() {
    this.paymentFormModel = {
      brokerId: null,
      paymentReference: '',
      paymentMethodId: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0]
    };
    this.approvedCommissions = [];
    this.selectedCommissions = [];
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
  }

  onBrokerSelect() {
    if (!this.paymentFormModel.brokerId) return;
    this.brokerService.getCommissions().subscribe(res => {
      // Find commissions belonging to selected broker that are APPROVED
      this.approvedCommissions = res.filter(c => Number(c.broker?.id) === Number(this.paymentFormModel.brokerId) && c.statusId === 'APPROVED');
      this.selectedCommissions = [];
    });
  }

  toggleCommissionSelection(comm: any) {
    const idx = this.selectedCommissions.findIndex(c => c.id === comm.id);
    if (idx > -1) {
      this.selectedCommissions.splice(idx, 1);
    } else {
      this.selectedCommissions.push(comm);
    }
  }

  isCommissionSelected(comm: any): boolean {
    return this.selectedCommissions.some(c => c.id === comm.id);
  }

  calculateTotalPayout(): number {
    return this.selectedCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
  }

  savePayment() {
    const dto = {
      paymentReference: this.paymentFormModel.paymentReference,
      paymentDate: this.paymentFormModel.paymentDate,
      paymentMethodId: this.paymentFormModel.paymentMethodId,
      allocations: this.selectedCommissions.map(c => ({
        brokerCommissionId: c.id,
        amountPaid: Number(c.commissionAmount)
      }))
    };

    this.brokerService.recordPayment(dto).subscribe({
      next: () => {
        this.loadPayments();
        this.closePaymentModal();
      },
      error: err => console.error('Failed to disburse commission payments', err)
    });
  }
}
