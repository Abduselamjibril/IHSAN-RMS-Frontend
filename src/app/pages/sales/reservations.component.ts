import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { PropertiesService } from '../../services/properties.service';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Reservations Log</h1>
        <p>Manage real estate holdings, lock available inventory, and track reservation expirations</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          New Reservation
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

    <!-- Main Content List -->
    <div class="card glass-card">
      <div class="filter-bar flex justify-between align-center gap-4" style="margin-bottom: 20px;">
        <div class="search-box" style="flex: 1; max-width: 400px;">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by customer, unit number or reservation code..." 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()" 
          />
        </div>
      </div>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Res. Code</th>
              <th>Customer</th>
              <th>Property / Unit</th>
              <th>Reservation Date</th>
              <th>Expiry Date</th>
              <th>Fee (ETB)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filteredReservations">
              <td class="font-mono font-bold">{{ r.reservationNo }}</td>
              <td>{{ r.customer?.fullName }}</td>
              <td>
                <div class="flex flex-col">
                  <span class="font-bold text-main">{{ r.property?.propertyName }}</span>
                  <span class="text-secondary font-xs">Unit: {{ r.unit?.unitNumber }} ({{ r.unit?.unitType?.typeName || 'Unit' }})</span>
                </div>
              </td>
              <td>{{ r.reservationDate | date:'mediumDate' }}</td>
              <td>{{ r.expiryDate | date:'mediumDate' }}</td>
              <td class="font-mono">{{ r.reservationFee ? ('ETB ' + (r.reservationFee | number)) : '-' }}</td>
              <td>
                <span class="badge" [ngClass]="getStatusBadgeClass(r.status)">
                  {{ r.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button 
                    *ngIf="r.status === 'RESERVED'"
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openExtendModal(r)"
                  >
                    <span class="material-icons-outlined font-sm">schedule</span>
                    <span>Extend</span>
                  </button>
                  <button 
                    *ngIf="r.status === 'RESERVED'"
                    class="btn btn-danger btn-sm flex align-center gap-1"
                    (click)="onCancel(r.id)"
                  >
                    <span class="material-icons-outlined font-sm">block</span>
                    <span>Cancel</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredReservations.length === 0">
              <td colspan="8" class="text-center py-6 text-secondary">
                No reservations found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Reservation Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Create New Unit Reservation</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitCreate($event)">
            <!-- Customer (Required) -->
            <div class="form-group flex flex-col">
              <label>Select Customer * [REQUIRED]</label>
              <select [(ngModel)]="newReservation.customerId" name="customerId" required>
                <option [value]="0">-- Select Buyer --</option>
                <option *ngFor="let c of customers" [value]="c.id">{{ c.fullName }} ({{ c.primaryPhone }})</option>
              </select>
            </div>

            <!-- Property (Required) -->
            <div class="form-group flex flex-col">
              <label>Select Property / Project * [REQUIRED]</label>
              <select [(ngModel)]="newReservation.propertyId" name="propertyId" required (change)="onPropertyChange()">
                <option [value]="0">-- Select Property --</option>
                <option *ngFor="let p of properties" [value]="p.id">{{ p.propertyName }} ({{ p.propertyCode }})</option>
              </select>
            </div>

            <!-- Unit (Required) -->
            <div class="form-group flex flex-col">
              <label>Select Development Unit * [REQUIRED]</label>
              <select [(ngModel)]="newReservation.unitId" name="unitId" required [disabled]="newReservation.propertyId === 0">
                <option [value]="0">-- Select Available Unit --</option>
                <option *ngFor="let u of units" [value]="u.id">
                  Unit: {{ u.unitNumber }} - {{ u.unitType?.typeName }} (Floor {{ u.floor?.floorNumber }}) - ETB {{ u.unitPrice?.basePrice | number }}
                </option>
              </select>
              <span class="text-secondary font-xs" style="margin-top: 4px;" *ngIf="units.length === 0 && newReservation.propertyId !== 0">
                No available units found for this property.
              </span>
            </div>

            <div class="form-row flex gap-3">
              <!-- Reservation Date (Required) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Reservation Date * [REQUIRED]</label>
                <input type="datetime-local" [(ngModel)]="newReservation.reservationDate" name="reservationDate" required />
              </div>

              <!-- Expiry Date (Required) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Expiry Date * [REQUIRED]</label>
                <input type="datetime-local" [(ngModel)]="newReservation.expiryDate" name="expiryDate" required />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Reservation Fee (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Reservation Fee (ETB) [OPTIONAL]</label>
                <input type="number" [(ngModel)]="newReservation.reservationFee" name="reservationFee" placeholder="e.g. 50000" />
              </div>

              <!-- Remarks (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Remarks / Scope Details [OPTIONAL]</label>
                <textarea [(ngModel)]="newReservation.remarks" name="remarks" placeholder="Enter holding agreement notes..." rows="2"></textarea>
              </div>
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="newReservation.customerId === 0 || newReservation.propertyId === 0 || newReservation.unitId === 0 || !newReservation.reservationDate || !newReservation.expiryDate"
              >
                Create Reservation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Reservation Extension Modal -->
    <div class="modal-overlay" *ngIf="showExtendModal" (click)="closeExtendModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Request Reservation Extension</h2>
          <button class="header-icon-btn close-btn" (click)="closeExtendModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitExtend($event)">
            <!-- Read-only Reservation Reference (Required) -->
            <div class="form-group flex flex-col">
              <label>Reservation ID / Reference * [REQUIRED]</label>
              <input type="text" [value]="selectedRes?.reservationNo + ' - ' + selectedRes?.customer?.fullName" readonly style="background-color: var(--bg-main);" />
            </div>

            <!-- Current Expiry (Required) -->
            <div class="form-group flex flex-col">
              <label>Current Expiry Date * [REQUIRED]</label>
              <input type="text" [value]="selectedRes?.expiryDate | date:'medium'" readonly style="background-color: var(--bg-main);" />
            </div>

            <!-- Proposed Expiry Date (Required) -->
            <div class="form-group flex flex-col">
              <label>Proposed Expiry Date * [REQUIRED]</label>
              <input type="datetime-local" [(ngModel)]="extensionData.newExpiryDate" name="newExpiryDate" required />
            </div>

            <!-- Reason (Required) -->
            <div class="form-group flex flex-col">
              <label>Extension Reason / Justification * [REQUIRED]</label>
              <textarea [(ngModel)]="extensionData.reason" name="reason" required placeholder="Describe extension purpose (e.g. Bank credit approval delay)..." rows="3"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeExtendModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!extensionData.newExpiryDate || !extensionData.reason">
                Submit Extension
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-reserved { background-color: var(--brand-primary-fade); color: var(--brand-primary); }
    .badge-expired { background-color: rgba(100, 116, 139, 0.15); color: var(--text-secondary); }
    .badge-cancelled { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-booking { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
  `]
})
export class ReservationsComponent implements OnInit {
  private salesService = inject(SalesService);
  private propertiesService = inject(PropertiesService);

  reservations: any[] = [];
  filteredReservations: any[] = [];
  customers: any[] = [];
  properties: any[] = [];
  units: any[] = [];

  searchQuery = '';
  showCreateModal = false;
  showExtendModal = false;
  selectedRes: any = null;
  successMessage = '';
  errorMessage = '';

  newReservation = {
    customerId: 0,
    propertyId: 0,
    unitId: 0,
    reservationDate: '',
    expiryDate: '',
    reservationFee: null as number | null,
    remarks: ''
  };

  extensionData = {
    reservationId: 0,
    newExpiryDate: '',
    reason: ''
  };

  ngOnInit() {
    this.loadReservations();
    this.loadCustomers();
    this.loadProperties();
    
    // Set default dates for new reservation
    const today = new Date();
    const tenDaysLater = new Date(today);
    tenDaysLater.setDate(today.getDate() + 10);
    
    this.newReservation.reservationDate = this.formatDateTimeLocal(today);
    this.newReservation.expiryDate = this.formatDateTimeLocal(tenDaysLater);
  }

  loadReservations() {
    this.salesService.getReservations().subscribe({
      next: (res) => {
        this.reservations = res;
        this.filteredReservations = res;
      },
      error: (err) => console.error('Error fetching reservations', err)
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

  onPropertyChange() {
    this.newReservation.unitId = 0;
    this.units = [];
    if (this.newReservation.propertyId === 0) return;
    
    this.propertiesService.getUnits({ propertyId: this.newReservation.propertyId, unitStatusId: 1 }).subscribe({
      next: (res) => {
        // filter for Available (statusName contains 'Available' or unitStatusId === 1)
        this.units = (res.items || res).filter((u: any) => u.unitStatus?.statusName === 'Available' || u.unitStatusId === 1);
      },
      error: (err) => console.error('Error loading units', err)
    });
  }

  onSearchChange() {
    if (!this.searchQuery.trim()) {
      this.filteredReservations = this.reservations;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredReservations = this.reservations.filter(r => 
      r.reservationNo?.toLowerCase().includes(q) ||
      r.customer?.fullName?.toLowerCase().includes(q) ||
      r.property?.propertyName?.toLowerCase().includes(q) ||
      r.unit?.unitNumber?.toLowerCase().includes(q)
    );
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'RESERVED': return 'badge-reserved';
      case 'EXPIRED': return 'badge-expired';
      case 'CANCELLED': return 'badge-cancelled';
      case 'CONVERTED_TO_BOOKING': return 'badge-booking';
      default: return '';
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Reset properties
    this.newReservation.customerId = 0;
    this.newReservation.propertyId = 0;
    this.newReservation.unitId = 0;
    this.newReservation.remarks = '';
    this.newReservation.reservationFee = null;
    
    const today = new Date();
    const tenDaysLater = new Date(today);
    tenDaysLater.setDate(today.getDate() + 10);
    this.newReservation.reservationDate = this.formatDateTimeLocal(today);
    this.newReservation.expiryDate = this.formatDateTimeLocal(tenDaysLater);
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openExtendModal(res: any) {
    this.selectedRes = res;
    this.showExtendModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    const currentExpiry = new Date(res.expiryDate);
    const extendedExpiry = new Date(currentExpiry);
    extendedExpiry.setDate(currentExpiry.getDate() + 7); // Default extension +7 days
    
    this.extensionData = {
      reservationId: res.id,
      newExpiryDate: this.formatDateTimeLocal(extendedExpiry),
      reason: ''
    };
  }

  closeExtendModal() {
    this.showExtendModal = false;
  }

  onSubmitCreate(event: Event) {
    event.preventDefault();
    if (this.newReservation.customerId === 0 || this.newReservation.propertyId === 0 || this.newReservation.unitId === 0) return;
    
    const payload = {
      ...this.newReservation,
      reservationDate: new Date(this.newReservation.reservationDate),
      expiryDate: new Date(this.newReservation.expiryDate),
      customerId: +this.newReservation.customerId,
      propertyId: +this.newReservation.propertyId,
      unitId: +this.newReservation.unitId,
      reservationFee: this.newReservation.reservationFee ? +this.newReservation.reservationFee : undefined
    };

    this.salesService.createReservation(payload).subscribe({
      next: (res) => {
        this.successMessage = `Reservation ${res.reservationNo} created and unit status updated to RESERVED!`;
        this.loadReservations();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating reservation', err);
        this.errorMessage = err.error?.message || 'Failed to create reservation.';
      }
    });
  }

  onSubmitExtend(event: Event) {
    event.preventDefault();
    if (!this.extensionData.newExpiryDate || !this.extensionData.reason) return;
    
    const payload = {
      reservationId: +this.extensionData.reservationId,
      newExpiryDate: new Date(this.extensionData.newExpiryDate),
      reason: this.extensionData.reason
    };

    this.salesService.extendReservation(payload).subscribe({
      next: (res) => {
        this.successMessage = `Reservation extension approved. New Expiry is ${new Date(res.newExpiryDate).toLocaleDateString()}!`;
        this.loadReservations();
        this.closeExtendModal();
      },
      error: (err) => {
        console.error('Error extending reservation', err);
        this.errorMessage = err.error?.message || 'Failed to extend reservation.';
      }
    });
  }

  onCancel(id: number) {
    if (!confirm('Are you sure you want to cancel this reservation? This will return the unit status to Available.')) return;
    
    this.salesService.cancelReservation(id).subscribe({
      next: (res) => {
        this.successMessage = `Reservation cancelled. Unit is now available!`;
        this.loadReservations();
      },
      error: (err) => {
        console.error('Error cancelling reservation', err);
        this.errorMessage = err.error?.message || 'Failed to cancel reservation.';
      }
    });
  }

  private formatDateTimeLocal(date: Date): string {
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  }
}
