import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Sales Management Dashboard</h1>
        <p>End-to-end sales KPIs, reservation cycles, and revenue performance</p>
      </div>
    </header>

    <div class="dashboard-grid flex flex-col gap-6">
      <!-- KPI Metric Cards Grid -->
      <div class="metrics-grid">
        <!-- Revenue Card -->
        <div class="metric-card card hover-lift glass-card border-indigo">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-indigo-light text-indigo">payments</span>
            <span class="metric-label">Sales Revenue (Active Contracts)</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (stats?.salesRevenue || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Cumulative active billing contract values</div>
        </div>

        <!-- Outstanding Installments Card -->
        <div class="metric-card card hover-lift glass-card border-warning">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-warning-light text-warning">pending_actions</span>
            <span class="metric-label">Outstanding Installments</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (stats?.outstandingInstallments || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Total outstanding receivables ledger</div>
        </div>

        <!-- Commissions Due Card -->
        <div class="metric-card card hover-lift glass-card border-danger">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-danger-light text-danger">account_balance_wallet</span>
            <span class="metric-label">Pending Commission Payouts</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (stats?.commissionsDue || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Unpaid agent payouts accrued</div>
        </div>
      </div>

      <div class="metrics-grid col-3">
        <!-- Reservations Count -->
        <div class="metric-card card hover-lift">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-info-light text-info">schedule</span>
            <span class="metric-label">Total Reservations</span>
          </div>
          <div class="metric-value font-mono">{{ stats?.totalReservations || 0 }}</div>
          <div class="metric-footer text-secondary">Reservations logged in system</div>
        </div>

        <!-- Active Bookings Count -->
        <div class="metric-card card hover-lift">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-success-light text-success">book_online</span>
            <span class="metric-label">Approved Bookings</span>
          </div>
          <div class="metric-value font-mono">{{ stats?.activeBookings || 0 }}</div>
          <div class="metric-footer text-secondary">Pre-contract approved units</div>
        </div>

        <!-- Total Contracts Count -->
        <div class="metric-card card hover-lift">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-primary-light text-primary">gavel</span>
            <span class="metric-label">Executed Contracts</span>
          </div>
          <div class="metric-value font-mono">{{ stats?.totalContracts || 0 }}</div>
          <div class="metric-footer text-secondary">Completed customer legal agreements</div>
        </div>
      </div>

      <!-- Quick Navigation Shortcuts -->
      <div class="card glass-card p-6">
        <h3 class="margin-b-4">Sales Module Workspaces</h3>
        <div class="shortcuts-grid">
          <a routerLink="/sales/reservations" class="shortcut-item card hover-lift border">
            <span class="material-icons-outlined font-lg text-indigo">schedule</span>
            <h4>Manage Reservations</h4>
            <p class="text-secondary">Register property holdings, process reservation extensions, and handle fees</p>
          </a>
          <a routerLink="/sales/quotations" class="shortcut-item card hover-lift border">
            <span class="material-icons-outlined font-lg text-success">request_quote</span>
            <h4>Quotations & Discounts</h4>
            <p class="text-secondary">Generate unit pricing quotes, request custom discounts, and review approvals</p>
          </a>
          <a routerLink="/sales/bookings" class="shortcut-item card hover-lift border">
            <span class="material-icons-outlined font-lg text-warning">book_online</span>
            <h4>Process Bookings</h4>
            <p class="text-secondary">Convert reservations to bookings, manage security deposits, and approve releases</p>
          </a>
          <a routerLink="/sales/contracts" class="shortcut-item card hover-lift border">
            <span class="material-icons-outlined font-lg text-primary">gavel</span>
            <h4>Contracts Ledger</h4>
            <p class="text-secondary">Manage executed sales contracts, agreements, and upload legal documents</p>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      margin-top: 12px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .metrics-grid.col-3 {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .metric-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .metric-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .metric-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .metric-label {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-main);
    }
    .metric-footer {
      font-size: 12px;
    }
    .bg-indigo-light { background-color: var(--brand-primary-fade); }
    .text-indigo { color: var(--brand-primary); }
    .border-indigo { border-left: 4px solid var(--brand-primary); }
    
    .bg-warning-light { background-color: rgba(234, 179, 8, 0.1); }
    .text-warning { color: var(--color-contacted); }
    .border-warning { border-left: 4px solid var(--color-contacted); }

    .bg-danger-light { background-color: rgba(239, 68, 68, 0.1); }
    .text-danger { color: var(--color-lost); }
    .border-danger { border-left: 4px solid var(--color-lost); }

    .bg-info-light { background-color: rgba(59, 130, 246, 0.1); }
    .text-info { color: var(--color-new); }

    .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
    .text-success { color: var(--color-qualified); }

    .bg-primary-light { background-color: rgba(168, 85, 247, 0.1); }
    .text-primary { color: var(--color-proposal); }

    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .shortcut-item {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
      transition: var(--transition-normal);
    }
    .shortcut-item:hover {
      border-color: var(--brand-primary) !important;
      background-color: var(--brand-primary-fade);
    }
    .shortcut-item h4 {
      font-weight: 700;
      color: var(--text-main);
    }
    .shortcut-item p {
      font-size: 12px;
    }
    .font-lg {
      font-size: 32px;
    }
    .margin-b-4 {
      margin-bottom: 16px;
    }
  `]
})
export class SalesDashboardComponent implements OnInit {
  private salesService = inject(SalesService);
  stats: any = null;

  ngOnInit() {
    this.salesService.getSalesDashboardStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error('Error fetching dashboard stats', err)
    });
  }
}
