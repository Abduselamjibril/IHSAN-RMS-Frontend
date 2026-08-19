import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';
import { customConfirm } from '../../../utils/confirm';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Pricing & Promotions</h1>
        <p>Valuation guidelines, unit pricing history, negotiable terms, and price change approval workflows</p>
      </div>
      <div class="app-header-actions" *ngIf="activeTab === 'promotions'">
        <button class="btn btn-primary" (click)="openPromotionModal()">
          <span class="material-icons-outlined">tag</span>
          Launch Promotion
        </button>
      </div>
    </header>

    <!-- Main Tabs Header -->
    <div class="flex gap-4" style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'pricing'" 
        (click)="activeTab = 'pricing'"
        style="padding: 10px 16px; font-weight: 600; font-size: 15px; border-bottom: 2px solid transparent; cursor: pointer; background: none; border: none; outline: none; transition: all 0.2s;"
        [style.border-bottom-color]="activeTab === 'pricing' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'pricing' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Base Pricing & Inventory
      </button>

      <button 
        class="tab-btn flex align-center gap-2" 
        [class.active]="activeTab === 'approvals'" 
        (click)="activeTab = 'approvals'; loadApprovalRequests()"
        style="padding: 10px 16px; font-weight: 600; font-size: 15px; border-bottom: 2px solid transparent; cursor: pointer; background: none; border: none; outline: none; transition: all 0.2s;"
        [style.border-bottom-color]="activeTab === 'approvals' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'approvals' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        <span>Price Approvals Queue</span>
        <span class="badge badge-warning" *ngIf="pendingApprovalsCount > 0" style="font-size: 11px; padding: 2px 6px;">{{ pendingApprovalsCount }}</span>
      </button>

      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'promotions'" 
        (click)="activeTab = 'promotions'"
        style="padding: 10px 16px; font-weight: 600; font-size: 15px; border-bottom: 2px solid transparent; cursor: pointer; background: none; border: none; outline: none; transition: all 0.2s;"
        [style.border-bottom-color]="activeTab === 'promotions' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'promotions' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Sales Promotions & Campaigns
      </button>
    </div>

    <!-- TAB 1: Base Pricing -->
    <div *ngIf="activeTab === 'pricing'">
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

      <!-- Pricing ledger list (Full width) -->
      <div class="card">
        <h3>Inventory Base Pricing</h3>
        <div class="table-container mt-3">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Unit Code</th>
                <th>Type</th>
                <th>Base Value</th>
                <th>Terms</th>
                <th>Taxes (VAT)</th>
                <th>Discount</th>
                <th>Effective Price</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of units">
                <td class="font-mono font-bold">{{ u.unitCode }}</td>
                <td>{{ u.unitType?.typeName }}</td>
                <td class="font-bold">{{ u.currentPrice ? ('ETB ' + (u.currentPrice | number)) : 'Not Set' }}</td>
                <td>
                  <span class="badge" [class.badge-new]="u.isNegotiable" [class.badge-low]="!u.isNegotiable" style="font-size: 11px;">
                    {{ u.isNegotiable ? 'Negotiable' : 'Fixed Price' }}
                  </span>
                </td>
                <td>15%</td>
                <td>{{ u.discountPercentage ?? 0 }}%</td>
                <td class="font-bold text-indigo">
                  {{ u.currentPrice ? ('ETB ' + (getEffectivePrice(u) | number)) : 'Not Set' }}
                </td>
                <td>
                  <div class="flex gap-2 justify-end align-center">
                    <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openPriceHistoryModal(u)" title="View Price Revision History">
                      <span class="material-icons-outlined font-xs">history</span> History
                    </button>
                    <button class="btn btn-primary btn-xs flex align-center gap-1" (click)="openPriceModal(u)">
                      <span class="material-icons-outlined font-xs">edit</span> Update Price
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="units.length === 0">
                <td colspan="8" class="text-center py-6 text-secondary">
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

    <!-- TAB 2: Price Approvals Queue (TC-3.37) -->
    <div *ngIf="activeTab === 'approvals'">
      <div class="card p-4 mb-4 flex justify-between align-center flex-wrap gap-3">
        <div class="flex gap-2">
          <button 
            class="btn btn-sm" 
            [class.btn-primary]="approvalStatusFilter === ''" 
            [class.btn-secondary]="approvalStatusFilter !== ''"
            (click)="setApprovalFilter('')"
          >
            All Requests ({{ approvalRequests.length }})
          </button>
          <button 
            class="btn btn-sm" 
            [class.btn-primary]="approvalStatusFilter === 'PENDING'" 
            [class.btn-secondary]="approvalStatusFilter !== 'PENDING'"
            (click)="setApprovalFilter('PENDING')"
          >
            Pending Review ({{ pendingApprovalsCount }})
          </button>
          <button 
            class="btn btn-sm" 
            [class.btn-primary]="approvalStatusFilter === 'APPROVED'" 
            [class.btn-secondary]="approvalStatusFilter !== 'APPROVED'"
            (click)="setApprovalFilter('APPROVED')"
          >
            Approved
          </button>
          <button 
            class="btn btn-sm" 
            [class.btn-primary]="approvalStatusFilter === 'REJECTED'" 
            [class.btn-secondary]="approvalStatusFilter !== 'REJECTED'"
            (click)="setApprovalFilter('REJECTED')"
          >
            Rejected
          </button>
        </div>

        <button class="btn btn-secondary btn-sm flex align-center gap-1" (click)="loadApprovalRequests()">
          <span class="material-icons-outlined font-sm">refresh</span> Refresh Queue
        </button>
      </div>

      <div class="card">
        <h3>Price Change Approval Requests</h3>
        <div class="table-container mt-3">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Req #</th>
                <th>Unit Code</th>
                <th>Property / Tower</th>
                <th>Current Listed Price</th>
                <th>Proposed Price</th>
                <th>Proposed Terms</th>
                <th>Requester</th>
                <th>Reason</th>
                <th>Status</th>
                <th style="text-align: right;">Decision</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let req of filteredApprovalRequests">
                <td class="font-mono">#{{ req.id }}</td>
                <td class="font-mono font-bold">{{ req.unit?.unitCode }}</td>
                <td>
                  <div class="flex flex-col">
                    <span class="font-bold">{{ req.unit?.property?.propertyName }}</span>
                    <span class="text-secondary font-xs">{{ req.unit?.building?.buildingName }}</span>
                  </div>
                </td>
                <td class="text-secondary">{{ req.currentPrice ? ('ETB ' + (req.currentPrice | number)) : 'Not Priced' }}</td>
                <td class="font-bold text-main">ETB {{ req.proposedPrice | number }}</td>
                <td>
                  <span class="badge" [class.badge-new]="req.isNegotiable" [class.badge-low]="!req.isNegotiable" style="font-size: 10px;">
                    {{ req.isNegotiable ? 'Negotiable' : 'Fixed' }}
                  </span>
                </td>
                <td>
                  <div class="flex flex-col">
                    <strong>{{ req.requestedByName || 'Sales Executive' }}</strong>
                    <span class="text-secondary font-xs">{{ req.requestedAt | date:'short' }}</span>
                  </div>
                </td>
                <td class="text-secondary" style="max-width: 200px;">{{ req.reason }}</td>
                <td>
                  <span class="badge" [class.badge-warning]="req.status === 'PENDING'" [class.badge-qualified]="req.status === 'APPROVED'" [class.badge-lost]="req.status === 'REJECTED'">
                    {{ req.status }}
                  </span>
                  <div class="text-secondary font-xs mt-1" *ngIf="req.reviewedByName">
                    By {{ req.reviewedByName }} ({{ req.reviewedAt | date:'shortDate' }})
                  </div>
                  <div class="text-secondary font-xs italic" *ngIf="req.reviewComment">
                    "{{ req.reviewComment }}"
                  </div>
                </td>
                <td>
                  <div class="flex gap-2 justify-end" *ngIf="req.status === 'PENDING'">
                    <button class="btn btn-primary btn-xs flex align-center gap-1" (click)="openDecisionModal(req, 'APPROVE')">
                      <span class="material-icons-outlined font-xs">check</span> Approve
                    </button>
                    <button class="btn btn-danger btn-xs flex align-center gap-1" (click)="openDecisionModal(req, 'REJECT')" style="background: rgba(239, 68, 68, 0.1); color: var(--color-lost); border: none;">
                      <span class="material-icons-outlined font-xs">close</span> Reject
                    </button>
                  </div>
                  <span *ngIf="req.status !== 'PENDING'" class="text-secondary font-xs italic flex justify-end">Processed</span>
                </td>
              </tr>
              <tr *ngIf="filteredApprovalRequests.length === 0">
                <td colspan="10" class="text-center py-6 text-secondary">
                  No price change approval requests found for this filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: Promotions & Campaigns -->
    <div *ngIf="activeTab === 'promotions'">
      <!-- Sub-tabs header -->
      <div class="flex justify-between align-center" style="margin-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 6px;">
        <div class="flex gap-3">
          <button 
            class="tab-btn" 
            [class.active]="activePromoTab === 'active'" 
            (click)="activePromoTab = 'active'"
            style="padding: 8px 12px; font-weight: 500; font-size: 14px; border-bottom: 2px solid transparent; cursor: pointer; background: none; border: none;"
            [style.border-bottom-color]="activePromoTab === 'active' ? 'var(--brand-primary)' : 'transparent'"
            [style.color]="activePromoTab === 'active' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
          >
            Active Campaigns ({{ activePromotions.length }})
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activePromoTab === 'history'" 
            (click)="activePromoTab = 'history'"
            style="padding: 8px 12px; font-weight: 500; font-size: 14px; border-bottom: 2px solid transparent; cursor: pointer; background: none; border: none;"
            [style.border-bottom-color]="activePromoTab === 'history' ? 'var(--brand-primary)' : 'transparent'"
            [style.color]="activePromoTab === 'history' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
          >
            Campaign History ({{ historyPromotions.length }})
          </button>
        </div>
      </div>

      <!-- Active Campaigns Table -->
      <div *ngIf="activePromoTab === 'active'" class="card">
        <div class="table-container mt-3">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Validity</th>
                <th>Scope</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let promo of activePromotions">
                <td class="font-bold">{{ promo.promotionName }}</td>
                <td><span class="badge badge-primary">{{ promo.promotionType || 'Standard' }}</span></td>
                <td class="font-bold text-indigo">
                  <span *ngIf="promo.discountPercentage">{{ promo.discountPercentage }}%</span>
                  <span *ngIf="promo.fixedDiscountAmount">ETB {{ promo.fixedDiscountAmount | number }}</span>
                </td>
                <td>
                  <span *ngIf="promo.startDate || promo.endDate">
                    {{ promo.startDate | date:'shortDate' }} — {{ promo.endDate | date:'shortDate' }}
                  </span>
                  <span *ngIf="!promo.startDate && !promo.endDate" class="text-secondary italic">Indefinite</span>
                </td>
                <td>
                  <div class="flex flex-col">
                    <span>{{ promo.applicableProperty?.propertyName || 'All Properties' }}</span>
                    <span class="text-secondary font-xs">{{ promo.applicableUnitType?.typeName || 'All Types' }}</span>
                  </div>
                </td>
                <td class="text-secondary font-xs" style="max-width: 150px;">{{ promo.remarks || '-' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-secondary btn-xs" (click)="openEditPromoModal(promo)">Edit</button>
                    <button class="btn btn-secondary btn-xs text-danger" (click)="deactivatePromo(promo.id)" style="color: red;">Deactivate</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="activePromotions.length === 0">
                <td colspan="7" class="text-center py-6 text-secondary">
                  No active campaigns at the moment. Click "Launch Promotion" to start one.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Campaign History Table -->
      <div *ngIf="activePromoTab === 'history'" class="card">
        <div class="table-container mt-3">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Type</th>
                <th>Discount Applied</th>
                <th>Validity Period</th>
                <th>Scope</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let promo of historyPromotions">
                <td class="font-bold">{{ promo.promotionName }}</td>
                <td><span class="badge badge-secondary">{{ promo.promotionType || 'Standard' }}</span></td>
                <td>
                  <span *ngIf="promo.discountPercentage">{{ promo.discountPercentage }}%</span>
                  <span *ngIf="promo.fixedDiscountAmount">ETB {{ promo.fixedDiscountAmount | number }}</span>
                </td>
                <td>
                  {{ promo.startDate | date:'shortDate' }} — {{ promo.endDate | date:'shortDate' }}
                </td>
                <td>
                  {{ promo.applicableProperty?.propertyName || 'All Properties' }}
                </td>
                <td>
                  <span class="badge badge-danger" *ngIf="!promo.isActive">Deactivated</span>
                  <span class="badge badge-secondary" *ngIf="promo.isActive">Expired</span>
                </td>
              </tr>
              <tr *ngIf="historyPromotions.length === 0">
                <td colspan="6" class="text-center py-6 text-secondary">
                  No campaign history available.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Update Price Modal (Direct update or Submit Approval Request) -->
    <div class="modal-overlay" *ngIf="showPriceModal" (click)="closePriceModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 600px;">
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
                <input type="number" [(ngModel)]="newPrice.basePrice" name="bPrice" required (ngModelChange)="recalcFinalPrice()" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Price per m²</label>
                <input type="number" [(ngModel)]="newPrice.pricePerSqm" name="perSqm" />
              </div>
            </div>

            <div class="form-group flex align-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="newPrice.isNegotiable" name="pNegotiable" id="pNeg" />
              <label for="pNeg" class="text-indigo font-bold cursor-pointer font-sm">Negotiable Price Option (TC-3.36)</label>
            </div>

            <div class="form-row flex gap-3 mt-2">
              <div class="form-group flex-1 flex flex-col">
                <label>VAT %</label>
                <input type="number" [(ngModel)]="newPrice.taxPercentage" name="vat" (ngModelChange)="recalcFinalPrice()" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Discount %</label>
                <input type="number" [(ngModel)]="newPrice.discountPercentage" name="discount" (ngModelChange)="recalcFinalPrice()" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Calculated Final Price</label>
                <input type="number" [(ngModel)]="newPrice.finalPrice" name="finalPrice" placeholder="Auto-calculated or manual" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Currency</label>
                <select [(ngModel)]="newPrice.currencyCode" name="currency">
                  <option value="ETB">ETB (Ethiopian Birr)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>

            <div class="form-group flex flex-col mt-2">
              <label>Reason for Price Revision (Recorded in Price History)</label>
              <input type="text" [(ngModel)]="newPrice.remarks" name="priceRemarks" placeholder="e.g. Annual market valuation update" />
            </div>

            <div class="modal-footer flex justify-between gap-3 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closePriceModal()">Cancel</button>
              <div class="flex gap-2">
                <button type="button" class="btn btn-secondary flex align-center gap-1" (click)="submitAsPriceApprovalRequest()" title="Submit for Manager Review instead of direct overwrite">
                  <span class="material-icons-outlined font-sm text-indigo">send</span> Submit for Approval
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="!newPrice.basePrice">Save Valuation</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Unit Price History Modal (TC-3.33) -->
    <div class="modal-overlay" *ngIf="showHistoryModal" (click)="closePriceHistoryModal()" style="backdrop-filter: blur(6px); background: rgba(15, 23, 42, 0.75);">
      <div class="modal-container" style="max-width: 800px; width: 90vw;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">history</span>
            <h2>Price Revision History: {{ selectedHistoryUnit?.unitCode }}</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closePriceHistoryModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <div class="table-container" *ngIf="unitHistoryList.length > 0">
            <table class="leads-table">
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>Previous Price</th>
                  <th>New Price</th>
                  <th>Terms</th>
                  <th>Changed By</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of unitHistoryList">
                  <td>{{ h.changedAt | date:'medium' }}</td>
                  <td class="text-secondary">{{ h.oldPrice ? ('ETB ' + (h.oldPrice | number)) : 'Not Priced' }}</td>
                  <td class="font-bold text-main">ETB {{ h.newPrice | number }}</td>
                  <td>
                    <span class="badge" [class.badge-new]="h.isNegotiable" [class.badge-low]="!h.isNegotiable" style="font-size: 10px;">
                      {{ h.isNegotiable ? 'Negotiable' : 'Fixed' }}
                    </span>
                  </td>
                  <td><strong>{{ h.changedByName || 'System Administrator' }}</strong></td>
                  <td class="text-secondary" style="font-style: italic;">{{ h.changeReason || 'Direct update' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="unitHistoryList.length === 0" class="text-center py-6 text-secondary italic">
            No price history recorded for this unit yet.
          </div>
        </div>
        <div class="modal-footer flex justify-end" style="border-top: 1px solid var(--border-color); padding: 12px 20px;">
          <button type="button" class="btn btn-secondary btn-sm" (click)="closePriceHistoryModal()">Close</button>
        </div>
      </div>
    </div>

    <!-- Manager Decision Modal (Approve / Reject) -->
    <div class="modal-overlay" *ngIf="showDecisionModal" (click)="closeDecisionModal()">
      <div class="modal-container" style="max-width: 480px; width: 90vw;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2 [class.text-green]="decisionType === 'APPROVE'" [class.text-danger]="decisionType === 'REJECT'">
            {{ decisionType === 'APPROVE' ? 'Approve Price Change' : 'Reject Price Change' }}
          </h2>
          <button class="header-icon-btn close-btn" (click)="closeDecisionModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <p class="font-sm text-secondary mb-3">
            Request #{{ activeDecisionRequest?.id }} for Unit <strong>{{ activeDecisionRequest?.unit?.unitCode }}</strong>
            (Proposed Price: <strong>ETB {{ activeDecisionRequest?.proposedPrice | number }}</strong>)
          </p>
          <div class="form-group flex flex-col">
            <label class="font-xs font-bold text-secondary">Reviewer Comment / Remarks</label>
            <textarea [(ngModel)]="decisionComment" rows="3" placeholder="Enter review remarks..." style="padding: 8px;"></textarea>
          </div>
        </div>
        <div class="modal-footer flex justify-end gap-3" style="border-top: 1px solid var(--border-color); padding: 12px 20px;">
          <button type="button" class="btn btn-secondary" (click)="closeDecisionModal()">Cancel</button>
          <button 
            type="button" 
            class="btn" 
            [class.btn-primary]="decisionType === 'APPROVE'" 
            [class.btn-danger]="decisionType === 'REJECT'"
            (click)="submitDecision()"
          >
            Confirm {{ decisionType === 'APPROVE' ? 'Approval' : 'Rejection' }}
          </button>
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
                <label>Start Date</label>
                <input type="date" [(ngModel)]="newPromotion.startDate" name="pStart" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>End Date</label>
                <input type="date" [(ngModel)]="newPromotion.endDate" name="pEnd" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Scope to Property (Optional)</label>
                <select [(ngModel)]="newPromotion.applicablePropertyId" name="pProp">
                  <option [value]="0">All Properties</option>
                  <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Scope to Unit Type (Optional)</label>
                <select [(ngModel)]="newPromotion.applicableUnitTypeId" name="pTypeOpt">
                  <option [value]="0">All Unit Types</option>
                  <option *ngFor="let t of unitTypes" [value]="t.id">{{ t.typeName }}</option>
                </select>
              </div>
            </div>
            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="newPromotion.remarks" name="pRemarks" rows="2" placeholder="Campaign details..."></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closePromotionModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newPromotion.promotionName || !newPromotion.discountPercentage">Launch Promotion</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Promotion Modal -->
    <div class="modal-overlay" *ngIf="showEditPromotionModal" (click)="closeEditPromoModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Edit Sales Promotion</h2>
          <button class="header-icon-btn close-btn" (click)="closeEditPromoModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitEditPromotion($event)" *ngIf="editPromotion">
            <div class="form-group flex flex-col">
              <label>Campaign Name <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="editPromotion.promotionName" name="epName" required />
            </div>
            <div class="form-group flex flex-col">
              <label>Promotion Type</label>
              <select [(ngModel)]="editPromotion.promotionType" name="epType">
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
                <input type="number" [(ngModel)]="editPromotion.discountPercentage" name="epPercent" required min="0" max="100" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Fixed Discount Amount (ETB)</label>
                <input type="number" [(ngModel)]="editPromotion.fixedDiscountAmount" name="epFixedAmt" placeholder="0" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Start Date</label>
                <input type="date" [(ngModel)]="editPromotion.startDate" name="epStart" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>End Date</label>
                <input type="date" [(ngModel)]="editPromotion.endDate" name="epEnd" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Scope to Property (Optional)</label>
                <select [(ngModel)]="editPromotion.applicablePropertyId" name="epProp">
                  <option [value]="0">All Properties</option>
                  <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Scope to Unit Type (Optional)</label>
                <select [(ngModel)]="editPromotion.applicableUnitTypeId" name="epTypeOpt">
                  <option [value]="0">All Unit Types</option>
                  <option *ngFor="let t of unitTypes" [value]="t.id">{{ t.typeName }}</option>
                </select>
              </div>
            </div>
            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="editPromotion.remarks" name="epRemarks" rows="2"></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeEditPromoModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editPromotion.promotionName || !editPromotion.discountPercentage">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-green { color: #10b981; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .flex-wrap { flex-wrap: wrap; }
  `]
})
export class PricingComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'pricing' | 'approvals' | 'promotions' = 'pricing';
  activePromoTab: 'active' | 'history' = 'active';

  units: any[] = [];
  totalUnits = 0;
  promotions: any[] = [];
  propertiesList: any[] = [];

  // Approvals queue
  approvalRequests: any[] = [];
  approvalStatusFilter = '';
  pendingApprovalsCount = 0;

  // History modal
  showHistoryModal = false;
  selectedHistoryUnit: any = null;
  unitHistoryList: any[] = [];

  // Decision modal
  showDecisionModal = false;
  activeDecisionRequest: any = null;
  decisionType: 'APPROVE' | 'REJECT' = 'APPROVE';
  decisionComment = '';

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
  showEditPromotionModal = false;

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

  editPromotion: any = null;
  unitTypes: any[] = [];
  searchTimeout: any;

  ngOnInit() {
    this.loadProperties();
    this.loadPricingData();
    this.loadUnitTypes();
    this.loadApprovalRequests();
    this.loadPromotions();
  }

  get filteredApprovalRequests(): any[] {
    if (!this.approvalStatusFilter) return this.approvalRequests;
    return this.approvalRequests.filter(r => r.status === this.approvalStatusFilter);
  }

  get activePromotions(): any[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    return this.promotions.filter(p => p.isActive && (!p.endDate || new Date(p.endDate) >= today));
  }

  get historyPromotions(): any[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    return this.promotions.filter(p => !p.isActive || (p.endDate && new Date(p.endDate) < today));
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
      error: (err) => console.error('Error loading pricing units:', err)
    });
  }

  loadApprovalRequests() {
    this.propertiesService.getPriceChangeRequests().subscribe({
      next: (res) => {
        this.approvalRequests = res ?? [];
        this.pendingApprovalsCount = this.approvalRequests.filter(r => r.status === 'PENDING').length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading approval requests:', err)
    });
  }

  loadPromotions() {
    this.propertiesService.getPromotions().subscribe({
      next: (res) => {
        this.promotions = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading promotions:', err)
    });
  }

  setApprovalFilter(status: string) {
    this.approvalStatusFilter = status;
    this.cdr.detectChanges();
  }

  openPriceHistoryModal(unit: any) {
    this.selectedHistoryUnit = unit;
    this.unitHistoryList = [];
    this.showHistoryModal = true;
    this.propertiesService.getUnitPriceHistory(unit.id).subscribe({
      next: (res) => {
        this.unitHistoryList = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading unit price history:', err)
    });
  }

  closePriceHistoryModal() {
    this.showHistoryModal = false;
    this.selectedHistoryUnit = null;
    this.unitHistoryList = [];
    this.cdr.detectChanges();
  }

  openDecisionModal(req: any, type: 'APPROVE' | 'REJECT') {
    this.activeDecisionRequest = req;
    this.decisionType = type;
    this.decisionComment = '';
    this.showDecisionModal = true;
    this.cdr.detectChanges();
  }

  closeDecisionModal() {
    this.showDecisionModal = false;
    this.activeDecisionRequest = null;
    this.decisionComment = '';
    this.cdr.detectChanges();
  }

  submitDecision() {
    if (!this.activeDecisionRequest) return;
    const id = this.activeDecisionRequest.id;

    if (this.decisionType === 'APPROVE') {
      this.propertiesService.approvePriceChangeRequest(id, this.decisionComment).subscribe({
        next: () => {
          this.closeDecisionModal();
          this.loadApprovalRequests();
          this.loadPricingData();
        },
        error: (err) => console.error('Error approving request:', err)
      });
    } else {
      this.propertiesService.rejectPriceChangeRequest(id, this.decisionComment).subscribe({
        next: () => {
          this.closeDecisionModal();
          this.loadApprovalRequests();
        },
        error: (err) => console.error('Error rejecting request:', err)
      });
    }
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
    this.filters.page = 1;
    this.filterBuildings = [];
    this.filterFloors = [];

    const prop = this.propertiesList.find((p) => +p.id === +this.filters.propertyId);
    if (prop) {
      this.filterBuildings = prop.buildings ?? [];
    }
    this.loadPricingData();
  }

  onBuildingFilterChange() {
    this.filters.floorId = 0;
    this.filters.page = 1;
    this.filterFloors = [];

    const bld = this.filterBuildings.find((b) => +b.id === +this.filters.buildingId);
    if (bld) {
      this.filterFloors = bld.floors ?? [];
    }
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
    const base = Number(unit.currentPrice || 0);
    const vat = 0.15;
    const discount = (unit.discountPercentage || 0) / 100;
    return base * (1 - discount) * (1 + vat);
  }

  openPriceModal(unit: any) {
    this.selectedUnit = unit;
    const base = unit.currentPrice ? Number(unit.currentPrice) : 0;
    const area = unit.grossArea || unit.areaSuperBuiltup || 1;
    this.newPrice = {
      basePrice: base,
      pricePerSqm: base > 0 ? Math.round(base / area) : 0,
      taxPercentage: 15,
      discountPercentage: 0,
      finalPrice: base > 0 ? Math.round(base * 1.15) : 0,
      currencyCode: unit.currencyCode || 'ETB',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isNegotiable: !!unit.isNegotiable,
      remarks: ''
    };
    this.showPriceModal = true;
    this.cdr.detectChanges();
  }

  closePriceModal() {
    this.showPriceModal = false;
    this.selectedUnit = null;
    this.cdr.detectChanges();
  }

  recalcFinalPrice() {
    const base = Number(this.newPrice.basePrice || 0);
    const discount = Number(this.newPrice.discountPercentage || 0) / 100;
    const vat = Number(this.newPrice.taxPercentage || 0) / 100;
    this.newPrice.finalPrice = Math.round(base * (1 - discount) * (1 + vat));
  }

  onSubmitPrice(event: Event) {
    event.preventDefault();
    if (!this.selectedUnit || !this.newPrice.basePrice) return;

    const payload = {
      unitId: this.selectedUnit.id,
      basePrice: Number(this.newPrice.basePrice),
      pricePerSqm: this.newPrice.pricePerSqm ? Number(this.newPrice.pricePerSqm) : undefined,
      taxPercentage: Number(this.newPrice.taxPercentage || 0),
      discountPercentage: Number(this.newPrice.discountPercentage || 0),
      currencyCode: this.newPrice.currencyCode,
      effectiveFrom: this.newPrice.effectiveFrom || new Date(),
      isNegotiable: !!this.newPrice.isNegotiable,
      remarks: this.newPrice.remarks || 'Valuation update'
    };

    this.propertiesService.createUnitPrice(payload).subscribe({
      next: () => {
        this.closePriceModal();
        this.loadPricingData();
      },
      error: (err) => console.error('Error setting pricing:', err)
    });
  }

  submitAsPriceApprovalRequest() {
    if (!this.selectedUnit || !this.newPrice.basePrice) return;

    const payload = {
      unitId: this.selectedUnit.id,
      proposedPrice: Number(this.newPrice.basePrice),
      isNegotiable: !!this.newPrice.isNegotiable,
      currencyCode: this.newPrice.currencyCode || 'ETB',
      reason: this.newPrice.remarks || 'Price adjustment submitted from pricing dashboard'
    };

    this.propertiesService.createPriceChangeRequest(payload).subscribe({
      next: () => {
        this.closePriceModal();
        this.loadApprovalRequests();
        alert('Price change request submitted successfully to the Approvals Queue!');
      },
      error: (err) => console.error('Error submitting price approval request:', err)
    });
  }

  openPromotionModal() {
    this.newPromotion = {
      promotionName: '',
      promotionType: '',
      discountPercentage: 10,
      fixedDiscountAmount: null,
      startDate: '',
      endDate: '',
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
    if (!this.newPromotion.promotionName || !this.newPromotion.discountPercentage) return;

    const payload: any = {
      promotionName: this.newPromotion.promotionName,
      promotionType: this.newPromotion.promotionType || undefined,
      discountPercentage: Number(this.newPromotion.discountPercentage),
      fixedDiscountAmount: this.newPromotion.fixedDiscountAmount ? Number(this.newPromotion.fixedDiscountAmount) : undefined,
      startDate: this.newPromotion.startDate || undefined,
      endDate: this.newPromotion.endDate || undefined,
      applicablePropertyId: +this.newPromotion.applicablePropertyId > 0 ? +this.newPromotion.applicablePropertyId : undefined,
      applicableUnitTypeId: +this.newPromotion.applicableUnitTypeId > 0 ? +this.newPromotion.applicableUnitTypeId : undefined,
      remarks: this.newPromotion.remarks || undefined
    };

    this.propertiesService.createPromotion(payload).subscribe({
      next: () => {
        this.closePromotionModal();
        this.loadPromotions();
      },
      error: (err) => console.error('Error creating promotion:', err)
    });
  }

  openEditPromoModal(promo: any) {
    this.editPromotion = {
      id: promo.id,
      promotionName: promo.promotionName,
      promotionType: promo.promotionType || '',
      discountPercentage: promo.discountPercentage || 0,
      fixedDiscountAmount: promo.fixedDiscountAmount || null,
      startDate: promo.startDate ? promo.startDate.split('T')[0] : '',
      endDate: promo.endDate ? promo.endDate.split('T')[0] : '',
      applicablePropertyId: promo.applicableProperty ? promo.applicableProperty.id : 0,
      applicableUnitTypeId: promo.applicableUnitType ? promo.applicableUnitType.id : 0,
      remarks: promo.remarks || ''
    };
    this.showEditPromotionModal = true;
    this.cdr.detectChanges();
  }

  closeEditPromoModal() {
    this.showEditPromotionModal = false;
    this.editPromotion = null;
    this.cdr.detectChanges();
  }

  onSubmitEditPromotion(event: Event) {
    event.preventDefault();
    if (!this.editPromotion) return;

    const payload: any = {
      promotionName: this.editPromotion.promotionName,
      promotionType: this.editPromotion.promotionType || undefined,
      discountPercentage: Number(this.editPromotion.discountPercentage),
      fixedDiscountAmount: this.editPromotion.fixedDiscountAmount ? Number(this.editPromotion.fixedDiscountAmount) : undefined,
      startDate: this.editPromotion.startDate || undefined,
      endDate: this.editPromotion.endDate || undefined,
      applicablePropertyId: +this.editPromotion.applicablePropertyId > 0 ? +this.editPromotion.applicablePropertyId : undefined,
      applicableUnitTypeId: +this.editPromotion.applicableUnitTypeId > 0 ? +this.editPromotion.applicableUnitTypeId : undefined,
      remarks: this.editPromotion.remarks || undefined
    };

    this.propertiesService.updatePromotion(this.editPromotion.id, payload).subscribe({
      next: () => {
        this.closeEditPromoModal();
        this.loadPromotions();
      },
      error: (err) => console.error('Error updating promotion:', err)
    });
  }

  deactivatePromo(id: number) {
    customConfirm('Are you sure you want to deactivate this sales campaign? It will immediately stop applying to new deals.', 'Deactivate Campaign').then((confirmed) => {
      if (confirmed) {
        this.propertiesService.deactivatePromotion(id).subscribe({
          next: () => {
            this.loadPromotions();
          },
          error: (err) => console.error('Error deactivating promotion:', err)
        });
      }
    });
  }
}
