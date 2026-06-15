import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-forecasting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header animate-fade-in">
      <div class="app-title-section">
        <h1>Sales Revenue Forecasting</h1>
        <p>Analyze expected close dates and probability-weighted revenues to predict quarterly performance</p>
      </div>
    </header>

    <!-- Pipeline Metrics Panel -->
    <div class="metrics-grid margin-y-4 animate-fade-in">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">bar_chart</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Pipeline</span>
          <span class="metric-value">ETB {{ totalPipeline | number:'1.0-0' }}</span>
          <span class="metric-subtext">Sum of active estimations</span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">insights</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Weighted Revenue</span>
          <span class="metric-value">ETB {{ weightedPipeline | number:'1.0-0' }}</span>
          <span class="metric-subtext">Risk-adjusted forecast value</span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-orange">
          <span class="material-icons-outlined">folder_special</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Forecasted Deals</span>
          <span class="metric-value">{{ activeDealsCount }}</span>
          <span class="metric-subtext">Opportunities with close dates</span>
        </div>
      </div>
    </div>

    <!-- Forecast Timeline Grid -->
    <div class="card margin-y-4 animate-fade-in">
      <div class="drawer-section-header margin-b-3">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Month-Over-Month Predictions</h3>
      </div>
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Forecast Month</th>
              <th style="text-align: center;">Opportunities Count</th>
              <th>Raw Estimated Value (ETB)</th>
              <th>Weighted Value (ETB)</th>
              <th style="width: 200px;">Weighted Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of forecastData">
              <td class="lead-code-cell font-bold">{{ item.monthStr }}</td>
              <td style="text-align: center;" class="font-bold text-main">{{ item.activeCount }}</td>
              <td class="font-semibold text-main">ETB {{ item.estimatedRevenue | number:'1.0-0' }}</td>
              <td class="font-bold text-brand" style="color: var(--brand-primary);">ETB {{ item.weightedRevenue | number:'1.0-0' }}</td>
              <td>
                <div class="flex align-center gap-2">
                  <div style="flex: 1; height: 8px; background-color: var(--border-color); border-radius: var(--radius-round); overflow: hidden;">
                    <div 
                      [style.width.%]="(item.weightedRevenue / (item.estimatedRevenue || 1)) * 100" 
                      style="height: 100%; background: linear-gradient(90deg, var(--brand-primary), #a855f7);"
                    ></div>
                  </div>
                  <span class="font-bold font-xs text-secondary">{{ ((item.weightedRevenue / (item.estimatedRevenue || 1)) * 100) | number:'1.0-0' }}%</span>
                </div>
              </td>
            </tr>
            <tr *ngIf="forecastData.length === 0">
              <td colspan="5" class="text-center text-secondary py-8 italic">
                No monthly forecasting timeline available (please set expected close dates on active opportunities).
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Forecast breakdown detailed list -->
    <div class="card margin-t-4 animate-fade-in">
      <div class="drawer-section-header margin-b-3">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Active Forecast Pipeline Breakdown</h3>
      </div>
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Opportunity Title</th>
              <th>Linked Customer</th>
              <th>Stage</th>
              <th>Est. Revenue (ETB)</th>
              <th>Win %</th>
              <th>Weighted Value</th>
              <th>Expected Close</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let opp of activeOpportunities">
              <td class="lead-code-cell font-semibold">{{ opp.opportunityCode }}</td>
              <td class="font-bold text-main">{{ opp.title }}</td>
              <td>{{ opp.lead?.fullName }}</td>
              <td>
                <span class="badge" [style.background-color]="opp.opportunityStage?.colorCode + '15'" [style.color]="opp.opportunityStage?.colorCode" [style.border]="'1px solid ' + opp.opportunityStage?.colorCode + '30'">
                  {{ opp.opportunityStage?.stageName }}
                </span>
              </td>
              <td class="font-semibold text-main">ETB {{ opp.estimatedValue | number:'1.0-0' }}</td>
              <td>
                <div class="flex align-center gap-2">
                  <span class="font-bold font-xs">{{ opp.probabilityPercent | number:'1.0-0' }}%</span>
                  <div style="width: 60px; height: 6px; background-color: var(--border-color); border-radius: var(--radius-round); overflow: hidden;">
                    <div [style.width.%]="opp.probabilityPercent" [style.background-color]="opp.opportunityStage?.colorCode || '#7c3aed'" style="height: 100%;"></div>
                  </div>
                </div>
              </td>
              <td class="font-bold text-brand" style="color: var(--brand-primary);">ETB {{ (opp.estimatedValue * (opp.probabilityPercent / 100)) | number:'1.0-0' }}</td>
              <td>{{ opp.expectedCloseDate | date:'mediumDate' }}</td>
            </tr>
            <tr *ngIf="activeOpportunities.length === 0">
              <td colspan="8" class="text-center text-secondary py-8 italic">
                No active opportunities currently contributing to forecast metrics.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ForecastingComponent implements OnInit {
  private crmService = inject(CrmService);

  forecastData: any[] = [];
  activeOpportunities: any[] = [];

  // Summary Metrics
  totalPipeline = 0;
  weightedPipeline = 0;
  activeDealsCount = 0;

  ngOnInit() {
    this.loadForecast();
  }

  loadForecast() {
    this.crmService.getOpportunityForecast().subscribe({
      next: (res) => {
        this.forecastData = res;
        this.loadActiveOpportunities();
      },
      error: (err) => console.error('Error fetching opportunity forecasting data:', err)
    });
  }

  loadActiveOpportunities() {
    // We can query all active opportunities (page limit 1000 to cover the list)
    this.crmService.getOpportunities({ page: 1, limit: 1000 }).subscribe({
      next: (res) => {
        // filter out closed won and closed lost for current active pipeline forecast
        this.activeOpportunities = res.data.filter((opp: any) => !opp.isWon && !opp.isLost && opp.expectedCloseDate);
        
        // Calculate summaries
        let pipeline = 0;
        let weighted = 0;
        
        this.activeOpportunities.forEach(opp => {
          const est = Number(opp.estimatedValue) || 0;
          const prob = Number(opp.probabilityPercent) || 0;
          pipeline += est;
          weighted += (est * (prob / 100));
        });

        this.totalPipeline = pipeline;
        this.weightedPipeline = weighted;
        this.activeDealsCount = this.activeOpportunities.length;
      },
      error: (err) => console.error('Error loading active opportunities list:', err)
    });
  }
}
