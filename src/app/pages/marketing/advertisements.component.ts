import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingService } from '../../services/marketing.service';
import { customConfirm } from '../../utils/confirm';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-advertisements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Advertisements Tracking</h1>
        <p>Register media placements, record actual campaign expenses, and monitor conversion metrics</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary flex items-center gap-2" (click)="openAdModal()" *ngIf="authService.hasPermission('marketing.advertisements.create', 'create')">
          <span class="material-icons-outlined">add</span> Register Advertisement
        </button>
      </div>
    </header>

    <div class="leads-workspace-grid">
      <!-- Advertisements Table -->
      <div class="leads-list-area card">
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 25%;">Ad Details</th>
                <th style="width: 20%;">Campaign</th>
                <th style="width: 15%;">Planned Budget</th>
                <th style="width: 12%;">Start Date</th>
                <th style="width: 8%;">Status</th>
                <th style="width: 20%; min-width: 280px;" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ad of ads" (click)="selectAd(ad)" [class.selected]="selectedAd?.id === ad.id" class="cursor-pointer">
                <td>
                  <div class="contact-info flex align-center gap-3">
                    <div class="table-avatar">{{ getInitials(ad.advertisementTitle) }}</div>
                    <div class="flex flex-col">
                      <span class="lead-name font-semibold text-main">{{ ad.advertisementTitle }}</span>
                      <span class="lead-phone">{{ ad.advertisementCode }} <span class="channel-pill" style="margin-left: 6px;">{{ ad.advertisementChannel }}</span></span>
                    </div>
                  </div>
                </td>
                <td>
                  <span style="font-weight: 500; color: var(--text-main);">{{ ad.campaign?.campaignName }}</span>
                </td>
                <td>
                  <span style="font-weight: 600; color: var(--text-main);">ETB {{ ad.plannedBudget | number:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="text-secondary font-sm">{{ ad.startDate | date:'mediumDate' }}</span>
                </td>
                <td>
                  <span class="badge" [class.badge-qualified]="ad.advertisementStatus === 'ACTIVE'" [class.badge-lost]="ad.advertisementStatus !== 'ACTIVE'">
                    {{ ad.advertisementStatus }}
                  </span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="flex justify-end align-center gap-2">
                    <button class="btn-action btn-action-success" (click)="openExpenseModal(ad)" title="Log Expense">
                      <span class="material-icons-outlined font-xs">receipt_long</span>
                      <span>+ Expense</span>
                    </button>
                    <button class="btn-action btn-action-warning" (click)="openPerfModal(ad)" title="Log Performance">
                      <span class="material-icons-outlined font-xs">analytics</span>
                      <span>+ Stats</span>
                    </button>
                    <button class="btn-action btn-action-danger" (click)="deleteAd(ad.id)" title="Delete">
                      <span class="material-icons-outlined font-xs">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!ads.length">
                <td colspan="6" class="text-center text-secondary py-8">
                  No advertisements registered. Click "Register Advertisement" to start.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Nested Details for Selected Ad (Expenses & Performance) -->
      <div *ngIf="selectedAd" class="layout-grid">
        <!-- Expenses History -->
        <div class="card p-6 border-indigo">
          <div class="flex justify-between items-center margin-b-4 border-bottom pb-2">
            <h3 class="font-semibold text-main">Expenses: {{ selectedAd.advertisementTitle }}</h3>
            <button class="btn btn-sm btn-secondary" (click)="openExpenseModal(selectedAd)">Add Expense</button>
          </div>
          <div class="table-container max-h-60">
            <table class="leads-table text-xs">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Ref</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let exp of expenses">
                  <td>{{ exp.expenseDate | date:'mediumDate' }}</td>
                  <td><span class="type-pill">{{ exp.expenseType }}</span></td>
                  <td>{{ exp.vendorName || '-' }}</td>
                  <td>{{ exp.paymentReference || '-' }}</td>
                  <td class="text-right"><strong class="text-main">ETB {{ exp.expenseAmount | number }}</strong></td>
                </tr>
                <tr *ngIf="!expenses.length">
                  <td colspan="5" class="text-center text-secondary py-4">No expenses logged.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Performance Metrics History -->
        <div class="card p-6 border-indigo">
          <div class="flex justify-between items-center margin-b-4 border-bottom pb-2">
            <h3 class="font-semibold text-main">Performance Statistics</h3>
            <button class="btn btn-sm btn-secondary" (click)="openPerfModal(selectedAd)">Log Performance</button>
          </div>
          <div class="table-container max-h-60">
            <table class="leads-table text-xs">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Impr.</th>
                  <th>Clicks</th>
                  <th>Leads</th>
                  <th>Conv.</th>
                  <th>Rev.</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let perf of performances">
                  <td>{{ perf.performanceDate | date:'mediumDate' }}</td>
                  <td class="font-mono">{{ perf.impressions | number }}</td>
                  <td class="font-mono">{{ perf.clicks | number }}</td>
                  <td class="font-mono">{{ perf.leadsGenerated | number }}</td>
                  <td class="font-mono">{{ perf.conversions | number }}</td>
                  <td class="font-mono">ETB {{ perf.revenueGenerated | number }}</td>
                  <td>
                    <span class="badge" [class.badge-qualified]="perf.roiPercentage > 0" [class.badge-lost]="perf.roiPercentage <= 0">
                      {{ perf.roiPercentage | number:'1.0-0' }}%
                    </span>
                  </td>
                </tr>
                <tr *ngIf="!performances.length">
                  <td colspan="7" class="text-center text-secondary py-4">No performance metrics logged.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Register Advertisement Modal -->
    <div class="modal-overlay" *ngIf="showAdModal" (click)="closeAdModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h2>Register Advertisement</h2>
          <button class="header-icon-btn close-btn" (click)="closeAdModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>
        <form (ngSubmit)="saveAd()" #adForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="campaignId">Campaign *</label>
                <select id="campaignId" name="campaignId" [(ngModel)]="adModel.campaignId" required>
                  <option *ngFor="let camp of campaigns" [value]="camp.id">{{ camp.campaignName }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="advertisementCode">Advertisement Code</label>
                <input type="text" id="advertisementCode" name="advertisementCode" [(ngModel)]="adModel.advertisementCode" placeholder="e.g. AD-FACEBOOK-POST-01">
              </div>
              <div class="form-group">
                <label for="advertisementTitle">Ad Title *</label>
                <input type="text" id="advertisementTitle" name="advertisementTitle" [(ngModel)]="adModel.advertisementTitle" required placeholder="e.g. Easter Offer Banner">
              </div>
              <div class="form-group">
                <label for="advertisementChannel">Ad Channel *</label>
                <select id="advertisementChannel" name="advertisementChannel" [(ngModel)]="adModel.advertisementChannel" required>
                  <option value="FACEBOOK">FACEBOOK</option>
                  <option value="INSTAGRAM">INSTAGRAM</option>
                  <option value="TELEGRAM">TELEGRAM</option>
                  <option value="TIKTOK">TIKTOK</option>
                  <option value="YOUTUBE">YOUTUBE</option>
                  <option value="TV">TV</option>
                  <option value="RADIO">RADIO</option>
                  <option value="NEWSPAPER">NEWSPAPER</option>
                  <option value="BILLBOARD">BILLBOARD</option>
                  <option value="WEBSITE">WEBSITE</option>
                  <option value="EMAIL">EMAIL</option>
                </select>
              </div>
              <div class="form-group">
                <label for="startDate">Start Date</label>
                <input type="date" id="startDate" name="startDate" [(ngModel)]="adModel.startDate">
              </div>
              <div class="form-group">
                <label for="endDate">End Date</label>
                <input type="date" id="endDate" name="endDate" [(ngModel)]="adModel.endDate">
              </div>
              <div class="form-group">
                <label for="plannedBudget">Planned Budget (ETB) *</label>
                <input type="number" id="plannedBudget" name="plannedBudget" [(ngModel)]="adModel.plannedBudget" required>
              </div>
              <div class="form-group">
                <label for="advertisementStatus">Status</label>
                <select id="advertisementStatus" name="advertisementStatus" [(ngModel)]="adModel.advertisementStatus">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div class="form-group col-span-2">
                <label for="advertisementContent">Advertisement Content Copy</label>
                <textarea id="advertisementContent" name="advertisementContent" [(ngModel)]="adModel.advertisementContent" rows="3" placeholder="Paste ad text copies, links, or image descriptions..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer flex justify-end gap-3" style="padding: 16px 24px; background-color: var(--bg-main); border-top: 1px solid var(--border-color); margin-top: 0;">
            <button type="button" class="btn btn-secondary" (click)="closeAdModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!adForm.form.valid">Register Ad</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Expense Modal -->
    <div class="modal-overlay" *ngIf="showExpenseModal" (click)="closeExpenseModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h2>Log Actual Ad Expense</h2>
          <button class="header-icon-btn close-btn" (click)="closeExpenseModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>
        <form (ngSubmit)="saveExpense()" #expForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="expenseDate">Expense Date *</label>
                <input type="date" id="expenseDate" name="expenseDate" [(ngModel)]="expenseModel.expenseDate" required>
              </div>
              <div class="form-group">
                <label for="expenseType">Expense Type *</label>
                <input type="text" id="expenseType" name="expenseType" [(ngModel)]="expenseModel.expenseType" required placeholder="e.g. Media Placement Fee">
              </div>
              <div class="form-group">
                <label for="expenseAmount">Expense Amount (ETB) *</label>
                <input type="number" id="expenseAmount" name="expenseAmount" [(ngModel)]="expenseModel.expenseAmount" required min="0">
              </div>
              <div class="form-group">
                <label for="vendorName">Vendor Name</label>
                <input type="text" id="vendorName" name="vendorName" [(ngModel)]="expenseModel.vendorName" placeholder="e.g. Telegram Ad Platform">
              </div>
              <div class="form-group col-span-2">
                <label for="paymentReference">Payment Reference / Receipt No</label>
                <input type="text" id="paymentReference" name="paymentReference" [(ngModel)]="expenseModel.paymentReference">
              </div>
              <div class="form-group col-span-2">
                <label for="remarks">Remarks / Invoice Description</label>
                <textarea id="remarks" name="remarks" [(ngModel)]="expenseModel.remarks" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer flex justify-end gap-3" style="padding: 16px 24px; background-color: var(--bg-main); border-top: 1px solid var(--border-color); margin-top: 0;">
            <button type="button" class="btn btn-secondary" (click)="closeExpenseModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!expForm.form.valid">Record Expense</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Log Performance Modal -->
    <div class="modal-overlay" *ngIf="showPerfModal" (click)="closePerfModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h2>Record Advertisement Daily Metrics</h2>
          <button class="header-icon-btn close-btn" (click)="closePerfModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>
        <form (ngSubmit)="savePerformance()" #perfForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="performanceDate">Date</label>
                <input type="date" id="performanceDate" name="performanceDate" [(ngModel)]="perfModel.performanceDate">
              </div>
              <div class="form-group">
                <label for="impressions">Impressions</label>
                <input type="number" id="impressions" name="impressions" [(ngModel)]="perfModel.impressions">
              </div>
              <div class="form-group">
                <label for="clicks">Clicks</label>
                <input type="number" id="clicks" name="clicks" [(ngModel)]="perfModel.clicks">
              </div>
              <div class="form-group">
                <label for="inquiries">Inquiries</label>
                <input type="number" id="inquiries" name="inquiries" [(ngModel)]="perfModel.inquiries">
              </div>
              <div class="form-group">
                <label for="leadsGenerated">Leads Generated</label>
                <input type="number" id="leadsGenerated" name="leadsGenerated" [(ngModel)]="perfModel.leadsGenerated">
              </div>
              <div class="form-group">
                <label for="conversions">Conversions / Sales</label>
                <input type="number" id="conversions" name="conversions" [(ngModel)]="perfModel.conversions">
              </div>
              <div class="form-group col-span-2">
                <label for="revenueGenerated">Revenue Generated (ETB)</label>
                <input type="number" id="revenueGenerated" name="revenueGenerated" [(ngModel)]="perfModel.revenueGenerated">
              </div>
            </div>
          </div>
          <div class="modal-footer flex justify-end gap-3" style="padding: 16px 24px; background-color: var(--bg-main); border-top: 1px solid var(--border-color); margin-top: 0;">
            <button type="button" class="btn btn-secondary" (click)="closePerfModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!perfForm.form.valid">Record Metrics</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .table-container { overflow-x: auto; }
    .max-h-60 { max-height: 240px; overflow-y: auto; }
    .selected-row { background-color: var(--brand-primary-fade) !important; }
    .channel-pill {
      font-weight: 700;
      font-size: 11px;
      padding: 2px 8px;
      background-color: var(--bg-main);
      border-radius: 4px;
      color: var(--text-secondary);
    }
    .badge-active { background-color: rgba(16, 185, 129, 0.1); color: var(--color-qualified); }
    .badge-inactive { background-color: rgba(239, 68, 68, 0.1); color: var(--color-lost); }
    .border-indigo { border: 1px solid var(--brand-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-color); }
    .pb-2 { padding-bottom: 8px; }
    .margin-b-4 { margin-bottom: 16px; }
    .layout-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 20px;
    }
    .text-xs { font-size: 12px; }
    .col-span-2 { grid-column: span 2; }
    
    /* Modal Form Group Select Field Styles */
    .form-group select {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      outline: none;
      transition: var(--transition-fast);
      width: 100%;
      background-color: var(--bg-card);
    }
    .form-group select:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px rgba(76, 58, 147, 0.12);
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1px solid transparent;
      white-space: nowrap;
    }
    
    .btn-action-success {
      background-color: rgba(16, 185, 129, 0.08);
      color: var(--color-qualified);
      border-color: rgba(16, 185, 129, 0.15);
    }
    .btn-action-success:hover {
      background-color: var(--color-qualified);
      color: white;
    }

    .btn-action-warning {
      background-color: rgba(234, 179, 8, 0.08);
      color: var(--color-contacted);
      border-color: rgba(234, 179, 8, 0.15);
    }
    .btn-action-warning:hover {
      background-color: var(--color-contacted);
      color: white;
    }

    .btn-action-danger {
      background-color: rgba(239, 68, 68, 0.08);
      color: var(--color-lost);
      border-color: rgba(239, 68, 68, 0.15);
    }
    .btn-action-danger:hover {
      background-color: var(--color-lost);
      color: white;
    }

  `]
})
export class AdvertisementsComponent implements OnInit {
  private marketingService = inject(MarketingService);
  public authService = inject(AuthService);

  ads: any[] = [];
  campaigns: any[] = [];
  selectedAd: any = null;
  expenses: any[] = [];
  performances: any[] = [];

  showAdModal = false;
  showExpenseModal = false;
  showPerfModal = false;

  adModel: any = {};
  expenseModel: any = {};
  perfModel: any = {};

  targetAdForAction: any = null;

  ngOnInit() {
    this.loadAds();
    this.marketingService.getCampaigns().subscribe(res => this.campaigns = res);
  }

  getInitials(name: string): string {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  loadAds() {
    this.marketingService.getAdvertisements().subscribe({
      next: (res) => this.ads = res,
      error: (err) => console.error('Failed to load advertisements', err)
    });
  }

  selectAd(ad: any) {
    this.selectedAd = ad;
    this.loadAdDetails(ad.id);
  }

  loadAdDetails(adId: number) {
    this.marketingService.getAdExpenses(adId).subscribe(res => this.expenses = res);
    this.marketingService.getAdPerformances(adId).subscribe(res => this.performances = res);
  }

  openAdModal() {
    this.adModel = {
      campaignId: this.campaigns[0]?.id || '',
      advertisementCode: '',
      advertisementTitle: '',
      advertisementChannel: 'FACEBOOK',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      plannedBudget: 0,
      advertisementStatus: 'ACTIVE',
      advertisementContent: ''
    };
    this.showAdModal = true;
  }

  closeAdModal() { this.showAdModal = false; }

  saveAd() {
    this.marketingService.createAdvertisement(this.adModel).subscribe({
      next: () => {
        this.closeAdModal();
        this.loadAds();
      },
      error: (err) => console.error('Failed to register advertisement', err)
    });
  }

  openExpenseModal(ad: any) {
    this.targetAdForAction = ad;
    this.expenseModel = {
      expenseDate: new Date().toISOString().slice(0, 10),
      expenseType: 'Media Cost',
      expenseAmount: 0,
      vendorName: '',
      paymentReference: '',
      remarks: ''
    };
    this.showExpenseModal = true;
  }

  closeExpenseModal() { this.showExpenseModal = false; }

  saveExpense() {
    this.marketingService.recordAdExpense(this.targetAdForAction.id, this.expenseModel).subscribe({
      next: () => {
        this.closeExpenseModal();
        if (this.selectedAd?.id === this.targetAdForAction.id) {
          this.loadAdDetails(this.selectedAd.id);
        }
        this.loadAds(); // Reload ad list to show updated totals/budgets if needed
      },
      error: (err) => console.error('Failed to record expense', err)
    });
  }

  openPerfModal(ad: any) {
    this.targetAdForAction = ad;
    this.perfModel = {
      performanceDate: new Date().toISOString().slice(0, 10),
      impressions: 0,
      clicks: 0,
      inquiries: 0,
      leadsGenerated: 0,
      conversions: 0,
      revenueGenerated: 0
    };
    this.showPerfModal = true;
  }

  closePerfModal() { this.showPerfModal = false; }

  savePerformance() {
    this.marketingService.recordAdPerformance(this.targetAdForAction.id, this.perfModel).subscribe({
      next: () => {
        this.closePerfModal();
        if (this.selectedAd?.id === this.targetAdForAction.id) {
          this.loadAdDetails(this.selectedAd.id);
        }
      },
      error: (err) => console.error('Failed to record performance metrics', err)
    });
  }

  deleteAd(id: number) {
    customConfirm('Are you sure you want to delete this advertisement placement?').then(confirmed => {
      if (confirmed) {
        this.marketingService.deleteAdvertisement(id).subscribe({
          next: () => {
            this.loadAds();
            if (this.selectedAd?.id === id) {
              this.selectedAd = null;
              this.expenses = [];
              this.performances = [];
            }
          },
          error: (err) => console.error('Failed to delete advertisement', err)
        });
      }
    });
  }
}
