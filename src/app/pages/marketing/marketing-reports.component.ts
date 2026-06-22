import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketingService } from '../../services/marketing.service';

@Component({
  selector: 'app-marketing-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header no-print">
      <div class="app-title-section">
        <h1>Marketing Reports</h1>
        <p>Analyze performance metrics across campaigns and lead channels. Print or download as CSV.</p>
      </div>
      <div class="app-header-actions flex gap-2">
        <button class="btn btn-secondary flex items-center gap-2" (click)="exportToCSV()">
          <span class="material-icons-outlined">download</span> Export CSV
        </button>
        <button class="btn btn-primary flex items-center gap-2" (click)="printReport()">
          <span class="material-icons-outlined">print</span> Print Report
        </button>
      </div>
    </header>

    <div class="flex flex-col gap-8 print-container">
      <!-- Active Report Title for Print -->
      <div class="print-only-header text-center margin-b-6">
        <h1>IHSAN Properties & Business Service PLC</h1>
        <h2>Marketing Management Performance Audit</h2>
        <p class="text-secondary font-mono">Date Generated: {{ today | date:'medium' }}</p>
      </div>



      <!-- Campaign Performance View -->
      <div class="card p-6">
        <div class="flex justify-between items-center border-bottom pb-3 margin-b-4 no-print">
          <h3>Campaign Performance Analysis</h3>
          <span class="text-secondary text-xs font-mono">Source: vw_rems_campaign_performance</span>
        </div>
        <h4 class="print-only margin-b-2">Campaign Performance Analysis</h4>
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 30%;">Campaign Name</th>
                <th style="width: 10%;" class="text-right">Total Leads</th>
                <th style="width: 12%;" class="text-right">Qualified Leads</th>
                <th style="width: 13%;" class="text-right">Converted Sales</th>
                <th style="width: 15%;" class="text-right">Total Cost</th>
                <th style="width: 15%;" class="text-right">Revenue Generated</th>
                <th style="width: 10%;" class="text-right">ROI (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let camp of campaignReports">
                <td>
                  <div class="contact-info flex align-center gap-3">
                    <div class="table-avatar">{{ getInitials(camp.campaignName) }}</div>
                    <div class="flex flex-col">
                      <span class="lead-name font-semibold text-main">{{ camp.campaignName }}</span>
                      <span class="text-secondary font-xs font-mono">{{ camp.campaignCode || 'CAMPAIGN' }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-right font-mono">{{ camp.totalLeads | number }}</td>
                <td class="text-right font-mono">{{ camp.qualifiedLeads | number }}</td>
                <td class="text-right font-mono">{{ camp.convertedSales | number }}</td>
                <td class="text-right font-mono">ETB {{ camp.totalExpense | number:'1.2-2' }}</td>
                <td class="text-right font-mono">ETB {{ camp.totalRevenue | number:'1.2-2' }}</td>
                <td class="text-right font-mono">
                  <span class="badge" [class.badge-qualified]="camp.totalRevenue > camp.totalExpense" [class.badge-lost]="camp.totalRevenue <= camp.totalExpense">
                    {{ calculateRoi(camp.totalRevenue, camp.totalExpense) | number:'1.0-1' }}%
                  </span>
                </td>
              </tr>
              <tr *ngIf="!campaignReports.length">
                <td colspan="7" class="text-center text-secondary py-8">
                  No campaign performance audit lines generated.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lead Source Analysis View -->
      <div class="card p-6">
        <div class="flex justify-between items-center border-bottom pb-3 margin-b-4 no-print">
          <h3>Lead Source & Channel Analysis</h3>
          <span class="text-secondary text-xs font-mono">Source: vw_rems_lead_source_analysis</span>
        </div>
        <h4 class="print-only margin-b-2">Lead Source & Channel Analysis</h4>
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 40%;">Lead Source / Channel</th>
                <th style="width: 20%;" class="text-right">Total Leads Acquired</th>
                <th style="width: 20%;" class="text-right">Sales Converted</th>
                <th style="width: 20%;">Conversion Ratio (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ls of sourceReports">
                <td>
                  <div class="contact-info flex align-center gap-3">
                    <div class="table-avatar bg-main text-secondary" style="font-size: 16px; background-color: var(--bg-main); border: 1px solid var(--border-color);">
                      <span class="material-icons-outlined" style="font-size: 18px;">{{ getSourceIcon(ls.sourceName) }}</span>
                    </div>
                    <span class="lead-name font-semibold text-main">{{ ls.sourceName }}</span>
                  </div>
                </td>
                <td class="text-right font-mono" style="padding-right: 24px !important;">{{ ls.totalLeads | number }}</td>
                <td class="text-right font-mono" style="padding-right: 24px !important;">{{ ls.totalConversions | number }}</td>
                <td>
                  <div class="flex flex-col gap-1" style="min-width: 120px; padding: 4px 0;">
                    <div class="flex justify-between font-xs font-mono font-semibold" style="color: var(--text-main);">
                      <span>{{ (ls.totalLeads > 0 ? (ls.totalConversions / ls.totalLeads * 100) : 0) | number:'1.1-2' }}%</span>
                    </div>
                    <div class="progress-bar-bg" style="height: 6px; width: 100%; background-color: #e2e8f0; border-radius: 3px; overflow: hidden;">
                      <div class="progress-bar-fill" 
                        [style.width.%]="ls.totalLeads > 0 ? (ls.totalConversions / ls.totalLeads * 100) : 0" 
                        [style.background-color]="ls.totalConversions > 0 ? 'var(--color-qualified)' : 'var(--text-muted)'"
                        style="height: 100%; border-radius: 3px;">
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!sourceReports.length">
                <td colspan="4" class="text-center text-secondary py-8">
                  No lead source analysis data logged.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-container { overflow-x: auto; }
    .border-bottom { border-bottom: 1px solid var(--border-color); }
    .pb-3 { padding-bottom: 12px; }
    .margin-b-4 { margin-bottom: 16px; }
    .margin-b-2 { margin-bottom: 8px; }
    .margin-b-6 { margin-bottom: 24px; }
    .text-xs { font-size: 12px; }

    .print-only-header { display: none; }
    .print-only { display: none; }

    /* Local grids for card metrics */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }
    .marketing-metric-card {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
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
      font-size: 24px;
      font-weight: 700;
      color: var(--text-main);
    }
    .metric-footer {
      font-size: 12px;
    }

    .bg-indigo-light { background-color: var(--brand-primary-fade); }
    .text-indigo { color: var(--brand-primary); }
    .border-indigo { border-left: 4px solid var(--brand-primary); }

    .bg-danger-light { background-color: rgba(239, 68, 68, 0.1); }
    .text-danger { color: var(--color-lost); }
    .border-danger { border-left: 4px solid var(--color-lost); }

    .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
    .text-success { color: var(--color-qualified); }
    .border-success { border-left: 4px solid var(--color-qualified); }

    .bg-info-light { background-color: rgba(59, 130, 246, 0.1); }
    .text-info { color: var(--color-new); }
    .border-info { border-left: 4px solid var(--color-new); }

    @media print {
      .no-print { display: none !important; }
      body { background-color: white !important; color: black !important; }
      .card { border: none !important; box-shadow: none !important; padding: 0 !important; background: transparent !important; }
      .print-only-header { display: block !important; }
      .print-only { display: block !important; }
      .print-container { gap: 40px !important; }
    }
  `]
})
export class MarketingReportsComponent implements OnInit {
  private marketingService = inject(MarketingService);

  campaignReports: any[] = [];
  sourceReports: any[] = [];
  today = new Date();

  get totalExpense(): number {
    return this.campaignReports.reduce((sum, c) => sum + Number(c.totalExpense || 0), 0);
  }

  get totalRevenue(): number {
    return this.campaignReports.reduce((sum, c) => sum + Number(c.totalRevenue || 0), 0);
  }

  get totalLeads(): number {
    return this.campaignReports.reduce((sum, c) => sum + Number(c.totalLeads || 0), 0);
  }

  get overallRoi(): number {
    const expense = this.totalExpense;
    if (expense <= 0) return 0;
    return ((this.totalRevenue - expense) / expense) * 100;
  }

  ngOnInit() {
    this.marketingService.getCampaignPerformanceReport().subscribe({
      next: (res) => this.campaignReports = res,
      error: (err) => console.error('Failed to load campaign reports', err)
    });

    this.marketingService.getLeadSourceAnalysisReport().subscribe({
      next: (res) => this.sourceReports = res,
      error: (err) => console.error('Failed to load lead source reports', err)
    });
  }

  calculateRoi(revenue: number, cost: number): number {
    const rawCost = Number(cost);
    if (rawCost <= 0) return 0;
    return ((Number(revenue) - rawCost) / rawCost) * 100;
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getSourceIcon(source: string): string {
    const s = (source || '').toLowerCase();
    if (s.includes('facebook')) return 'facebook';
    if (s.includes('instagram')) return 'photo_camera';
    if (s.includes('telegram')) return 'telegram';
    if (s.includes('tiktok')) return 'music_note';
    if (s.includes('youtube')) return 'play_circle';
    if (s.includes('billboard')) return 'art_track';
    if (s.includes('walk-in') || s.includes('walkin')) return 'directions_walk';
    if (s.includes('referral')) return 'share';
    if (s.includes('website')) return 'public';
    if (s.includes('google')) return 'search';
    if (s.includes('broker')) return 'handshake';
    if (s.includes('email')) return 'email';
    if (s.includes('newspaper')) return 'newspaper';
    if (s.includes('radio')) return 'radio';
    if (s.includes('tv')) return 'tv';
    return 'campaign';
  }

  printReport() {
    window.print();
  }

  exportToCSV() {
    // Generate CSV representing campaign performance
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Campaign Performance Analysis\n';
    csvContent += 'Campaign Name,Total Leads,Qualified Leads,Converted Sales,Total Cost (ETB),Revenue Generated (ETB),ROI (%)\n';
    
    this.campaignReports.forEach(c => {
      const roi = this.calculateRoi(c.totalRevenue, c.totalExpense);
      csvContent += `"${c.campaignName}",${c.totalLeads},${c.qualifiedLeads},${c.convertedSales},${c.totalExpense},${c.totalRevenue},${roi.toFixed(1)}%\n`;
    });

    csvContent += '\nLead Source & Channel Analysis\n';
    csvContent += 'Lead Source,Total Leads,Sales Converted,Conversion Ratio (%)\n';
    
    this.sourceReports.forEach(ls => {
      const ratio = ls.totalLeads > 0 ? (ls.totalConversions / ls.totalLeads * 100) : 0;
      csvContent += `"${ls.sourceName}",${ls.totalLeads},${ls.totalConversions},${ratio.toFixed(1)}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rems_marketing_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
