import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { PropertiesService } from '../../services/properties.service';
import { customConfirm } from '../../utils/confirm';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Bookings Log</h1>
        <p>Convert reservations, log initial sales down-payments, and authorize bookings</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()" *ngIf="authService.hasPermission('sales.bookings.create', 'create')">
          <span class="material-icons-outlined">add</span>
          New Booking
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

    <!-- Booking Card list -->
    <div class="card glass-card">
      <div class="filter-bar flex justify-between align-center gap-4" style="margin-bottom: 20px;">
        <div class="search-box" style="flex: 1; max-width: 400px;">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by booking number, customer name, unit number..." 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()" 
          />
        </div>
      </div>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Booking No</th>
              <th>Customer</th>
              <th>Property / Unit</th>
              <th>Booking Date</th>
              <th>Deposit (ETB)</th>
              <th>Linked Ref</th>
              <th>Approval Stage / Status</th>
              <th>Review Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of filteredBookings">
              <td class="font-mono font-bold">{{ b.bookingNo }}</td>
              <td>{{ b.customer?.fullName }}</td>
              <td>
                <div class="flex flex-col">
                  <span class="font-bold text-main">{{ b.property?.propertyName }}</span>
                  <span class="text-secondary font-xs">Unit: {{ b.unit?.unitCode || b.unit?.unitNumber }}</span>
                </div>
              </td>
              <td>{{ b.bookingDate | date:'mediumDate' }}</td>
              <td class="font-mono font-bold">ETB {{ b.bookingAmount | number }}</td>
              <td>
                <div class="flex flex-col font-xs text-secondary gap-1">
                  <span *ngIf="b.reservation">Res: {{ b.reservation.reservationNo }}</span>
                  <span *ngIf="b.quotation">Quote: {{ b.quotation.quotationNo }}</span>
                  <span *ngIf="!b.reservation && !b.quotation">-</span>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="getBookingStatusBadge(b.status)">
                  {{ getBookingStatusLabel(b.status) }}
                </span>
              </td>
              <td>
                <div *ngIf="b.status === 'APPROVED'" class="text-secondary font-xs">
                  <strong>Final Approved</strong><br>
                  <span *ngIf="b.financeComment" class="text-success font-xs">{{ b.financeComment }}</span>
                </div>
                <div *ngIf="b.status === 'PENDING_SALES' || b.status === 'PENDING'" class="text-secondary italic font-xs">
                  Stage 1: Awaiting Sales Manager Review
                </div>
                <div *ngIf="b.status === 'PENDING_FINANCE'" class="text-secondary italic font-xs">
                  Stage 2: Sales Approved &bull; Awaiting Finance Review
                </div>
                <div *ngIf="b.status === 'REJECTED'" class="text-danger font-xs">
                  <strong>Rejected:</strong> {{ b.rejectionReason || 'Review declined' }}
                </div>
                <div *ngIf="b.status === 'CANCELLED'" class="text-secondary font-xs">
                  <strong>Cancelled:</strong> {{ b.cancellationReason || 'Client cancellation' }}
                </div>
                <div *ngIf="b.status === 'CONTRACT_CREATED'" class="text-secondary font-xs">
                  Contract Executed
                </div>
              </td>
              <td>
                <div class="flex gap-1 flex-wrap">
                  <!-- Stage 1: Sales Manager Review -->
                  <ng-container *ngIf="b.status === 'PENDING_SALES' || b.status === 'PENDING'">
                    <button 
                      class="btn btn-primary btn-xs flex align-center gap-1"
                      (click)="onSalesApprove(b.id)"
                      title="Sales Manager: Approve & Forward to Finance"
                    >
                      <span class="material-icons-outlined font-xs">forward</span>
                      <span>Approve to Finance</span>
                    </button>
                    <button 
                      class="btn btn-danger btn-xs flex align-center gap-1"
                      (click)="openRejectModal(b)"
                      title="Sales Manager: Reject Booking with Reason"
                    >
                      <span class="material-icons-outlined font-xs">close</span>
                      <span>Reject</span>
                    </button>
                  </ng-container>

                  <!-- Stage 2: Finance Review -->
                  <ng-container *ngIf="b.status === 'PENDING_FINANCE'">
                    <button 
                      class="btn btn-success btn-xs flex align-center gap-1"
                      (click)="openFinanceReviewModal(b, 'APPROVE')"
                      title="Finance Officer: Confirm Payment & Final Approve"
                    >
                      <span class="material-icons-outlined font-xs">verified</span>
                      <span>Finance Approve</span>
                    </button>
                    <button 
                      class="btn btn-danger btn-xs flex align-center gap-1"
                      (click)="openFinanceReviewModal(b, 'REJECT')"
                      title="Finance Officer: Reject Payment Proof"
                    >
                      <span class="material-icons-outlined font-xs">close</span>
                      <span>Finance Reject</span>
                    </button>
                  </ng-container>

                  <!-- Cancel Button (Available on Active/Approved Bookings with Reason) -->
                  <button 
                    *ngIf="b.status === 'APPROVED' || b.status === 'PENDING_SALES' || b.status === 'PENDING_FINANCE' || b.status === 'PENDING'"
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="openCancelModal(b)"
                    title="Cancel Booking & Revert Unit"
                  >
                    <span class="material-icons-outlined font-xs">block</span>
                    <span>Cancel</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredBookings.length === 0">
              <td colspan="9" class="text-center py-6 text-secondary">
                No bookings logged yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Booking Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Log New Property Booking</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitBooking($event)">
            
            <div class="form-row flex gap-3">
              <!-- Customer * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Customer * [REQUIRED]</label>
                <select [(ngModel)]="newBooking.customerId" name="customerId" required>
                  <option [value]="0">-- Select Customer --</option>
                  <option *ngFor="let c of customers" [value]="c.id">{{ c.fullName }} ({{ c.primaryPhone }})</option>
                </select>
              </div>

              <!-- Link Reservation (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Link Reservation [OPTIONAL]</label>
                <select [(ngModel)]="newBooking.reservationId" name="reservationId" (change)="onReservationChange()">
                  <option [value]="null">-- Select Active Reservation --</option>
                  <option *ngFor="let r of reservations" [value]="r.id">
                    {{ r.reservationNo }} - {{ r.customer?.fullName }} (Unit: {{ r.unit?.unitNumber }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Property * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Property * [REQUIRED]</label>
                <select [(ngModel)]="newBooking.propertyId" name="propertyId" required (change)="onPropertyChange()">
                  <option [value]="0">-- Select Property --</option>
                  <option *ngFor="let p of properties" [value]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>

              <!-- Unit * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Unit * [REQUIRED]</label>
                <select [(ngModel)]="newBooking.unitId" name="unitId" required [disabled]="newBooking.propertyId === 0">
                  <option [value]="0">-- Select Unit --</option>
                  <option *ngFor="let u of units" [value]="u.id">Unit {{ u.unitNumber }} ({{ u.unitStatus?.statusName || 'Available' }})</option>
                </select>
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Link Quotation (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Link Approved Quotation [OPTIONAL]</label>
                <select [(ngModel)]="newBooking.quotationId" name="quotationId" (change)="onQuotationChange()">
                  <option [value]="null">-- Select Quotation --</option>
                  <option *ngFor="let q of quotations" [value]="q.id">
                    {{ q.quotationNo }} - {{ q.customer?.fullName }} (Total: ETB {{ q.totalAmount | number }})
                  </option>
                </select>
              </div>

              <!-- Booking Date * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Booking Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newBooking.bookingDate" name="bookingDate" required />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Booking Amount * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Booking Fee/Deposit Amount (ETB) * [REQUIRED]</label>
                <input type="number" [(ngModel)]="newBooking.bookingAmount" name="bookingAmount" required placeholder="e.g. 150000" />
              </div>

              <!-- Remarks (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Booking Notes/Remarks [OPTIONAL]</label>
                <textarea [(ngModel)]="newBooking.remarks" name="remarks" placeholder="Enter payment or booking remarks..." rows="2"></textarea>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="newBooking.customerId === 0 || newBooking.propertyId === 0 || newBooking.unitId === 0 || !newBooking.bookingDate || !newBooking.bookingAmount"
              >
                Log Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- TC-5.14: Reject Booking Modal -->
    <div class="modal-overlay" *ngIf="showRejectModal" (click)="closeRejectModal()">
      <div class="modal-container" style="max-width: 540px; width: 90vw;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-danger">cancel</span>
            <h2>Reject Booking Request</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeRejectModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body" style="padding: 20px;">
          <form (submit)="onSubmitReject($event)">
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Booking Number</label>
              <input type="text" [value]="selectedBooking?.bookingNo + ' (' + selectedBooking?.customer?.fullName + ')'" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Mandatory Rejection Reason <span class="text-danger">*</span></label>
              <textarea [(ngModel)]="rejectReason" name="rejReason" required rows="3" placeholder="State reason for rejecting this booking (e.g. Unverified down-payment slip, customer withdrawal)..." style="padding: 9px 12px;"></textarea>
            </div>

            <div class="alert alert-danger font-xs mb-3" style="background: rgba(239, 68, 68, 0.08); border-color: #ef4444; color: #b91c1c;">
              <strong>Effect:</strong> The booking status will transition to <code>REJECTED</code>, the reason will be recorded in audit history, and Unit {{ selectedBooking?.unit?.unitCode || selectedBooking?.unit?.unitNumber }} will be released back to <code>AVAILABLE</code>.
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closeRejectModal()">Dismiss</button>
              <button type="submit" class="btn btn-danger flex align-center gap-1" [disabled]="!rejectReason.trim() || isSubmittingAction">
                <span class="material-icons-outlined font-sm">close</span>
                <span>{{ isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- TC-5.15: Finance Review Modal -->
    <div class="modal-overlay" *ngIf="showFinanceModal" (click)="closeFinanceModal()">
      <div class="modal-container" style="max-width: 580px; width: 90vw;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" [class.text-success]="financeAction === 'APPROVE'" [class.text-danger]="financeAction === 'REJECT'">
              {{ financeAction === 'APPROVE' ? 'verified' : 'gavel' }}
            </span>
            <h2>Finance Review: {{ financeAction === 'APPROVE' ? 'Final Payment Approval' : 'Finance Rejection' }}</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeFinanceModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body" style="padding: 20px;">
          <form (submit)="onSubmitFinanceReview($event)">
            
            <div class="form-row flex gap-3 mb-3">
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Booking Number</label>
                <input type="text" [value]="selectedBooking?.bookingNo" readonly style="background-color: var(--bg-main); font-weight: bold; font-family: monospace;" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Deposit Amount</label>
                <input type="text" [value]="'ETB ' + (selectedBooking?.bookingAmount | number)" readonly style="background-color: var(--bg-main); font-weight: bold; color: var(--brand-primary);" />
              </div>
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Finance Verification Comments / Slip Reference</label>
              <textarea [(ngModel)]="financeComment" name="finComment" rows="3" [required]="financeAction === 'REJECT'" placeholder="e.g. Deposit slip #ETB-883921 verified with Bank of Abyssinia account..." style="padding: 9px 12px;"></textarea>
            </div>

            <div class="alert font-xs mb-3" [style.background]="financeAction === 'APPROVE' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'" [style.color]="financeAction === 'APPROVE' ? '#047857' : '#b91c1c'">
              <span *ngIf="financeAction === 'APPROVE'">
                <strong>Final Approval:</strong> This will mark the booking as fully <code>APPROVED</code>, link the quotation as <code>ACCEPTED</code>, and lock the unit status as <code>SOLD</code>.
              </span>
              <span *ngIf="financeAction === 'REJECT'">
                <strong>Finance Rejection:</strong> The booking will be <code>REJECTED</code> and the unit reverted back to <code>AVAILABLE</code>.
              </span>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closeFinanceModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn flex align-center gap-1"
                [class.btn-success]="financeAction === 'APPROVE'"
                [class.btn-danger]="financeAction === 'REJECT'"
                [disabled]="(financeAction === 'REJECT' && !financeComment.trim()) || isSubmittingAction"
              >
                <span class="material-icons-outlined font-sm">{{ financeAction === 'APPROVE' ? 'check_circle' : 'close' }}</span>
                <span>{{ isSubmittingAction ? 'Processing...' : (financeAction === 'APPROVE' ? 'Authorize & Final Approve' : 'Reject Booking') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- TC-5.16: Cancellation Reason Modal -->
    <div class="modal-overlay" *ngIf="showCancelModal" (click)="closeCancelModal()">
      <div class="modal-container" style="max-width: 540px; width: 90vw;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-danger">block</span>
            <h2>Cancel Booking</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeCancelModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body" style="padding: 20px;">
          <form (submit)="onSubmitCancel($event)">
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Booking Reference</label>
              <input type="text" [value]="selectedBooking?.bookingNo + ' - ' + selectedBooking?.customer?.fullName" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Mandatory Cancellation Reason <span class="text-danger">*</span></label>
              <textarea [(ngModel)]="cancelReason" name="cReason" required rows="3" placeholder="Provide mandatory reason why this booking is being cancelled..." style="padding: 9px 12px;"></textarea>
            </div>

            <div class="alert alert-danger font-xs mb-3" style="background: rgba(239, 68, 68, 0.08); border-color: #ef4444; color: #b91c1c;">
              <strong>Important:</strong> Cancelling this booking will permanently record the reason in the audit log and revert the unit status back to <code>AVAILABLE</code> for resale.
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closeCancelModal()">Dismiss</button>
              <button type="submit" class="btn btn-danger flex align-center gap-1" [disabled]="!cancelReason.trim() || isSubmittingAction">
                <span class="material-icons-outlined font-sm">block</span>
                <span>{{ isSubmittingAction ? 'Cancelling...' : 'Confirm Cancellation' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-finance { background-color: rgba(99, 102, 241, 0.15); color: #6366f1; }
    .badge-approved { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-rejected { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-cancelled { background-color: rgba(100, 116, 139, 0.15); color: var(--text-secondary); }
    .badge-contract { background-color: rgba(76, 58, 147, 0.15); color: var(--brand-primary); }
  `]
})
export class BookingsComponent implements OnInit {
  private salesService = inject(SalesService);
  private propertiesService = inject(PropertiesService);
  public authService = inject(AuthService);

  bookings: any[] = [];
  filteredBookings: any[] = [];
  customers: any[] = [];
  properties: any[] = [];
  units: any[] = [];
  reservations: any[] = [];
  quotations: any[] = [];

  searchQuery = '';
  showCreateModal = false;
  showRejectModal = false;
  showFinanceModal = false;
  showCancelModal = false;
  isSubmittingAction = false;

  selectedBooking: any = null;
  rejectReason = '';
  financeAction: 'APPROVE' | 'REJECT' = 'APPROVE';
  financeComment = '';
  cancelReason = '';

  successMessage = '';
  errorMessage = '';

  newBooking = {
    customerId: 0,
    propertyId: 0,
    unitId: 0,
    reservationId: null as number | null,
    quotationId: null as number | null,
    bookingDate: '',
    bookingAmount: 0,
    remarks: ''
  };

  ngOnInit() {
    this.loadBookings();
    this.loadCustomers();
    this.loadProperties();
    this.loadReservationsAndQuotes();
    
    this.newBooking.bookingDate = this.formatDate(new Date());
  }

  loadBookings() {
    this.salesService.getBookings().subscribe({
      next: (res) => {
        this.bookings = res;
        this.filteredBookings = res;
      },
      error: (err) => console.error('Error loading bookings', err)
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

  loadReservationsAndQuotes() {
    this.salesService.getReservations().subscribe({
      next: (res) => {
        this.reservations = res.filter((r: any) => r.status === 'RESERVED');
      },
      error: (err) => console.error('Error loading reservations', err)
    });
    this.salesService.getQuotations().subscribe({
      next: (res) => {
        this.quotations = res.filter((q: any) => q.status === 'ACCEPTED' || q.status === 'SENT' || q.status === 'DRAFT');
      },
      error: (err) => console.error('Error loading quotations', err)
    });
  }

  onReservationChange() {
    if (!this.newBooking.reservationId) return;
    const res = this.reservations.find(r => r.id == this.newBooking.reservationId);
    if (res) {
      this.newBooking.customerId = res.customer?.id || 0;
      this.newBooking.propertyId = res.property?.id || 0;
      this.onPropertyChange();
      this.newBooking.unitId = res.unit?.id || 0;
      if (res.reservationFee) {
        this.newBooking.bookingAmount = Number(res.reservationFee);
      }
    }
  }

  onQuotationChange() {
    if (!this.newBooking.quotationId) return;
    const q = this.quotations.find(qt => qt.id == this.newBooking.quotationId);
    if (q) {
      this.newBooking.customerId = q.customer?.id || 0;
      this.newBooking.propertyId = q.property?.id || 0;
      this.onPropertyChange();
      this.newBooking.unitId = q.unit?.id || 0;
      // booking deposit could be partial percentage or the whole, default to quote total or typical 10%
      this.newBooking.bookingAmount = Math.round(q.totalAmount * 0.1);
    }
  }

  onPropertyChange() {
    this.newBooking.unitId = 0;
    this.units = [];
    if (this.newBooking.propertyId === 0) return;

    this.propertiesService.getUnits({ propertyId: this.newBooking.propertyId }).subscribe({
      next: (res) => {
        this.units = res.items || res;
      },
      error: (err) => console.error('Error fetching units', err)
    });
  }

  onSearchChange() {
    if (!this.searchQuery.trim()) {
      this.filteredBookings = this.bookings;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredBookings = this.bookings.filter(b => 
      b.bookingNo?.toLowerCase().includes(q) ||
      b.customer?.fullName?.toLowerCase().includes(q) ||
      b.property?.propertyName?.toLowerCase().includes(q) ||
      b.unit?.unitNumber?.toLowerCase().includes(q)
    );
  }

  getBookingStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'PENDING_SALES': return 'badge-pending';
      case 'PENDING_FINANCE': return 'badge-finance';
      case 'APPROVED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      case 'CANCELLED': return 'badge-cancelled';
      case 'CONTRACT_CREATED': return 'badge-contract';
      default: return 'badge-pending';
    }
  }

  getBookingStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'PENDING_SALES': return 'Pending Sales Mgr';
      case 'PENDING_FINANCE': return 'Pending Finance';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'CANCELLED': return 'Cancelled';
      case 'CONTRACT_CREATED': return 'Contract Executed';
      default: return status || 'Pending';
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.newBooking.customerId = 0;
    this.newBooking.propertyId = 0;
    this.newBooking.unitId = 0;
    this.newBooking.reservationId = null;
    this.newBooking.quotationId = null;
    this.newBooking.bookingAmount = 0;
    this.newBooking.remarks = '';
    this.newBooking.bookingDate = this.formatDate(new Date());
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  onSubmitBooking(event: Event) {
    event.preventDefault();
    if (this.newBooking.customerId === 0 || this.newBooking.propertyId === 0 || this.newBooking.unitId === 0) return;

    const payload = {
      customerId: +this.newBooking.customerId,
      propertyId: +this.newBooking.propertyId,
      unitId: +this.newBooking.unitId,
      reservationId: this.newBooking.reservationId ? +this.newBooking.reservationId : undefined,
      quotationId: this.newBooking.quotationId ? +this.newBooking.quotationId : undefined,
      bookingDate: new Date(this.newBooking.bookingDate),
      bookingAmount: +this.newBooking.bookingAmount,
      remarks: this.newBooking.remarks || undefined
    };

    this.salesService.createBooking(payload).subscribe({
      next: (res) => {
        this.successMessage = `Booking ${res.bookingNo} logged with deposit ETB ${Number(res.bookingAmount).toLocaleString()}! It is now pending Sales Manager approval.`;
        this.loadBookings();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating booking', err);
        this.errorMessage = err.error?.message || 'Failed to create booking.';
      }
    });
  }

  // --- TC-5.15 Stage 1: Sales Manager Approval ---
  onSalesApprove(id: number) {
    this.salesService.approveBooking(id, 1).subscribe({
      next: (res) => {
        this.successMessage = `Booking #${res.bookingNo} approved by Sales! It is now forwarded to Finance Department for down payment verification.`;
        this.loadBookings();
      },
      error: (err) => {
        console.error('Error approving booking at sales stage', err);
        this.errorMessage = err.error?.message || 'Failed to approve booking.';
      }
    });
  }

  // --- TC-5.14: Rejection Workflow ---
  openRejectModal(b: any) {
    this.selectedBooking = b;
    this.rejectReason = '';
    this.showRejectModal = true;
    this.isSubmittingAction = false;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedBooking = null;
    this.isSubmittingAction = false;
  }

  onSubmitReject(event: Event) {
    event.preventDefault();
    if (!this.selectedBooking || !this.rejectReason.trim()) return;

    this.isSubmittingAction = true;
    this.salesService.rejectBooking(this.selectedBooking.id, this.rejectReason.trim()).subscribe({
      next: (res) => {
        this.isSubmittingAction = false;
        this.closeRejectModal();
        this.successMessage = `Booking #${res.bookingNo} has been rejected. Unit has been returned to Available inventory.`;
        this.loadBookings();
      },
      error: (err) => {
        this.isSubmittingAction = false;
        console.error('Error rejecting booking:', err);
        this.errorMessage = err.error?.message || 'Failed to reject booking.';
      }
    });
  }

  // --- TC-5.15 Stage 2: Finance Review ---
  openFinanceReviewModal(b: any, action: 'APPROVE' | 'REJECT') {
    this.selectedBooking = b;
    this.financeAction = action;
    this.financeComment = action === 'APPROVE' ? 'Down payment bank transfer slip verified' : '';
    this.showFinanceModal = true;
    this.isSubmittingAction = false;
  }

  closeFinanceModal() {
    this.showFinanceModal = false;
    this.selectedBooking = null;
    this.isSubmittingAction = false;
  }

  closeFinanceReviewModal() {
    this.closeFinanceModal();
  }

  onSubmitFinanceReview(event: Event) {
    event.preventDefault();
    if (!this.selectedBooking) return;
    if (this.financeAction === 'REJECT' && !this.financeComment.trim()) return;

    this.isSubmittingAction = true;
    this.salesService.financeReviewBooking(this.selectedBooking.id, this.financeAction, this.financeComment.trim()).subscribe({
      next: (res) => {
        this.isSubmittingAction = false;
        this.closeFinanceReviewModal();
        if (this.financeAction === 'APPROVE') {
          this.successMessage = `Booking #${res.bookingNo} has received Final Finance Approval! Unit is now locked as SOLD.`;
        } else {
          this.successMessage = `Booking #${res.bookingNo} was rejected by Finance. Unit returned to Available inventory.`;
        }
        this.loadBookings();
      },
      error: (err) => {
        this.isSubmittingAction = false;
        console.error('Error reviewing finance booking:', err);
        this.errorMessage = err.error?.message || 'Failed to process finance review.';
      }
    });
  }

  // --- TC-5.16: Cancellation with Mandatory Reason ---
  openCancelModal(b: any) {
    this.selectedBooking = b;
    this.cancelReason = '';
    this.showCancelModal = true;
    this.isSubmittingAction = false;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.selectedBooking = null;
    this.isSubmittingAction = false;
  }

  onSubmitCancel(event: Event) {
    event.preventDefault();
    if (!this.selectedBooking || !this.cancelReason.trim()) return;

    this.isSubmittingAction = true;
    this.salesService.cancelBooking(this.selectedBooking.id, this.cancelReason.trim()).subscribe({
      next: (res) => {
        this.isSubmittingAction = false;
        this.closeCancelModal();
        this.successMessage = `Booking #${res.bookingNo} cancelled with reason recorded. Unit released back to Available inventory.`;
        this.loadBookings();
      },
      error: (err) => {
        this.isSubmittingAction = false;
        console.error('Error cancelling booking:', err);
        this.errorMessage = err.error?.message || 'Failed to cancel booking.';
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
