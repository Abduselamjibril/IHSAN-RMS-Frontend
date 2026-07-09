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
              <th>Deposit Paid (ETB)</th>
              <th>Linked Reservation/Quote</th>
              <th>Status</th>
              <th>Approver / Date</th>
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
                  <span class="text-secondary font-xs">Unit: {{ b.unit?.unitNumber }}</span>
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
                  {{ b.status }}
                </span>
              </td>
              <td>
                <div *ngIf="b.status === 'APPROVED'" class="text-secondary font-xs">
                  Approved by User #{{ b.approvedBy || 1 }}<br>
                  on {{ b.approvedAt | date:'shortDate' }}
                </div>
                <div *ngIf="b.status === 'PENDING'" class="text-secondary italic font-xs">
                  Awaiting Approval
                </div>
                <div *ngIf="b.status === 'CANCELLED'" class="text-secondary italic font-xs">
                  Cancelled Booking
                </div>
                <div *ngIf="b.status === 'CONTRACT_CREATED'" class="text-secondary font-xs">
                  Contract Executed
                </div>
              </td>
              <td>
                <div class="flex gap-2" *ngIf="b.status === 'PENDING'">
                  <button 
                    class="btn btn-primary btn-sm flex align-center gap-1"
                    (click)="onApprove(b.id)"
                  >
                    <span class="material-icons-outlined font-sm">check_circle</span>
                    <span>Approve</span>
                  </button>
                  <button 
                    class="btn btn-danger btn-sm flex align-center gap-1"
                    (click)="onCancel(b.id)"
                  >
                    <span class="material-icons-outlined font-sm">cancel</span>
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
  `,
  styles: [`
    .badge-pending { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-approved { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-cancelled { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
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
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'CANCELLED': return 'badge-cancelled';
      case 'CONTRACT_CREATED': return 'badge-contract';
      default: return '';
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
        this.successMessage = `Booking ${res.bookingNo} created with deposit ETB ${res.bookingAmount.toLocaleString()}! Awaiting manager approval.`;
        this.loadBookings();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating booking', err);
        this.errorMessage = err.error?.message || 'Failed to create booking.';
      }
    });
  }

  onApprove(id: number) {
    this.salesService.approveBooking(id, 1).subscribe({
      next: (res) => {
        this.successMessage = `Booking ${res.bookingNo} is approved successfully! Inventory status updated.`;
        this.loadBookings();
      },
      error: (err) => {
        console.error('Error approving booking', err);
        this.errorMessage = err.error?.message || 'Failed to approve booking.';
      }
    });
  }

  onCancel(id: number) {
    customConfirm('Are you sure you want to cancel this booking?').then(confirmed => {
      if (confirmed) {
        this.salesService.cancelBooking(id).subscribe({
          next: (res) => {
            this.successMessage = `Booking cancelled successfully. Unit returned to inventory.`;
            this.loadBookings();
          },
          error: (err) => {
            console.error('Error cancelling booking', err);
            this.errorMessage = err.error?.message || 'Failed to cancel booking.';
          }
        });
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
