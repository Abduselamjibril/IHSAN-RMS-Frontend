import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrokerService } from '../../services/broker.service';
import { SalesService } from '../../services/sales.service';
import { PropertiesService } from '../../services/properties.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-broker-commissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Sales & Commissions Attribution</h1>
        <p>Log transactions attributable to brokers, approve calculated commission vouchers, and configure adjustments</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openSaleModal()">
          <span class="material-icons-outlined">add_shopping_cart</span> Attribute Sale
        </button>
      </div>
    </header>

    <!-- Tab navigation -->
    <div class="flex gap-4 border-bottom pb-2 margin-b-6">
      <button class="btn" [class.btn-primary]="activeTab === 'commissions'" [class.btn-secondary]="activeTab !== 'commissions'" (click)="activeTab = 'commissions'">
        Commissions Registry
      </button>
      <button class="btn" [class.btn-primary]="activeTab === 'sales'" [class.btn-secondary]="activeTab !== 'sales'" (click)="activeTab = 'sales'">
        Attributed Sales
      </button>
    </div>

    <!-- Commissions Tab Content -->
    <div *ngIf="activeTab === 'commissions'" class="card p-6">
      <h3 class="margin-b-4">Commission Payments Registry</h3>
      
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">Broker</th>
              <th style="width: 20%;">Property / Unit</th>
              <th style="width: 15%;">Sale Amount</th>
              <th style="width: 15%;">Commission Earned</th>
              <th style="width: 15%;">Status</th>
              <th style="width: 10%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of commissions">
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main">{{ item.broker?.brokerName }}</span>
                  <span class="text-xs text-muted">{{ item.broker?.brokerCode }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main">{{ item.brokerSale?.property?.propertyName || 'N/A' }}</span>
                  <span class="text-xs text-secondary">Plan: {{ item.commissionPlan?.commissionPlanName }}</span>
                </div>
              </td>
              <td>
                <strong class="font-mono text-main">ETB {{ item.saleAmount | number:'1.2-2' }}</strong>
                <span class="text-xs text-muted block" *ngIf="item.commissionRate">Rate: {{ item.commissionRate }}%</span>
              </td>
              <td>
                <strong class="font-mono text-indigo">ETB {{ item.commissionAmount | number:'1.2-2' }}</strong>
                <span class="text-xs text-muted block" *ngIf="item.adjustments?.length">
                  Has {{ item.adjustments.length }} adjustment(s)
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="getBadgeClass(item.statusId)">
                  {{ item.statusId }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  <button *ngIf="item.statusId === 'PENDING'" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" (click)="approveCommission(item)">
                    Approve
                  </button>
                  <button *ngIf="item.statusId === 'PENDING' || item.statusId === 'APPROVED'" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; background-color: var(--brand-primary-light); color: var(--brand-primary);" (click)="openAdjustmentModal(item)" title="Add Adjustment">
                    Adjust
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!commissions.length">
              <td colspan="6" class="text-center text-secondary py-8">
                No commission entries logged in registry.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Attributed Sales Tab Content -->
    <div *ngIf="activeTab === 'sales'" class="card p-6">
      <h3 class="margin-b-4">Manually Attributed Broker Sales</h3>
      
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">Broker</th>
              <th style="width: 25%;">Customer</th>
              <th style="width: 25%;">Property Scope</th>
              <th style="width: 15%;">Attributed Amount</th>
              <th style="width: 10%;">Sale Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of sales">
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main">{{ item.broker?.brokerName }}</span>
                  <span class="text-xs text-muted">{{ item.broker?.brokerCode }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main">{{ item.customer?.fullName }}</span>
                  <span class="text-xs text-muted">{{ item.customer?.primaryPhone }}</span>
                </div>
              </td>
              <td>
                <span class="font-semibold text-main">{{ item.property?.propertyName }}</span>
              </td>
              <td>
                <strong class="font-mono text-indigo">ETB {{ item.saleAmount | number:'1.2-2' }}</strong>
              </td>
              <td>
                <span class="text-secondary">{{ item.saleDate | date:'mediumDate' }}</span>
              </td>
            </tr>
            <tr *ngIf="!sales.length">
              <td colspan="5" class="text-center text-secondary py-8">
                No attributed sales tracked.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Attribute Sale Modal -->
    <div class="modal-overlay" *ngIf="showSaleModal" (click)="closeSaleModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 550px;">
        <header class="modal-header">
          <h2>Attribute Transaction to Broker</h2>
          <button class="header-icon-btn close-btn" (click)="closeSaleModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="saveSale()" #saleForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group col-span-2">
                <label for="brokerId">Attributable Broker *</label>
                <select id="brokerId" name="brokerId" [(ngModel)]="saleFormModel.brokerId" required class="form-control">
                  <option [value]="null" disabled selected>-- Choose Broker --</option>
                  <option *ngFor="let b of brokers" [value]="b.id">{{ b.brokerName }} ({{ b.brokerCode }})</option>
                </select>
              </div>

              <div class="form-group col-span-2">
                <label for="customerId">Customer / Client *</label>
                <select id="customerId" name="customerId" [(ngModel)]="saleFormModel.customerId" required class="form-control">
                  <option [value]="null" disabled selected>-- Choose Customer --</option>
                  <option *ngFor="let c of customers" [value]="c.id">{{ c.fullName }} ({{ c.primaryPhone }})</option>
                </select>
              </div>

              <div class="form-group col-span-2">
                <label for="propertyId">Property Project *</label>
                <select id="propertyId" name="propertyId" [(ngModel)]="saleFormModel.propertyId" required class="form-control">
                  <option [value]="null" disabled selected>-- Choose Property --</option>
                  <option *ngFor="let p of properties" [value]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="saleAmount">Contract Sale Amount (ETB) *</label>
                <input type="number" id="saleAmount" name="saleAmount" [(ngModel)]="saleFormModel.saleAmount" required placeholder="5000000" class="form-control">
              </div>

              <div class="form-group">
                <label for="saleDate">Attribution Date *</label>
                <input type="date" id="saleDate" name="saleDate" [(ngModel)]="saleFormModel.saleDate" required class="form-control">
              </div>

              <div class="form-group">
                <label for="reservationId">Reservation ID (Optional)</label>
                <input type="number" id="reservationId" name="reservationId" [(ngModel)]="saleFormModel.reservationId" placeholder="ID" class="form-control">
              </div>

              <div class="form-group">
                <label for="salesContractId">Contract ID (Optional)</label>
                <input type="number" id="salesContractId" name="salesContractId" [(ngModel)]="saleFormModel.salesContractId" placeholder="ID" class="form-control">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeSaleModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!saleForm.valid">Attribute & Calculate</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Commission Payout Adjustment Modal -->
    <div class="modal-overlay" *ngIf="showAdjustmentModal" (click)="closeAdjustmentModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 450px;">
        <header class="modal-header">
          <h2>Apply Payout Adjustment</h2>
          <button class="header-icon-btn close-btn" (click)="closeAdjustmentModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="saveAdjustment()" #adjForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group col-span-2">
                <label for="adjustmentTypeId">Adjustment Action *</label>
                <select id="adjustmentTypeId" name="adjustmentTypeId" [(ngModel)]="adjFormModel.adjustmentTypeId" required class="form-control">
                  <option value="INCREASE">Increase Payout (Bonus / Multiplier)</option>
                  <option value="DECREASE">Decrease Payout (Withholdings / Deductions)</option>
                </select>
              </div>

              <div class="form-group col-span-2">
                <label for="adjustmentAmount">Adjustment Amount (ETB) *</label>
                <input type="number" id="adjustmentAmount" name="adjustmentAmount" [(ngModel)]="adjFormModel.adjustmentAmount" required placeholder="5000" class="form-control">
              </div>

              <div class="form-group col-span-2">
                <label for="reason">Reason / Justification *</label>
                <textarea id="reason" name="reason" [(ngModel)]="adjFormModel.reason" required placeholder="Describe the reason for adjustment..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeAdjustmentModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!adjForm.valid">Apply Adjustment</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      outline: none;
    }
    .form-control:focus {
      border-color: var(--brand-primary);
    }
  `]
})
export class BrokerCommissionsComponent implements OnInit {
  private brokerService = inject(BrokerService);
  private salesService = inject(SalesService);
  private propertiesService = inject(PropertiesService);

  activeTab: 'commissions' | 'sales' = 'commissions';

  commissions: any[] = [];
  sales: any[] = [];
  brokers: any[] = [];
  customers: any[] = [];
  properties: any[] = [];

  showSaleModal = false;
  showAdjustmentModal = false;

  saleFormModel: any = {};
  adjFormModel: any = {};
  selectedCommissionForAdjustment: any = null;

  ngOnInit() {
    this.loadCommissions();
    this.loadSales();
    this.loadBrokers();
    this.loadCustomers();
    this.loadProperties();
  }

  loadCommissions() {
    this.brokerService.getCommissions().subscribe(res => {
      this.commissions = res;
    });
  }

  loadSales() {
    this.brokerService.getSalesAttributed().subscribe(res => {
      this.sales = res;
    });
  }

  loadBrokers() {
    this.brokerService.getBrokers().subscribe(res => {
      this.brokers = res.filter(b => b.statusId === 'ACTIVE');
    });
  }

  loadCustomers() {
    this.salesService.getCustomers().subscribe(res => {
      this.customers = res;
    });
  }

  loadProperties() {
    this.propertiesService.getProperties().subscribe(res => {
      this.properties = res;
    });
  }

  openSaleModal() {
    this.saleFormModel = {
      brokerId: null,
      customerId: null,
      propertyId: null,
      saleAmount: null,
      saleDate: new Date().toISOString().split('T')[0],
      reservationId: null,
      salesContractId: null
    };
    this.showSaleModal = true;
  }

  closeSaleModal() {
    this.showSaleModal = false;
  }

  saveSale() {
    this.brokerService.logBrokerSale(this.saleFormModel).subscribe({
      next: () => {
        this.loadSales();
        this.loadCommissions();
        this.closeSaleModal();
      },
      error: err => console.error('Failed to log attributed sale', err)
    });
  }

  async approveCommission(commission: any) {
    const confirm = await customConfirm(
      `Approve commission of ETB ${commission.commissionAmount.toLocaleString()} for broker "${commission.broker?.brokerName}"?`,
      'Approve Commission'
    );
    if (confirm) {
      this.brokerService.approveCommission(commission.id).subscribe({
        next: () => {
          this.loadCommissions();
        },
        error: err => console.error('Failed to approve commission', err)
      });
    }
  }

  openAdjustmentModal(commission: any) {
    this.selectedCommissionForAdjustment = commission;
    this.adjFormModel = {
      adjustmentTypeId: 'INCREASE',
      adjustmentAmount: null,
      reason: ''
    };
    this.showAdjustmentModal = true;
  }

  closeAdjustmentModal() {
    this.showAdjustmentModal = false;
    this.selectedCommissionForAdjustment = null;
  }

  saveAdjustment() {
    if (!this.selectedCommissionForAdjustment) return;
    this.brokerService.addAdjustment(this.selectedCommissionForAdjustment.id, this.adjFormModel).subscribe({
      next: () => {
        this.loadCommissions();
        this.closeAdjustmentModal();
      },
      error: err => console.error('Failed to add adjustment', err)
    });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-contacted';
      case 'APPROVED': return 'badge-new';
      case 'PAYABLE': return 'badge-proposal';
      case 'PAID': return 'badge-qualified';
      default: return 'badge-lost';
    }
  }
}
