import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertiesService } from '../../../../services/properties.service';
import { AuthService } from '../../../../services/auth.service';
import { environment } from '../../../../config';

@Component({
  selector: 'app-unit-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Floating Toast Notifications -->
    <div *ngIf="toastSuccess" class="floating-toast success" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; color: white; padding: 12px 20px; border-radius: 6px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 14px; background: #10b981; animation: toastSlideIn 0.3s ease-out;">
      <span class="material-icons-outlined">check_circle</span>
      <span>{{ toastSuccess }}</span>
    </div>
    <div *ngIf="toastError" class="floating-toast error" style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; color: white; padding: 12px 20px; border-radius: 6px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 14px; background: #ef4444; animation: toastSlideIn 0.3s ease-out;">
      <span class="material-icons-outlined">error_outline</span>
      <span>{{ toastError }}</span>
    </div>

    <header class="app-header flex justify-between align-center">
      <div class="app-title-section">
        <div class="flex align-center gap-2">
          <a routerLink="/properties/units" class="btn btn-secondary btn-sm flex align-center gap-1" style="margin-right: 8px;">
            <span class="material-icons-outlined font-sm">arrow_back</span> Back
          </a>
          <div>
            <h1>Unit: {{ unit?.unitCode || 'Loading...' }}</h1>
            <p>{{ unit?.title || unit?.property?.propertyName || '' }}</p>
          </div>
        </div>
      </div>
      <div class="app-header-actions flex gap-2" *ngIf="unit">
        <button class="btn btn-secondary flex align-center gap-2" (click)="openPriceRequestModal()" title="Submit Price Change Request for Manager Approval">
          <span class="material-icons-outlined font-sm text-indigo">request_quote</span> Request Price Approval
        </button>
        <button class="btn btn-primary flex align-center gap-2" (click)="openEditModal()">
          <span class="material-icons-outlined font-sm">edit</span> Edit Unit
        </button>
      </div>
    </header>

    <div *ngIf="!unit" class="text-center py-6 text-secondary">Loading unit details...</div>

    <div *ngIf="unit" class="unit-details-layout">
      <!-- Profile Card -->
      <div class="card p-6">
        <div class="info-header border-bottom flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">apartment</span>
            <h3>Unit Profile</h3>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openEditModal()">
              <span class="material-icons-outlined font-xs">edit</span> Quick Edit
            </button>
          </div>
        </div>
        <div class="details-list mt-3">
          <div class="details-item"><span class="label">Unit Code</span><span class="val font-mono">{{ unit.unitCode }}</span></div>
          <div class="details-item"><span class="label">Unit Number</span><span class="val">{{ unit.unitNumber }}</span></div>
          <div class="details-item"><span class="label">Property</span><span class="val">{{ unit.property?.propertyName || '-' }}</span></div>
          <div class="details-item"><span class="label">Building</span><span class="val">{{ unit.building?.buildingName || '-' }}</span></div>
          <div class="details-item"><span class="label">Floor</span><span class="val">Floor {{ unit.floor?.floorNumber ?? '-' }}</span></div>
          <div class="details-item"><span class="label">Type</span><span class="val">{{ unit.unitType?.typeName || '-' }}</span></div>
          <div class="details-item"><span class="label">Status</span>
            <span class="badge" [style.background-color]="unit.unitStatus?.colorCode || '#28a745'">{{ unit.unitStatus?.statusName || 'Available' }}</span>
          </div>
          <div class="details-item"><span class="label">Area (Gross)</span><span class="val">{{ unit.grossArea || unit.areaSuperBuiltup || '-' }} m²</span></div>
          <div class="details-item" *ngIf="unit.netArea"><span class="label">Area (Net)</span><span class="val">{{ unit.netArea }} m²</span></div>
          <div class="details-item"><span class="label">Bedrooms / Bathrooms</span><span class="val">{{ unit.bedroomCount ?? '-' }} / {{ unit.bathroomCount ?? '-' }}</span></div>
          <div class="details-item">
            <span class="label">Current Price</span>
            <span class="val font-bold flex align-center gap-2">
              {{ unit.currentPrice ? ('ETB ' + (unit.currentPrice | number)) : 'Not Priced' }}
              <span class="badge" [class.badge-new]="unit.isNegotiable" [class.badge-low]="!unit.isNegotiable" style="font-size: 10px;">
                {{ unit.isNegotiable ? 'Negotiable' : 'Fixed Price' }}
              </span>
            </span>
          </div>
          <div class="details-item" *ngIf="unit.viewType"><span class="label">View</span><span class="val">{{ unit.viewType }}</span></div>
          <div class="details-item" *ngIf="unit.facing"><span class="label">Facing</span><span class="val">{{ unit.facing }}</span></div>
          <div class="details-item" *ngIf="unit.remarks"><span class="label">Remarks</span><span class="val" style="font-style: italic;">{{ unit.remarks }}</span></div>
        </div>
        <div class="flex gap-2 flex-wrap mt-3">
          <span class="badge badge-indigo" *ngIf="unit.isFurnished" style="font-size: 10px;">Furnished</span>
          <span class="badge badge-indigo" *ngIf="unit.isCornerUnit" style="font-size: 10px;">Corner Unit</span>
          <span class="badge badge-qualified" *ngIf="unit.isFeatured" style="font-size: 10px;">Featured</span>
          <span class="badge badge-new" *ngIf="unit.isNegotiable" style="font-size: 10px;">Negotiable</span>
        </div>
      </div>

      <!-- Floor Plan Preview -->
      <div class="card p-6" *ngIf="unit.floor?.floorPlan">
        <div class="info-header border-bottom">
          <span class="material-icons-outlined text-indigo">map</span>
          <h3>Floor Plan</h3>
        </div>
        <div class="mt-3" style="text-align: center;">
          <ng-container *ngIf="isImagePlan(unit.floor.floorPlan)">
            <img [src]="getFileUrl(unit.floor.floorPlan.filePath)" style="max-width: 100%; max-height: 400px; border-radius: var(--radius-md); border: 1px solid var(--border-color);" />
          </ng-container>
          <ng-container *ngIf="isPdfPlan(unit.floor.floorPlan)">
            <iframe [src]="getFileUrl(unit.floor.floorPlan.filePath)" style="width: 100%; height: 500px; border: 1px solid var(--border-color); border-radius: var(--radius-md);"></iframe>
          </ng-container>
          <p class="text-secondary font-xs mt-2">{{ unit.floor.floorPlan.planName }} (v{{ unit.floor.floorPlan.versionNumber || 1 }})</p>
        </div>
      </div>

      <!-- Media Gallery -->
      <div class="card p-6" *ngIf="unit.media && unit.media.length > 0">
        <div class="info-header border-bottom">
          <span class="material-icons-outlined text-indigo">photo_library</span>
          <h3>Property Images</h3>
        </div>
        <div class="flex flex-wrap gap-3 mt-3">
          <div *ngFor="let m of unit.media" style="width: 140px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color);">
            <img [src]="getFileUrl(m.filePath)" style="width: 100%; height: 100px; object-fit: cover;" />
            <div style="padding: 4px 6px; font-size: 10px;" class="text-secondary">
              {{ m.isFeatured ? 'Cover' : (m.mediaType || 'Gallery') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Unit Price History (TC-3.33) -->
      <div class="card p-6">
        <div class="info-header border-bottom flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">payments</span>
            <h3>Unit Price History (Audit Trail)</h3>
          </div>
          <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openPriceRequestModal()">
            <span class="material-icons-outlined font-xs text-indigo">add</span> Request Price Revision
          </button>
        </div>
        <div class="table-container mt-3" *ngIf="priceHistoryList && priceHistoryList.length > 0">
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
              <tr *ngFor="let h of priceHistoryList">
                <td>{{ h.changedAt | date:'medium' }}</td>
                <td class="text-secondary">{{ h.oldPrice ? ('ETB ' + (h.oldPrice | number)) : 'Not Priced' }}</td>
                <td class="font-bold text-main">ETB {{ h.newPrice | number }}</td>
                <td>
                  <span class="badge" [class.badge-new]="h.isNegotiable" [class.badge-low]="!h.isNegotiable" style="font-size: 10px;">
                    {{ h.isNegotiable ? 'Negotiable' : 'Fixed Price' }}
                  </span>
                </td>
                <td><strong>{{ h.changedByName || 'System Administrator' }}</strong></td>
                <td class="text-secondary" style="font-style: italic;">{{ h.changeReason || 'Direct price update' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div *ngIf="!priceHistoryList || priceHistoryList.length === 0" class="text-center py-4 text-secondary italic font-sm">
          No price revisions recorded yet. Price updates will appear here automatically with full audit attribution.
        </div>
      </div>

      <!-- Status History -->
      <div class="card p-6">
        <div class="info-header border-bottom">
          <span class="material-icons-outlined text-indigo">history</span>
          <h3>Status Lifecycle Log</h3>
        </div>
        <div class="activity-timeline mt-3" *ngIf="unit.statusHistory && unit.statusHistory.length > 0">
          <div class="timeline-item" *ngFor="let h of unit.statusHistory">
            <div class="timeline-body" style="padding-left: 12px; border-left: 2px solid var(--brand-primary); margin-left: 6px; padding-bottom: 12px;">
              <div class="timeline-header flex justify-between">
                <span class="badge" [style.background-color]="h.newStatus?.colorCode || '#28a745'" style="color: #fff; font-weight: 600;">{{ h.newStatus?.statusName }}</span>
                <span class="timeline-date font-xs text-secondary">{{ h.changedAt | date:'short' }}</span>
              </div>
              <p class="mt-1 text-main font-sm">{{ h.reason || 'No details provided.' }}</p>
              <span class="font-xs text-secondary" *ngIf="h.changedByName" style="display: block; margin-top: 2px;">By: {{ h.changedByName }}</span>
            </div>
          </div>
        </div>
        <div *ngIf="!unit.statusHistory || unit.statusHistory.length === 0" class="text-center py-4 text-secondary italic font-sm">No status transitions recorded.</div>
      </div>

      <!-- Field Modification Audit Log (TC-3.19) -->
      <div class="card p-6">
        <div class="info-header border-bottom">
          <span class="material-icons-outlined text-indigo">fact_check</span>
          <h3>Field Modification Log (Audit Trail)</h3>
        </div>
        <div class="table-container mt-3" *ngIf="auditLog && auditLog.length > 0">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Changed By</th>
                <th>Modification Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of auditLog">
                <td class="font-mono font-bold text-indigo">{{ a.fieldName }}</td>
                <td class="text-secondary"><span class="badge badge-low">{{ a.oldValue || 'None' }}</span></td>
                <td class="font-bold"><span class="badge badge-qualified">{{ a.newValue || 'None' }}</span></td>
                <td><strong>{{ a.changedBy || 'System' }}</strong></td>
                <td>{{ a.changedAt | date:'medium' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div *ngIf="!auditLog || auditLog.length === 0" class="text-center py-4 text-secondary italic font-sm">No field modifications recorded yet. Click "Edit Unit" above to modify any attribute.</div>
      </div>
    </div>

    <!-- Edit Unit Modal -->
    <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
      <div class="modal-container" style="max-width: 650px; width: 90vw;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Edit Unit: {{ unit?.unitCode }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeEditModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <form (submit)="onSubmitEditUnit($event)">
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Unit Number <span class="text-danger">*</span></label>
                <input type="text" [(ngModel)]="editForm.unitNumber" name="unitNumber" required style="padding: 8px;" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">View</label>
                <input type="text" [(ngModel)]="editForm.viewType" name="viewType" placeholder="e.g. City View, Pool View" style="padding: 8px;" />
              </div>
            </div>

            <div class="form-row flex gap-3 mt-2">
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Gross Area (m²)</label>
                <input type="number" [(ngModel)]="editForm.grossArea" name="grossArea" step="0.01" style="padding: 8px;" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Net Area (m²)</label>
                <input type="number" [(ngModel)]="editForm.netArea" name="netArea" step="0.01" style="padding: 8px;" />
              </div>
            </div>

            <div class="form-row flex gap-3 mt-2">
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Bedrooms</label>
                <input type="number" [(ngModel)]="editForm.bedroomCount" name="bedroomCount" min="0" style="padding: 8px;" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Bathrooms</label>
                <input type="number" [(ngModel)]="editForm.bathroomCount" name="bathroomCount" min="0" style="padding: 8px;" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Facing</label>
                <input type="text" [(ngModel)]="editForm.facing" name="facing" placeholder="e.g. East, North-West" style="padding: 8px;" />
              </div>
            </div>

            <!-- General Unit Feature Checkboxes -->
            <div class="flex gap-4 mt-3 flex-wrap" style="padding: 10px 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
              <label class="flex align-center gap-2 font-xs font-bold cursor-pointer">
                <input type="checkbox" [(ngModel)]="editForm.isFurnished" name="isFurnished" />
                Furnished
              </label>
              <label class="flex align-center gap-2 font-xs font-bold cursor-pointer">
                <input type="checkbox" [(ngModel)]="editForm.isCornerUnit" name="isCornerUnit" />
                Corner Unit
              </label>
              <label class="flex align-center gap-2 font-xs font-bold cursor-pointer">
                <input type="checkbox" [(ngModel)]="editForm.isFeatured" name="isFeatured" />
                Featured Unit
              </label>
            </div>

            <!-- Pricing Section: Current Price -> Left-aligned Negotiable checkbox -> Price Change Reason -->
            <div class="card p-3 mt-3" style="border: 1px solid var(--border-color); border-radius: 8px; background: rgba(255, 255, 255, 0.02);">
              <div class="form-group flex flex-col">
                <label class="font-xs font-bold text-secondary">Current Price (ETB)</label>
                <input type="number" [(ngModel)]="editForm.currentPrice" name="currentPrice" placeholder="0" style="padding: 9px 12px; font-weight: 600; font-size: 15px; width: 100%; border-radius: 6px; border: 1px solid var(--border-color);" />
              </div>

              <!-- Left-aligned checkbox under price input -->
              <div class="flex align-center justify-start gap-2 mt-2" style="text-align: left;">
                <input type="checkbox" [(ngModel)]="editForm.isNegotiable" name="isNegotiable" id="editNegCheck" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--brand-primary); margin: 0;" />
                <label for="editNegCheck" class="cursor-pointer font-xs font-bold text-indigo" style="user-select: none; margin: 0; display: inline;">Negotiable Price Option</label>
              </div>

              <div class="form-group flex flex-col mt-3">
                <label class="font-xs font-bold text-secondary">Price Change Reason / Audit Note</label>
                <input type="text" [(ngModel)]="editForm.priceChangeReason" name="priceChangeReason" placeholder="e.g. Market appraisal adjustment" style="padding: 8px 12px; width: 100%; border-radius: 6px; border: 1px solid var(--border-color);" />
              </div>
            </div>

            <div class="form-group flex flex-col mt-3">
              <label class="font-xs font-bold text-secondary">Remarks</label>
              <textarea [(ngModel)]="editForm.remarks" name="remarks" rows="2" style="padding: 8px;"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editForm.unitNumber">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Request Price Change Approval Modal (TC-3.37) -->
    <div class="modal-overlay" *ngIf="showPriceRequestModal" (click)="closePriceRequestModal()">
      <div class="modal-container" style="max-width: 520px; width: 90vw;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">request_quote</span>
            <h2>Submit Price Approval Request</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closePriceRequestModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <form (submit)="onSubmitPriceRequest($event)">
            <div class="p-3 mb-3 bg-main border" style="border-radius: var(--radius-sm);">
              <div class="flex justify-between font-xs">
                <span class="text-secondary">Current Listed Price:</span>
                <strong class="text-main">{{ unit?.currentPrice ? ('ETB ' + (unit.currentPrice | number)) : 'Not Priced' }}</strong>
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label class="font-xs font-bold text-secondary">Proposed Price (ETB) <span class="text-danger">*</span></label>
              <input type="number" [(ngModel)]="priceRequestForm.proposedPrice" name="propPrice" required placeholder="Enter proposed amount" style="padding: 8px;" />
            </div>

            <div class="form-group flex align-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" [(ngModel)]="priceRequestForm.isNegotiable" name="reqNegotiable" id="reqNeg" />
              <label for="reqNeg" class="font-xs font-bold text-secondary cursor-pointer">Mark as Negotiable Price</label>
            </div>

            <div class="form-group flex flex-col mt-3">
              <label class="font-xs font-bold text-secondary">Reason / Justification <span class="text-danger">*</span></label>
              <textarea [(ngModel)]="priceRequestForm.reason" name="reqReason" required rows="3" placeholder="Provide justification for manager review..." style="padding: 8px;"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closePriceRequestModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!priceRequestForm.proposedPrice || !priceRequestForm.reason">Submit for Approval</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unit-details-layout {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .details-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .details-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .details-item .label {
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 13px;
    }
    .details-item .val {
      color: var(--text-main);
      font-weight: 600;
      font-size: 13px;
    }
    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 12px;
    }
    .mt-3 { margin-top: 12px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    @keyframes toastSlideIn {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class UnitDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private propertiesService = inject(PropertiesService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  unit: any = null;
  auditLog: any[] = [];
  priceHistoryList: any[] = [];
  toastSuccess = '';
  toastError = '';

  showToast(message: string, isError = false) {
    if (isError) {
      this.toastError = message;
      setTimeout(() => {
        this.toastError = '';
        this.cdr.detectChanges();
      }, 5000);
    } else {
      this.toastSuccess = message;
      setTimeout(() => {
        this.toastSuccess = '';
        this.cdr.detectChanges();
      }, 5000);
    }
    this.cdr.detectChanges();
  }

  showEditModal = false;
  editForm: any = {
    unitNumber: '',
    grossArea: null,
    netArea: null,
    bedroomCount: null,
    bathroomCount: null,
    currentPrice: null,
    viewType: '',
    facing: '',
    remarks: '',
    isNegotiable: false,
    isFurnished: false,
    isCornerUnit: false,
    isFeatured: false,
    priceChangeReason: ''
  };

  showPriceRequestModal = false;
  priceRequestForm: any = {
    proposedPrice: null,
    isNegotiable: false,
    reason: ''
  };

  ngOnInit() {
    const id = +this.route.snapshot.params['id'];
    this.loadUnit(id);
    this.loadAuditLog(id);
    this.loadPriceHistory(id);
  }

  loadUnit(id: number) {
    this.propertiesService.getUnit(id).subscribe({
      next: (res) => {
        this.unit = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading unit details:', err)
    });
  }

  loadAuditLog(id: number) {
    this.propertiesService.getUnitAuditLog(id).subscribe({
      next: (res) => {
        this.auditLog = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading audit log:', err)
    });
  }

  loadPriceHistory(id: number) {
    this.propertiesService.getUnitPriceHistory(id).subscribe({
      next: (res) => {
        this.priceHistoryList = res ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading price history:', err)
    });
  }

  openEditModal() {
    if (!this.unit) return;
    this.editForm = {
      unitNumber: this.unit.unitNumber || '',
      grossArea: this.unit.grossArea || this.unit.areaSuperBuiltup || null,
      netArea: this.unit.netArea || null,
      bedroomCount: this.unit.bedroomCount ?? null,
      bathroomCount: this.unit.bathroomCount ?? null,
      currentPrice: this.unit.currentPrice ? Number(this.unit.currentPrice) : null,
      viewType: this.unit.viewType || '',
      facing: this.unit.facing || '',
      remarks: this.unit.remarks || '',
      isNegotiable: !!this.unit.isNegotiable,
      isFurnished: !!this.unit.isFurnished,
      isCornerUnit: !!this.unit.isCornerUnit,
      isFeatured: !!this.unit.isFeatured,
      priceChangeReason: ''
    };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.cdr.detectChanges();
  }

  onSubmitEditUnit(event: Event) {
    event.preventDefault();
    if (!this.unit) return;

    this.propertiesService.updateUnit(this.unit.id, this.editForm).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadUnit(this.unit.id);
        this.loadAuditLog(this.unit.id);
        this.loadPriceHistory(this.unit.id);
        this.showToast('Unit updated successfully!');
      },
      error: (err) => {
        console.error('Error updating unit:', err);
        const errMsg = err.error?.message || err.message || 'An error occurred while updating the unit.';
        this.showToast(errMsg, true);
      }
    });
  }

  openPriceRequestModal() {
    if (!this.unit) return;
    this.priceRequestForm = {
      proposedPrice: this.unit.currentPrice ? Number(this.unit.currentPrice) : null,
      isNegotiable: !!this.unit.isNegotiable,
      reason: ''
    };
    this.showPriceRequestModal = true;
    this.cdr.detectChanges();
  }

  closePriceRequestModal() {
    this.showPriceRequestModal = false;
    this.cdr.detectChanges();
  }

  onSubmitPriceRequest(event: Event) {
    event.preventDefault();
    if (!this.unit || !this.priceRequestForm.proposedPrice || !this.priceRequestForm.reason) return;

    const payload = {
      unitId: this.unit.id,
      proposedPrice: Number(this.priceRequestForm.proposedPrice),
      isNegotiable: !!this.priceRequestForm.isNegotiable,
      reason: this.priceRequestForm.reason
    };

    this.propertiesService.createPriceChangeRequest(payload).subscribe({
      next: () => {
        this.closePriceRequestModal();
        this.showToast('Price change request submitted successfully for Manager approval!');
      },
      error: (err) => {
        console.error('Error submitting price request:', err);
        const errMsg = err.error?.message || 'Failed to submit price request.';
        this.showToast(errMsg, true);
      }
    });
  }

  getFileUrl(filePath: string): string {
    return this.authService.getDownloadUrl(filePath);
  }

  isImagePlan(plan: any): boolean {
    const type = (plan.fileType || plan.mimeType || '').toLowerCase();
    return type.startsWith('image/') || type.includes('png') || type.includes('jpg') || type.includes('jpeg');
  }

  isPdfPlan(plan: any): boolean {
    const type = (plan.fileType || plan.mimeType || '').toLowerCase();
    return type.includes('pdf');
  }
}
