import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { customConfirm } from '../../utils/confirm';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Contracts & Agreements Registry</h1>
        <p>Register binding property buyer sales agreements and execute official contracts</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-secondary" (click)="openCreateAgreementModal()" *ngIf="authService.hasPermission('sales.contracts.create', 'create')">
          <span class="material-icons-outlined">add</span>
          New Agreement
        </button>
        <button class="btn btn-primary" (click)="openCreateContractModal()" *ngIf="authService.hasPermission('sales.contracts.create', 'create')">
          <span class="material-icons-outlined">gavel</span>
          New Contract
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
        [class.active]="activeTab === 'agreements'" 
        (click)="activeTab = 'agreements'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'agreements' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'agreements' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Sales Agreements
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'contracts'" 
        (click)="activeTab = 'contracts'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'contracts' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'contracts' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Executed Contracts
      </button>
    </div>

    <!-- Sales Agreements Tab -->
    <div class="card glass-card" *ngIf="activeTab === 'agreements'">
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Agreement No</th>
              <th>Customer</th>
              <th>Linked Booking</th>
              <th>Agreement Date</th>
              <th>Version</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of agreements">
              <td class="font-mono font-bold" style="color: var(--brand-primary);">{{ a.agreementNo }}</td>
              <td>
                <div class="flex flex-col">
                  <strong>{{ a.customer?.fullName }}</strong>
                  <span class="text-secondary font-xs">{{ a.customer?.primaryPhone }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="font-mono">{{ a.booking?.bookingNo }}</span>
                  <span class="text-secondary font-xs" *ngIf="a.booking?.unit">Unit {{ a.booking?.unit?.unitNumber || a.booking?.unit?.unitCode }}</span>
                </div>
              </td>
              <td>{{ a.agreementDate | date:'mediumDate' }}</td>
              <td>
                <span class="badge badge-indigo font-mono">v{{ a.agreementVersion || 1 }}.0</span>
              </td>
              <td>
                <span class="badge" [ngClass]="getAgreementStatusBadge(a.status)">
                  {{ a.status }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="flex justify-end gap-2">
                  <!-- TC-5.18: Export PDF -->
                  <button 
                    class="btn btn-primary btn-sm flex align-center gap-1"
                    (click)="openPdfModal(a)"
                    title="Export / Print Vector PDF Agreement"
                    style="padding: 6px 10px; font-size: 12px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 15px;">picture_as_pdf</span>
                    <span>PDF</span>
                  </button>

                  <!-- TC-5.19: Version History -->
                  <button 
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openHistoryModal(a)"
                    title="View Revision & Version History"
                    style="padding: 6px 10px; font-size: 12px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 15px;">history</span>
                    <span>History</span>
                  </button>

                  <!-- TC-5.19: Increment Version & Edit Clauses -->
                  <button 
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openNewVersionModal(a)"
                    title="Edit terms & increment version"
                    style="padding: 6px 10px; font-size: 12px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 15px;">edit_note</span>
                    <span>v+ Edit</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="agreements.length === 0">
              <td colspan="7" class="text-center py-6 text-secondary">
                No agreements logged yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Executed Contracts Tab -->
    <div class="card glass-card" *ngIf="activeTab === 'contracts'">
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Contract No</th>
              <th>Customer</th>
              <th>Agreement Ref</th>
              <th>Term Dates</th>
              <th>Contract Amount</th>
              <th>Status</th>
              <th>Legal Documents</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of contracts">
              <td class="font-mono font-bold" style="color: var(--brand-primary);">{{ c.contractNo }}</td>
              <td>
                <div class="flex flex-col">
                  <strong>{{ c.customer?.fullName }}</strong>
                  <span class="text-secondary font-xs">{{ c.customer?.primaryPhone }}</span>
                </div>
              </td>
              <td>{{ c.agreement?.agreementNo || '-' }}</td>
              <td>
                <div class="flex flex-col font-xs text-secondary">
                  <span>Start: {{ c.contractStartDate | date:'mediumDate' }}</span>
                  <span>End: {{ c.contractEndDate | date:'mediumDate' }}</span>
                </div>
              </td>
              <td class="font-mono font-bold">ETB {{ c.contractAmount | number }}</td>
              <td>
                <span class="badge" [ngClass]="getContractStatusBadge(c.status)">
                  {{ c.status }}
                </span>
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <div *ngFor="let doc of c.documents" class="flex align-center justify-between gap-2 font-xs text-secondary" style="border-bottom: 1px dashed rgba(0,0,0,0.05); padding-bottom: 4px; margin-bottom: 4px;">
                    <div class="flex align-center gap-1">
                      <span class="material-icons-outlined" style="font-size: 14px;">description</span>
                      <a [href]="getDownloadUrl(doc.filePath)" target="_blank" class="doc-link">
                        {{ doc.fileName }}
                      </a>
                    </div>
                    <button 
                      type="button" 
                      style="background: none; border: none; color: var(--color-lost); cursor: pointer; padding: 2px; display: inline-flex; align-items: center;"
                      (click)="onDetachDocument(doc.id, doc.fileName)"
                      title="Detach document"
                    >
                      <span class="material-icons-outlined" style="font-size: 14px;">close</span>
                    </button>
                  </div>
                  <span *ngIf="!c.documents || c.documents.length === 0" class="text-secondary italic font-xs">No documents</span>
                </div>
              </td>
              <td style="text-align: right;">
                <div class="flex justify-end flex-wrap gap-2">
                  <!-- TC-5.21: Status Transition -->
                  <button 
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openStatusModal(c)"
                    title="Change Contract Lifecycle Status"
                    style="padding: 6px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">sync_alt</span>
                    <span>Status</span>
                  </button>

                  <!-- TC-5.23: Amendments -->
                  <button 
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openViewAmendmentsModal(c)"
                    title="Manage Amendments / Addenda"
                    style="padding: 6px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">edit_note</span>
                    <span>Amend</span>
                  </button>

                  <button 
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openUploadDocModal(c)"
                    style="padding: 6px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">file_upload</span>
                    <span>Attach</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="contracts.length === 0">
              <td colspan="8" class="text-center py-6 text-secondary">
                No contracts executed yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TC-5.18: SALES AGREEMENT PDF MODAL         -->
    <!-- ========================================== -->
    <div class="modal-overlay" *ngIf="showPdfModal" (click)="closePdfModal()">
      <div class="modal-container agreement-pdf-modal" (click)="$event.stopPropagation()" style="max-width: 900px; width: 95vw; max-height: 92vh; display: flex; flex-direction: column; padding: 0;">
        <div class="modal-header flex justify-between align-center" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; padding: 16px 24px; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: #38bdf8;">gavel</span>
            <h2 style="color: white; margin: 0; font-size: 18px;">Official Sales Agreement #{{ selectedPdfAgreement?.agreementNo }}</h2>
          </div>
          <div class="flex align-center gap-2">
            <button class="btn btn-primary btn-sm flex align-center gap-1" (click)="printAgreementPdf()" style="background-color: #0284c7; border: none;">
              <span class="material-icons-outlined" style="font-size: 16px;">print</span>
              <span>Print / Save PDF</span>
            </button>
            <button class="header-icon-btn close-btn" (click)="closePdfModal()" style="color: white; background: rgba(255,255,255,0.15); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none;">
              <span class="material-icons-outlined" style="font-size: 20px;">close</span>
            </button>
          </div>
        </div>

        <div class="modal-body agreement-print-sheet" style="padding: 32px; overflow-y: auto; background-color: #ffffff; color: #1e293b; font-family: 'Inter', -apple-system, sans-serif;">
          <!-- Corporate Header -->
          <div class="flex justify-between align-center border-bottom pb-4 mb-4" style="border-bottom: 2px solid #0f172a; padding-bottom: 16px;">
            <div class="flex flex-col">
              <div class="flex align-center gap-2">
                <span class="material-icons-outlined" style="color: #0284c7; font-size: 28px;">apartment</span>
                <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">IHSAN REAL ESTATE</span>
              </div>
              <span style="font-size: 12px; color: #64748b; margin-top: 2px;">Premier Luxury Real Estate Developments • Addis Ababa, Ethiopia</span>
            </div>
            <div class="flex flex-col text-right">
              <span style="font-size: 18px; font-weight: 800; color: #0f172a;">PROPERTY SALES AGREEMENT</span>
              <span class="font-mono font-bold" style="color: #0284c7; font-size: 13px;">Ref: {{ selectedPdfAgreement?.agreementNo }}</span>
              <div class="flex align-center justify-end gap-2 mt-1">
                <span class="badge badge-indigo font-mono font-xs">Version {{ selectedPdfAgreement?.agreementVersion || 1 }}.0</span>
                <span class="badge" [ngClass]="getAgreementStatusBadge(selectedPdfAgreement?.status)">{{ selectedPdfAgreement?.status }}</span>
              </div>
            </div>
          </div>

          <!-- Section 1: Agreement Parties -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0284c7;">1. Identification of Parties</h4>
            <div class="grid grid-cols-2 gap-4 font-sm">
              <div>
                <span class="text-secondary block font-xs">SELLER / DEVELOPER:</span>
                <strong>IHSAN Real Estate PLC</strong><br>
                <span class="text-secondary font-xs">Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia<br>Tel: +251 11 663 8899 | Email: sales&#64;ihsanrems.com</span>
              </div>
              <div>
                <span class="text-secondary block font-xs">BUYER / PURCHASER:</span>
                <strong>{{ selectedPdfAgreement?.customer?.fullName }}</strong><br>
                <span class="text-secondary font-xs">
                  Phone: {{ selectedPdfAgreement?.customer?.primaryPhone || 'N/A' }} | Email: {{ selectedPdfAgreement?.customer?.primaryEmail || 'N/A' }}<br>
                  Nationality: {{ selectedPdfAgreement?.customer?.nationality || 'Ethiopian' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Section 2: Property & Technical Unit Specifications -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0284c7;">2. Property & Technical Specifications</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 6px 0; color: #64748b; width: 25%;">Project / Property Name:</td>
                  <td style="padding: 6px 0; font-weight: bold; width: 25%;">{{ selectedPdfAgreement?.booking?.property?.propertyName || 'Ihsan Heights Block A' }}</td>
                  <td style="padding: 6px 0; color: #64748b; width: 25%;">Unit Designation:</td>
                  <td style="padding: 6px 0; font-weight: bold; width: 25%;">Unit {{ selectedPdfAgreement?.booking?.unit?.unitCode || selectedPdfAgreement?.booking?.unit?.unitNumber || '304' }}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 6px 0; color: #64748b;">Unit Type / Model:</td>
                  <td style="padding: 6px 0; font-weight: bold;">{{ selectedPdfAgreement?.booking?.unit?.unitType?.typeName || 'Residential Apartment' }}</td>
                  <td style="padding: 6px 0; color: #64748b;">Floor Level:</td>
                  <td style="padding: 6px 0; font-weight: bold;">Floor {{ selectedPdfAgreement?.booking?.unit?.floorLevel || '3rd Floor' }}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 6px 0; color: #64748b;">Gross Floor Area:</td>
                  <td style="padding: 6px 0; font-weight: bold;">{{ selectedPdfAgreement?.booking?.unit?.grossArea || '120.50' }} m²</td>
                  <td style="padding: 6px 0; color: #64748b;">Bedrooms / Bathrooms:</td>
                  <td style="padding: 6px 0; font-weight: bold;">{{ selectedPdfAgreement?.booking?.unit?.bedroomCount || '2' }} Beds / {{ selectedPdfAgreement?.booking?.unit?.bathroomCount || '2' }} Baths</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">View & Orientation:</td>
                  <td style="padding: 6px 0; font-weight: bold;">{{ selectedPdfAgreement?.booking?.unit?.viewType || 'City Skyline View' }}</td>
                  <td style="padding: 6px 0; color: #64748b;">Agreement Date:</td>
                  <td style="padding: 6px 0; font-weight: bold;">{{ selectedPdfAgreement?.agreementDate | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 3: Financial Considerations & Valuation -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; background-color: #faf5ff;">
            <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #7e22ce;">3. Financial Considerations & Payment Terms</h4>
            <div class="grid grid-cols-3 gap-4 font-sm">
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9d5ff;">
                <span class="text-secondary block font-xs">TOTAL CONTRACT VALUATION</span>
                <strong style="font-size: 16px; font-family: monospace; color: #7e22ce;">
                  ETB {{ (selectedPdfAgreement?.booking?.quotation?.totalAmount || (selectedPdfAgreement?.booking?.bookingAmount * 10) || 2800000) | number }}
                </strong>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9d5ff;">
                <span class="text-secondary block font-xs">INITIAL BOOKING DEPOSIT PAID</span>
                <strong style="font-size: 16px; font-family: monospace; color: #16a34a;">
                  ETB {{ selectedPdfAgreement?.booking?.bookingAmount | number }}
                </strong>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9d5ff;">
                <span class="text-secondary block font-xs">OUTSTANDING INSTALLMENT BALANCE</span>
                <strong style="font-size: 16px; font-family: monospace; color: #0284c7;">
                  ETB {{ ((selectedPdfAgreement?.booking?.quotation?.totalAmount || (selectedPdfAgreement?.booking?.bookingAmount * 10) || 2800000) - (selectedPdfAgreement?.booking?.bookingAmount || 0)) | number }}
                </strong>
              </div>
            </div>
          </div>

          <!-- Section 4: Specific Version Notes or Clauses (if edited) -->
          <div *ngIf="selectedPdfAgreement?.agreementDocument" style="border: 1px solid #fed7aa; background-color: #fffaf0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #ea580c;">Special Conditions & Specific Version Addendum</h4>
            <p style="margin: 0; font-size: 12px; color: #431407; white-space: pre-wrap;">{{ selectedPdfAgreement?.agreementDocument }}</p>
          </div>

          <!-- Section 5: Standard Legal Clauses -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 12px; line-height: 1.6; color: #475569;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0284c7;">5. Standard Legal Clauses & Obligations</h4>
            <p style="margin-bottom: 8px;"><strong>Article 1 (Property Purchase):</strong> The Seller agrees to sell and construct, and the Buyer agrees to purchase the real property unit specified in Section 2 under the terms herein.</p>
            <p style="margin-bottom: 8px;"><strong>Article 2 (Payment Schedule):</strong> The remaining balance shall be payable in scheduled milestone installments in accordance with the registered Contract Installment Plan.</p>
            <p style="margin-bottom: 8px;"><strong>Article 3 (Handover & Title Conveyance):</strong> Physical delivery of the completed unit and transfer of title deeds shall occur upon 100% completion of agreed payments and issuance of the municipal occupancy permit.</p>
            <p style="margin: 0;"><strong>Article 4 (Governing Law & Jurisdiction):</strong> This agreement is executed under the laws of the Federal Democratic Republic of Ethiopia. Disputes shall be settled amicably or before the courts of Addis Ababa.</p>
          </div>

          <!-- Section 6: Signatures -->
          <div class="grid grid-cols-2 gap-8 pt-4" style="border-top: 2px solid #0f172a;">
            <div class="flex flex-col">
              <span class="text-secondary font-xs mb-6">FOR AND ON BEHALF OF THE SELLER:</span>
              <div style="border-bottom: 1px solid #94a3b8; height: 36px; margin-bottom: 6px;"></div>
              <strong>Authorized Signatory (IHSAN Real Estate PLC)</strong>
              <span class="text-secondary font-xs">Date: ________________________</span>
            </div>
            <div class="flex flex-col">
              <span class="text-secondary font-xs mb-6">FOR AND ON BEHALF OF THE BUYER:</span>
              <div style="border-bottom: 1px solid #94a3b8; height: 36px; margin-bottom: 6px;"></div>
              <strong>{{ selectedPdfAgreement?.customer?.fullName }}</strong>
              <span class="text-secondary font-xs">Date: ________________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TC-5.19: AGREEMENT VERSION HISTORY MODAL   -->
    <!-- ========================================== -->
    <div class="modal-overlay" *ngIf="showHistoryModal" (click)="closeHistoryModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 650px;">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: var(--brand-primary);">history</span>
            <h2>Agreement Revision History</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeHistoryModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="flex justify-between align-center p-3 mb-3 bg-card border rounded">
            <div>
              <span class="text-secondary font-xs block">Agreement Reference</span>
              <strong class="font-mono">{{ selectedHistoryAgreement?.agreementNo }}</strong>
            </div>
            <div>
              <span class="text-secondary font-xs block">Current Version</span>
              <span class="badge badge-indigo font-mono">v{{ selectedHistoryAgreement?.agreementVersion || 1 }}.0</span>
            </div>
          </div>

          <h4 class="font-xs font-bold text-secondary uppercase mb-2">Revision & Modification Log</h4>
          <div class="flex flex-col gap-3" *ngIf="agreementHistory.length > 0">
            <div *ngFor="let h of agreementHistory" class="p-3 border rounded bg-card flex flex-col gap-1">
              <div class="flex justify-between align-center">
                <span class="badge badge-indigo font-mono font-xs">v{{ h.newValue?.version || 2 }}.0 ({{ h.action }})</span>
                <span class="text-secondary font-xs">{{ h.changedAt | date:'medium' }}</span>
              </div>
              <strong class="font-sm text-main my-1">{{ h.newValue?.remarks || 'Agreement updated' }}</strong>
              <span class="text-secondary font-xs" *ngIf="h.newValue?.document">Updated Terms: {{ h.newValue.document }}</span>
            </div>
          </div>

          <div *ngIf="agreementHistory.length === 0" class="text-center py-6 text-secondary italic">
            No previous revision logs recorded. Agreement is currently at its initial version.
          </div>

          <div class="modal-footer flex justify-end mt-4">
            <button class="btn btn-secondary" (click)="closeHistoryModal()">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TC-5.19: INCREMENT VERSION & EDIT MODAL    -->
    <!-- ========================================== -->
    <div class="modal-overlay" *ngIf="showNewVersionModal" (click)="closeNewVersionModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 600px;">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: var(--brand-primary);">edit_note</span>
            <h2>Create New Agreement Version</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeNewVersionModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form (submit)="onSubmitNewVersion($event)">
            <div class="form-row flex gap-3 mb-3">
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Agreement Reference</label>
                <input type="text" [value]="selectedVersionAgreement?.agreementNo" readonly style="background-color: var(--bg-main);" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Target Version</label>
                <input type="text" [value]="'v' + ((selectedVersionAgreement?.agreementVersion || 1) + 1) + '.0'" readonly style="background-color: var(--bg-main); font-weight: bold; color: var(--brand-primary);" />
              </div>
            </div>

            <!-- Edit specific clauses / text body for this new version -->
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Modify Specific Clauses / Terms for v{{ (selectedVersionAgreement?.agreementVersion || 1) + 1 }}.0</label>
              <textarea [(ngModel)]="editableDocumentBody" name="vDoc" rows="4" placeholder="Enter or edit special terms, altered clauses, or finishing specifications for this revision..."></textarea>
            </div>

            <!-- Mandatory Changelog reason -->
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Revision Reason / Changelog * [REQUIRED]</label>
              <input type="text" [(ngModel)]="versionRemarks" name="vRemarks" required placeholder="e.g. Extended handover date by 2 months & added interior package" />
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeNewVersionModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!versionRemarks">
                Save & Increment to v{{ (selectedVersionAgreement?.agreementVersion || 1) + 1 }}.0
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TC-5.21: CONTRACT STATUS TRANSITION MODAL  -->
    <!-- ========================================== -->
    <div class="modal-overlay" *ngIf="showStatusModal" (click)="closeStatusModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header flex justify-between align-center">
          <h2>Update Contract Status</h2>
          <button class="header-icon-btn close-btn" (click)="closeStatusModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form (submit)="onSubmitStatusChange($event)">
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Contract Reference</label>
              <input type="text" [value]="selectedStatusContract?.contractNo + ' - ' + selectedStatusContract?.customer?.fullName" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Current Status</label>
              <span class="badge" [ngClass]="getContractStatusBadge(selectedStatusContract?.status)">{{ selectedStatusContract?.status }}</span>
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Target Contract Status *</label>
              <select [(ngModel)]="targetStatus" name="tStatus" required>
                <option value="DRAFT">DRAFT (Initial document preparation)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Legal counsel examination)</option>
                <option value="PENDING_SIGNATURE">PENDING_SIGNATURE (Awaiting buyer & seller signing)</option>
                <option value="SIGNED">SIGNED (Executed by both parties)</option>
                <option value="ACTIVE">ACTIVE (In full binding effect)</option>
                <option value="COMPLETED">COMPLETED (All installments paid & title transferred)</option>
                <option value="TERMINATED">TERMINATED (Mutually or legally dissolved)</option>
                <option value="CANCELLED">CANCELLED (Contract voided)</option>
              </select>
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Status Change Remarks</label>
              <textarea [(ngModel)]="statusRemarks" name="sRemarks" placeholder="Enter reason or notes for this status transition..." rows="2"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeStatusModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Status</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TC-5.23: CONTRACT AMENDMENTS MODAL         -->
    <!-- ========================================== -->
    <div class="modal-overlay" *ngIf="showViewAmendmentsModal" (click)="closeViewAmendmentsModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 700px;">
        <div class="modal-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined" style="color: var(--brand-primary);">edit_note</span>
            <h2>Contract Amendments & Addenda</h2>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeViewAmendmentsModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="flex justify-between align-center p-3 mb-3 bg-card border rounded">
            <div>
              <span class="text-secondary font-xs block">Contract Reference</span>
              <strong class="font-mono">{{ selectedAmendmentContract?.contractNo }}</strong>
            </div>
            <div>
              <button class="btn btn-primary btn-sm flex align-center gap-1" (click)="openAddAmendmentModal()">
                <span class="material-icons-outlined" style="font-size: 15px;">add</span>
                <span>Add Amendment</span>
              </button>
            </div>
          </div>

          <h4 class="font-xs font-bold text-secondary uppercase mb-2">Registered Amendments</h4>
          <div class="flex flex-col gap-3" *ngIf="contractAmendments.length > 0">
            <div *ngFor="let am of contractAmendments" class="p-3 border rounded bg-card flex flex-col gap-1">
              <div class="flex justify-between align-center">
                <span class="badge badge-indigo font-mono font-xs">{{ am.amendmentNo || 'AMENDMENT' }} ({{ am.amendmentType }})</span>
                <span class="text-secondary font-xs">{{ am.effectiveDate | date:'mediumDate' }}</span>
              </div>
              <strong class="font-sm text-main my-1">{{ am.amendmentDescription }}</strong>
              <div class="flex justify-between align-center font-xs text-secondary">
                <span *ngIf="am.adjustedAmount">Adjusted Amount: <strong>ETB {{ am.adjustedAmount | number }}</strong></span>
                <span>Remarks: {{ am.remarks || '-' }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="contractAmendments.length === 0" class="text-center py-6 text-secondary italic">
            No amendments or addenda registered on this contract yet.
          </div>

          <div class="modal-footer flex justify-end mt-4">
            <button class="btn btn-secondary" (click)="closeViewAmendmentsModal()">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD AMENDMENT FORM MODAL -->
    <div class="modal-overlay" *ngIf="showAddAmendmentModal" (click)="closeAddAmendmentModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 550px;">
        <div class="modal-header flex justify-between align-center">
          <h2>Register Contract Amendment</h2>
          <button class="header-icon-btn close-btn" (click)="closeAddAmendmentModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form (submit)="onSubmitCreateAmendment($event)">
            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Amendment Type *</label>
              <select [(ngModel)]="newAmendment.amendmentType" name="aType" required>
                <option value="PRICE_ADJUSTMENT">Price Valuation Adjustment</option>
                <option value="SCHEDULE_EXTENSION">Installment Schedule Extension</option>
                <option value="BUYER_UPDATE">Buyer Information Update</option>
                <option value="SCOPE_CHANGE">Finishing / Specification Scope Change</option>
              </select>
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Amendment Description *</label>
              <input type="text" [(ngModel)]="newAmendment.amendmentDescription" name="aDesc" required placeholder="e.g. Added premium kitchen finishing package" />
            </div>

            <div class="form-row flex gap-3 mb-3">
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Adjusted Amount (ETB) [Optional]</label>
                <input type="number" [(ngModel)]="newAmendment.adjustedAmount" name="aAmt" placeholder="e.g. 3500000" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label class="font-xs font-bold text-secondary">Effective Date *</label>
                <input type="date" [(ngModel)]="newAmendment.effectiveDate" name="aDate" required />
              </div>
            </div>

            <div class="form-group flex flex-col mb-3">
              <label class="font-xs font-bold text-secondary">Remarks / Authorizing Note</label>
              <textarea [(ngModel)]="newAmendment.remarks" name="aRem" placeholder="Authorized by Sales Director..." rows="2"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeAddAmendmentModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newAmendment.amendmentDescription">
                Save Amendment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Sales Agreement Modal -->
    <div class="modal-overlay" *ngIf="showCreateAgreementModal" (click)="closeCreateAgreementModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Draft Sales Agreement</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateAgreementModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitAgreement($event)">
            <div class="form-group flex flex-col">
              <label>Select Approved Booking Reference * [REQUIRED]</label>
              <select [(ngModel)]="newAgreement.bookingId" name="bookingId" required (change)="onBookingChange()">
                <option [value]="0">-- Select Approved Booking --</option>
                <option *ngFor="let b of approvedBookings" [value]="b.id">
                  {{ b.bookingNo }} - {{ b.customer?.fullName }} (ETB {{ b.bookingAmount | number }} deposit)
                </option>
              </select>
            </div>

            <div class="form-group flex flex-col">
              <label>Customer Entity * [REQUIRED]</label>
              <select [(ngModel)]="newAgreement.customerId" name="customerId" required [disabled]="true" style="background-color: var(--bg-main);">
                <option [value]="0">-- Select Customer --</option>
                <option *ngFor="let cust of customers" [value]="cust.id">{{ cust.fullName }}</option>
              </select>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Agreement Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newAgreement.agreementDate" name="agreementDate" required />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Version Number * [REQUIRED]</label>
                <input type="number" [(ngModel)]="newAgreement.agreementVersion" name="agreementVersion" required />
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Agreement Document Body [OPTIONAL]</label>
              <textarea [(ngModel)]="newAgreement.agreementDocument" name="agreementDocument" placeholder="Enter standard merge terms, clauses, or text body..." rows="4"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateAgreementModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="newAgreement.bookingId === 0 || newAgreement.customerId === 0 || !newAgreement.agreementDate || !newAgreement.agreementVersion"
              >
                Save Agreement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Contract Modal -->
    <div class="modal-overlay" *ngIf="showCreateContractModal" (click)="closeCreateContractModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Execute Official Sales Contract</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateContractModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitContract($event)">
            <div class="form-group flex flex-col">
              <label>Select Active Agreement Reference * [REQUIRED]</label>
              <select [(ngModel)]="newContract.agreementId" name="agreementId" required (change)="onAgreementChange()">
                <option [value]="0">-- Select Active Agreement --</option>
                <option *ngFor="let ag of activeAgreements" [value]="ag.id">
                  {{ ag.agreementNo }} - {{ ag.customer?.fullName }} (Booking: {{ ag.booking?.bookingNo }})
                </option>
              </select>
            </div>

            <div class="form-group flex flex-col">
              <label>Customer Entity * [REQUIRED]</label>
              <select [(ngModel)]="newContract.customerId" name="customerId" required [disabled]="true" style="background-color: var(--bg-main);">
                <option [value]="0">-- Select Customer --</option>
                <option *ngFor="let cust of customers" [value]="cust.id">{{ cust.fullName }}</option>
              </select>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Contract Start Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newContract.contractStartDate" name="contractStartDate" required />
              </div>

              <div class="form-group flex-1 flex flex-col">
                <label>Contract Expiry Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newContract.contractEndDate" name="contractEndDate" required />
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Contract Valuation Amount (ETB) * [REQUIRED]</label>
              <input type="number" [(ngModel)]="newContract.contractAmount" name="contractAmount" required placeholder="e.g. 5000000" />
            </div>

            <div class="form-group flex flex-col">
              <label>Contract Document Attachment Name [OPTIONAL]</label>
              <input type="text" [(ngModel)]="uploadDocFileName" name="uploadDocFileName" placeholder="e.g. green-view-signed-contract.pdf" />
              <input type="file" (change)="onFileSelected($event)" style="margin-top: 8px;" />
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateContractModal()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="newContract.agreementId === 0 || newContract.customerId === 0 || !newContract.contractStartDate || !newContract.contractEndDate || !newContract.contractAmount"
              >
                Execute Contract
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Upload Document Modal -->
    <div class="modal-overlay" *ngIf="showUploadModal" (click)="closeUploadModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Attach Document to Contract</h2>
          <button class="header-icon-btn close-btn" (click)="closeUploadModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitUploadDocument($event)">
            <div class="form-group flex flex-col">
              <label>Contract Reference</label>
              <input type="text" [value]="selectedContract?.contractNo + ' - ' + selectedContract?.customer?.fullName" readonly style="background-color: var(--bg-main);" />
            </div>

            <div class="form-group flex flex-col">
              <label>Attachment Name * [REQUIRED]</label>
              <input type="text" [(ngModel)]="uploadDocFileName" name="fileName" required placeholder="e.g. Stamp approval copy.pdf" />
            </div>

            <div class="form-group flex flex-col">
              <label>File Upload * [REQUIRED]</label>
              <input type="file" required (change)="onFileSelected($event)" />
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeUploadModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!uploadDocFileName || !selectedFile">
                Upload Document
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-draft { background-color: rgba(59, 130, 246, 0.15); color: var(--color-new); }
    .badge-active { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-revised { background-color: rgba(234, 179, 8, 0.15); color: var(--color-contacted); }
    .badge-terminated { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-suspended { background-color: rgba(100, 116, 139, 0.15); color: var(--text-secondary); }
    .badge-completed { background-color: rgba(76, 58, 147, 0.15); color: var(--brand-primary); }
    .doc-link {
      color: var(--brand-primary);
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .doc-link:hover {
      text-decoration: underline !important;
      opacity: 0.8;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      .agreement-pdf-modal, .agreement-print-sheet, .agreement-print-sheet * {
        visibility: visible;
      }
      .agreement-pdf-modal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        max-width: 100% !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .modal-header, .btn, .close-btn {
        display: none !important;
      }
    }
  `]
})
export class ContractsComponent implements OnInit {
  private salesService = inject(SalesService);
  public authService = inject(AuthService);

  activeTab = 'agreements';
  agreements: any[] = [];
  contracts: any[] = [];
  approvedBookings: any[] = [];
  activeAgreements: any[] = [];
  customers: any[] = [];

  successMessage = '';
  errorMessage = '';

  showCreateAgreementModal = false;
  showCreateContractModal = false;
  showUploadModal = false;

  // TC-5.18: PDF State
  showPdfModal = false;
  selectedPdfAgreement: any = null;

  // TC-5.19: Version History State
  showHistoryModal = false;
  selectedHistoryAgreement: any = null;
  agreementHistory: any[] = [];

  showNewVersionModal = false;
  selectedVersionAgreement: any = null;
  versionRemarks = '';
  editableDocumentBody = '';

  // TC-5.21: Status Transition State
  showStatusModal = false;
  selectedStatusContract: any = null;
  targetStatus = 'ACTIVE';
  statusRemarks = '';

  // TC-5.23: Amendments State
  showViewAmendmentsModal = false;
  showAddAmendmentModal = false;
  selectedAmendmentContract: any = null;
  contractAmendments: any[] = [];
  newAmendment = {
    amendmentType: 'PRICE_ADJUSTMENT',
    amendmentDescription: '',
    adjustedAmount: 0,
    effectiveDate: '',
    remarks: ''
  };

  selectedContract: any = null;
  selectedFile: File | null = null;
  uploadDocFileName = '';

  newAgreement = {
    bookingId: 0,
    customerId: 0,
    agreementDate: '',
    agreementVersion: 1,
    agreementDocument: ''
  };

  newContract = {
    agreementId: 0,
    customerId: 0,
    contractStartDate: '',
    contractEndDate: '',
    contractAmount: 0
  };

  ngOnInit() {
    this.loadAgreements();
    this.loadContracts();
    this.loadApprovedBookings();
    this.loadCustomers();

    const today = this.formatDate(new Date());
    this.newAgreement.agreementDate = today;
    this.newContract.contractStartDate = today;
    this.newAmendment.effectiveDate = today;

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    this.newContract.contractEndDate = this.formatDate(nextYear);
  }

  loadAgreements() {
    this.salesService.getAgreements().subscribe({
      next: (res) => {
        this.agreements = res;
        this.activeAgreements = res.filter((a: any) => a.status === 'ACTIVE' || a.status === 'DRAFT');
      },
      error: (err) => console.error('Error fetching agreements', err)
    });
  }

  loadContracts() {
    this.salesService.getContracts().subscribe({
      next: (res) => this.contracts = res,
      error: (err) => console.error('Error fetching contracts', err)
    });
  }

  loadApprovedBookings() {
    this.salesService.getBookings().subscribe({
      next: (res) => {
        this.approvedBookings = res.filter((b: any) => b.status === 'APPROVED');
      },
      error: (err) => console.error('Error loading bookings', err)
    });
  }

  loadCustomers() {
    this.salesService.getCustomers().subscribe({
      next: (res) => this.customers = res,
      error: (err) => console.error('Error loading customers', err)
    });
  }

  onBookingChange() {
    if (this.newAgreement.bookingId === 0) return;
    const booking = this.approvedBookings.find(b => b.id == this.newAgreement.bookingId);
    if (booking) {
      this.newAgreement.customerId = booking.customer?.id || 0;
    }
  }

  onAgreementChange() {
    if (this.newContract.agreementId === 0) return;
    const agreement = this.activeAgreements.find(a => a.id == this.newContract.agreementId);
    if (agreement) {
      this.newContract.customerId = agreement.customer?.id || 0;
      if (agreement.booking?.quotation?.totalAmount) {
        this.newContract.contractAmount = Number(agreement.booking.quotation.totalAmount);
      } else if (agreement.booking?.bookingAmount) {
        this.newContract.contractAmount = Number(agreement.booking.bookingAmount) * 10;
      }
    }
  }

  getAgreementStatusBadge(status: string): string {
    switch (status) {
      case 'DRAFT': return 'badge-draft';
      case 'ACTIVE': return 'badge-active';
      case 'REVISED': return 'badge-revised';
      case 'TERMINATED': return 'badge-terminated';
      default: return 'badge-draft';
    }
  }

  getContractStatusBadge(status: string): string {
    switch (status) {
      case 'DRAFT': return 'badge-draft';
      case 'UNDER_REVIEW': return 'badge-revised';
      case 'PENDING_SIGNATURE': return 'badge-suspended';
      case 'SIGNED': return 'badge-completed';
      case 'ACTIVE': return 'badge-active';
      case 'SUSPENDED': return 'badge-suspended';
      case 'COMPLETED': return 'badge-completed';
      case 'TERMINATED': return 'badge-terminated';
      case 'CANCELLED': return 'badge-terminated';
      default: return 'badge-active';
    }
  }

  // --- TC-5.18: Agreement PDF Preview & Print ---
  openPdfModal(a: any) {
    this.selectedPdfAgreement = a;
    this.showPdfModal = true;
  }

  closePdfModal() {
    this.showPdfModal = false;
    this.selectedPdfAgreement = null;
  }

  printAgreementPdf() {
    window.print();
  }

  // --- TC-5.19: Version History & Increments ---
  openHistoryModal(a: any) {
    this.selectedHistoryAgreement = a;
    this.showHistoryModal = true;
    this.salesService.getAgreementHistory(a.id).subscribe({
      next: (res) => {
        this.agreementHistory = res;
      },
      error: (err) => {
        console.error('Error fetching agreement history', err);
        this.agreementHistory = [];
      }
    });
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
    this.selectedHistoryAgreement = null;
    this.agreementHistory = [];
  }

  openNewVersionModal(a: any) {
    this.selectedVersionAgreement = a;
    this.versionRemarks = '';
    this.editableDocumentBody = a.agreementDocument || '';
    this.showNewVersionModal = true;
  }

  closeNewVersionModal() {
    this.showNewVersionModal = false;
    this.selectedVersionAgreement = null;
    this.versionRemarks = '';
    this.editableDocumentBody = '';
  }

  onSubmitNewVersion(event: Event) {
    event.preventDefault();
    if (!this.selectedVersionAgreement || !this.versionRemarks) return;

    this.salesService.updateAgreementVersion(this.selectedVersionAgreement.id, {
      changeRemarks: this.versionRemarks,
      agreementDocument: this.editableDocumentBody || undefined
    }).subscribe({
      next: (res) => {
        this.successMessage = `Sales Agreement version incremented to v${res.agreementVersion}.0 successfully with updated terms!`;
        this.loadAgreements();
        this.closeNewVersionModal();
      },
      error: (err) => {
        console.error('Error incrementing agreement version', err);
        this.errorMessage = err.error?.message || 'Failed to update agreement version.';
      }
    });
  }

  // --- TC-5.21: Contract Status Transitions ---
  openStatusModal(c: any) {
    this.selectedStatusContract = c;
    this.targetStatus = c.status || 'ACTIVE';
    this.statusRemarks = '';
    this.showStatusModal = true;
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.selectedStatusContract = null;
  }

  onSubmitStatusChange(event: Event) {
    event.preventDefault();
    if (!this.selectedStatusContract) return;

    this.salesService.updateContractStatus(this.selectedStatusContract.id, {
      status: this.targetStatus,
      remarks: this.statusRemarks || undefined
    }).subscribe({
      next: (res) => {
        this.successMessage = `Contract ${res.contractNo} status transitioned to ${res.status} successfully!`;
        this.loadContracts();
        this.closeStatusModal();
      },
      error: (err) => {
        console.error('Error updating contract status', err);
        this.errorMessage = err.error?.message || 'Failed to update contract status.';
      }
    });
  }

  // --- TC-5.23: Contract Amendments ---
  openViewAmendmentsModal(c: any) {
    this.selectedAmendmentContract = c;
    this.showViewAmendmentsModal = true;
    this.salesService.getContractAmendments(c.id).subscribe({
      next: (res) => {
        this.contractAmendments = res || [];
      },
      error: (err) => {
        console.error('Error loading contract amendments', err);
        this.contractAmendments = [];
      }
    });
  }

  closeViewAmendmentsModal() {
    this.showViewAmendmentsModal = false;
    this.selectedAmendmentContract = null;
  }

  openAddAmendmentModal() {
    this.showAddAmendmentModal = true;
    this.newAmendment = {
      amendmentType: 'PRICE_ADJUSTMENT',
      amendmentDescription: '',
      adjustedAmount: this.selectedAmendmentContract?.contractAmount || 0,
      effectiveDate: this.formatDate(new Date()),
      remarks: ''
    };
  }

  closeAddAmendmentModal() {
    this.showAddAmendmentModal = false;
  }

  onSubmitCreateAmendment(event: Event) {
    event.preventDefault();
    if (!this.selectedAmendmentContract || !this.newAmendment.amendmentDescription) return;

    this.salesService.createContractAmendment(this.selectedAmendmentContract.id, {
      amendmentType: this.newAmendment.amendmentType,
      amendmentDescription: this.newAmendment.amendmentDescription,
      adjustedAmount: this.newAmendment.adjustedAmount ? +this.newAmendment.adjustedAmount : undefined,
      effectiveDate: this.newAmendment.effectiveDate || undefined,
      remarks: this.newAmendment.remarks || undefined
    }).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Contract amendment registered successfully!';
        this.loadContracts();
        this.closeAddAmendmentModal();
        if (this.selectedAmendmentContract) {
          this.openViewAmendmentsModal(this.selectedAmendmentContract);
        }
      },
      error: (err) => {
        console.error('Error creating contract amendment', err);
        this.errorMessage = err.error?.message || 'Failed to create contract amendment.';
      }
    });
  }

  openCreateAgreementModal() {
    this.showCreateAgreementModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.newAgreement = {
      bookingId: 0,
      customerId: 0,
      agreementDate: this.formatDate(new Date()),
      agreementVersion: 1,
      agreementDocument: ''
    };
  }

  closeCreateAgreementModal() {
    this.showCreateAgreementModal = false;
  }

  openCreateContractModal() {
    this.showCreateContractModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.newContract = {
      agreementId: 0,
      customerId: 0,
      contractStartDate: this.formatDate(new Date()),
      contractEndDate: '',
      contractAmount: 0
    };
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    this.newContract.contractEndDate = this.formatDate(nextYear);
    
    this.uploadDocFileName = '';
    this.selectedFile = null;
  }

  closeCreateContractModal() {
    this.showCreateContractModal = false;
  }

  openUploadDocModal(c: any) {
    this.selectedContract = c;
    this.showUploadModal = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.uploadDocFileName = '';
    this.selectedFile = null;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      if (!this.uploadDocFileName) {
        this.uploadDocFileName = this.selectedFile?.name || '';
      }
    }
  }

  onSubmitAgreement(event: Event) {
    event.preventDefault();
    if (this.newAgreement.bookingId === 0 || this.newAgreement.customerId === 0) return;

    const payload = {
      bookingId: +this.newAgreement.bookingId,
      customerId: +this.newAgreement.customerId,
      agreementDate: new Date(this.newAgreement.agreementDate),
      agreementVersion: +this.newAgreement.agreementVersion,
      agreementDocument: this.newAgreement.agreementDocument || undefined
    };

    this.salesService.createAgreement(payload).subscribe({
      next: (res) => {
        this.successMessage = `Sales Agreement ${res.agreementNo} drafted and registered successfully!`;
        this.loadAgreements();
        this.closeCreateAgreementModal();
      },
      error: (err) => {
        console.error('Error creating agreement', err);
        this.errorMessage = err.error?.message || 'Failed to draft sales agreement.';
      }
    });
  }

  onSubmitContract(event: Event) {
    event.preventDefault();
    if (this.newContract.agreementId === 0 || this.newContract.customerId === 0) return;

    const payload = {
      agreementId: +this.newContract.agreementId,
      customerId: +this.newContract.customerId,
      contractStartDate: new Date(this.newContract.contractStartDate),
      contractEndDate: new Date(this.newContract.contractEndDate),
      contractAmount: +this.newContract.contractAmount
    };

    this.salesService.createContract(payload).subscribe({
      next: (res) => {
        this.successMessage = `Official Contract ${res.contractNo} executed successfully! Inventory updated to SOLD.`;
        
        if (this.selectedFile) {
          this.salesService.uploadContractDocumentFile(
            res.id,
            this.selectedFile,
            this.uploadDocFileName || this.selectedFile.name
          ).subscribe({
            next: () => {
              this.loadContracts();
            },
            error: (err) => {
              console.error('Error uploading contract document', err);
              this.errorMessage = err.error?.message || 'Contract executed but document upload failed.';
            }
          });
        } else {
          this.loadContracts();
        }
        
        this.loadAgreements();
        this.closeCreateContractModal();
      },
      error: (err) => {
        console.error('Error creating contract', err);
        this.errorMessage = err.error?.message || 'Failed to execute contract.';
      }
    });
  }

  onSubmitUploadDocument(event: Event) {
    event.preventDefault();
    if (!this.selectedContract || !this.selectedFile) return;

    this.salesService.uploadContractDocumentFile(
      this.selectedContract.id,
      this.selectedFile,
      this.uploadDocFileName
    ).subscribe({
      next: (res) => {
        this.successMessage = `Document attached successfully to contract ${this.selectedContract.contractNo}!`;
        this.loadContracts();
        this.closeUploadModal();
      },
      error: (err) => {
        console.error('Error attaching contract document', err);
        this.errorMessage = err.error?.message || 'Failed to attach document.';
      }
    });
  }

  onDetachDocument(docId: number, name: string) {
    customConfirm(`Are you sure you want to detach the document "${name}"?`).then(confirmed => {
      if (confirmed) {
        this.salesService.deleteContractDocument(docId).subscribe({
          next: () => {
            this.successMessage = `Document "${name}" detached successfully!`;
            this.loadContracts();
          },
          error: (err) => {
            console.error('Error detaching document', err);
            this.errorMessage = err.error?.message || 'Failed to detach document.';
          }
        });
      }
    });
  }

  getDownloadUrl(filePath: string): string {
    return this.authService.getDownloadUrl(filePath);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
