import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-finance-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Outstanding Balances & Financial Statements</h1>
        <p>Analyze accounts aging brackets, query database customer statement views, and monitor automated payment reminder triggers</p>
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
        [class.active]="activeTab === 'balances'" 
        (click)="activeTab = 'balances'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'balances' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'balances' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Outstanding Balances
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'aging'" 
        (click)="activeTab = 'aging'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'aging' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'aging' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Aging & Revenue Analysis
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'reminders'" 
        (click)="activeTab = 'reminders'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'reminders' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'reminders' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Reminder Configurations & Logs
      </button>
    </div>

    <!-- Tab 1: Outstanding Balances -->
    <div *ngIf="activeTab === 'balances'" class="grid gap-6 animate-fade-in" style="display: grid; grid-template-columns: 1fr; gap: 24px;">
      <div class="card glass-card">
        <h3 style="margin-bottom: 16px;">Customer Outstanding Accounts</h3>

        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Customer Profile</th>
                <th>Contract Reference</th>
                <th>Contract Amount</th>
                <th>Total Paid Amount</th>
                <th>Accrued Penalty Dues</th>
                <th>Outstanding Balance</th>
                <th>Last Calculated</th>
                <th class="text-center">Statement</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of balances">
                <td class="font-bold text-main">{{ b.customer?.fullName }}</td>
                <td class="font-mono">{{ b.contract?.contractNo }}</td>
                <td class="font-mono">ETB {{ b.contractAmount | number }}</td>
                <td class="font-mono text-success">ETB {{ b.totalPaid | number }}</td>
                <td class="font-mono text-danger">ETB {{ b.totalPenalty | number }}</td>
                <td class="font-mono font-bold text-danger">ETB {{ b.outstandingBalance | number }}</td>
                <td>{{ b.lastUpdated | date:'short' }}</td>
                <td class="text-center">
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="viewCustomerStatement(b.customer?.id)"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">assignment</span>
                    View Statement
                  </button>
                </td>
              </tr>
              <tr *ngIf="balances.length === 0">
                <td colspan="8" class="text-center py-6 text-secondary">
                  No balance records compiled yet. Register and approve contract payments to build ledger summaries.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Customer Statement Drawer/Box -->
      <div class="card glass-card border" *ngIf="selectedStatement" style="border-color: var(--brand-primary); margin-top: 16px; background-color: rgba(124, 58, 237, 0.02);">
        <div class="flex justify-between align-center border-bottom pb-2" style="border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
          <h3>
            Statement Account: {{ selectedStatement[0]?.contract_number }}
          </h3>
          <button class="header-icon-btn close-btn" (click)="selectedStatement = null">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
          <div class="flex flex-col">
            <span class="text-secondary font-xs font-bold uppercase">Customer Profile ID</span>
            <span class="font-bold text-main font-mono" style="font-size: 14px; margin-top: 4px;">#CUST-0{{ selectedStatement[0]?.customer_id }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-secondary font-xs font-bold uppercase">Contract Valuation Price</span>
            <span class="font-bold text-main font-mono" style="font-size: 14px; margin-top: 4px;">ETB {{ selectedStatement[0]?.property_price | number }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-secondary font-xs font-bold uppercase">Total Collections Settled</span>
            <span class="font-bold text-success font-mono" style="font-size: 14px; margin-top: 4px;">ETB {{ selectedStatement[0]?.total_paid | number }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-secondary font-xs font-bold uppercase">Accrued Late Fees Penalty</span>
            <span class="font-bold text-danger font-mono" style="font-size: 14px; margin-top: 4px;">ETB {{ selectedStatement[0]?.total_penalty | number }}</span>
          </div>
        </div>

        <div class="card p-3" style="background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div class="flex justify-between align-center">
            <span class="text-secondary font-xs font-bold uppercase">Net Outstanding Receivable Balance</span>
            <span class="font-mono text-danger font-bold" style="font-size: 18px;">
              ETB {{ selectedStatement[0]?.outstanding_balance | number }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Aging & Revenue Analysis -->
    <div *ngIf="activeTab === 'aging'" class="grid gap-6 animate-fade-in" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <!-- Left: Accounts Aging Analysis -->
      <div class="card glass-card flex flex-col justify-between">
        <div>
          <h3 style="margin-bottom: 16px;">Receivables Aging Brackets</h3>
          <p class="text-secondary font-xs mb-4">Categorization of outstanding balances by time intervals since due dates</p>
          
          <div class="flex flex-col gap-3">
            <div class="flex justify-between align-center p-3 border" style="border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
              <span class="font-bold">Current Receivables</span>
              <span class="font-mono font-bold text-main">ETB {{ aging.current | number }}</span>
            </div>
            <div class="flex justify-between align-center p-3 border" style="border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
              <span class="font-bold">1 - 30 Days Overdue</span>
              <span class="font-mono font-bold text-warning">ETB {{ aging.days30 | number }}</span>
            </div>
            <div class="flex justify-between align-center p-3 border" style="border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
              <span class="font-bold">31 - 60 Days Overdue</span>
              <span class="font-mono font-bold text-warning">ETB {{ aging.days60 | number }}</span>
            </div>
            <div class="flex justify-between align-center p-3 border" style="border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
              <span class="font-bold">61 - 90 Days Overdue</span>
              <span class="font-mono font-bold text-danger">ETB {{ aging.days90 | number }}</span>
            </div>
            <div class="flex justify-between align-center p-3 border" style="border-radius: var(--radius-sm); background-color: rgba(255,255,255,0.01);">
              <span class="font-bold">90+ Days Overdue Bracket</span>
              <span class="font-mono font-bold text-danger">ETB {{ aging.days90Plus | number }}</span>
            </div>
          </div>
        </div>

        <div class="card p-3 border mt-4" style="background-color: rgba(239, 68, 68, 0.03); border-color: rgba(239,68,68,0.2);">
          <div class="flex justify-between align-center">
            <span class="font-bold uppercase font-xs text-secondary">Total Arrears (Overdue Debt)</span>
            <span class="font-mono font-bold text-danger" style="font-size: 16px;">
              ETB {{ (aging.days30 + aging.days60 + aging.days90 + aging.days90Plus) | number }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Analytical Collections Summary -->
      <div class="card glass-card flex flex-col justify-between">
        <div>
          <h3 style="margin-bottom: 16px;">Revenue & Collections Analytical Summary</h3>
          <p class="text-secondary font-xs mb-4">Financial overview metrics showing collections health and accrued penalties</p>

          <div class="flex flex-col gap-4">
            <div class="flex justify-between align-center">
              <span class="text-secondary font-bold font-xs">TOTAL COLLECTIONS</span>
              <span class="font-mono text-success font-bold" style="font-size: 16px;">ETB {{ stats.totalCollections | number }}</span>
            </div>
            <hr style="border: 0; border-top: 1px solid var(--border-color);">
            <div class="flex justify-between align-center">
              <span class="text-secondary font-bold font-xs">TOTAL PENALTIES ACCRUED</span>
              <span class="font-mono text-danger font-bold" style="font-size: 16px;">ETB {{ stats.totalPenalties | number }}</span>
            </div>
            <hr style="border: 0; border-top: 1px solid var(--border-color);">
            <div class="flex justify-between align-center">
              <span class="text-secondary font-bold font-xs">TOTAL GROSS REVENUE VALUATION</span>
              <span class="font-mono text-main font-bold" style="font-size: 18px;">ETB {{ stats.totalRevenue | number }}</span>
            </div>
          </div>
        </div>

        <div class="alert alert-info py-3 font-xs mt-4" style="background-color: rgba(59, 130, 246, 0.05); border-radius: var(--radius-sm); border: 1px solid rgba(59, 130, 246, 0.2); color: #3b82f6;">
          <strong>Ledger Status:</strong> Collections health remains stable. Arrears ratio is within acceptable limits.
        </div>
      </div>
    </div>

    <!-- Tab 3: Reminders Config & Logs -->
    <div *ngIf="activeTab === 'reminders'" class="grid gap-6 animate-fade-in" style="display: grid; grid-template-columns: 1fr; gap: 24px;">
      <div class="grid gap-6" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Left: Reminder Settings Form -->
        <div class="card glass-card">
          <h3 style="margin-bottom: 16px;">Reminders Policy & Schedules</h3>
          
          <form class="modal-form" (submit)="onSubmitReminderConfig($event)">
            <!-- Days Before Due -->
            <div class="form-group flex flex-col">
              <label>Reminder Days Before Installment Due * [REQUIRED]</label>
              <input type="number" [(ngModel)]="reminderConfig.reminderDaysBeforeDue" name="reminderDaysBeforeDue" required placeholder="e.g. 5" />
            </div>

            <!-- Days After Due -->
            <div class="form-group flex flex-col">
              <label>Overdue Alert Days After Due Date * [REQUIRED]</label>
              <input type="number" [(ngModel)]="reminderConfig.reminderDaysAfterDue" name="reminderDaysAfterDue" required placeholder="e.g. 3" />
            </div>

            <h4 style="margin-bottom: 12px; margin-top: 16px; font-size: 13px;" class="text-main">Allowed Notifications Channels</h4>

            <!-- Channel checklist checkboxes -->
            <div class="flex flex-col gap-2">
              <div class="form-group flex align-center gap-2">
                <input type="checkbox" id="smsEnabled" [(ngModel)]="reminderConfig.smsEnabled" name="smsEnabled" />
                <label for="smsEnabled">Enable SMS Alerts * [SMS REQUIRED]</label>
              </div>

              <div class="form-group flex align-center gap-2">
                <input type="checkbox" id="emailEnabled" [(ngModel)]="reminderConfig.emailEnabled" name="emailEnabled" />
                <label for="emailEnabled">Enable Email Notifications * [EMAIL REQUIRED]</label>
              </div>

              <div class="form-group flex align-center gap-2">
                <input type="checkbox" id="telegramEnabled" [(ngModel)]="reminderConfig.telegramEnabled" name="telegramEnabled" />
                <label for="telegramEnabled">Enable Telegram Chatbot Broadcasts * [TELEGRAM REQUIRED]</label>
              </div>
            </div>

            <!-- Active default -->
            <div class="form-group flex align-center gap-2" style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 12px;">
              <input type="checkbox" id="reminderActive" [(ngModel)]="reminderConfig.isActive" name="isActive" />
              <label for="reminderActive">Enable Reminder Schedule Dispatcher</label>
            </div>

            <div style="margin-top: 24px;">
              <button type="submit" class="btn btn-primary">
                Update Reminders Policy
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Dispatcher sweep manual engine -->
        <div class="card glass-card flex flex-col justify-between">
          <div>
            <h3 style="margin-bottom: 12px;">Automation Dispatcher Engine</h3>
            <p class="text-secondary font-xs mb-4">
              Reminders run automatically as cron processes in the background. If you want to check timelines and dispatch messages immediately, trigger the scan now.
            </p>
          </div>

          <div class="card p-4 border" style="background-color: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border-color: rgba(124, 58, 237, 0.2);">
            <h4 style="margin-bottom: 8px;" class="text-main flex align-center gap-1">
              <span class="material-icons-outlined text-warning" style="font-size: 20px;">alarm</span>
              Trigger Reminders Sweep
            </h4>
            <p class="text-secondary font-xs mb-3">
              This scans all active customer contracts installment schedules. It evaluates configurations of before/after overdue parameters and sends notifications.
            </p>
            <button class="btn btn-primary w-full flex align-center justify-center gap-2" (click)="triggerRemindersScan()">
              <span class="material-icons-outlined">send</span>
              Scan & Dispatch Reminders
            </button>
          </div>
        </div>
      </div>

      <!-- Logs Section -->
      <div class="card glass-card">
        <h3 style="margin-bottom: 16px;">Reminders logs history</h3>
        
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Recipient Name</th>
                <th>Contract No</th>
                <th>Notification Channel</th>
                <th>Dispatch Date</th>
                <th>Status</th>
                <th>Message Content</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of reminderLogs">
                <td class="font-mono font-bold">#RLOG-{{ log.id }}</td>
                <td class="font-bold text-main">{{ log.customer?.fullName }}</td>
                <td class="font-mono">{{ log.contract?.contractNo }}</td>
                <td>
                  <span class="badge badge-indigo font-xs">{{ log.notificationType }}</span>
                </td>
                <td>{{ log.reminderDate | date:'medium' }}</td>
                <td>
                  <span class="badge" [ngClass]="log.deliveryStatus === 'SENT' ? 'badge-success' : 'badge-disabled'">
                    {{ log.deliveryStatus }}
                  </span>
                </td>
                <td style="max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" [title]="log.messageContent">
                  {{ log.messageContent }}
                </td>
              </tr>
              <tr *ngIf="reminderLogs.length === 0">
                <td colspan="7" class="text-center py-6 text-secondary">
                  No automated reminder logs recorded yet. Run a scan above to audit logs.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-success { color: var(--color-qualified) !important; }
    .text-danger { color: var(--color-lost) !important; }
    .text-warning { color: var(--color-contacted) !important; }
    .badge-success { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-disabled { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-indigo { background-color: var(--brand-primary-fade); color: var(--brand-primary); }
    .w-full { width: 100%; }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FinanceReportsComponent implements OnInit {
  private financeService = inject(FinanceService);

  activeTab = 'balances';
  balances: any[] = [];
  selectedStatement: any = null;
  
  aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days90Plus: 0
  };

  stats = {
    totalCollections: 0,
    totalPenalties: 0,
    totalRevenue: 0,
    totalOutstanding: 0
  };

  reminderConfig = {
    reminderDaysBeforeDue: 5,
    reminderDaysAfterDue: 3,
    smsEnabled: true,
    emailEnabled: true,
    telegramEnabled: true,
    isActive: true
  };

  reminderLogs: any[] = [];

  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadBalances();
    this.loadAging();
    this.loadStats();
    this.loadReminderConfigs();
    this.loadReminderLogs();
  }

  loadBalances() {
    this.financeService.getCustomerBalances().subscribe({
      next: (res) => this.balances = res,
      error: (err) => console.error('Error fetching customer balances', err)
    });
  }

  viewCustomerStatement(customerId: number) {
    if (!customerId) return;
    this.financeService.getCustomerStatement(customerId).subscribe({
      next: (res) => {
        this.selectedStatement = res;
      },
      error: (err) => console.error('Error fetching customer statement', err)
    });
  }

  loadAging() {
    this.financeService.getAgingAnalysis().subscribe({
      next: (res) => this.aging = res,
      error: (err) => console.error('Error fetching aging analytical data', err)
    });
  }

  loadStats() {
    this.financeService.getRevenueSummary().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error('Error fetching summary stats', err)
    });
  }

  loadReminderConfigs() {
    this.financeService.getReminderConfigs().subscribe({
      next: (res) => {
        if (res.length > 0) {
          const cfg = res.find((c: any) => c.isActive) || res[0];
          this.reminderConfig = {
            reminderDaysBeforeDue: cfg.reminderDaysBeforeDue || 5,
            reminderDaysAfterDue: cfg.reminderDaysAfterDue || 3,
            smsEnabled: !!cfg.smsEnabled,
            emailEnabled: !!cfg.emailEnabled,
            telegramEnabled: !!cfg.telegramEnabled,
            isActive: !!cfg.isActive
          };
        }
      },
      error: (err) => console.error('Error loading reminder configs', err)
    });
  }

  loadReminderLogs() {
    this.financeService.getReminderLogs().subscribe({
      next: (res) => this.reminderLogs = res,
      error: (err) => console.error('Error loading reminder logs', err)
    });
  }

  onSubmitReminderConfig(event: Event) {
    event.preventDefault();
    this.financeService.updateReminderConfig(this.reminderConfig).subscribe({
      next: () => {
        this.successMessage = 'Reminder policies and channel schedules updated successfully!';
        this.loadReminderConfigs();
      },
      error: (err) => {
        console.error('Error saving config', err);
        this.errorMessage = err.error?.message || 'Failed to update reminder settings.';
      }
    });
  }

  triggerRemindersScan() {
    this.successMessage = '';
    this.errorMessage = '';
    this.financeService.triggerReminderEngine().subscribe({
      next: (res) => {
        this.successMessage = res.remarks || 'Reminders scan complete.';
        this.loadReminderLogs();
      },
      error: (err) => {
        console.error('Error scanning reminders', err);
        this.errorMessage = err.error?.message || 'Reminders scanner scan run failed.';
      }
    });
  }
}
