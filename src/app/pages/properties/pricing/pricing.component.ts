import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Pricing & Promotions</h1>
        <p>Valuation guidelines, unit pricing history, and sales discount rules</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openPromotionModal()">
          <span class="material-icons-outlined">tag</span>
          Launch Promotion
        </button>
      </div>
    </header>

    <!-- Filters Panel -->
    <div class="card" style="margin-bottom: 24px; padding: 16px;">
      <div class="flex justify-between align-center gap-3 flex-wrap">
        <!-- Search box -->
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by code or number..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex align-center gap-2 flex-wrap">
          <select [(ngModel)]="filters.propertyId" (change)="onPropertyFilterChange()">
            <option [value]="0">All Properties</option>
            <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
          </select>

          <select [(ngModel)]="filters.buildingId" (change)="onBuildingFilterChange()" [disabled]="!filters.propertyId">
            <option [value]="0">All Buildings</option>
            <option *ngFor="let b of filterBuildings" [value]="b.id">{{ b.buildingName }}</option>
          </select>

          <select [(ngModel)]="filters.floorId" (change)="loadPricingData()" [disabled]="!filters.buildingId">
            <option [value]="0">All Floors</option>
            <option *ngFor="let f of filterFloors" [value]="f.id">Floor {{ f.floorNumber }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="pricing-middle-row grid gap-6">
      
      <!-- List of active promotions -->
      <div class="card">
        <h3>Active Sales Promotions</h3>
        <div class="promotions-deck mt-3 flex flex-col gap-3">
          <div class="promo-card border bg-main p-3 relative" *ngFor="let promo of promotions">
            <div class="flex justify-between align-center">
              <div>
                <div class="flex gap-2 align-center">
                  <span class="badge badge-qualified">Active Promo</span>
                  <span class="badge badge-indigo" *ngIf="promo.promotionType" style="font-size: 10px;">{{ promo.promotionType }}</span>
                </div>
                <h4 class="mt-1">{{ promo.promotionName }}</h4>
                <p class="text-secondary font-xs mt-1">
                  Discount: <strong class="text-indigo">{{ promo.discountPercentage }}%</strong>
                  <span *ngIf="promo.fixedDiscountAmount"> | Fixed: <strong>ETB {{ promo.fixedDiscountAmount | number }}</strong></span>
                  | Validity: {{ promo.startDate | date:'shortDate' }} to {{ promo.endDate | date:'shortDate' }}
                </p>
                <p class="text-secondary font-xs" *ngIf="promo.applicableProperty || promo.applicableUnitType">
                  Scope: {{ promo.applicableProperty?.propertyName || 'All Properties' }} / {{ promo.applicableUnitType?.typeName || 'All Types' }}
                </p>
                <p class="text-secondary font-xs" *ngIf="promo.remarks" style="font-style: italic; margin-top: 4px;">{{ promo.remarks }}</p>
              </div>
            </div>
          </div>
          <div *ngIf="promotions.length === 0" class="text-center py-6 text-secondary italic font-sm">
            No active discount campaigns running.
          </div>
        </div>
      </div>

      <!-- Pricing ledger list -->
      <div class="card">
        <h3>Inventory Base Pricing</h3>
        <div class="table-container mt-3">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Unit Code</th>
                <th>Type</th>
                <th>Base Value</th>
                <th>Taxes (VAT)</th>
                <th>Discount</th>
                <th>Effective Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of units">
                <td class="font-mono font-bold">{{ u.unitCode }}</td>
                <td>{{ u.unitType?.typeName }}</td>
                <td>{{ u.currentPrice ? ('ETB ' + (u.currentPrice | number)) : 'Not Set' }}</td>
                <td>15%</td>
                <td>{{ u.discountPercentage ?? 0 }}%</td>
                <td class="font-bold text-indigo">
                  {{ u.currentPrice ? ('ETB ' + (getEffectivePrice(u) | number)) : 'Not Set' }}
                </td>
                <td>
                  <button class="btn btn-secondary btn-xs" (click)="openPriceModal(u)">Update Price</button>
                </td>
              </tr>
              <tr *ngIf="units.length === 0">
                <td colspan="7" class="text-center py-6 text-secondary">
                  No units found. Set unit properties first.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination flex justify-between align-center mt-3" *ngIf="units.length > 0">
          <span class="pagination-info">Showing {{ units.length }} of {{ totalUnits }} units</span>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" [disabled]="filters.page <= 1" (click)="prevPage()">Prev</button>
            <button class="btn btn-secondary btn-sm" [disabled]="(filters.page * filters.limit) >= totalUnits" (click)="nextPage()">Next</button>
          </div>
        </div>
      </div>

    </div>

    <!-- Set Price Modal -->
    <div class="modal-overlay" *ngIf="showPriceModal" (click)="closePriceModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Update Unit Price Details</h2>
          <button class="header-icon-btn close-btn" (click)="closePriceModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitPrice($event)">
            <div class="form-group flex flex-col">
              <label>Unit Code</label>
              <input type="text" [value]="selectedUnit?.unitCode" disabled class="bg-main border" style="cursor: not-allowed;" />
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Base Price (ETB) <span class="text-danger" style="color: red;">*</span></label>
                <input type="number" [(ngModel)]="newPrice.basePrice" name="bPrice" required />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Price per m²</label>
                <input type="number" [(ngModel)]="newPrice.pricePerSqm" name="perSqm" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>VAT %</label>
                <input type="number" [(ngModel)]="newPrice.taxPercentage" name="vat" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Discount %</label>
                <input type="number" [(ngModel)]="newPrice.discountPercentage" name="discount" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Calculated Final Price</label>
                <input type="number" [(ngModel)]="newPrice.finalPrice" name="finalPrice" placeholder="Auto-calculated or manual" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Currency</label>
                <input type="text" [(ngModel)]="newPrice.currencyCode" name="currency" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Effective From <span class="text-danger" style="color: red;">*</span></label>
                <input type="date" [(ngModel)]="newPrice.effectiveFrom" name="effFrom" required />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Effective To</label>
                <input type="date" [(ngModel)]="newPrice.effectiveTo" name="effTo" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex align-center gap-2">
                <input type="checkbox" [(ngModel)]="newPrice.isNegotiable" name="negotiable" id="chkNegotiable" />
                <label for="chkNegotiable">Price is Negotiable</label>
              </div>
            </div>
            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="newPrice.remarks" name="priceRemarks" rows="2" placeholder="Pricing notes..."></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closePriceModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newPrice.basePrice">Save Valuation</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Promotion Modal -->
    <div class="modal-overlay" *ngIf="showPromotionModal" (click)="closePromotionModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Launch Sales Promotion</h2>
          <button class="header-icon-btn close-btn" (click)="closePromotionModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitPromotion($event)">
            <div class="form-group flex flex-col">
              <label>Campaign Name <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="newPromotion.promotionName" name="pName" required placeholder="e.g. Summer Special 2026" />
            </div>
            <div class="form-group flex flex-col">
              <label>Promotion Type</label>
              <select [(ngModel)]="newPromotion.promotionType" name="pType">
                <option value="">Select Type</option>
                <option value="Seasonal">Seasonal</option>
                <option value="Early Bird">Early Bird</option>
                <option value="Bulk Purchase">Bulk Purchase</option>
                <option value="Clearance">Clearance</option>
                <option value="Special Event">Special Event</option>
              </select>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Discount Percentage <span class="text-danger" style="color: red;">*</span></label>
                <input type="number" [(ngModel)]="newPromotion.discountPercentage" name="pPercent" required min="0" max="100" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Fixed Discount Amount (ETB)</label>
                <input type="number" [(ngModel)]="newPromotion.fixedDiscountAmount" name="pFixedAmt" placeholder="0" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Start Date <span class="text-danger" style="color: red;">*</span></label>
                <input type="date" [(ngModel)]="newPromotion.startDate" name="pStart" required />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>End Date <span class="text-danger" style="color: red;">*</span></label>
                <input type="date" [(ngModel)]="newPromotion.endDate" name="pEnd" required />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Applicable Property</label>
                <select [(ngModel)]="newPromotion.applicablePropertyId" name="pPropId">
                  <option [value]="0">All Properties</option>
                  <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Applicable Unit Type</label>
                <select [(ngModel)]="newPromotion.applicableUnitTypeId" name="pTypeId">
                  <option [value]="0">All Types</option>
                  <option *ngFor="let t of unitTypes" [value]="t.id">{{ t.typeName }}</option>
                </select>
              </div>
            </div>
            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="newPromotion.remarks" name="promoRemarks" rows="2" placeholder="Campaign notes..."></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closePromotionModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newPromotion.promotionName || !newPromotion.discountPercentage">Activate Campaign</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pricing-middle-row {
      display: grid;
      grid-template-columns: 1fr 2fr;
    }
    .mt-1 { margin-top: 4px; }
    .mt-3 { margin-top: 12px; }
    .flex-wrap { flex-wrap: wrap; }
  `]
})
export class PricingComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  units: any[] = [];
  totalUnits = 0;
  promotions: any[] = [];
  propertiesList: any[] = [];

  // Filter dropdown options
  filterBuildings: any[] = [];
  filterFloors: any[] = [];

  filters = {
    search: '',
    propertyId: 0,
    buildingId: 0,
    floorId: 0,
    page: 1,
    limit: 10
  };

  // Modal forms states
  showPriceModal = false;
  showPromotionModal = false;

  selectedUnit: any = null;
  newPrice = {
    basePrice: 0,
    pricePerSqm: 0,
    taxPercentage: 15,
    discountPercentage: 0,
    finalPrice: null as number | null,
    currencyCode: 'ETB',
    effectiveFrom: '',
    effectiveTo: '',
    isNegotiable: false,
    remarks: ''
  };

  newPromotion = {
    promotionName: '',
    promotionType: '',
    discountPercentage: 10,
    fixedDiscountAmount: null as number | null,
    startDate: '',
    endDate: '',
    applicablePropertyId: 0,
    applicableUnitTypeId: 0,
    isActive: true,
    remarks: ''
  };

  unitTypes: any[] = [];

  searchTimeout: any;

  ngOnInit() {
    this.loadProperties();
    this.loadPricingData();
    this.loadUnitTypes();
  }

  loadProperties() {
    this.propertiesService.getProperties().subscribe({
      next: (res) => {
        this.propertiesList = res.items ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading properties:', err)
    });
  }

  loadUnitTypes() {
    this.propertiesService.getUnitTypes().subscribe({
      next: (res) => {
        this.unitTypes = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading unit types:', err)
    });
  }

  loadPricingData() {
    const activeFilters: any = {};
    if (this.filters.search) activeFilters.search = this.filters.search;
    if (this.filters.propertyId) activeFilters.propertyId = +this.filters.propertyId;
    if (this.filters.buildingId) activeFilters.buildingId = +this.filters.buildingId;
    if (this.filters.floorId) activeFilters.floorId = +this.filters.floorId;
    activeFilters.page = this.filters.page;
    activeFilters.limit = this.filters.limit;

    this.propertiesService.getUnits(activeFilters).subscribe({
      next: (res) => {
        this.units = res.items ?? [];
        this.totalUnits = res.total ?? 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading units list:', err)
    });

    this.propertiesService.getActivePromotions().subscribe({
      next: (res) => {
        this.promotions = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading promotions:', err)
    });
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadPricingData();
    }, 400);
  }

  onPropertyFilterChange() {
    this.filters.buildingId = 0;
    this.filters.floorId = 0;
    this.filterBuildings = [];
    this.filterFloors = [];
    const prop = this.propertiesList.find((p) => +p.id === +this.filters.propertyId);
    if (prop) {
      this.filterBuildings = prop.buildings ?? [];
    }
    this.filters.page = 1;
    this.loadPricingData();
  }

  onBuildingFilterChange() {
    this.filters.floorId = 0;
    this.filterFloors = [];
    const bld = this.filterBuildings.find((b) => +b.id === +this.filters.buildingId);
    if (bld) {
      this.filterFloors = bld.floors ?? [];
    }
    this.filters.page = 1;
    this.loadPricingData();
  }

  prevPage() {
    if (this.filters.page > 1) {
      this.filters.page--;
      this.loadPricingData();
    }
  }

  nextPage() {
    if ((this.filters.page * this.filters.limit) < this.totalUnits) {
      this.filters.page++;
      this.loadPricingData();
    }
  }

  getEffectivePrice(unit: any): number {
    const base = unit.currentPrice ?? 0;
    const discount = unit.discountPercentage ?? 0;
    return base - (base * (discount / 100));
  }

  openPriceModal(unit: any) {
    this.selectedUnit = unit;
    this.newPrice = {
      basePrice: unit.currentPrice ?? 0,
      pricePerSqm: 0,
      taxPercentage: 15,
      discountPercentage: unit.discountPercentage ?? 0,
      finalPrice: null,
      currencyCode: unit.currencyCode || 'ETB',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isNegotiable: false,
      remarks: ''
    };
    this.showPriceModal = true;
    this.cdr.detectChanges();
  }
  closePriceModal() { 
    this.showPriceModal = false; 
    this.cdr.detectChanges();
  }
  onSubmitPrice(event: Event) {
    event.preventDefault();
    if (!this.selectedUnit) return;

    this.propertiesService.createUnitPrice({
      unitId: this.selectedUnit.id,
      basePrice: +this.newPrice.basePrice,
      pricePerSqm: +this.newPrice.pricePerSqm || undefined,
      taxPercentage: +this.newPrice.taxPercentage || 15,
      discountPercentage: +this.newPrice.discountPercentage || 0,
      finalPrice: this.newPrice.finalPrice ? +this.newPrice.finalPrice : undefined,
      currencyCode: this.newPrice.currencyCode || 'ETB',
      effectiveFrom: this.newPrice.effectiveFrom ? new Date(this.newPrice.effectiveFrom) : new Date(),
      effectiveTo: this.newPrice.effectiveTo ? new Date(this.newPrice.effectiveTo) : undefined,
      isNegotiable: this.newPrice.isNegotiable,
      isActive: true,
      remarks: this.newPrice.remarks || undefined
    }).subscribe({
      next: () => {
        this.closePriceModal();
        this.loadPricingData();
      },
      error: (err) => console.error('Error setting pricing:', err)
    });
  }

  openPromotionModal() {
    const today = new Date().toISOString().split('T')[0];
    this.newPromotion = {
      promotionName: '',
      promotionType: '',
      discountPercentage: 10,
      fixedDiscountAmount: null,
      startDate: today,
      endDate: today,
      applicablePropertyId: 0,
      applicableUnitTypeId: 0,
      isActive: true,
      remarks: ''
    };
    this.showPromotionModal = true;
    this.cdr.detectChanges();
  }
  closePromotionModal() { 
    this.showPromotionModal = false; 
    this.cdr.detectChanges();
  }
  onSubmitPromotion(event: Event) {
    event.preventDefault();
    const payload: any = {
      promotionName: this.newPromotion.promotionName,
      promotionType: this.newPromotion.promotionType || undefined,
      discountPercentage: +this.newPromotion.discountPercentage,
      fixedDiscountAmount: this.newPromotion.fixedDiscountAmount ? +this.newPromotion.fixedDiscountAmount : undefined,
      startDate: new Date(this.newPromotion.startDate),
      endDate: new Date(this.newPromotion.endDate),
      isActive: this.newPromotion.isActive,
      remarks: this.newPromotion.remarks || undefined
    };
    if (+this.newPromotion.applicablePropertyId) {
      payload.applicablePropertyId = +this.newPromotion.applicablePropertyId;
    }
    if (+this.newPromotion.applicableUnitTypeId) {
      payload.applicableUnitTypeId = +this.newPromotion.applicableUnitTypeId;
    }

    this.propertiesService.createPromotion(payload).subscribe({
      next: () => {
        this.closePromotionModal();
        this.loadPricingData();
      },
      error: (err) => console.error('Error launching promotion:', err)
    });
  }
}
