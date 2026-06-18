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
        <p>Configure sales representative payout percentage rules and track closed contract agent earnings</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateRuleModal()">
          <span class="material-icons-outlined">add</span>
          Configure Commission Rule
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
        (click)="activeTab = 'ledger'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'ledger' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'ledger' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Commission Ledger
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'rules'" 
        (click)="activeTab = 'rules'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'rules' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'rules' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Payout Rules Configuration
      </button>
    </div>

    <!-- Commission Ledger Tab -->
    <div class="card glass-card" *ngIf="activeTab === 'ledger'">
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Payout ID</th>
              <th>Contract Reference</th>
              <th>Sales Representative</th>
              <th>Base Rule</th>
              <th>Total Sale (ETB)</th>
              <th>Commission (ETB)</th>
              <th>Status</th>
              <th>Date Generated</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let comm of commissions">
              <td class="font-mono font-bold">#PAY-0{{ comm.id }}</td>
              <td class="font-mono">{{ comm.contract?.contractNo }}</td>
              <td>{{ comm.salesRep?.fullName }}</td>
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
            </tr>
            <tr *ngIf="commissions.length === 0">
              <td colspan="8" class="text-center py-6 text-secondary">
                No commission payouts calculated yet. Earnings will appear automatically when contracts are executed.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payout Rules Tab -->
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
                No custom commission rules registered. Standard defaults will be applied.
              </td>
            </tr>
          </tbody>
        </table>
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
              <input type="text" [(ngModel)]="newRule.commissionName" name="commissionName" required placeholder="e.g. Standard Agent 3.5% Payout" />
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
                <input type="number" [(ngModel)]="newRule.commissionValue" name="commissionValue" required placeholder="e.g. 3.5 or 50000" />
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
    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-approved { background-color: rgba(59, 130, 246, 0.15); color: var(--color-new); }
    .badge-paid { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-active { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-disabled { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-indigo { background-color: var(--brand-primary-fade); color: var(--brand-primary); }
  `]
})
export class CommissionsComponent implements OnInit {
  private salesService = inject(SalesService);

  activeTab = 'ledger';
  commissions: any[] = [];
  rules: any[] = [];

  successMessage = '';
  errorMessage = '';

  showCreateRuleModal = false;

  newRule = {
    commissionName: '',
    commissionType: 'PERCENTAGE',
    commissionValue: 0,
    isActive: true
  };

  ngOnInit() {
    this.loadCommissions();
    this.loadRules();
  }

  loadCommissions() {
    this.salesService.getCommissions().subscribe({
      next: (res) => this.commissions = res,
      error: (err) => console.error('Error loading commissions', err)
    });
  }

  loadRules() {
    this.salesService.getCommissionRules().subscribe({
      next: (res) => this.rules = res,
      error: (err) => console.error('Error loading commission rules', err)
    });
  }

  getCommissionStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'PAID': return 'badge-paid';
      default: return '';
    }
  }

  openCreateRuleModal() {
    this.showCreateRuleModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.newRule = {
      commissionName: '',
      commissionType: 'PERCENTAGE',
      commissionValue: 0,
      isActive: true
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
      isActive: this.newRule.isActive
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
      }
    });
  }
}
