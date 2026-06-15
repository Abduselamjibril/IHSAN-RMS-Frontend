import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-properties-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Properties Dashboard</h1>
        <p>Real-time inventory statistics and project telemetry</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-secondary flex align-center gap-2" (click)="loadDashboardData()">
          <span class="material-icons-outlined">refresh</span>
          Refresh
        </button>
        <a routerLink="/properties/list" class="btn btn-primary flex align-center gap-2">
          <span class="material-icons-outlined">business</span>
          Manage Properties
        </a>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid">
      <div class="metric-card card hover-lift">
        <div class="metric-icon bg-gradient-blue">
          <span class="material-icons-outlined">domain</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Properties</span>
          <span class="metric-value">{{ stats?.totalProperties ?? 0 }}</span>
          <span class="metric-trend text-blue">Active projects</span>
        </div>
      </div>

      <div class="metric-card card hover-lift">
        <div class="metric-icon bg-gradient-indigo">
          <span class="material-icons-outlined">location_city</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Buildings</span>
          <span class="metric-value">{{ stats?.totalBuildings ?? 0 }}</span>
          <span class="metric-trend text-indigo-dark">Constructed blocks</span>
        </div>
      </div>

      <div class="metric-card card hover-lift">
        <div class="metric-icon bg-gradient-purple">
          <span class="material-icons-outlined">apartment</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Units</span>
          <span class="metric-value">{{ stats?.totalUnits ?? 0 }}</span>
          <span class="metric-trend text-purple-dark">Registered units</span>
        </div>
      </div>

      <div class="metric-card card hover-lift">
        <div class="metric-icon bg-gradient-green">
          <span class="material-icons-outlined">check_circle_outline</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Available Units</span>
          <span class="metric-value">{{ stats?.availableUnits ?? 0 }}</span>
          <span class="metric-trend text-green flex align-center gap-1">
            <span class="glow-dot" style="background-color: #10b981; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></span>
            {{ getPercent(stats?.availableUnits, stats?.totalUnits) }}% Available
          </span>
        </div>
      </div>

      <div class="metric-card card hover-lift">
        <div class="metric-icon bg-gradient-orange">
          <span class="material-icons-outlined">pending_actions</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Reserved Units</span>
          <span class="metric-value">{{ stats?.reservedUnits ?? 0 }}</span>
          <span class="metric-trend text-yellow flex align-center gap-1">
            <span class="glow-dot" style="background-color: #f59e0b; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px #f59e0b;"></span>
            {{ getPercent(stats?.reservedUnits, stats?.totalUnits) }}% Locked
          </span>
        </div>
      </div>

      <div class="metric-card card hover-lift">
        <div class="metric-icon bg-gradient-red">
          <span class="material-icons-outlined">shopping_cart</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Sold Units</span>
          <span class="metric-value">{{ stats?.soldUnits ?? 0 }}</span>
          <span class="metric-trend text-red flex align-center gap-1">
            <span class="glow-dot" style="background-color: #ef4444; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px #ef4444;"></span>
            {{ getPercent(stats?.soldUnits, stats?.totalUnits) }}% Sold out
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="dashboard-middle-row">
      <!-- Donut Chart -->
      <div class="source-distribution card glass-card">
        <div class="card-header border-bottom">
          <h3>Inventory Distribution</h3>
        </div>
        <div class="source-content">
          <div class="donut-chart-container">
            <svg width="160" height="160" viewBox="0 0 42 42" class="donut">
              <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
              <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" stroke-width="4"></circle>
              
              <!-- Available (Green) -->
              <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="4.5"
                      [attr.stroke-dasharray]="getStrokeDash(stats?.availableUnits, stats?.totalUnits)"
                      stroke-dashoffset="100"></circle>
              
              <!-- Reserved (Yellow) -->
              <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="4.5"
                      [attr.stroke-dasharray]="getStrokeDash(stats?.reservedUnits, stats?.totalUnits)"
                      [attr.stroke-dashoffset]="100 - getPercent(stats?.availableUnits, stats?.totalUnits) + 100"></circle>

              <!-- Sold (Red) -->
              <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ef4444" stroke-width="4.5"
                      [attr.stroke-dasharray]="getStrokeDash(stats?.soldUnits, stats?.totalUnits)"
                      [attr.stroke-dashoffset]="100 - getPercent(stats?.availableUnits, stats?.totalUnits) - getPercent(stats?.reservedUnits, stats?.totalUnits) + 100"></circle>
            </svg>
            <div class="donut-center-text">
              <span class="big-number">{{ stats?.totalUnits ?? 0 }}</span>
              <span class="small-label">Total Units</span>
            </div>
          </div>
          
          <div class="source-legend">
            <div class="legend-item">
              <span class="flex align-center"><span class="legend-dot" style="background-color: #10b981; box-shadow: 0 0 6px #10b981;"></span><span class="legend-name">Available</span></span>
              <span class="legend-val">{{ stats?.availableUnits ?? 0 }} ({{ getPercent(stats?.availableUnits, stats?.totalUnits) }}%)</span>
            </div>
            <div class="legend-item">
              <span class="flex align-center"><span class="legend-dot" style="background-color: #f59e0b; box-shadow: 0 0 6px #f59e0b;"></span><span class="legend-name">Reserved</span></span>
              <span class="legend-val">{{ stats?.reservedUnits ?? 0 }} ({{ getPercent(stats?.reservedUnits, stats?.totalUnits) }}%)</span>
            </div>
            <div class="legend-item">
              <span class="flex align-center"><span class="legend-dot" style="background-color: #ef4444; box-shadow: 0 0 6px #ef4444;"></span><span class="legend-name">Sold</span></span>
              <span class="legend-val">{{ stats?.soldUnits ?? 0 }} ({{ getPercent(stats?.soldUnits, stats?.totalUnits) }}%)</span>
            </div>
            <div class="legend-item" *ngIf="stats?.blockedUnits">
              <span class="flex align-center"><span class="legend-dot" style="background-color: #6b7280; box-shadow: 0 0 6px #6b7280;"></span><span class="legend-name">Blocked</span></span>
              <span class="legend-val">{{ stats?.blockedUnits ?? 0 }} ({{ getPercent(stats?.blockedUnits, stats?.totalUnits) }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Units by Property Bar Chart -->
      <div class="pipeline-overview card">
        <div class="card-header border-bottom">
          <h3>Units by Property</h3>
        </div>
        <div class="bar-chart-container" style="padding-top: 10px;">
          <div class="bar-row" *ngFor="let prop of stats?.byProperty">
            <div class="bar-label">{{ prop.propertyName }}</div>
            <div class="bar-wrapper">
              <div class="bar-fill" [style.width.%]="getPercent(prop.unitCount, stats?.totalUnits)" style="background: var(--brand-primary-gradient); box-shadow: 0 2px 6px rgba(99, 102, 241, 0.2);"></div>
            </div>
            <div class="bar-value">{{ prop.unitCount }} Units</div>
          </div>
          <div *ngIf="!stats?.byProperty || stats?.byProperty.length === 0" class="text-center py-6 text-secondary italic">
            No properties registered.
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Properties Grid -->
    <div class="dashboard-bottom-row" style="margin-top: 24px;">
      <div class="followup-panel card">
        <div class="card-header border-bottom">
          <h3>Recent Real Estate Projects</h3>
          <a routerLink="/properties/list" class="btn btn-secondary btn-sm flex align-center gap-1">
            <span>View All</span>
            <span class="material-icons-outlined font-sm">east</span>
          </a>
        </div>
        <div class="properties-deck">
          <div *ngFor="let p of recentProperties" class="property-deck-card hover-lift">
            <div class="p-accent-banner"></div>
            <div class="p-deck-body">
              <div class="p-img">
                <span class="material-icons-outlined">business</span>
              </div>
              <div class="p-details">
                <h4>{{ p.propertyName }}</h4>
                <p class="p-location"><span class="material-icons-outlined font-sm">place</span> {{ p.city }}, {{ p.country }}</p>
                <div class="p-meta-grid">
                  <span class="badge badge-indigo">{{ p.propertyType?.typeName }}</span>
                  <span class="p-code font-mono">{{ p.propertyCode }}</span>
                </div>
              </div>
              <a [routerLink]="['/properties/details', p.id]" class="btn btn-secondary btn-sm flex align-center justify-center" style="width: 100%; margin-top: 4px;">
                <span>Manage Details</span>
              </a>
            </div>
          </div>
          <div *ngIf="recentProperties.length === 0" class="text-center py-6 text-secondary italic font-sm" style="grid-column: 1 / -1;">
            No properties found.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 18px;
    }
    .metric-icon {
      width: 46px;
      height: 46px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .bg-gradient-blue { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3); }
    .bg-gradient-indigo { background: linear-gradient(135deg, #818cf8 0%, #4f46e5 100%); box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); }
    .bg-gradient-purple { background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 100%); box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3); }
    .bg-gradient-green { background: linear-gradient(135deg, #34d399 0%, #10b981 100%); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3); }
    .bg-gradient-orange { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3); }
    .bg-gradient-red { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3); }

    .metric-icon .material-icons-outlined {
      font-size: 24px;
    }
    .metric-info {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .metric-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
      margin: 1px 0;
    }
    .metric-trend {
      font-size: 11px;
      font-weight: 600;
    }
    .text-blue { color: var(--color-new); }
    .text-indigo-dark { color: var(--brand-primary-text); }
    .text-purple-dark { color: var(--brand-primary-text); }
    .text-green { color: var(--color-qualified); }
    .text-yellow { color: var(--color-contacted); }
    .text-red { color: var(--color-lost); }

    .dashboard-middle-row {
      display: grid;
      grid-template-columns: 1fr 1.6fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .border-bottom {
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }
    .card-header h3 {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
    }
    .source-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding-top: 10px;
    }
    .donut-chart-container {
      position: relative;
    }
    .donut {
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.06));
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
      font-size: 9px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
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
      display: inline-block;
    }
    .legend-name {
      color: var(--text-secondary);
      font-weight: 500;
    }
    .legend-val {
      font-weight: 700;
      color: var(--text-main);
    }

    .bar-chart-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bar-label {
      width: 150px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
    .bar-wrapper {
      flex: 1;
      height: 10px;
      background-color: var(--bg-main);
      border-radius: var(--radius-round);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: var(--radius-round);
    }
    .bar-value {
      width: 80px;
      text-align: right;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-main);
    }

    .properties-deck {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .property-deck-card {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      background-color: var(--bg-card);
      position: relative;
      border: 1px solid var(--border-color);
      overflow: hidden;
      transition: var(--transition-normal);
    }
    .p-accent-banner {
      height: 4px;
      background: var(--brand-primary-gradient);
    }
    .p-deck-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .p-img {
      height: 110px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(79, 70, 229, 0.08));
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brand-primary);
      margin-bottom: 4px;
      border: 1px solid rgba(76, 58, 147, 0.05);
    }
    .p-img span {
      font-size: 38px;
    }
    .p-details h4 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 4px;
    }
    .p-location {
      font-size: 11px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }
    .p-meta-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .p-code {
      font-size: 11px;
      color: var(--brand-primary);
      font-weight: 600;
    }
  `]
})
export class PropertiesDashboardComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  stats: any = null;
  recentProperties: any[] = [];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.propertiesService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
      },
      error: (err) => console.error('Error loading dashboard stats:', err)
    });

    this.propertiesService.getProperties().subscribe({
      next: (res) => {
        this.recentProperties = res.items ? res.items.slice(0, 4) : [];
      },
      error: (err) => console.error('Error loading properties list:', err)
    });
  }

  getPercent(value: number | undefined, total: number | undefined): number {
    if (!value || !total) return 0;
    return Math.round((value / total) * 100);
  }

  getStrokeDash(value: number | undefined, total: number | undefined): string {
    const percentage = this.getPercent(value, total);
    return `${percentage} ${100 - percentage}`;
  }
}
