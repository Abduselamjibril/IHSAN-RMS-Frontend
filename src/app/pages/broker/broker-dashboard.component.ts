import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BrokerService } from '../../services/broker.service';

@Component({
  selector: 'app-broker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Broker Executive Dashboard</h1>
        <p>Real-time broker performance metrics, commission targets, and sales attributions</p>
      </div>
      <div class="app-header-actions">
        <a routerLink="/broker/list" class="btn btn-primary">
          <span class="material-icons-outlined">people</span> Manage Brokers
        </a>
      </div>
    </header>

    <div class="dashboard-grid flex flex-col gap-6" style="padding-bottom: 40px;">
      <!-- KPI Cards Grid -->
      <div class="metrics-grid">
        <!-- Active Brokers -->
        <div class="marketing-metric-card card hover-lift glass-card border-indigo">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-indigo-light text-indigo">support_agent</span>
            <span class="metric-label">Active Brokers</span>
          </div>
          <div class="metric-value font-mono">{{ stats?.brokersCount || 0 }}</div>
          <div class="metric-footer text-secondary">Onboarded agents & companies</div>
        </div>

        <!-- Total Sales Value -->
        <div class="marketing-metric-card card hover-lift glass-card border-success">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-success-light text-success">monetization_on</span>
            <span class="metric-label">Attributed Sales Value</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (stats?.totalSalesValue || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Total contract amount from broker leads</div>
        </div>

        <!-- Total Commissions Earned -->
        <div class="marketing-metric-card card hover-lift glass-card border-warning">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-warning-light text-warning">payments</span>
            <span class="metric-label">Commissions Earned</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (stats?.totalEarnedCommissions || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Calculated commissions (Pending & Approved)</div>
        </div>

        <!-- Total Commissions Paid -->
        <div class="marketing-metric-card card hover-lift glass-card border-info">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-info-light text-info">check_circle_outline</span>
            <span class="metric-label">Commissions Paid</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (stats?.totalPaidCommissions || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Disbursed funds logged in payment registry</div>
        </div>
      </div>

      <!-- Layout Grid: Leaderboard & Shortcuts -->
      <div class="layout-grid">
        <!-- Top Performing Brokers Leaderboard -->
        <div class="card p-6 col-span-2">
          <div class="flex justify-between items-center margin-b-4">
            <h3 class="font-semibold text-main">Top Performing Brokers</h3>
            <span class="text-secondary font-sm">Ranked by sales volume</span>
          </div>
          
          <div class="table-container">
            <table class="leads-table">
              <thead>
                <tr>
                  <th style="width: 10%;">Rank</th>
                  <th style="width: 40%;">Broker Name</th>
                  <th style="width: 15%;">Type</th>
                  <th style="width: 15%;">Sales Count</th>
                  <th style="width: 20%;" class="text-right">Sales Value</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let broker of stats?.leaderboard; let i = index">
                  <td>
                    <span class="badge" [class.badge-high]="i === 0" [class.badge-medium]="i === 1" [class.badge-low]="i > 1">
                      #{{ i + 1 }}
                    </span>
                  </td>
                  <td>
                    <div class="contact-info flex align-center gap-3">
                      <div class="table-avatar">{{ getInitials(broker.brokerName) }}</div>
                      <div class="flex flex-col">
                        <span class="lead-name font-semibold text-main">{{ broker.brokerName }}</span>
                        <span class="lead-phone">{{ broker.brokerCode }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="type-pill" style="font-size: 11px;">{{ broker.brokerTypeId }}</span>
                  </td>
                  <td>
                    <strong class="text-main">{{ broker.salesCount }} sales</strong>
                  </td>
                  <td class="text-right">
                    <strong class="text-indigo font-mono">ETB {{ broker.salesValue | number:'1.2-2' }}</strong>
                  </td>
                </tr>
                <tr *ngIf="!stats?.leaderboard?.length">
                  <td colspan="5" class="text-center text-secondary py-8">
                    No sales attributed to brokers yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Side: Commission Analytics and Quick Navigation -->
        <div class="flex flex-col gap-6">
          <!-- Commission Status Bar Chart / KPI Breakdown -->
          <div class="card p-6">
            <h3 class="margin-b-4">Payout Statistics</h3>
            
            <div class="flex flex-col gap-4 mt-2">
              <div class="flex justify-between items-center text-sm border-bottom pb-2">
                <span class="text-secondary">Outstanding Approved Commissions</span>
                <span class="font-semibold text-warning font-mono">
                  ETB {{ ((stats?.totalEarnedCommissions || 0) - (stats?.totalPaidCommissions || 0)) | number:'1.2-2' }}
                </span>
              </div>
              
              <div class="flex justify-between items-center text-sm border-bottom pb-2">
                <span class="text-secondary">Payout Rate</span>
                <span class="font-semibold text-success">
                  {{ (stats?.totalEarnedCommissions > 0 ? (stats.totalPaidCommissions / stats.totalEarnedCommissions * 100) : 0) | number:'1.0-1' }}%
                </span>
              </div>

              <!-- Mini Progress bar -->
              <div class="progress-bar-bg">
                <div class="progress-bar-fill bg-success" [style.width.%]="stats?.totalEarnedCommissions > 0 ? (stats.totalPaidCommissions / stats.totalEarnedCommissions * 100) : 0"></div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Panel -->
          <div class="card p-6">
            <h3 class="margin-b-4">Quick Workspaces</h3>
            <div class="flex flex-col gap-3">
              <a routerLink="/broker/assignments" class="btn btn-secondary flex items-center justify-between" style="width: 100%;">
                <span class="flex items-center gap-2">
                  <span class="material-icons-outlined text-indigo font-sm">assignment_ind</span>
                  Manage Assignments
                </span>
                <span class="material-icons-outlined font-sm">chevron_right</span>
              </a>

              <a routerLink="/broker/plans" class="btn btn-secondary flex items-center justify-between" style="width: 100%;">
                <span class="flex items-center gap-2">
                  <span class="material-icons-outlined text-indigo font-sm">settings_suggest</span>
                  Commission Schemes
                </span>
                <span class="material-icons-outlined font-sm">chevron_right</span>
              </a>

              <a routerLink="/broker/commissions" class="btn btn-secondary flex items-center justify-between" style="width: 100%;">
                <span class="flex items-center gap-2">
                  <span class="material-icons-outlined text-indigo font-sm">payments</span>
                  Sales & Commission List
                </span>
                <span class="material-icons-outlined font-sm">chevron_right</span>
              </a>

              <a routerLink="/broker/payments" class="btn btn-secondary flex items-center justify-between" style="width: 100%;">
                <span class="flex items-center gap-2">
                  <span class="material-icons-outlined text-indigo font-sm">account_balance</span>
                  Disburse Payouts
                </span>
                <span class="material-icons-outlined font-sm">chevron_right</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-indigo-light { background-color: rgba(99, 102, 241, 0.1); }
    .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
    .bg-warning-light { background-color: rgba(245, 158, 11, 0.1); }
    .bg-info-light { background-color: rgba(59, 130, 246, 0.1); }
    
    .type-pill {
      background-color: var(--brand-primary-light);
      color: var(--brand-primary);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
  `]
})
export class BrokerDashboardComponent implements OnInit {
  private brokerService = inject(BrokerService);
  stats: any = null;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.brokerService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
      },
      error: (err) => {
        console.error('Failed to load dashboard statistics', err);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'BR';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
