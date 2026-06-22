import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketingService } from '../../services/marketing.service';

@Component({
  selector: 'app-marketing-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Marketing Executive Dashboard</h1>
        <p>Real-time campaign analysis, lead acquisition costs, and marketing ROI dashboard</p>
      </div>
    </header>

    <div class="dashboard-grid flex flex-col gap-6">
      <!-- KPI Metric Cards Grid -->
      <div class="metrics-grid">
        <!-- Marketing Cost -->
        <div class="marketing-metric-card card hover-lift glass-card border-danger">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-danger-light text-danger">payments</span>
            <span class="metric-label">Marketing Expenses</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (kpis?.marketingCost || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Total actual advertisement & media spending</div>
        </div>

        <!-- Revenue Generated -->
        <div class="marketing-metric-card card hover-lift glass-card border-success">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-success-light text-success">monetization_on</span>
            <span class="metric-label">Revenue Generated</span>
          </div>
          <div class="metric-value font-mono">ETB {{ (kpis?.revenueGenerated || 0) | number:'1.2-2' }}</div>
          <div class="metric-footer text-secondary">Total booking value attributed to marketing</div>
        </div>

        <!-- ROI Card -->
        <div class="marketing-metric-card card hover-lift glass-card border-indigo">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-indigo-light text-indigo">trending_up</span>
            <span class="metric-label">Return on Investment</span>
          </div>
          <div class="metric-value font-mono">{{ (kpis?.roi || 0) | number:'1.1-2' }}%</div>
          <div class="metric-footer text-secondary">ROI percentage relative to marketing spend</div>
        </div>
      </div>

      <div class="metrics-grid col-4">
        <!-- Total Leads -->
        <div class="marketing-metric-card card hover-lift">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-info-light text-info">people_outline</span>
            <span class="metric-label">Total Leads</span>
          </div>
          <div class="metric-value font-mono">{{ kpis?.totalLeads || 0 }}</div>
          <div class="metric-footer text-secondary">Leads tracked to campaigns</div>
        </div>

        <!-- Qualified Leads -->
        <div class="marketing-metric-card card hover-lift">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-warning-light text-warning">verified_user</span>
            <span class="metric-label">Qualified Leads</span>
          </div>
          <div class="metric-value font-mono">{{ kpis?.qualifiedLeads || 0 }}</div>
          <div class="metric-footer text-secondary">High probability leads (&ge; 70%)</div>
        </div>

        <!-- Converted Leads -->
        <div class="marketing-metric-card card hover-lift">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-success-light text-success">shopping_cart</span>
            <span class="metric-label">Converted Sales</span>
          </div>
          <div class="metric-value font-mono">{{ kpis?.convertedLeads || 0 }}</div>
          <div class="metric-footer text-secondary">Approved sales bookings logged</div>
        </div>

        <!-- Conversion Rate -->
        <div class="marketing-metric-card card hover-lift">
          <div class="metric-header">
            <span class="material-icons-outlined metric-icon bg-primary-light text-primary">percent</span>
            <span class="metric-label">Conversion Rate</span>
          </div>
          <div class="metric-value font-mono">{{ (kpis?.conversionRate || 0) | number:'1.1-1' }}%</div>
          <div class="metric-footer text-secondary">Lead-to-booking conversion ratio</div>
        </div>
      </div>

      <div class="layout-grid">
        <!-- Lead Source Breakdown -->
        <div class="card p-6">
          <h3 class="margin-b-4">Lead Source Performance</h3>
          <div class="source-list flex flex-col gap-4 mt-4">
            <div *ngFor="let item of charts?.sourceTrend" class="source-item">
              <div class="flex justify-between font-sm margin-b-1">
                <span class="font-semibold text-main">{{ item.source }}</span>
                <span class="text-secondary font-mono">{{ item.count }} leads</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill bg-indigo" [style.width.%]="getPercent(item.count)"></div>
              </div>
            </div>
            <div *ngIf="!charts?.sourceTrend?.length" class="text-center text-secondary py-8">
              No lead source attributions logged yet.
            </div>
          </div>
        </div>

        <!-- Campaign ROI Breakdown -->
        <div class="card p-6">
          <h3 class="margin-b-4">Campaign Efficiency</h3>
          <div class="campaign-roi-list flex flex-col gap-4 mt-4">
            <div *ngFor="let item of charts?.campaigns" class="campaign-roi-item border p-4 rounded-md">
              <div class="flex justify-between items-center margin-b-2">
                <span class="font-bold text-main">{{ item.campaignName }}</span>
                <span class="badge" [class.badge-qualified]="item.totalRevenue > item.totalExpense" [class.badge-lost]="item.totalRevenue <= item.totalExpense">
                  ROI: {{ (item.totalExpense > 0 ? ((item.totalRevenue - item.totalExpense) / item.totalExpense * 100) : 0) | number:'1.0-0' }}%
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-xs font-mono mt-2">
                <div>
                  <span class="text-secondary block">Leads</span>
                  <strong>{{ item.totalLeads }}</strong>
                </div>
                <div>
                  <span class="text-secondary block">Spent</span>
                  <strong>ETB {{ item.totalExpense | number }}</strong>
                </div>
                <div>
                  <span class="text-secondary block">Revenue</span>
                  <strong>ETB {{ item.totalRevenue | number }}</strong>
                </div>
              </div>
            </div>
            <div *ngIf="!charts?.campaigns?.length" class="text-center text-secondary py-8">
              No campaigns tracked yet.
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Navigation Workspaces -->
      <div class="card glass-card p-6">
        <h3 class="margin-b-4">Marketing Workspaces</h3>
        <div class="shortcuts-grid">
          <a routerLink="/marketing/campaigns" class="shortcut-item card hover-lift border">
            <span class="material-icons-outlined font-lg text-indigo">campaign</span>
            <h4>Campaigns & Budgets</h4>
            <p class="text-secondary">Create new marketing campaigns, set budget allocations, and track lifecycle status</p>
          </a>
          <a routerLink="/marketing/ads" class="shortcut-item card hover-lift border">
            <span class="material-icons-outlined font-lg text-success">ads_click</span>
            <h4>Ads & Channels</h4>
            <p class="text-secondary">Manage advertisement publications, log clicks/inquiries, and track vendor payments</p>
          </a>
          <a routerLink="/marketing/reports" class="shortcut-item card hover-lift border">
            <span class="material-icons-outlined font-lg text-warning">bar_chart</span>
            <h4>Performance Reports</h4>
            <p class="text-secondary">View detailed conversion sheets, cost per lead parameters, and export dashboard files</p>
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
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .metrics-grid.col-4 {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
    .marketing-metric-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: var(--transition-normal);
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
    .border-success { border-left: 4px solid var(--color-qualified); }

    .bg-primary-light { background-color: rgba(168, 85, 247, 0.1); }
    .text-primary { color: var(--color-proposal); }

    .layout-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 20px;
    }

    .progress-bar-bg {
      height: 8px;
      background-color: var(--border-color);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .bg-indigo { background-color: var(--brand-primary); }

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
    .margin-b-2 { margin-bottom: 8px; }
    .margin-b-1 { margin-bottom: 4px; }
    

    .border {
      border: 1px solid var(--border-color);
    }
    .p-4 { padding: 16px; }
    .rounded-md { border-radius: 6px; }
    .text-xs { font-size: 12px; }
    .block { display: block; }
    .grid { display: grid; }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  `]
})
export class MarketingDashboardComponent implements OnInit {
  private marketingService = inject(MarketingService);
  kpis: any = null;
  charts: any = null;

  ngOnInit() {
    this.marketingService.getDashboardKpis().subscribe({
      next: (res) => this.kpis = res,
      error: (err) => console.error('Error fetching marketing dashboard KPIs', err)
    });

    this.marketingService.getDashboardCharts().subscribe({
      next: (res) => this.charts = res,
      error: (err) => console.error('Error fetching marketing dashboard charts', err)
    });
  }

  getPercent(count: number): number {
    if (!this.kpis?.totalLeads) return 0;
    return (count / this.kpis.totalLeads) * 100;
  }
}
