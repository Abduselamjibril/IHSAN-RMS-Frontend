import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Dashboard</h1>
        <p>Real-time analytics and operations overview</p>
      </div>
      <div class="app-header-actions">
        <div class="header-search">
          <span class="material-icons-outlined">search</span>
          <input type="text" placeholder="Search leads, opportunities..." />
        </div>
        <button class="header-icon-btn">
          <span class="material-icons-outlined">notifications</span>
          <span class="badge-dot" *ngIf="reminders.length > 0"></span>
        </button>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid">
      <div class="metric-card card">
        <div class="metric-icon bg-blue">
          <span class="material-icons-outlined">people</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Leads</span>
          <span class="metric-value">{{ stats?.totalLeads ?? 0 }}</span>
          <span class="metric-trend text-green">
            <span class="material-icons-outlined arrow">arrow_upward</span>
            +18% <span class="trend-label">vs last month</span>
          </span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">trending_up</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Opportunities</span>
          <span class="metric-value">87</span>
          <span class="metric-trend text-green">
            <span class="material-icons-outlined arrow">arrow_upward</span>
            +12% <span class="trend-label">vs last month</span>
          </span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">check_circle</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Won Opportunities</span>
          <span class="metric-value">23</span>
          <span class="metric-trend text-green">
            <span class="material-icons-outlined arrow">arrow_upward</span>
            +35% <span class="trend-label">vs last month</span>
          </span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-orange">
          <span class="material-icons-outlined">monetization_on</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Pipeline Value</span>
          <span class="metric-value">ETB 45.6M</span>
          <span class="metric-trend text-green">
            <span class="material-icons-outlined arrow">arrow_upward</span>
            +22% <span class="trend-label">vs last month</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Middle Section: Pipeline & Source Distribution -->
    <div class="dashboard-middle-row">
      
      <!-- Sales Pipeline Overview -->
      <div class="pipeline-overview card">
        <div class="card-header">
          <h3>Sales Pipeline Overview</h3>
          <span class="badge badge-new">Live</span>
        </div>
        <div class="pipeline-progress-cards">
          <div class="progress-card border-blue">
            <span class="label">New Leads</span>
            <span class="value">{{ getStatusCount('New') }}</span>
          </div>
          <div class="progress-card border-yellow">
            <span class="label">Contacted</span>
            <span class="value">{{ getStatusCount('Contacted') }}</span>
          </div>
          <div class="progress-card border-green">
            <span class="label">Qualified</span>
            <span class="value">{{ getStatusCount('Qualified') }}</span>
          </div>
          <div class="progress-card border-purple">
            <span class="label">Proposal Sent</span>
            <span class="value">{{ getStatusCount('Proposal Sent') }}</span>
          </div>
          <div class="progress-card border-teal">
            <span class="label">Converted</span>
            <span class="value">{{ getStatusCount('Converted') }}</span>
          </div>
          <div class="progress-card border-red">
            <span class="label">Lost</span>
            <span class="value">{{ getStatusCount('Lost') }}</span>
          </div>
        </div>
      </div>

      <!-- Leads by Source distribution -->
      <div class="source-distribution card">
        <div class="card-header">
          <h3>Leads by Source</h3>
        </div>
        <div class="source-content">
          <div class="donut-chart-container">
            <!-- Simulated premium donut chart using SVG -->
            <svg width="140" height="140" viewBox="0 0 42 42" class="donut">
              <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
              <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" stroke-width="4.5"></circle>
              
              <!-- Segment: Website (35%) -->
              <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#4c3a93" stroke-width="4.5" stroke-dasharray="35 65" stroke-dashoffset="100"></circle>
              <!-- Segment: Facebook (25%) -->
              <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" stroke-width="4.5" stroke-dasharray="25 75" stroke-dashoffset="65"></circle>
              <!-- Segment: Walk-in (15%) -->
              <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="4.5" stroke-dasharray="15 85" stroke-dashoffset="40"></circle>
              <!-- Segment: Other (25%) -->
              <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="4.5" stroke-dasharray="25 75" stroke-dashoffset="25"></circle>
            </svg>
            <div class="donut-center-text">
              <span class="big-number">{{ stats?.totalLeads ?? 0 }}</span>
              <span class="small-label">Leads</span>
            </div>
          </div>
          <div class="source-legend">
            <div class="legend-item" *ngFor="let s of stats?.bySource | slice:0:4">
              <span class="legend-dot" [style.background-color]="getSourceColor($any(s).source)"></span>
              <span class="legend-name">{{ $any(s).source }}</span>
              <span class="legend-val">{{ $any(s).count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Reminders & Alerts -->
    <div class="dashboard-bottom-row">
      <!-- Follow-up reminders panel -->
      <div class="followup-panel card">
        <div class="card-header">
          <h3>Follow-up Reminders & Notifications</h3>
          <span class="badge badge-proposal">Action Required</span>
        </div>
        <div class="reminder-list">
          <div *ngFor="let reminder of reminders" class="reminder-item" [class.font-dimmed]="reminder.isCompleted">
            <div class="reminder-meta">
              <span class="material-icons-outlined reminder-icon text-indigo">notifications_active</span>
              <div class="reminder-details">
                <span class="reminder-title">{{ reminder.subject }}</span>
                <span class="reminder-desc">{{ reminder.reminderMessage }}</span>
              </div>
            </div>
            <div class="reminder-schedule flex align-center gap-3">
              <span class="schedule-time">{{ reminder.reminderDatetime | date:'medium' }}</span>
              <span class="badge" [ngClass]="getReminderBadgeClass(reminder.priority)">{{ reminder.priority }}</span>
            </div>
          </div>

          <div *ngIf="reminders.length === 0" class="text-center py-6 text-secondary italic font-sm">
            No active follow-up reminders or alerts at this time.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .metric-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .bg-blue { background-color: var(--color-new); }
    .bg-indigo { background-color: var(--brand-primary); }
    .bg-green { background-color: var(--color-qualified); }
    .bg-orange { background-color: var(--color-medium); }

    .metric-icon .material-icons-outlined {
      font-size: 28px;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
    }

    .metric-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
      margin: 2px 0;
    }

    .metric-trend {
      font-size: 11px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .text-green { color: var(--color-qualified); }
    .metric-trend .arrow { font-size: 12px; font-weight: 800; }
    .trend-label { color: var(--text-secondary); font-weight: 400; margin-left: 2px; }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
    }

    .dashboard-middle-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .pipeline-progress-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .progress-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-main);
      transition: var(--transition-fast);
      border-left: 4px solid var(--border-color);
    }

    .progress-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .progress-card.border-blue { border-left-color: var(--color-new); }
    .progress-card.border-yellow { border-left-color: var(--color-contacted); }
    .progress-card.border-green { border-left-color: var(--color-qualified); }
    .progress-card.border-purple { border-left-color: var(--color-proposal); }
    .progress-card.border-teal { border-left-color: var(--color-converted); }
    .progress-card.border-red { border-left-color: var(--color-lost); }

    .progress-card .label {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .progress-card .value {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 4px;
    }

    .source-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      height: calc(100% - 40px);
    }

    .donut-chart-container {
      position: relative;
      display: inline-block;
    }

    .donut-center-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .donut-center-text .big-number {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
    }

    .donut-center-text .small-label {
      font-size: 10px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
    }

    .source-legend {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-round);
      margin-right: 8px;
    }

    .legend-name {
      flex: 1;
      color: var(--text-secondary);
    }

    .legend-val {
      font-weight: 700;
      color: var(--text-main);
    }

    .dashboard-bottom-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .reminder-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .reminder-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      transition: var(--transition-fast);
    }

    .reminder-item:hover {
      border-color: #cbd5e1;
      background-color: #f1f5f9;
    }

    .reminder-meta {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .reminder-icon {
      font-size: 22px;
    }

    .text-red { color: var(--color-high); }
    .text-yellow { color: var(--color-medium); }
    .text-blue { color: var(--color-new); }

    .reminder-details {
      display: flex;
      flex-direction: column;
    }

    .reminder-title {
      font-weight: 600;
      color: var(--text-main);
    }

    .reminder-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .reminder-schedule .schedule-time {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .font-dimmed {
      opacity: 0.75;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private crmService = inject(CrmService);
  stats: any = null;
  reminders: any[] = [];
 
  ngOnInit() {
    this.crmService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
      },
      error: (err) => {
        console.error('Error fetching dashboard stats:', err);
      }
    });

    this.crmService.getReminders().subscribe({
      next: (res) => {
        this.reminders = res;
      },
      error: (err) => {
        console.error('Error fetching reminders:', err);
      }
    });
  }

  getReminderBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
  }

  getStatusCount(statusName: string): number {
    if (!this.stats || !this.stats.byStatus) return 0;
    const item = this.stats.byStatus.find((s: any) => s.status === statusName);
    return item ? item.count : 0;
  }

  getSourceColor(sourceName: string): string {
    switch (sourceName) {
      case 'Website': return '#4c3a93';
      case 'Facebook': return '#3b82f6';
      case 'Instagram': return '#e83e8c';
      case 'Google Ads': return '#10b981';
      case 'Walk-in': return '#14b8a6';
      case 'Broker': return '#f59e0b';
      default: return '#9ca3af';
    }
  }
}
