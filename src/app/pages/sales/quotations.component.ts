import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { PropertiesService } from '../../services/properties.service';
import { FinanceService } from '../../services/finance.service';
import { environment } from '../../config';

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
    <div class="alert alert-success" *ngIf="successMessage" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 20px; border-radius: 6px; background-color: #10b981; border: 1px solid #10b981; color: white; font-size: 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease-out;">
      <span class="material-icons-outlined" style="font-size: 20px; color: white;">check_circle</span>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <div class="alert alert-danger" *ngIf="errorMessage" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 20px; border-radius: 6px; background-color: #ef4444; border: 1px solid #ef4444; color: white; font-size: 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease-out;">
      <span class="material-icons-outlined" style="font-size: 20px; color: white;">error_outline</span>
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
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="openPdfModal(q)"
                    title="Generate PDF / Print Preview"
                  >
                    <span class="material-icons-outlined font-xs">picture_as_pdf</span>
                    <span>PDF</span>
                  </button>
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="openEmailModal(q)"
                    title="Email Quotation to Client"
                  >
                    <span class="material-icons-outlined font-xs">email</span>
                    <span>Email</span>
                  </button>
                  <button 
                    *ngIf="q.status === 'DRAFT' || q.status === 'SENT'"
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="openDiscountRequestModal(q)"
                    title="Request Special Discount"
                  >
                    <span class="material-icons-outlined font-xs">discount</span>
                    <span>Discount</span>
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
                <div class="flex gap-2 align-center">
                  <button 
                    *ngIf="dr.status === 'PENDING'"
                    class="btn btn-primary btn-sm flex align-center gap-1"
                    (click)="openReviewDiscountModal(dr, 'APPROVE')"
                  >
                    <span class="material-icons-outlined font-sm">check</span>
                    <span>Approve</span>
                  </button>
                  <button 
                    *ngIf="dr.status === 'PENDING'"
                    class="btn btn-danger btn-sm flex align-center gap-1"
                    (click)="openReviewDiscountModal(dr, 'REJECT')"
                  >
                    <span class="material-icons-outlined font-sm">close</span>
                    <span>Reject</span>
                  </button>
                  <button 
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openDiscountAuditHistory(dr)"
                    title="View Full Approval Audit Trail"
                  >
                    <span class="material-icons-outlined font-sm">history</span>
                    <span>Audit Trail</span>
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

    <!-- TC-5.32: Discount Approval Audit Trail Modal -->
    <div class="modal-overlay" *ngIf="showDiscountAuditModal" (click)="closeDiscountAuditModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 650px;">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: var(--brand-primary);">history</span>
            <h2>Discount Request Audit Trail</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeDiscountAuditModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="p-3 mb-3 bg-card border rounded">
            <div class="grid grid-cols-2 gap-2 font-xs">
              <div>
                <span class="text-secondary block">Request Ref</span>
                <strong class="font-mono">#DR-0{{ selectedAuditDiscount?.id }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Quotation No</span>
                <strong class="font-mono">{{ selectedAuditDiscount?.quotation?.quotationNo }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Customer</span>
                <strong>{{ selectedAuditDiscount?.quotation?.customer?.fullName }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Requester</span>
                <strong>Sales Representative #{{ selectedAuditDiscount?.requestedBy || 1 }}</strong>
              </div>
              <div>
                <span class="text-secondary block">Requested Amount</span>
                <strong class="font-mono text-danger">ETB {{ selectedAuditDiscount?.requestedDiscount | number }} ({{ selectedAuditDiscount?.discountPercentage }}%)</strong>
              </div>
              <div>
                <span class="text-secondary block">Submission Time</span>
                <span>{{ selectedAuditDiscount?.requestedAt | date:'medium' }}</span>
              </div>
            </div>
            <div class="mt-2 pt-2 border-top font-xs text-secondary">
              <strong>Original Justification:</strong> {{ selectedAuditDiscount?.reason }}
            </div>
          </div>

          <h4 class="font-xs font-bold text-secondary uppercase mb-2">Approval Lifecycle & Decision Log</h4>
          <div class="flex flex-col gap-3" *ngIf="discountAuditData?.approvals?.length > 0">
            <div *ngFor="let app of discountAuditData.approvals" class="p-3 border rounded bg-card flex flex-col gap-1">
              <div class="flex justify-between align-center">
                <span class="badge" [ngClass]="app.action === 'APPROVED' ? 'badge-qualified' : 'badge-lost'">
                  {{ app.action }} by Approver #{{ app.approverId }}
                </span>
                <span class="text-secondary font-xs">{{ app.actionDate | date:'medium' }}</span>
              </div>
              <p class="font-sm text-main my-1">{{ app.comments || 'No comment provided' }}</p>
              <span class="text-secondary font-xs">Approval Level: Stage {{ app.approvalLevel || 1 }}</span>
            </div>
          </div>

          <div *ngIf="!discountAuditData?.approvals || discountAuditData?.approvals?.length === 0" class="text-center py-6 text-secondary italic">
            No approval decisions logged yet. Request is currently awaiting review.
          </div>

          <div class="p-2 mt-3 text-secondary font-xs text-center border-top">
            🔒 <em>Immutable Audit Record — Protected against modification by standard users.</em>
          </div>

          <div class="modal-footer flex justify-end mt-4">
            <button class="btn btn-secondary" (click)="closeDiscountAuditModal()">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Discount Review Modal (Approve / Reject) -->
    <div class="modal-overlay" *ngIf="showReviewDiscountModal" (click)="closeReviewDiscountModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header flex justify-between align-center">
          <h2>{{ discountReviewAction === 'APPROVE' ? 'Approve Discount Request' : 'Reject Discount Request' }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeReviewDiscountModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="p-3 mb-3 bg-card border rounded">
            <div class="flex justify-between">
              <span class="text-secondary font-xs">Quotation</span>
              <strong class="font-mono">{{ selectedReviewDiscount?.quotation?.quotationNo }}</strong>
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-secondary font-xs">Requested Discount</span>
              <strong class="text-danger font-mono">ETB {{ selectedReviewDiscount?.requestedDiscount | number }} ({{ selectedReviewDiscount?.discountPercentage }}%)</strong>
            </div>
            <div class="mt-2 text-secondary font-xs">
              Reason: {{ selectedReviewDiscount?.reason }}
            </div>
          </div>
          <form (submit)="onSubmitReviewDiscount($event)">
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Approver Review Comments {{ discountReviewAction === 'REJECT' ? '*' : '' }}</label>
              <textarea [(ngModel)]="discountReviewComment" name="dComment" [required]="discountReviewAction === 'REJECT'" placeholder="Enter review remarks / authorization basis..." rows="3"></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeReviewDiscountModal()">Cancel</button>
              <button type="submit" class="btn" [ngClass]="discountReviewAction === 'APPROVE' ? 'btn-primary' : 'btn-danger'">
                {{ discountReviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection' }}
              </button>
            </div>
          </form>
        </div>
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

              <!-- Discount Amount -->
              <div class="form-group flex-1 flex flex-col">
                <label>Discount Amount (ETB)</label>
                <input type="number" [(ngModel)]="newQuotation.discountAmount" name="discountAmount" (ngModelChange)="recalculateTotals()" />
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

    <!-- TC-5.09: Quotation PDF / Print Preview Modal -->
    <div class="modal-overlay" *ngIf="showPdfModal" (click)="closePdfModal()" style="backdrop-filter: blur(8px); background: rgba(15, 23, 42, 0.85); z-index: 9999;">
      <div class="modal-container" style="max-width: 850px; width: 95vw; max-height: 90vh; overflow-y: auto; background: #ffffff; color: #1e293b; padding: 0; border-radius: 12px;" (click)="$event.stopPropagation()">
        
        <!-- Action Toolbar (Hidden during Print) -->
        <div class="flex justify-between align-center no-print" style="padding: 16px 24px; background: #0f172a; color: #fff; border-top-left-radius: 12px; border-top-right-radius: 12px;">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: #60a5fa;">picture_as_pdf</span>
            <strong style="font-size: 16px;">Official Quotation Document Preview</strong>
          </div>
          <div class="flex gap-3 align-center">
            <button class="btn btn-primary btn-sm flex align-center gap-1" (click)="printQuotationPdf()">
              <span class="material-icons-outlined font-sm">print</span> Print / Download PDF
            </button>
            <button 
              type="button"
              (click)="closePdfModal()" 
              style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); color: #ffffff; width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;"
              title="Close Preview"
            >
              <span class="material-icons-outlined" style="font-size: 20px; color: #ffffff;">close</span>
            </button>
          </div>
        </div>

        <!-- Printable Document Body -->
        <div id="printableQuote" style="padding: 36px 40px; background: #ffffff; color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
          
          <!-- Company Branding Header -->
          <div class="flex justify-between align-center pb-4" style="border-bottom: 2px solid #1e3a8a; margin-bottom: 24px;">
            <div class="flex align-center gap-3">
              <div *ngIf="orgSettings.headerImagePath" style="max-height: 65px; overflow: hidden;">
                <img [src]="resolveUrl(orgSettings.headerImagePath)" style="max-height: 65px; width: auto; object-fit: contain;" alt="Header" />
              </div>
              <div *ngIf="!orgSettings.headerImagePath" class="flex align-center gap-3">
                <img *ngIf="orgSettings.logoPath" [src]="resolveUrl(orgSettings.logoPath)" style="height: 52px; width: 52px; object-fit: contain; border-radius: 6px;" alt="Logo" />
                <div *ngIf="!orgSettings.logoPath" style="width: 48px; height: 48px; background: #1e3a8a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 24px;">
                  I
                </div>
                <div>
                  <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">{{ orgSettings.companyName || 'IHSAN BRAND PROPERTIES' }}</h1>
                  <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                    TIN: {{ orgSettings.tinNumber || 'TIN-77665544' }} | VAT: {{ orgSettings.vatNumber || 'VAT-332211' }} • {{ orgSettings.companyAddress || 'Bole, Addis Ababa, Ethiopia' }}
                  </p>
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge" style="background: #1e3a8a; color: #fff; font-size: 13px; font-weight: bold; padding: 4px 10px; border-radius: 4px;">OFFICIAL QUOTATION</span>
              <div style="margin-top: 6px; font-family: monospace; font-size: 14px; font-weight: bold;">#{{ selectedPdfQuote?.quotationNo }}</div>
            </div>
          </div>

          <!-- Metadata Info Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div>
              <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Client Information</h4>
              <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">{{ selectedPdfQuote?.customer?.fullName }}</div>
              <div style="font-size: 13px; color: #334155;">📞 Phone: {{ selectedPdfQuote?.customer?.primaryPhone || 'N/A' }}</div>
              <div style="font-size: 13px; color: #334155;">✉️ Email: {{ selectedPdfQuote?.customer?.primaryEmail || 'N/A' }}</div>
              <div style="font-size: 13px; color: #334155;">🌍 Nationality: {{ selectedPdfQuote?.customer?.nationality || 'Ethiopian' }}</div>
            </div>
            <div>
              <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Quotation Schedule</h4>
              <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">📅 <strong>Issue Date:</strong> {{ selectedPdfQuote?.quotationDate | date:'mediumDate' }}</div>
              <div style="font-size: 13px; color: #dc2626; font-weight: bold; margin-bottom: 4px;">⏳ <strong>Validity Date:</strong> {{ selectedPdfQuote?.validityDate | date:'mediumDate' }}</div>
              <div style="font-size: 13px; color: #334155;">🏢 <strong>Project:</strong> {{ selectedPdfQuote?.property?.propertyName || '-' }}</div>
              <div style="font-size: 13px; color: #334155;">🏠 <strong>Unit Code / No:</strong> Unit {{ selectedPdfQuote?.unit?.unitCode }} (Unit #{{ selectedPdfQuote?.unit?.unitNumber }})</div>
            </div>
          </div>

          <!-- Unit Specifications Section -->
          <div style="margin-bottom: 28px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">Property & Unit Technical Specifications</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px;">
              <div style="background: #f1f5f9; padding: 10px; border-radius: 6px;">
                <div style="color: #64748b; font-size: 11px;">Unit Type</div>
                <strong style="color: #0f172a;">{{ selectedPdfQuote?.unit?.unitType?.typeName || 'Apartment' }}</strong>
              </div>
              <div style="background: #f1f5f9; padding: 10px; border-radius: 6px;">
                <div style="color: #64748b; font-size: 11px;">Gross Area</div>
                <strong style="color: #0f172a;">{{ selectedPdfQuote?.unit?.grossArea || selectedPdfQuote?.unit?.areaSuperBuiltup || '-' }} m²</strong>
              </div>
              <div style="background: #f1f5f9; padding: 10px; border-radius: 6px;">
                <div style="color: #64748b; font-size: 11px;">Bedrooms / Bathrooms</div>
                <strong style="color: #0f172a;">{{ selectedPdfQuote?.unit?.bedroomCount ?? '-' }} Bed / {{ selectedPdfQuote?.unit?.bathroomCount ?? '-' }} Bath</strong>
              </div>
              <div style="background: #f1f5f9; padding: 10px; border-radius: 6px;">
                <div style="color: #64748b; font-size: 11px;">View / Orientation</div>
                <strong style="color: #0f172a;">{{ selectedPdfQuote?.unit?.viewType || 'Standard View' }}</strong>
              </div>
            </div>
          </div>

          <!-- Itemized Financial Breakdown Table -->
          <div style="margin-bottom: 28px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">Financial Pricing Matrix</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #1e3a8a; color: #ffffff;">
                  <th style="padding: 10px 12px; text-align: left; border-top-left-radius: 6px;">Description</th>
                  <th style="padding: 10px 12px; text-align: center; width: 70px;">Quantity</th>
                  <th style="padding: 10px 12px; text-align: right; width: 140px;">Unit Rate (ETB)</th>
                  <th style="padding: 10px 12px; text-align: right; width: 160px; border-top-right-radius: 6px;">Total (ETB)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedPdfQuote?.items" style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 12px; font-weight: 500;">{{ item.description }}</td>
                  <td style="padding: 10px 12px; text-align: center;">{{ item.quantity }}</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: monospace;">ETB {{ item.unitPrice | number }}</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: bold;">ETB {{ item.amount | number }}</td>
                </tr>
                <tr *ngIf="!selectedPdfQuote?.items || selectedPdfQuote?.items?.length === 0" style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 12px; font-weight: 500;">Unit Base Valuation Price</td>
                  <td style="padding: 10px 12px; text-align: center;">1</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: monospace;">ETB {{ selectedPdfQuote?.basePrice | number }}</td>
                  <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: bold;">ETB {{ selectedPdfQuote?.basePrice | number }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total Calculation Ledger -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
            <div style="width: 350px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px;">
              <div class="flex justify-between mb-2">
                <span style="color: #64748b;">Base Valuation Price:</span>
                <strong style="font-family: monospace;">ETB {{ selectedPdfQuote?.basePrice | number }}</strong>
              </div>
              <div class="flex justify-between mb-2" *ngIf="selectedPdfQuote?.discountAmount > 0" style="color: #dc2626;">
                <span>Discounts / Concessions:</span>
                <strong style="font-family: monospace;">- ETB {{ selectedPdfQuote?.discountAmount | number }}</strong>
              </div>
              <div class="flex justify-between mb-3" style="color: #64748b; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                <span>Value Added Tax (15% VAT):</span>
                <strong style="font-family: monospace;">+ ETB {{ selectedPdfQuote?.vatAmount | number }}</strong>
              </div>
              <div class="flex justify-between align-center" style="font-size: 18px; font-weight: 800; color: #1e3a8a;">
                <span>Final Quotation Value:</span>
                <span style="font-family: monospace;">ETB {{ selectedPdfQuote?.totalAmount | number }}</span>
              </div>
            </div>
          </div>

          <!-- Remarks / Terms -->
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 14px; margin-bottom: 32px; font-size: 12px; color: #92400e;">
            <strong>Special Terms & Conditions:</strong>
            <p style="margin: 4px 0 0 0;">{{ selectedPdfQuote?.remarks || 'This quotation is issued for budgeting purposes and represents a binding reservation offer until the validity date specified above. Final contract execution remains subject to standard sales agreement terms and down payment confirmation.' }}</p>
          </div>

          <!-- Signatures Section -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 24px;">
            <div>
              <div style="border-bottom: 1px solid #94a3b8; height: 50px; margin-bottom: 6px;"></div>
              <div style="font-weight: bold; font-size: 13px;">Prepared By: Sales Representative</div>
              <div style="font-size: 11px; color: #64748b;">IHSAN Real Estate Management System</div>
            </div>
            <div>
              <div style="border-bottom: 1px solid #94a3b8; height: 50px; margin-bottom: 6px;"></div>
              <div style="font-weight: bold; font-size: 13px;">Client Acknowledgement Signature</div>
              <div style="font-size: 11px; color: #64748b;">Date: ________________________</div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer flex justify-between align-center no-print" style="padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc;">
          <span class="text-secondary font-xs">Tip: Click "Print / Download PDF" to save an official vector PDF or print a hard copy.</span>
          <div class="flex gap-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="closePdfModal()">Close</button>
            <button type="button" class="btn btn-primary btn-sm flex align-center gap-1" (click)="printQuotationPdf()">
              <span class="material-icons-outlined font-sm">print</span> Print / Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TC-5.10: Email Quotation Modal -->
    <div class="modal-overlay" *ngIf="showEmailModal" (click)="closeEmailModal()" style="backdrop-filter: blur(6px); background: rgba(15, 23, 42, 0.8);">
      <div class="modal-container" style="max-width: 820px; width: 95vw; max-height: 90vh; overflow-y: auto;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #fff; padding: 18px 24px;">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: #93c5fd; font-size: 24px;">email</span>
            <h2 style="margin: 0; font-size: 18px; color: #fff;">Email Quotation to Customer</h2>
          </div>
          <button 
            type="button"
            (click)="closeEmailModal()" 
            style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); color: #ffffff; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;"
            title="Close"
          >
            <span class="material-icons-outlined" style="font-size: 20px; color: #ffffff;">close</span>
          </button>
        </div>

        <div class="modal-body" style="padding: 24px;">
          <!-- Quotation Quick Summary Banner -->
          <div style="background: var(--bg-main, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
            <div class="flex justify-between align-center mb-2 pb-2" style="border-bottom: 1px dashed var(--border-color, #cbd5e1);">
              <span class="font-bold text-main flex align-center gap-1">
                <span class="material-icons-outlined font-sm text-primary">description</span>
                <span>Quotation #{{ selectedEmailQuote?.quotationNo }}</span>
              </span>
              <span class="badge" [ngClass]="getQuoteStatusBadge(selectedEmailQuote?.status)">
                {{ selectedEmailQuote?.status }}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; font-size: 13px;">
              <div>
                <span class="text-secondary font-xs block">Customer Name</span>
                <strong>{{ selectedEmailQuote?.customer?.fullName }}</strong>
              </div>
              <div>
                <span class="text-secondary font-xs block">Property / Project</span>
                <strong>{{ selectedEmailQuote?.property?.propertyName }}</strong>
              </div>
              <div>
                <span class="text-secondary font-xs block">Unit Details</span>
                <strong>Unit {{ selectedEmailQuote?.unit?.unitCode || selectedEmailQuote?.unit?.unitNumber }} ({{ selectedEmailQuote?.unit?.unitType?.typeName || 'Unit' }})</strong>
              </div>
              <div>
                <span class="text-secondary font-xs block">Total Valuation (with VAT)</span>
                <strong style="color: var(--brand-primary, #1e3a8a); font-family: monospace; font-size: 14px;">ETB {{ selectedEmailQuote?.totalAmount | number }}</strong>
              </div>
              <div>
                <span class="text-secondary font-xs block">Offer Validity Until</span>
                <strong class="text-danger">📅 {{ selectedEmailQuote?.validityDate | date:'mediumDate' }}</strong>
              </div>
            </div>
          </div>

          <form (submit)="onSubmitSendEmail($event)">
            <div class="form-row flex gap-3 mb-3">
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Recipient Customer Email <span class="text-danger">*</span></label>
                <input type="email" [(ngModel)]="emailData.recipientEmail" name="recEmail" required placeholder="client@example.com" style="padding: 10px 14px; font-weight: 500; font-size: 14px;" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Customer Phone Number</label>
                <input type="text" [(ngModel)]="emailData.recipientPhone" name="recPhone" placeholder="+251911223344" style="padding: 10px 14px; font-weight: 500; font-size: 14px;" />
              </div>
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Email Subject Line <span class="text-danger">*</span></label>
              <input type="text" [(ngModel)]="emailData.subject" name="eSubj" required style="padding: 10px 14px; font-size: 14px; font-weight: 500;" />
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Personalized Message / Cover Note</label>
              <textarea [(ngModel)]="emailData.message" name="eMsg" rows="5" placeholder="Enter personalized message and quotation highlights..." style="padding: 12px 14px; font-size: 13.5px; line-height: 1.5;"></textarea>
            </div>

            <div class="alert font-xs mb-3" style="background: rgba(59, 130, 246, 0.08); border: 1px solid #3b82f6; color: #1e3a8a; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
              <span class="material-icons-outlined" style="font-size: 20px; color: #2563eb;">attach_email</span>
              <span><strong>Branded Attachment:</strong> The client will receive an official HTML email with full company letterhead, unit specifications, itemized pricing matrix, 15% VAT, and terms of validity.</span>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 18px;">
              <button type="button" class="btn btn-secondary" (click)="closeEmailModal()">Cancel</button>
              <button type="submit" class="btn btn-primary flex align-center gap-1" [disabled]="!emailData.recipientEmail || isSendingEmail" style="padding: 10px 20px;">
                <span class="material-icons-outlined font-sm">send</span>
                <span>{{ isSendingEmail ? 'Sending Email...' : 'Send Quotation Email' }}</span>
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

    @media print {
      body * {
        visibility: hidden !important;
      }
      #printableQuote, #printableQuote * {
        visibility: visible !important;
      }
      #printableQuote {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        background: #fff !important;
      }
      .no-print {
        display: none !important;
      }
    }
    @keyframes toastSlideIn {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class QuotationsComponent implements OnInit {
  private salesService = inject(SalesService);
  private propertiesService = inject(PropertiesService);
  private financeService = inject(FinanceService);

  orgSettings: any = {
    companyName: 'IHSAN BRAND PROPERTIES',
    tinNumber: 'TIN-77665544',
    vatNumber: 'VAT-332211',
    companyAddress: 'Bole, Addis Ababa, Ethiopia',
    companyPhone: '+251-11-1234567',
    companyEmail: 'info@ihsanproperties.com',
    logoPath: '',
    headerImagePath: ''
  };

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

  // PDF Preview State (TC-5.09)
  showPdfModal = false;
  selectedPdfQuote: any = null;

  // Email Modal State (TC-5.10)
  showEmailModal = false;
  selectedEmailQuote: any = null;
  emailData = {
    recipientEmail: '',
    recipientPhone: '',
    subject: '',
    message: ''
  };
  isSendingEmail = false;

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
    this.loadOrgSettings();

    const today = new Date();
    const validity = new Date(today);
    validity.setDate(today.getDate() + 30); // Valid for 30 days
    this.newQuotation.quotationDate = this.formatDate(today);
    this.newQuotation.validityDate = this.formatDate(validity);
  }

  loadOrgSettings() {
    this.financeService.getSettings().subscribe({
      next: (res) => {
        if (res) {
          this.orgSettings = { ...this.orgSettings, ...res };
        }
      },
      error: (err) => console.error('Error loading org settings', err)
    });
  }

  resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    return environment.serverUrl + (url.startsWith('/') ? '' : '/') + url;
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

  // TC-5.32: Discount Review & Audit Trail State
  showDiscountAuditModal = false;
  selectedAuditDiscount: any = null;
  discountAuditData: any = null;

  showReviewDiscountModal = false;
  selectedReviewDiscount: any = null;
  discountReviewAction: 'APPROVE' | 'REJECT' = 'APPROVE';
  discountReviewComment = '';

  openReviewDiscountModal(dr: any, action: 'APPROVE' | 'REJECT') {
    this.selectedReviewDiscount = dr;
    this.discountReviewAction = action;
    this.discountReviewComment = action === 'APPROVE' ? 'Approved by management' : '';
    this.showReviewDiscountModal = true;
  }

  closeReviewDiscountModal() {
    this.showReviewDiscountModal = false;
    this.selectedReviewDiscount = null;
    this.discountReviewComment = '';
  }

  onSubmitReviewDiscount(event: Event) {
    event.preventDefault();
    if (!this.selectedReviewDiscount) return;

    if (this.discountReviewAction === 'APPROVE') {
      this.salesService.approveDiscountRequest(this.selectedReviewDiscount.id, 1, this.discountReviewComment || 'Approved').subscribe({
        next: (res) => {
          this.successMessage = `Discount request #${this.selectedReviewDiscount.id} approved! Quotation values updated.`;
          this.loadDiscountRequests();
          this.loadQuotations();
          this.closeReviewDiscountModal();
        },
        error: (err) => {
          console.error('Error approving discount request', err);
          this.errorMessage = err.error?.message || 'Failed to approve discount request.';
        }
      });
    } else {
      this.salesService.rejectDiscountRequest(this.selectedReviewDiscount.id, 1, this.discountReviewComment || 'Rejected').subscribe({
        next: (res) => {
          this.successMessage = `Discount request #${this.selectedReviewDiscount.id} rejected.`;
          this.loadDiscountRequests();
          this.closeReviewDiscountModal();
        },
        error: (err) => {
          console.error('Error rejecting discount request', err);
          this.errorMessage = err.error?.message || 'Failed to reject discount request.';
        }
      });
    }
  }

  openDiscountAuditHistory(dr: any) {
    this.selectedAuditDiscount = dr;
    this.showDiscountAuditModal = true;
    this.salesService.getDiscountHistory(dr.id).subscribe({
      next: (res) => {
        this.discountAuditData = res;
      },
      error: (err) => {
        console.error('Error fetching discount history', err);
        this.discountAuditData = { approvals: [], auditLogs: [] };
      }
    });
  }

  closeDiscountAuditModal() {
    this.showDiscountAuditModal = false;
    this.selectedAuditDiscount = null;
    this.discountAuditData = null;
  }

  // --- TC-5.09: PDF Print Modal ---
  openPdfModal(q: any) {
    this.selectedPdfQuote = q;
    this.showPdfModal = true;
  }

  closePdfModal() {
    this.showPdfModal = false;
    this.selectedPdfQuote = null;
  }

  printQuotationPdf() {
    const quote = this.selectedPdfQuote;
    if (!quote) {
      window.print();
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      window.print();
      return;
    }

    const resolveUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
      return environment.serverUrl + (url.startsWith('/') ? '' : '/') + url;
    };

    const logoHtml = this.orgSettings.headerImagePath 
      ? `<img src="${resolveUrl(this.orgSettings.headerImagePath)}" style="max-height: 65px; width: auto; object-fit: contain;" />`
      : (this.orgSettings.logoPath 
          ? `<div style="display: flex; align-items: center; gap: 12px;"><img src="${resolveUrl(this.orgSettings.logoPath)}" style="height: 52px; width: 52px; object-fit: contain; border-radius: 6px;" /><div><h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">${this.orgSettings.companyName || 'IHSAN BRAND PROPERTIES'}</h1><p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">TIN: ${this.orgSettings.tinNumber || 'TIN-77665544'} | VAT: ${this.orgSettings.vatNumber || 'VAT-332211'} • ${this.orgSettings.companyAddress || 'Bole, Addis Ababa, Ethiopia'}</p></div></div>`
          : `<div style="display: flex; align-items: center; gap: 12px;"><div style="width: 48px; height: 48px; background: #1e3a8a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 24px;">I</div><div><h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px;">${this.orgSettings.companyName || 'IHSAN REAL ESTATE'}</h1><p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${this.orgSettings.companyAddress || 'Luxury Developments • Addis Ababa, Ethiopia'}</p></div></div>`);

    let itemsHtml = '';
    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item: any) => {
        itemsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 500;">${item.description}</td>
            <td style="padding: 10px 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px 12px; text-align: right; font-family: monospace;">ETB ${Number(item.unitPrice || 0).toLocaleString()}</td>
            <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: bold;">ETB ${Number(item.amount || 0).toLocaleString()}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml = `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: 500;">Unit Base Valuation Price</td>
          <td style="padding: 10px 12px; text-align: center;">1</td>
          <td style="padding: 10px 12px; text-align: right; font-family: monospace;">ETB ${Number(quote.basePrice || 0).toLocaleString()}</td>
          <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: bold;">ETB ${Number(quote.basePrice || 0).toLocaleString()}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Quotation ${quote.quotationNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@300;400;600;700&display=swap');
            body {
              background: #f1f5f9;
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .a4-sheet {
              background: white;
              width: 210mm;
              min-height: 297mm;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              padding: 20mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }
            @page { size: A4; margin: 0; }
            @media print {
              body { background: white; padding: 0; margin: 0; }
              .a4-sheet { box-shadow: none; width: 210mm; height: 297mm; padding: 15mm; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="a4-sheet">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px;">
              ${logoHtml}
              <div style="text-align: right;">
                <div style="background: #1e3a8a; color: #fff; font-size: 13px; font-weight: bold; padding: 4px 10px; border-radius: 4px; display: inline-block;">OFFICIAL QUOTATION</div>
                <div style="margin-top: 6px; font-family: monospace; font-size: 14px; font-weight: bold;">#${quote.quotationNo}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div>
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">Client Information</div>
                <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${quote.customer?.fullName || ''}</div>
                <div style="font-size: 12px; color: #334155;">📞 Phone: ${quote.customer?.primaryPhone || 'N/A'}</div>
                <div style="font-size: 12px; color: #334155;">✉️ Email: ${quote.customer?.primaryEmail || 'N/A'}</div>
              </div>
              <div>
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">Schedule Details</div>
                <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">📅 <strong>Date:</strong> ${new Date(quote.quotationDate).toLocaleDateString()}</div>
                <div style="font-size: 12px; color: #dc2626; font-weight: bold; margin-bottom: 3px;">⏳ <strong>Valid Until:</strong> ${new Date(quote.validityDate).toLocaleDateString()}</div>
                <div style="font-size: 12px; color: #334155;">🏢 <strong>Unit:</strong> ${quote.property?.propertyName || ''} - Unit #${quote.unit?.unitNumber || ''}</div>
              </div>
            </div>

            <div style="margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #1e3a8a; color: #ffffff;">
                    <th style="padding: 10px 12px; text-align: left;">Description</th>
                    <th style="padding: 10px 12px; text-align: center; width: 70px;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; width: 140px;">Unit Rate</th>
                    <th style="padding: 10px 12px; text-align: right; width: 160px;">Total (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
              <div style="width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #64748b;">Base Price:</span>
                  <strong>ETB ${Number(quote.basePrice || 0).toLocaleString()}</strong>
                </div>
                ${quote.discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #dc2626;">
                  <span>Discount:</span>
                  <strong>- ETB ${Number(quote.discountAmount).toLocaleString()}</strong>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #cbd5e1; color: #64748b;">
                  <span>VAT (15%):</span>
                  <strong>+ ETB ${Number(quote.vatAmount || 0).toLocaleString()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #1e3a8a;">
                  <span>Total Amount:</span>
                  <span>ETB ${Number(quote.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 12px; font-size: 11px; color: #92400e; margin-bottom: auto;">
              <strong>Terms:</strong> ${quote.remarks || 'This quotation is issued for budgeting purposes and represents a binding reservation offer until the validity date specified above.'}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 16px;">
              <div>
                <div style="border-bottom: 1px solid #94a3b8; height: 40px; margin-bottom: 6px;"></div>
                <div style="font-weight: bold; font-size: 12px;">Prepared By: Sales Representative</div>
                <div style="font-size: 10px; color: #64748b;">${this.orgSettings.companyName || 'IHSAN Real Estate'}</div>
              </div>
              <div>
                <div style="border-bottom: 1px solid #94a3b8; height: 40px; margin-bottom: 6px;"></div>
                <div style="font-weight: bold; font-size: 12px;">Client Acknowledgement Signature</div>
                <div style="font-size: 10px; color: #64748b;">Date: ________________________</div>
              </div>
            </div>
          </div>
          <script>
            document.fonts.ready.then(() => {
              setTimeout(() => { window.print(); }, 250);
            });
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  // --- TC-5.10: Email Quotation Modal ---
  openEmailModal(q: any) {
    this.selectedEmailQuote = q;
    this.emailData = {
      recipientEmail: q.customer?.primaryEmail || '',
      recipientPhone: q.customer?.primaryPhone || '',
      subject: `Official Quotation #${q.quotationNo} - IHSAN Real Estate`,
      message: `Dear ${q.customer?.fullName || 'Valued Client'},\n\nPlease find attached the official price quotation for Unit ${q.unit?.unitCode || q.unit?.unitNumber || ''} at ${q.property?.propertyName || ''}.`
    };
    this.showEmailModal = true;
    this.isSendingEmail = false;
  }

  closeEmailModal() {
    this.showEmailModal = false;
    this.selectedEmailQuote = null;
    this.isSendingEmail = false;
  }

  onSubmitSendEmail(event: Event) {
    event.preventDefault();
    if (!this.selectedEmailQuote || !this.emailData.recipientEmail) return;

    this.isSendingEmail = true;
    this.salesService.sendQuotationEmail(this.selectedEmailQuote.id, this.emailData).subscribe({
      next: (res) => {
        this.isSendingEmail = false;
        this.closeEmailModal();
        const msg = res.message || `Quotation successfully emailed to ${this.emailData.recipientEmail}!`;
        this.successMessage = msg;
        setTimeout(() => this.successMessage = '', 6000);
      },
      error: (err) => {
        this.isSendingEmail = false;
        console.error('Error sending quotation email:', err);
        const errMsg = err.error?.message || 'Failed to email quotation.';
        this.errorMessage = errMsg;
        setTimeout(() => this.errorMessage = '', 6000);
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
