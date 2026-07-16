import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../services/reports.service';
import { CrmService } from '../../services/crm.service';
declare var io: any;


interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header dashboard-hero">
      <div class="app-title-section hero-copy">
        <span class="eyebrow"><span class="hero-dot"></span> IHSAN COMMAND CENTRE</span>
        <h1>Good to see you.</h1>
        <p>Your live overview of property sales, collections, inventory, and client activity.</p>
      </div>
      <div class="app-header-actions flex align-center gap-3">
        <div class="live-indicator flex align-center gap-2">
          <span class="pulse-dot"></span>
          <span class="font-xs font-bold text-green uppercase" style="letter-spacing: 0.5px;">Live Sweeps</span>
        </div>
        <button class="btn btn-secondary flex align-center gap-2" (click)="loadAllData()">
          <span class="material-icons-outlined">refresh</span>
          Refresh
        </button>
      </div>
    </header>

    <section class="section-heading"><div><span class="eyebrow">TODAY AT A GLANCE</span><h2>Today’s workspace</h2></div><span class="section-note">Updated in real time</span></section>
    <div class="realtime-ticker-grid mb-6">
      <div class="ticker-card card">
        <span class="label">Today's Sales Volume</span>
        <div class="flex justify-between align-center mt-2">
          <span class="value">{{ realtime?.liveSalesCount ?? 0 }} Contracts</span>
          <span class="badge badge-new flex align-center gap-1"><span class="glow-dot bg-blue"></span> Active</span>
        </div>
      </div>
      <div class="ticker-card card">
        <span class="label">Today's Collections</span>
        <div class="flex justify-between align-center mt-2">
          <span class="value">ETB {{ formatValue(realtime?.liveCollections ?? 0) }}</span>
          <span class="badge badge-qualified flex align-center gap-1"><span class="glow-dot bg-green"></span> Settled</span>
        </div>
      </div>
      <div class="ticker-card card">
        <span class="label">Today's New Leads</span>
        <div class="flex justify-between align-center mt-2">
          <span class="value">{{ realtime?.liveLeadsCount ?? 0 }} Registered</span>
          <span class="badge badge-proposal flex align-center gap-1"><span class="glow-dot bg-purple"></span> Incoming</span>
        </div>
      </div>
      <div class="ticker-card card">
        <span class="label">Inventory Sweeps</span>
        <div class="flex justify-between align-center mt-2">
          <span class="value">{{ realtime?.liveInventoryUpdates ?? 0 }} Revisions</span>
          <span class="badge badge-medium flex align-center gap-1"><span class="glow-dot bg-yellow"></span> Modified</span>
        </div>
      </div>
    </div>

    <section class="section-heading"><div><span class="eyebrow">PORTFOLIO SNAPSHOT</span><h2>Business overview</h2></div><span class="section-note">Portfolio-wide totals</span></section>
    <div class="metrics-grid mb-6">
      <!-- KPI 1: Gross Revenue -->
      <div class="metric-card card border-indigo">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">account_balance</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Gross Valuations</span>
          <span class="metric-value">ETB {{ formatShortNumber(kpis?.totalRevenue ?? 0) }}</span>
          <span class="metric-trend text-indigo-dark">
            Registered Contract Value
          </span>
        </div>
      </div>

      <!-- KPI 2: Collections -->
      <div class="metric-card card border-green">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">check_circle</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Settled Collections</span>
          <span class="metric-value">ETB {{ formatShortNumber(kpis?.totalCollections ?? 0) }}</span>
          <span class="metric-trend text-green font-bold">
            Collection Rate: {{ getCollectionRate() }}%
          </span>
        </div>
      </div>

      <!-- KPI 3: Outstanding -->
      <div class="metric-card card border-orange">
        <div class="metric-icon bg-orange">
          <span class="material-icons-outlined">money_off</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Outstanding Balances</span>
          <span class="metric-value">ETB {{ formatShortNumber(kpis?.outstandingBalances ?? 0) }}</span>
          <span class="metric-trend text-yellow">
            Pending installments due
          </span>
        </div>
      </div>

      <!-- KPI 4: Inventory -->
      <div class="metric-card card border-teal">
        <div class="metric-icon bg-teal">
          <span class="material-icons-outlined">business</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Available Inventory</span>
          <span class="metric-value">{{ kpis?.availableInventory ?? 0 }} Units</span>
          <span class="metric-trend text-blue">
            {{ kpis?.unitsSold ?? 0 }} units sold
          </span>
        </div>
      </div>

      <!-- KPI 5: CRM Funnel -->
      <div class="metric-card card border-blue">
        <div class="metric-icon bg-blue">
          <span class="material-icons-outlined">people</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Active Leads</span>
          <span class="metric-value">{{ kpis?.activeLeads ?? 0 }} Profiles</span>
          <span class="metric-trend text-indigo-dark font-bold">
            Conv. Rate: {{ kpis?.leadConversionRate ?? 0 }}%
          </span>
        </div>
      </div>

      <!-- KPI 6: Brokers -->
      <div class="metric-card card border-purple">
        <div class="metric-icon bg-purple">
          <span class="material-icons-outlined">badge</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Broker Volume</span>
          <span class="metric-value">ETB {{ formatShortNumber(kpis?.brokerSales ?? 0) }}</span>
          <span class="metric-trend text-purple-dark">
            Referred property sales
          </span>
        </div>
      </div>
    </div>

    <!-- Analytical Visualizations Row 1 -->
    <div class="dashboard-middle-row mb-6">
      
      <!-- Line Chart: Revenue vs Collections Growth -->
      <div class="card glass-card">
        <div class="card-header border-bottom">
          <div class="flex flex-col">
            <h3>Cashflow overview</h3>
            <span class="text-secondary font-xs">Contract value compared with recorded collections</span>
          </div>
          <div class="flex gap-3 font-xs">
            <span class="flex align-center gap-1"><span class="legend-dot bg-indigo"></span> Invoiced</span>
            <span class="flex align-center gap-1"><span class="legend-dot bg-teal"></span> Collected</span>
          </div>
        </div>
        <div *ngIf="revenuePoints.length > 1" class="chart-content mt-4" style="height: 240px; position: relative;">
          <!-- SVG Line Chart -->
          <svg width="100%" height="100%" viewBox="0 0 540 220" preserveAspectRatio="none" style="overflow: visible;">
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#087fce" stop-opacity="0.24"/>
                <stop offset="100%" stop-color="#087fce" stop-opacity="0.02"/>
              </linearGradient>
              <linearGradient id="collectionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.20"/>
                <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.02"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <!-- Gridlines -->
            <line x1="60" y1="20" x2="520" y2="20" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>
            <line x1="60" y1="57" x2="520" y2="57" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>
            <line x1="60" y1="95" x2="520" y2="95" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>
            <line x1="60" y1="132" x2="520" y2="132" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>
            <line x1="60" y1="170" x2="520" y2="170" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>
            <line x1="60" y1="20" x2="60" y2="170" stroke="#e2e8f0" stroke-width="1"/>
            <line x1="60" y1="170" x2="520" y2="170" stroke="#e2e8f0" stroke-width="1"/>

            <!-- Y-axis labels -->
            <text *ngFor="let lbl of chartYLabels" [attr.x]="55" [attr.y]="lbl.y + 3" font-size="9" fill="#94a3b8" text-anchor="end" font-weight="500">{{ lbl.text }}</text>

            <!-- Area under lines -->
            <path *ngIf="revenueAreaPath" [attr.d]="revenueAreaPath" fill="url(#revenueGrad)"/>
            <path *ngIf="collectionsAreaPath" [attr.d]="collectionsAreaPath" fill="url(#collectionsGrad)"/>

            <!-- Lines -->
            <path *ngIf="revenueLinePath" [attr.d]="revenueLinePath" fill="none" stroke="#087fce" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="chart-line"/>
            <path *ngIf="collectionsLinePath" [attr.d]="collectionsLinePath" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="chart-line"/>

            <!-- Revenue Circles & Labels -->
            <g *ngFor="let pt of revenuePoints; let i = index">
              <circle *ngIf="revenuePoints.length === 1" [attr.cx]="pt.x" [attr.cy]="pt.y" r="16" fill="#087fce" fill-opacity="0.08" stroke="none" filter="url(#glow)"/>
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" [attr.r]="revenuePoints.length === 1 ? 7 : 5" fill="#087fce" stroke="#ffffff" [attr.stroke-width]="revenuePoints.length === 1 ? 3 : 2" class="chart-dot"/>
              <text *ngIf="revenuePoints.length <= 3" [attr.x]="pt.x" [attr.y]="pt.y - 14" font-size="10" fill="#087fce" text-anchor="middle" font-weight="700">ETB {{ formatShortNumber(pt.value) }}</text>
              <text [attr.x]="pt.x" y="192" font-size="9" fill="#64748b" text-anchor="middle" font-weight="600">{{ pt.label }}</text>
            </g>

            <!-- Collection Circles & Labels -->
            <g *ngFor="let pt of collectionsPoints">
              <circle *ngIf="collectionsPoints.length === 1" [attr.cx]="pt.x" [attr.cy]="pt.y" r="14" fill="#14b8a6" fill-opacity="0.08" stroke="none" filter="url(#glow)"/>
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" [attr.r]="collectionsPoints.length === 1 ? 6 : 4.5" fill="#14b8a6" stroke="#ffffff" [attr.stroke-width]="collectionsPoints.length === 1 ? 3 : 2" class="chart-dot"/>
              <text *ngIf="collectionsPoints.length <= 3" [attr.x]="pt.x" [attr.y]="pt.y + 20" font-size="10" fill="#14b8a6" text-anchor="middle" font-weight="700">ETB {{ formatShortNumber(pt.value) }}</text>
            </g>
          </svg>

        </div>
        <div *ngIf="revenuePoints.length <= 1" class="cashflow-summary">
          <div class="cashflow-stat primary"><span>Contract value</span><strong>ETB {{ formatShortNumber(kpis?.totalRevenue ?? 0) }}</strong><small>Registered sales</small></div>
          <div class="cashflow-stat"><span>Collected to date</span><strong>ETB {{ formatShortNumber(kpis?.totalCollections ?? 0) }}</strong><small>{{ getCollectionRate() }}% collection rate</small></div>
          <div class="cashflow-bars" aria-label="Cashflow comparison chart">
            <div class="comparison-column"><div class="comparison-track"><span class="comparison-fill revenue-fill" [style.height.%]="100"></span></div><strong>ETB {{ formatShortNumber(kpis?.totalRevenue ?? 0) }}</strong><small>Contract value</small></div>
            <div class="comparison-column"><div class="comparison-track"><span class="comparison-fill collection-fill" [style.height.%]="getCollectionChartPercent()"></span></div><strong>ETB {{ formatShortNumber(kpis?.totalCollections ?? 0) }}</strong><small>Collected</small></div>
            <div class="comparison-caption"><span class="material-icons-outlined">bar_chart</span> Cashflow comparison</div>
          </div>
        </div>
      </div>

      <!-- Donut Chart: Leads Distribution by Source -->
      <div class="card glass-card">
        <div class="card-header border-bottom">
          <h3>Lead sources</h3>
        </div>
        <div class="source-content mt-2">
          <div class="donut-chart-container">
            <svg width="150" height="150" viewBox="0 0 42 42" class="donut">
              <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#ffffff"></circle>
              <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="4.5"></circle>
              
              <circle *ngFor="let seg of getDonutSegments()" 
                      class="donut-segment" 
                      cx="21" cy="21" r="15.91549430918954" 
                      fill="transparent" 
                      [attr.stroke]="seg.color" 
                      stroke-width="4.5" 
                      [attr.stroke-dasharray]="seg.dasharray" 
                      [attr.stroke-dashoffset]="seg.dashoffset"
                      style="transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;">
              </circle>
            </svg>
            <div class="donut-center-text">
              <span class="big-number">{{ kpis?.activeLeads ?? 0 }}</span>
              <span class="small-label">Profiles</span>
            </div>
          </div>
          
          <div class="source-legend">
            <div class="legend-item" *ngFor="let s of leadTrends?.leadAcquisitionTrend | slice:0:5">
              <span class="flex align-center"><span class="legend-dot" [style.background-color]="getSourceColor($any(s).source)"></span><span class="legend-name">{{ $any(s).source }}</span></span>
              <span class="legend-val">{{ $any(s).count }}</span>
            </div>
            <div *ngIf="!leadTrends?.leadAcquisitionTrend || leadTrends?.leadAcquisitionTrend.length === 0" class="text-center py-2 text-secondary italic font-xs">
              No active acquisition metrics.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytical Visualizations Row 2 -->
    <div class="grid grid-2 gap-6 mb-6" style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px;">
      
      <!-- Bar Chart: Monthly Sales Velocity -->
      <div class="card glass-card">
        <div class="card-header border-bottom">
          <div class="flex flex-col">
          <h3>Sales momentum</h3>
            <span class="text-secondary font-xs">Contracts signed over time</span>
          </div>
        </div>
        <div *ngIf="salesTrends.length > 0" class="chart-content mt-4" style="height: 200px; display: flex; align-items: flex-end; justify-content: center; padding: 0 20px; gap: 16px;">
          <!-- SVG-like DOM Bar Chart for premium control -->
          <div *ngFor="let s of salesTrends" class="flex flex-col align-center gap-2" [style.flex]="salesTrends.length > 1 ? '1' : '0 0 80px'" style="min-width: 40px; max-width: 100px;">
            <span class="font-xs font-bold text-main" style="font-size: 11px;">{{ $any(s).salesCount }}</span>
            <div class="bar-fill-container" style="width: 32px; height: 120px; background-color: var(--bg-main); border-radius: var(--radius-sm); overflow: hidden; display: flex; align-items: flex-end;">
              <div class="bar-fill" [style.height.%]="getSalesHeightPercent($any(s).salesCount)" style="width: 100%; background: var(--brand-primary-gradient); border-radius: var(--radius-sm) var(--radius-sm) 0 0; transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);"></div>
            </div>
            <span class="text-secondary font-xs font-bold" style="font-size: 10px;">{{ formatMonthLabel($any(s).period) }}</span>
            <span *ngIf="salesTrends.length === 1" class="font-xs text-secondary" style="font-size: 9px;">ETB {{ formatShortNumber($any(s).salesValue || 0) }}</span>
          </div>

        </div>
        <div *ngIf="salesTrends.length === 0" class="sales-summary">
          <span class="summary-icon material-icons-outlined">handshake</span>
          <div><strong>{{ salesTrends.length ? $any(salesTrends[0]).salesCount : 0 }} signed contract{{ (salesTrends.length && $any(salesTrends[0]).salesCount === 1) ? '' : 's' }}</strong><p>{{ salesTrends.length ? 'ETB ' + formatShortNumber($any(salesTrends[0]).salesValue || 0) + ' in contract value this month.' : 'New signed contracts will appear here.' }}</p></div>
        </div>
      </div>

      <!-- Top Brokers Rankings -->
      <div class="card glass-card">
        <div class="card-header border-bottom">
          <h3>Broker Performance Leaderboard</h3>
        </div>
        <div class="broker-leaderboard-list mt-3 flex flex-col gap-3">
          <div class="leaderboard-row" *ngFor="let b of brokerTrends?.topBrokers | slice:0:4; let index = index">
            <div class="flex justify-between align-center mb-1">
              <span class="font-bold text-main flex align-center gap-2">
                <span class="rank-badge" [class.rank-1]="index === 0" [class.rank-2]="index === 1" [class.rank-3]="index === 2">{{ index + 1 }}</span>
                {{ $any(b).broker }}
              </span>
              <span class="font-mono text-indigo font-bold">ETB {{ formatValue($any(b).sales) }}</span>
            </div>
            <div class="progress-bar-wrapper">
              <div class="progress-bar-fill" [style.width.%]="getBrokerSalesPercent($any(b).sales)" style="background: linear-gradient(90deg, #087fce, #f0bc47);"></div>
            </div>
          </div>

          <div *ngIf="!brokerTrends?.topBrokers || brokerTrends?.topBrokers.length === 0" class="empty-insight">
            <span class="material-icons-outlined">groups</span>
            <strong>No broker sales yet</strong>
            <p>Broker performance will appear once referred sales are recorded.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Reminders & Alerts -->
    <div class="dashboard-bottom-row">
      <div class="followup-panel card">
        <div class="card-header border-bottom">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-indigo" style="font-size: 24px;">alarm</span>
            <h3>Follow-up Reminders & Operations Notifications</h3>
          </div>
          <span class="badge badge-proposal">Action Items Required</span>
        </div>
        
        <div class="reminder-list mt-4">
          <div *ngFor="let reminder of reminders" class="reminder-item flex justify-between align-center" [class.font-dimmed]="reminder.isCompleted">
            <div class="reminder-meta flex align-center gap-3">
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

          <div *ngIf="reminders.length === 0" class="text-center py-10 text-secondary italic font-sm">
            All notifications swept. No active reminders logged.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding-bottom: 24px; }
    .dashboard-hero {
      position: relative;
      overflow: hidden;
      min-height: 178px;
      padding: 30px 32px;
      margin: -4px 0 26px;
      border: 1px solid rgba(13, 122, 200, .25);
      border-radius: 22px;
      background: linear-gradient(115deg, #061a3a 0%, #073c73 62%, #087fce 145%);
      box-shadow: 0 16px 35px rgba(4, 48, 91, .17);
    }
    .dashboard-hero::after {
      content: '';
      position: absolute;
      width: 270px;
      height: 270px;
      right: -85px;
      top: -115px;
      border: 34px solid rgba(240, 188, 71, .25);
      border-radius: 50%;
    }
    .dashboard-hero .app-title-section { position: relative; z-index: 1; }
    .dashboard-hero h1 { color: #fff; font-size: clamp(28px, 3vw, 36px); letter-spacing: -.8px; margin: 7px 0 5px; }
    .dashboard-hero p { color: #c9e5fb; max-width: 600px; font-size: 14px; }
    .dashboard-hero .app-header-actions { position: relative; z-index: 1; }
    .dashboard-hero .btn-secondary { background: rgba(255,255,255,.10); border-color: rgba(255,255,255,.22); color: #fff; backdrop-filter: blur(8px); }
    .dashboard-hero .btn-secondary:hover { background: rgba(255,255,255,.18); color: #fff; }
    .eyebrow { display: inline-flex; align-items: center; gap: 7px; color: var(--brand-primary); font-size: 10px; font-weight: 800; letter-spacing: 1.25px; }
    .dashboard-hero .eyebrow { color: #f4c764; }
    .hero-dot { width: 7px; height: 7px; border-radius: 50%; background: #f4c764; box-shadow: 0 0 0 4px rgba(244,199,100,.15); }
    .section-heading { display: flex; align-items: end; justify-content: space-between; margin: 23px 2px 12px; }
    .section-heading h2 { color: var(--text-main); font-size: 19px; letter-spacing: -.25px; margin-top: 2px; }
    .section-note { color: var(--text-muted); font-size: 11px; font-weight: 600; }
    .live-indicator { padding: 9px 12px; border: 1px solid rgba(157, 234, 196, .25); border-radius: 10px; background: rgba(5, 25, 55, .26); }
    .realtime-ticker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .ticker-card {
      padding: 17px 18px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      box-shadow: 0 8px 18px rgba(12, 56, 97, .05);
      position: relative;
      overflow: hidden;
    }
    .ticker-card::before {
      content: ''; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--brand-primary-gradient);
    }
    .ticker-card .label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .ticker-card .value {
      font-size: 17px;
      font-weight: 750;
      color: var(--text-main);
    }
    .glow-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }
    .glow-dot.bg-blue { background: var(--color-new); box-shadow: 0 0 8px var(--color-new); }
    .glow-dot.bg-green { background: var(--color-qualified); box-shadow: 0 0 8px var(--color-qualified); }
    .glow-dot.bg-purple { background: var(--color-proposal); box-shadow: 0 0 8px var(--color-proposal); }
    .glow-dot.bg-yellow { background: var(--color-contacted); box-shadow: 0 0 8px var(--color-contacted); }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
      animation: pulse 1.6s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 19px;
      border: 1px solid var(--border-color);
      border-top: 3px solid var(--border-color);
      box-shadow: 0 8px 18px rgba(12, 56, 97, .05);
    }
    .metric-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .bg-blue { background: var(--color-new); }
    .bg-indigo { background: var(--brand-primary); }
    .bg-green { background: var(--color-qualified); }
    .bg-orange { background: var(--color-medium); }
    .bg-teal { background: var(--color-converted); }
    .bg-purple { background: var(--color-proposal); }

    .metric-icon .material-icons-outlined { font-size: 24px; }
    .metric-info { display: flex; flex-direction: column; }
    .metric-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
    .metric-value { font-size: 20px; font-weight: 700; color: var(--text-main); margin: 2px 0; }
    .metric-trend { font-size: 11px; font-weight: 600; }
    .text-green { color: var(--color-qualified); }
    .text-yellow { color: var(--color-medium); }
    .text-blue { color: var(--color-new); }
    .text-indigo-dark { color: var(--brand-primary); }
    .text-purple-dark { color: var(--brand-primary-text); }

    .border-blue { border-top-color: var(--color-new); }
    .border-indigo { border-top-color: var(--brand-primary); }
    .border-green { border-top-color: var(--color-qualified); }
    .border-orange { border-top-color: var(--color-medium); }
    .border-teal { border-top-color: var(--color-converted); }
    .border-purple { border-top-color: var(--color-proposal); }

    .dashboard-middle-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 18px;
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
      gap: 20px;
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
    .donut-center-text .big-number { font-size: 20px; font-weight: 700; color: var(--text-main); }
    .donut-center-text .small-label { font-size: 9px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
    .source-legend {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .source-legend-full { margin-top: 26px; }
    .source-legend-full .legend-item {
      padding: 13px 14px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--bg-main);
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
    .legend-name { color: var(--text-secondary); font-weight: 500; }
    .legend-val { font-weight: 700; color: var(--text-main); }

    .chart-line {
      transition: stroke-dashoffset 1s ease;
    }
    .chart-dot {
      cursor: pointer;
      transition: r 0.2s ease, fill 0.2s ease;
    }
    .chart-dot:hover {
      r: 7;
      fill: #ffffff;
      stroke-width: 3;
    }
    .absolute-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .rank-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--bg-main);
      color: var(--text-secondary);
      font-size: 10px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .rank-1 { background-color: rgba(245, 158, 11, 0.15); color: #b45309; }
    .rank-2 { background-color: rgba(148, 163, 184, 0.15); color: #475569; }
    .rank-3 { background-color: rgba(180, 83, 9, 0.15); color: #78350f; }

    .progress-bar-wrapper {
      height: 6px;
      width: 100%;
      background-color: var(--bg-main);
      border-radius: var(--radius-round);
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-round);
    }

    .reminder-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .reminder-item {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      transition: var(--transition-fast);
    }
    .reminder-item:hover {
      background-color: var(--bg-main);
    }
    .reminder-title { font-weight: 600; color: var(--text-main); font-size: 13px; }
    .reminder-desc { font-size: 12px; color: var(--text-secondary); }
    .schedule-time { font-size: 12px; color: var(--text-secondary); }
    .font-dimmed { opacity: 0.7; }

    .cashflow-summary {
      display: grid;
      grid-template-columns: 1fr 1fr 1.15fr;
      gap: 14px;
      padding: 24px 0 2px;
    }
    .cashflow-stat {
      padding: 20px;
      border: 1px solid var(--border-color);
      border-radius: 15px;
      background: var(--bg-main);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cashflow-stat.primary { background: linear-gradient(135deg, #073b72, #087fce); border: 0; }
    .cashflow-stat span { color: var(--text-secondary); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; }
    .cashflow-stat strong { color: var(--text-main); font-size: 24px; letter-spacing: -.5px; }
    .cashflow-stat small { color: var(--text-secondary); font-size: 11px; }
    .cashflow-stat.primary span, .cashflow-stat.primary small { color: #c8e7fd; }
    .cashflow-stat.primary strong { color: #fff; }
    .cashflow-bars { min-height: 132px; display: grid; grid-template-columns: 1fr 1fr; gap: 17px; padding: 4px 12px 22px; border: 1px solid var(--border-color); border-radius: 15px; background: var(--bg-main); position: relative; }
    .comparison-column { display: flex; flex-direction: column; align-items: center; justify-content: end; min-width: 0; }
    .comparison-track { height: 73px; width: 30px; display: flex; align-items: end; border-radius: 8px 8px 4px 4px; background: color-mix(in srgb, var(--border-color) 60%, transparent); overflow: hidden; }
    .comparison-fill { width: 100%; min-height: 7px; border-radius: 7px 7px 3px 3px; transition: height .5s ease; }
    .revenue-fill { background: linear-gradient(180deg, #1194e3, #065b9e); }
    .collection-fill { background: linear-gradient(180deg, #31c899, #10846b); }
    .comparison-column strong { margin-top: 6px; color: var(--text-main); font-size: 10px; white-space: nowrap; }
    .comparison-column small { color: var(--text-secondary); font-size: 9px; white-space: nowrap; }
    .comparison-caption { position: absolute; bottom: 6px; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 4px; color: var(--text-secondary); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
    .comparison-caption .material-icons-outlined { font-size: 13px; color: var(--brand-primary); }
    .sales-summary { min-height: 200px; display: flex; align-items: center; justify-content: center; gap: 15px; text-align: left; }
    .summary-icon { width: 50px; height: 50px; display: inline-flex; align-items: center; justify-content: center; border-radius: 15px; background: var(--brand-primary-light); color: var(--brand-primary); font-size: 24px; }
    .sales-summary strong { display: block; color: var(--text-main); font-size: 17px; }
    .sales-summary p { margin-top: 4px; color: var(--text-secondary); font-size: 12px; }
    .empty-insight { min-height: 184px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-secondary); }
    .empty-insight .material-icons-outlined { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; border-radius: 14px; background: var(--brand-primary-light); color: var(--brand-primary); font-size: 22px; }
    .empty-insight strong { color: var(--text-main); font-size: 14px; }
    .empty-insight p { max-width: 230px; margin-top: 5px; font-size: 12px; line-height: 1.5; }

    .glass-card { background: var(--bg-card); backdrop-filter: none; box-shadow: 0 10px 22px rgba(12, 56, 97, .06); }
    .dashboard-middle-row .card, .grid-2 .card, .dashboard-bottom-row .card { padding: 22px; }
    @media (max-width: 980px) {
      .dashboard-middle-row, .grid-2 { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 680px) {
      .dashboard-hero { padding: 24px 20px; }
      .dashboard-hero .app-header-actions { margin-top: 18px; width: 100%; justify-content: space-between; }
      .realtime-ticker-grid, .metrics-grid { grid-template-columns: 1fr; }
      .cashflow-summary { grid-template-columns: 1fr; }
      .reminder-item, .reminder-schedule { align-items: flex-start; flex-direction: column; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private crmService = inject(CrmService);
  private socket: any;

  kpis: any = null;
  realtime: any = null;
  salesTrends: any[] = [];
  revenueTrends: any = null;
  collectionTrends: any = null;
  leadTrends: any = null;
  brokerTrends: any = null;
  reminders: any[] = [];

  // Line Chart coordinate bindings
  revenuePoints: ChartPoint[] = [];
  collectionsPoints: ChartPoint[] = [];
  revenueLinePath = '';
  collectionsLinePath = '';
  revenueAreaPath = '';
  collectionsAreaPath = '';
  chartYLabels: { y: number; text: string }[] = [];
  chartMaxVal = 0;

  ngOnInit() {
    this.loadAllData();
    this.connectToWebSocket();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  connectToWebSocket() {
    if (typeof io !== 'undefined') {
      try {
        this.socket = io('http://localhost:3000/reports');
        this.socket.on('dashboardKpisUpdated', (data: any) => {
          console.log('Realtime Dashboard KPIs update received via WebSockets:', data);
          this.kpis = data;
          this.loadAllData();
        });
      } catch (err) {
        console.error('Failed to init reports socket connection:', err);
      }
    }
  }

  loadAllData() {
    this.reportsService.getKpis().subscribe({
      next: (res) => this.kpis = res,
      error: (err) => console.error('Error fetching dashboard KPIs:', err)
    });

    this.reportsService.getRealTimeStats().subscribe({
      next: (res) => this.realtime = res,
      error: (err) => console.error('Error fetching real-time stats:', err)
    });

    this.reportsService.getSalesTrends('monthly').subscribe({
      next: (res) => {
        this.salesTrends = res ? res.slice(-6) : []; // Show last 6 months
      },
      error: (err) => console.error('Error fetching sales trends:', err)
    });

    this.reportsService.getRevenueTrends().subscribe({
      next: (res) => {
        this.revenueTrends = res;
        this.processLineCharts();
      },
      error: (err) => console.error('Error fetching revenue trends:', err)
    });

    this.reportsService.getCollectionTrends().subscribe({
      next: (res) => {
        this.collectionTrends = res;
        this.processLineCharts();
      },
      error: (err) => console.error('Error fetching collection trends:', err)
    });

    this.reportsService.getLeadTrends().subscribe({
      next: (res) => this.leadTrends = res,
      error: (err) => console.error('Error fetching lead trends:', err)
    });

    this.reportsService.getBrokerTrends().subscribe({
      next: (res) => this.brokerTrends = res,
      error: (err) => console.error('Error fetching broker trends:', err)
    });

    this.crmService.getReminders().subscribe({
      next: (res) => {
        this.reminders = res ? res.slice(0, 4) : [];
      },
      error: (err) => console.error('Error fetching crm reminders:', err)
    });
  }

  // --- Dynamic calculation of Line Chart Paths (Revenue & Collections) ---
  processLineCharts() {
    if (!this.revenueTrends || !this.revenueTrends.revenueGrowth) return;
    
    const growth = this.revenueTrends.revenueGrowth.slice(-6); // last 6 months
    if (growth.length === 0) return;

    // Find max value to auto-scale chart heights — NO hardcoded minimum
    const maxRevenue = Math.max(...growth.map((g: any) => Number(g.amount || 0)));
    
    let collectionsList: any[] = [];
    if (this.collectionTrends && this.collectionTrends.collectionTrend) {
      collectionsList = this.collectionTrends.collectionTrend.slice(-6);
    }
    const maxCollection = collectionsList.length > 0 
      ? Math.max(...collectionsList.map((c: any) => Number(c.amount || 0))) 
      : 0;

    // Auto-scale: use actual data max, add 20% headroom so points don't touch the top
    const rawMax = Math.max(maxRevenue, maxCollection);
    const maxVal = rawMax > 0 ? rawMax * 1.2 : 1000; // fallback only if truly zero
    this.chartMaxVal = maxVal;

    // Establish dimensions (wider left padding for value labels)
    const chartWidth = 540;
    const chartHeight = 220;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 50;

    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;

    // Build Y-axis labels (5 ticks from 0 to maxVal)
    this.chartYLabels = [];
    const yTicks = 5;
    for (let i = 0; i < yTicks; i++) {
      const ratio = i / (yTicks - 1);
      const val = maxVal * (1 - ratio);
      const yPos = paddingTop + ratio * graphHeight;
      this.chartYLabels.push({ y: yPos, text: this.formatShortNumber(val) });
    }

    // Build Revenue points
    this.revenuePoints = growth.map((g: any, index: number) => {
      const x = growth.length === 1 
        ? paddingLeft + graphWidth / 2 
        : paddingLeft + (index / (growth.length - 1)) * graphWidth;
      const amount = Number(g.amount || 0);
      const y = paddingTop + graphHeight - (amount / maxVal) * graphHeight;
      return { x, y, label: this.formatMonthLabel(g.month), value: amount };
    });

    // Build Collections points (aligned to revenue months)
    this.collectionsPoints = growth.map((g: any, index: number) => {
      const x = growth.length === 1 
        ? paddingLeft + graphWidth / 2 
        : paddingLeft + (index / (growth.length - 1)) * graphWidth;
      const matchingCol = collectionsList.find((c: any) => c.month === g.month);
      const amount = matchingCol ? Number(matchingCol.amount || 0) : 0;
      const y = paddingTop + graphHeight - (amount / maxVal) * graphHeight;
      return { x, y, label: this.formatMonthLabel(g.month), value: amount };
    });

    // Generate Path strings — no paths generated for single-point charts to avoid rectangular blocks and floating dashes
    if (this.revenuePoints.length > 1) {
      this.revenueLinePath = this.revenuePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      this.revenueAreaPath = `${this.revenueLinePath} L ${this.revenuePoints[this.revenuePoints.length - 1].x} ${chartHeight - paddingBottom} L ${this.revenuePoints[0].x} ${chartHeight - paddingBottom} Z`;
    } else {
      this.revenueLinePath = '';
      this.revenueAreaPath = '';
    }

    if (this.collectionsPoints.length > 1) {
      this.collectionsLinePath = this.collectionsPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      this.collectionsAreaPath = `${this.collectionsLinePath} L ${this.collectionsPoints[this.collectionsPoints.length - 1].x} ${chartHeight - paddingBottom} L ${this.collectionsPoints[0].x} ${chartHeight - paddingBottom} Z`;
    } else {
      this.collectionsLinePath = '';
      this.collectionsAreaPath = '';
    }
  }

  // --- Donut Segment Computation (by lead source) ---
  getDonutSegments() {
    if (!this.leadTrends || !this.leadTrends.leadAcquisitionTrend || this.leadTrends.leadAcquisitionTrend.length === 0) return [];
    
    const items = this.leadTrends.leadAcquisitionTrend.slice(0, 5);
    const total = items.reduce((sum: number, i: any) => sum + i.count, 0);
    if (total === 0) return [];

    let currentOffset = 100;
    return items.map((s: any) => {
      const pct = Math.round((s.count / total) * 100);
      const dasharray = `${pct} ${100 - pct}`;
      const dashoffset = currentOffset;
      currentOffset -= pct;
      return {
        source: s.source,
        color: this.getSourceColor(s.source),
        dasharray,
        dashoffset
      };
    });
  }

  // --- SVG scale helpers ---
  getSalesHeightPercent(count: number): number {
    if (this.salesTrends.length === 0) return 0;
    const max = Math.max(...this.salesTrends.map(s => s.salesCount), 1);
    return Math.round((count / max) * 100);
  }

  getBrokerSalesPercent(val: number): number {
    if (!this.brokerTrends || !this.brokerTrends.topBrokers || this.brokerTrends.topBrokers.length === 0) return 0;
    const max = Math.max(...this.brokerTrends.topBrokers.map((b: any) => b.sales), 1);
    return Math.round((val / max) * 100);
  }

  getSourceColor(monthName: string): string {
    const colors = ['#087fce', '#14b8a6', '#e7a72e', '#3b82f6', '#10b981', '#ef4444'];
    let hash = 0;
    for (let i = 0; i < monthName.length; i++) {
      hash = monthName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  getReminderBadgeClass(priority: string): string {
    switch (priority) {
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
  }

  getCollectionRate(): string {
    if (!this.kpis || !this.kpis.totalRevenue) return '0.0';
    return ((this.kpis.totalCollections / this.kpis.totalRevenue) * 100).toFixed(1);
  }

  getCollectionChartPercent(): number {
    if (!this.kpis || !this.kpis.totalRevenue) return 0;
    return Math.min(100, Math.max(0, (Number(this.kpis.totalCollections || 0) / Number(this.kpis.totalRevenue)) * 100));
  }

  formatMonthLabel(periodStr: string): string {
    if (!periodStr) return '';
    // E.g. YYYY-MM
    const parts = periodStr.split('-');
    if (parts.length === 2) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return monthNames[monthIdx] || periodStr;
    }
    return periodStr;
  }

  formatShortNumber(val: number): string {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(2) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toFixed(2);
  }

  formatValue(val: any): string {
    if (val === null || val === undefined) return '0.00';
    const num = Number(val);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
