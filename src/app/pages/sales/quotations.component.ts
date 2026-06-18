import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { PropertiesService } from '../../services/properties.service';

interface QuotationItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Quotations & Pricing Rules</h1>
        <p>Draft pricing proposals, calculate discount priorities, and manage approval workflows</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-secondary" (click)="activeTab = 'discounts'" [class.btn-primary]="activeTab === 'discounts'">
          <span class="material-icons-outlined">discount</span>
          Discount Approvals
        </button>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          New Quotation
        </button>
      </div>
    </header>

    <!-- Success Alert -->
    <div class="alert alert-success" *ngIf="successMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-qualified); color: var(--color-qualified); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">check_circle</span>
      <strong>Success:</strong>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <div class="alert alert-danger" *ngIf="errorMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">error_outline</span>
      <strong>Error:</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Tabs header -->
    <div class="flex gap-4" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'quotations'" 
        (click)="activeTab = 'quotations'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'quotations' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'quotations' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Quotation Ledger
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'discounts'" 
        (click)="activeTab = 'discounts'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'discounts' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'discounts' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Discount Requests
      </button>
    </div>

    <!-- Quotations Tab Content -->
    <div class="card glass-card" *ngIf="activeTab === 'quotations'">
      <div class="filter-bar flex justify-between align-center gap-4" style="margin-bottom: 20px;">
        <div class="search-box" style="flex: 1; max-width: 400px;">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by quote number, customer, property..." 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()" 
          />
        </div>
      </div>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Quote No</th>
              <th>Customer</th>
              <th>Property / Unit</th>
              <th>Base Price</th>
              <th>Discount</th>
              <th>VAT (15%)</th>
              <th>Total Amount</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of filteredQuotations">
              <td class="font-mono font-bold">{{ q.quotationNo }}</td>
              <td>{{ q.customer?.fullName }}</td>
              <td>
                <div class="flex flex-col">
                  <span class="font-bold text-main">{{ q.property?.propertyName }}</span>
                  <span class="text-secondary font-xs">Unit: {{ q.unit?.unitNumber }}</span>
                </div>
              </td>
              <td class="font-mono">ETB {{ q.basePrice | number }}</td>
              <td class="font-mono text-danger">-ETB {{ q.discountAmount | number }}</td>
              <td class="font-mono">ETB {{ q.vatAmount | number }}</td>
              <td class="font-mono font-bold">ETB {{ q.totalAmount | number }}</td>
              <td>{{ q.validityDate | date:'mediumDate' }}</td>
              <td>
                <span class="badge" [ngClass]="getQuoteStatusBadge(q.status)">
                  {{ q.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button 
                    *ngIf="q.status === 'DRAFT' || q.status === 'SENT'"
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openDiscountRequestModal(q)"
                  >
                    <span class="material-icons-outlined font-sm">discount</span>
                    <span>Request Discount</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredQuotations.length === 0">
              <td colspan="10" class="text-center py-6 text-secondary">
                No quotations generated yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Discount Requests Tab Content -->
    <div class="card glass-card" *ngIf="activeTab === 'discounts'">
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Quotation No</th>
              <th>Customer</th>
              <th>Requested Discount</th>
              <th>Percentage (%)</th>
              <th>Justification / Reason</th>
              <th>Status</th>
              <th>Approver / Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let dr of discountRequests">
              <td class="font-mono font-bold">#DR-0{{ dr.id }}</td>
              <td class="font-mono">{{ dr.quotation?.quotationNo }}</td>
              <td>{{ dr.quotation?.customer?.fullName }}</td>
              <td class="font-mono text-danger">ETB {{ dr.requestedDiscount | number }}</td>
              <td class="font-mono font-bold">{{ dr.discountPercentage ? (dr.discountPercentage + '%') : '-' }}</td>
              <td>{{ dr.reason }}</td>
              <td>
                <span class="badge" [ngClass]="getDiscountStatusBadge(dr.status)">
                  {{ dr.status }}
                </span>
              </td>
              <td>
                <div *ngIf="dr.status !== 'PENDING'" class="text-secondary font-xs">
                  Processed by Approver #{{ dr.createdBy || 1 }}
                </div>
                <div *ngIf="dr.status === 'PENDING'" class="text-secondary italic font-xs">
                  Pending review
                </div>
              </td>
              <td>
                <div class="flex gap-2" *ngIf="dr.status === 'PENDING'">
                  <button 
                    class="btn btn-primary btn-sm flex align-center gap-1"
                    (click)="onApproveDiscount(dr.id)"
                  >
                    <span class="material-icons-outlined font-sm">check</span>
                    <span>Approve</span>
                  </button>
                  <button 
                    class="btn btn-danger btn-sm flex align-center gap-1"
                    (click)="onRejectDiscount(dr.id)"
                  >
                    <span class="material-icons-outlined font-sm">close</span>
                    <span>Reject</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="discountRequests.length === 0">
              <td colspan="9" class="text-center py-6 text-secondary">
                No discount requests submitted.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Generate Quotation Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" style="max-width: 800px; width: 95%;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Generate Pricing Quotation</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitQuotation($event)">
            
            <div class="form-row flex gap-3">
              <!-- Customer * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Customer * [REQUIRED]</label>
                <select [(ngModel)]="newQuotation.customerId" name="customerId" required>
                  <option [value]="0">-- Select Customer --</option>
                  <option *ngFor="let c of customers" [value]="c.id">{{ c.fullName }} ({{ c.primaryPhone }})</option>
                </select>
              </div>

              <!-- Link Reservation (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Link Active Reservation [OPTIONAL]</label>
                <select [(ngModel)]="newQuotation.reservationId" name="reservationId" (change)="onReservationChange()">
                  <option [value]="null">-- Select Active Reservation --</option>
                  <option *ngFor="let r of activeReservations" [value]="r.id">
                    {{ r.reservationNo }} - {{ r.customer?.fullName }} (Unit: {{ r.unit?.unitNumber }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Property * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Property * [REQUIRED]</label>
                <select [(ngModel)]="newQuotation.propertyId" name="propertyId" required (change)="onPropertyChange()">
                  <option [value]="0">-- Select Property --</option>
                  <option *ngFor="let p of properties" [value]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>

              <!-- Unit * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Unit * [REQUIRED]</label>
                <select [(ngModel)]="newQuotation.unitId" name="unitId" required [disabled]="newQuotation.propertyId === 0" (change)="onUnitChange()">
                  <option [value]="0">-- Select Development Unit --</option>
                  <option *ngFor="let u of units" [value]="u.id">Unit {{ u.unitNumber }} - Floor {{ u.floor?.floorNumber }}</option>
                </select>
              </div>
            </div>

            <!-- Precedence notification block if pricing calculation returned active promotion/discount -->
            <div class="alert alert-success flex flex-col gap-1" *ngIf="pricingDetails" style="margin-bottom: 16px; background-color: rgba(76, 58, 147, 0.08); border-color: var(--brand-primary); color: var(--brand-primary);">
              <div class="flex align-center gap-2">
                <span class="material-icons-outlined font-sm">info</span>
                <strong>Pricing Rules Output:</strong>
              </div>
              <div class="font-xs">
                Base: ETB {{ pricingDetails.basePrice | number }} | 
                Rule Applied: {{ pricingDetails.appliedRuleDescription || 'Base Price (No discounts active)' }} |
                Calculated Discount: ETB {{ pricingDetails.discountAmount | number }}
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Quotation Date * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Quotation Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newQuotation.quotationDate" name="quotationDate" required />
              </div>

              <!-- Validity Date * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Validity Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newQuotation.validityDate" name="validityDate" required />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Base Price * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Base Unit Price (ETB) * [REQUIRED]</label>
                <input type="number" [(ngModel)]="newQuotation.basePrice" name="basePrice" required (ngModelChange)="recalculateTotals()" />
              </div>

              <!-- Discount Amount (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Applied Discount Amount (ETB) [OPTIONAL]</label>
                <input type="number" [(ngModel)]="newQuotation.discountAmount" name="discountAmount" (ngModelChange)="recalculateTotals()" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- VAT Amount (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>VAT Tax (15% ETB) [OPTIONAL]</label>
                <input type="number" [(ngModel)]="newQuotation.vatAmount" name="vatAmount" (ngModelChange)="recalculateTotals()" />
              </div>

              <!-- Total Amount (Required, Read-Only) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Total Valuation Amount (ETB) * [REQUIRED] [READ-ONLY]</label>
                <input type="number" [value]="newQuotation.totalAmount" readonly style="background-color: var(--bg-main); font-weight: bold; color: var(--brand-primary);" />
              </div>
            </div>

            <!-- Remarks (Optional) -->
            <div class="form-group flex flex-col">
              <label>Remarks / Quotation Scope Notes [OPTIONAL]</label>
              <textarea [(ngModel)]="newQuotation.remarks" name="remarks" placeholder="Enter quotation terms, payment phases or scope..." rows="2"></textarea>
            </div>

            <!-- Quotation Item Ledger (Array of items) * -->
            <div style="margin-top: 16px;">
              <div class="flex justify-between align-center" style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 12px;">
                <span style="font-weight: 700; font-size: 13px;">Quotation Item Ledger * [REQUIRED]</span>
                <button type="button" class="btn btn-secondary btn-sm flex align-center gap-1" (click)="addItemRow()">
                  <span class="material-icons-outlined font-sm">add</span> Add Line Item
                </button>
              </div>

              <!-- Item Column Headers -->
              <div class="flex gap-2 align-center" style="margin-bottom: 6px; font-size: 11px; font-weight: 600; color: var(--text-secondary); padding: 0 4px;">
                <div style="flex: 3;">Description *</div>
                <div style="flex: 1;">Qty *</div>
                <div style="flex: 2;">Unit Price (ETB) *</div>
                <div style="flex: 2;">Line Total (ETB)</div>
                <div style="width: 38px;" class="text-center">Action</div>
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex gap-2 align-center" *ngFor="let item of itemRows; let idx = index" style="width: 100%;">
                  <!-- Description * -->
                  <div style="flex: 3; min-width: 0;">
                    <input type="text" [(ngModel)]="item.description" name="item_desc_{{idx}}" placeholder="e.g. Unit base price" required style="padding: 8px 10px; width: 100%; box-sizing: border-box;" />
                  </div>
                  <!-- Quantity * -->
                  <div style="flex: 1; min-width: 0;">
                    <input type="number" [(ngModel)]="item.quantity" name="item_qty_{{idx}}" placeholder="Qty" required (ngModelChange)="onItemRowChange(idx)" style="padding: 8px 10px; width: 100%; box-sizing: border-box;" />
                  </div>
                  <!-- Unit Price * -->
                  <div style="flex: 2; min-width: 0;">
                    <input type="number" [(ngModel)]="item.unitPrice" name="item_price_{{idx}}" placeholder="Price" required (ngModelChange)="onItemRowChange(idx)" style="padding: 8px 10px; width: 100%; box-sizing: border-box;" />
                  </div>
                  <!-- Line Total * -->
                  <div style="flex: 2; min-width: 0;">
                    <input type="number" [value]="item.amount" readonly style="padding: 8px 10px; width: 100%; box-sizing: border-box; background-color: var(--bg-main);" />
                  </div>
                  <!-- Delete Action Button -->
                  <div style="width: 38px; display: flex; justify-content: center;">
                    <button type="button" class="btn btn-secondary" style="padding: 0; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; color: var(--color-lost); border-color: rgba(239, 68, 68, 0.2);" (click)="removeItemRow(idx)" [disabled]="itemRows.length <= 1">
                      <span class="material-icons-outlined font-sm" style="font-size: 18px;">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="newQuotation.customerId === 0 || newQuotation.propertyId === 0 || newQuotation.unitId === 0 || !newQuotation.quotationDate || !newQuotation.validityDate || itemRows.length === 0"
              >
                Generate Quote
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Submit Discount Request Modal -->
    <div class="modal-overlay" *ngIf="showDiscountModal" (click)="closeDiscountModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Submit Discount Approval Request</h2>
          <button class="header-icon-btn close-btn" (click)="closeDiscountModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitDiscountRequest($event)">
            <!-- Link Quotation (Required) -->
            <div class="form-group flex flex-col">
              <label>Quotation Reference * [REQUIRED]</label>
              <input type="text" [value]="selectedQuote?.quotationNo + ' - ' + selectedQuote?.customer?.fullName" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-row flex gap-3">
              <!-- Requested Discount Amount [OPTIONAL] -->
              <div class="form-group flex-1 flex flex-col">
                <label>Requested Discount Amount (ETB) [OPTIONAL]</label>
                <input type="number" [(ngModel)]="discountRequestData.requestedDiscount" name="requestedDiscount" placeholder="e.g. 150000" />
              </div>

              <!-- Requested Discount Percentage [OPTIONAL] -->
              <div class="form-group flex-1 flex flex-col">
                <label>Requested Discount % [OPTIONAL]</label>
                <input type="number" [(ngModel)]="discountRequestData.discountPercentage" name="discountPercentage" placeholder="e.g. 5" />
              </div>
            </div>
            <span class="text-secondary font-xs" style="margin-top: -8px; display: block; margin-bottom: 12px;">
              Either flat discount amount or percentage must be specified.
            </span>

            <!-- Reason (Required) -->
            <div class="form-group flex flex-col">
              <label>Business Justification / Reason * [REQUIRED]</label>
              <textarea [(ngModel)]="discountRequestData.reason" name="reason" required placeholder="State why this discount is requested (e.g. buyer is paying 100% upfront in foreign cash)..." rows="3"></textarea>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeDiscountModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!discountRequestData.reason || (!discountRequestData.requestedDiscount && !discountRequestData.discountPercentage)">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-draft { background-color: rgba(59, 130, 246, 0.15); color: var(--color-new); }
    .badge-sent { background-color: rgba(168, 85, 247, 0.15); color: var(--color-proposal); }
    .badge-accepted { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-rejected { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-expired { background-color: rgba(100, 116, 139, 0.15); color: var(--text-secondary); }

    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-approved { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
  `]
})
export class QuotationsComponent implements OnInit {
  private salesService = inject(SalesService);
  private propertiesService = inject(PropertiesService);

  activeTab = 'quotations';
  quotations: any[] = [];
  filteredQuotations: any[] = [];
  discountRequests: any[] = [];

  customers: any[] = [];
  properties: any[] = [];
  units: any[] = [];
  activeReservations: any[] = [];

  searchQuery = '';
  showCreateModal = false;
  showDiscountModal = false;
  selectedQuote: any = null;
  successMessage = '';
  errorMessage = '';

  pricingDetails: any = null;

  newQuotation = {
    customerId: 0,
    reservationId: null as number | null,
    propertyId: 0,
    unitId: 0,
    quotationDate: '',
    validityDate: '',
    basePrice: 0,
    discountAmount: 0,
    vatAmount: 0,
    totalAmount: 0,
    remarks: ''
  };

  itemRows: QuotationItemRow[] = [];

  discountRequestData = {
    quotationId: 0,
    requestedDiscount: null as number | null,
    discountPercentage: null as number | null,
    reason: ''
  };

  ngOnInit() {
    this.loadQuotations();
    this.loadDiscountRequests();
    this.loadCustomers();
    this.loadProperties();
    this.loadActiveReservations();

    const today = new Date();
    const validity = new Date(today);
    validity.setDate(today.getDate() + 30); // Valid for 30 days
    this.newQuotation.quotationDate = this.formatDate(today);
    this.newQuotation.validityDate = this.formatDate(validity);
  }

  loadQuotations() {
    this.salesService.getQuotations().subscribe({
      next: (res) => {
        this.quotations = res;
        this.filteredQuotations = res;
      },
      error: (err) => console.error('Error fetching quotations', err)
    });
  }

  loadDiscountRequests() {
    this.salesService.getDiscountRequests().subscribe({
      next: (res) => this.discountRequests = res,
      error: (err) => console.error('Error fetching discount requests', err)
    });
  }

  loadCustomers() {
    this.salesService.getCustomers().subscribe({
      next: (res) => this.customers = res,
      error: (err) => console.error('Error fetching customers', err)
    });
  }

  loadProperties() {
    this.propertiesService.getProperties().subscribe({
      next: (res) => this.properties = res.items || res,
      error: (err) => console.error('Error fetching properties', err)
    });
  }

  loadActiveReservations() {
    this.salesService.getReservations().subscribe({
      next: (res) => {
        this.activeReservations = res.filter((r: any) => r.status === 'RESERVED');
      },
      error: (err) => console.error('Error fetching reservations', err)
    });
  }

  onReservationChange() {
    if (!this.newQuotation.reservationId) return;
    const res = this.activeReservations.find(r => r.id == this.newQuotation.reservationId);
    if (res) {
      this.newQuotation.customerId = res.customer?.id || 0;
      this.newQuotation.propertyId = res.property?.id || 0;
      this.onPropertyChange();
      this.newQuotation.unitId = res.unit?.id || 0;
      this.onUnitChange();
    }
  }

  onPropertyChange() {
    this.newQuotation.unitId = 0;
    this.units = [];
    this.pricingDetails = null;
    if (this.newQuotation.propertyId === 0) return;

    this.propertiesService.getUnits({ propertyId: this.newQuotation.propertyId }).subscribe({
      next: (res) => {
        this.units = res.items || res;
      },
      error: (err) => console.error('Error fetching units', err)
    });
  }

  onUnitChange() {
    this.pricingDetails = null;
    if (this.newQuotation.propertyId === 0 || this.newQuotation.unitId === 0) return;

    this.salesService.calculateQuotationPrice(this.newQuotation.propertyId, this.newQuotation.unitId).subscribe({
      next: (res) => {
        this.pricingDetails = res;
        this.newQuotation.basePrice = res.basePrice;
        this.newQuotation.discountAmount = res.discountAmount;
        this.newQuotation.vatAmount = res.vatAmount;
        this.newQuotation.totalAmount = res.totalAmount;
        
        // Auto-populate item rows
        this.itemRows = [
          {
            description: `Unit Booking Base Price: ${res.appliedRuleDescription || 'Default Pricing'}`,
            quantity: 1,
            unitPrice: res.basePrice,
            amount: res.basePrice
          }
        ];
        
        this.recalculateTotals();
      },
      error: (err) => console.error('Error calculating quote price', err)
    });
  }

  onSearchChange() {
    if (!this.searchQuery.trim()) {
      this.filteredQuotations = this.quotations;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredQuotations = this.quotations.filter(qt => 
      qt.quotationNo?.toLowerCase().includes(q) ||
      qt.customer?.fullName?.toLowerCase().includes(q) ||
      qt.property?.propertyName?.toLowerCase().includes(q) ||
      qt.unit?.unitNumber?.toLowerCase().includes(q)
    );
  }

  getQuoteStatusBadge(status: string): string {
    switch (status) {
      case 'DRAFT': return 'badge-draft';
      case 'SENT': return 'badge-sent';
      case 'ACCEPTED': return 'badge-accepted';
      case 'REJECTED': return 'badge-rejected';
      case 'EXPIRED': return 'badge-expired';
      default: return '';
    }
  }

  getDiscountStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      default: return '';
    }
  }

  addItemRow() {
    this.itemRows.push({
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    });
  }

  removeItemRow(idx: number) {
    this.itemRows.splice(idx, 1);
    this.recalculateTotals();
  }

  onItemRowChange(idx: number) {
    const row = this.itemRows[idx];
    row.amount = row.quantity * row.unitPrice;
    this.recalculateTotals();
  }

  recalculateTotals() {
    // Recalculate base price based on item rows sum or let basePrice remain unit price
    const itemsSum = this.itemRows.reduce((sum, item) => sum + item.amount, 0);
    if (itemsSum > 0) {
      this.newQuotation.basePrice = itemsSum;
    }
    
    // Calculate total: (BasePrice - DiscountAmount) * 1.15 if VAT included, or manually edit
    const netAmount = Math.max(0, this.newQuotation.basePrice - this.newQuotation.discountAmount);
    
    // Auto calculate VAT at 15% if it was not manually modified, or keep standard 15%
    this.newQuotation.vatAmount = Math.round(netAmount * 0.15 * 100) / 100;
    this.newQuotation.totalAmount = Math.round((netAmount + this.newQuotation.vatAmount) * 100) / 100;
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.newQuotation.customerId = 0;
    this.newQuotation.reservationId = null;
    this.newQuotation.propertyId = 0;
    this.newQuotation.unitId = 0;
    this.newQuotation.basePrice = 0;
    this.newQuotation.discountAmount = 0;
    this.newQuotation.vatAmount = 0;
    this.newQuotation.totalAmount = 0;
    this.newQuotation.remarks = '';
    
    const today = new Date();
    const validity = new Date(today);
    validity.setDate(today.getDate() + 30);
    this.newQuotation.quotationDate = this.formatDate(today);
    this.newQuotation.validityDate = this.formatDate(validity);
    
    this.itemRows = [
      { description: 'Unit Base Price', quantity: 1, unitPrice: 0, amount: 0 }
    ];
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openDiscountRequestModal(q: any) {
    this.selectedQuote = q;
    this.showDiscountModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.discountRequestData = {
      quotationId: q.id,
      requestedDiscount: null,
      discountPercentage: null,
      reason: ''
    };
  }

  closeDiscountModal() {
    this.showDiscountModal = false;
  }

  onSubmitQuotation(event: Event) {
    event.preventDefault();
    if (this.newQuotation.customerId === 0 || this.newQuotation.propertyId === 0 || this.newQuotation.unitId === 0) return;

    const payload = {
      customerId: +this.newQuotation.customerId,
      reservationId: this.newQuotation.reservationId ? +this.newQuotation.reservationId : undefined,
      propertyId: +this.newQuotation.propertyId,
      unitId: +this.newQuotation.unitId,
      quotationDate: new Date(this.newQuotation.quotationDate),
      validityDate: new Date(this.newQuotation.validityDate),
      basePrice: +this.newQuotation.basePrice,
      discountAmount: +this.newQuotation.discountAmount,
      vatAmount: +this.newQuotation.vatAmount,
      remarks: this.newQuotation.remarks || undefined,
      items: this.itemRows.map(row => ({
        description: row.description,
        quantity: +row.quantity,
        unitPrice: +row.unitPrice
      }))
    };

    this.salesService.createQuotation(payload).subscribe({
      next: (res) => {
        this.successMessage = `Quotation ${res.quotationNo} generated successfully with total value ETB ${res.totalAmount.toLocaleString()}!`;
        this.loadQuotations();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating quotation', err);
        this.errorMessage = err.error?.message || 'Failed to generate quotation.';
      }
    });
  }

  onSubmitDiscountRequest(event: Event) {
    event.preventDefault();
    if (!this.discountRequestData.reason) return;

    const payload = {
      quotationId: +this.discountRequestData.quotationId,
      requestedDiscount: this.discountRequestData.requestedDiscount ? +this.discountRequestData.requestedDiscount : undefined,
      discountPercentage: this.discountRequestData.discountPercentage ? +this.discountRequestData.discountPercentage : undefined,
      reason: this.discountRequestData.reason
    };

    this.salesService.createDiscountRequest(payload).subscribe({
      next: (res) => {
        this.successMessage = `Discount request submitted to approvals successfully!`;
        this.loadDiscountRequests();
        this.closeDiscountModal();
      },
      error: (err) => {
        console.error('Error submitting discount request', err);
        this.errorMessage = err.error?.message || 'Failed to submit discount request.';
      }
    });
  }

  onApproveDiscount(id: number) {
    const comment = prompt('Enter approval comments (optional):');
    this.salesService.approveDiscountRequest(id, 1, comment || 'Approved').subscribe({
      next: (res) => {
        this.successMessage = `Discount request approved! Quotation values have been updated.`;
        this.loadDiscountRequests();
        this.loadQuotations();
      },
      error: (err) => {
        console.error('Error approving discount request', err);
        this.errorMessage = err.error?.message || 'Failed to approve discount request.';
      }
    });
  }

  onRejectDiscount(id: number) {
    const comment = prompt('Enter rejection reasons (required):');
    if (!comment) {
      alert('Rejection reason is required.');
      return;
    }
    this.salesService.rejectDiscountRequest(id, 1, comment).subscribe({
      next: (res) => {
        this.successMessage = `Discount request rejected.`;
        this.loadDiscountRequests();
      },
      error: (err) => {
        console.error('Error rejecting discount request', err);
        this.errorMessage = err.error?.message || 'Failed to reject discount request.';
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
