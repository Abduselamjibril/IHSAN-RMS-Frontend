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
              <th>Document Body Snippet</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of agreements">
              <td class="font-mono font-bold">{{ a.agreementNo }}</td>
              <td>{{ a.customer?.fullName }}</td>
              <td>{{ a.booking?.bookingNo }}</td>
              <td>{{ a.agreementDate | date:'mediumDate' }}</td>
              <td class="font-mono">v{{ a.agreementVersion }}</td>
              <td style="max-width: 300px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                {{ a.agreementDocument || 'No draft text body provided.' }}
              </td>
              <td>
                <span class="badge" [ngClass]="getAgreementStatusBadge(a.status)">
                  {{ a.status }}
                </span>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of contracts">
              <td class="font-mono font-bold">{{ c.contractNo }}</td>
              <td>{{ c.customer?.fullName }}</td>
              <td>{{ c.agreement?.agreementNo }}</td>
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
                  <!-- Documents list -->
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
                  <span *ngIf="!c.documents || c.documents.length === 0" class="text-secondary italic font-xs">No documents attached</span>
                </div>
              </td>
              <td>
                <div class="flex gap-2">
                  <button 
                    class="btn btn-secondary btn-sm flex align-center gap-1"
                    (click)="openUploadDocModal(c)"
                  >
                    <span class="material-icons-outlined font-sm">file_upload</span>
                    <span>Attach Doc</span>
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
            <!-- Link Booking * (shows approved bookings) -->
            <div class="form-group flex flex-col">
              <label>Select Approved Booking Reference * [REQUIRED]</label>
              <select [(ngModel)]="newAgreement.bookingId" name="bookingId" required (change)="onBookingChange()">
                <option [value]="0">-- Select Approved Booking --</option>
                <option *ngFor="let b of approvedBookings" [value]="b.id">
                  {{ b.bookingNo }} - {{ b.customer?.fullName }} (ETB {{ b.bookingAmount | number }} deposit)
                </option>
              </select>
            </div>

            <!-- Customer * (auto-fills from booking, dropdown representation) -->
            <div class="form-group flex flex-col">
              <label>Customer Entity * [REQUIRED]</label>
              <select [(ngModel)]="newAgreement.customerId" name="customerId" required [disabled]="true" style="background-color: var(--bg-main);">
                <option [value]="0">-- Select Customer --</option>
                <option *ngFor="let cust of customers" [value]="cust.id">{{ cust.fullName }}</option>
              </select>
            </div>

            <div class="form-row flex gap-3">
              <!-- Agreement Date * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Agreement Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newAgreement.agreementDate" name="agreementDate" required />
              </div>

              <!-- Version Number * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Version Number * [REQUIRED]</label>
                <input type="number" [(ngModel)]="newAgreement.agreementVersion" name="agreementVersion" required />
              </div>
            </div>

            <!-- Agreement Document Body (Optional) -->
            <div class="form-group flex flex-col">
              <label>Agreement Document Body [OPTIONAL]</label>
              <textarea [(ngModel)]="newAgreement.agreementDocument" name="agreementDocument" placeholder="Enter standard merge terms, clauses, or text body..." rows="4"></textarea>
            </div>

            <!-- Footer Buttons -->
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
            <!-- Link Agreement * (shows active agreements) -->
            <div class="form-group flex flex-col">
              <label>Select Active Agreement Reference * [REQUIRED]</label>
              <select [(ngModel)]="newContract.agreementId" name="agreementId" required (change)="onAgreementChange()">
                <option [value]="0">-- Select Active Agreement --</option>
                <option *ngFor="let ag of activeAgreements" [value]="ag.id">
                  {{ ag.agreementNo }} - {{ ag.customer?.fullName }} (Booking: {{ ag.booking?.bookingNo }})
                </option>
              </select>
            </div>

            <!-- Customer * (auto-fills from agreement) -->
            <div class="form-group flex flex-col">
              <label>Customer Entity * [REQUIRED]</label>
              <select [(ngModel)]="newContract.customerId" name="customerId" required [disabled]="true" style="background-color: var(--bg-main);">
                <option [value]="0">-- Select Customer --</option>
                <option *ngFor="let cust of customers" [value]="cust.id">{{ cust.fullName }}</option>
              </select>
            </div>

            <div class="form-row flex gap-3">
              <!-- Contract Start Date * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Contract Start Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newContract.contractStartDate" name="contractStartDate" required />
              </div>

              <!-- Contract End Date * -->
              <div class="form-group flex-1 flex flex-col">
                <label>Contract Expiry Date * [REQUIRED]</label>
                <input type="date" [(ngModel)]="newContract.contractEndDate" name="contractEndDate" required />
              </div>
            </div>

            <!-- Contract Amount * -->
            <div class="form-group flex flex-col">
              <label>Contract Valuation Amount (ETB) * [REQUIRED]</label>
              <input type="number" [(ngModel)]="newContract.contractAmount" name="contractAmount" required placeholder="e.g. 5000000" />
            </div>

            <!-- Document Attachments [OPTIONAL] -->
            <div class="form-group flex flex-col">
              <label>Contract Document Attachment Name [OPTIONAL]</label>
              <input type="text" [(ngModel)]="uploadDocFileName" name="uploadDocFileName" placeholder="e.g. green-view-signed-contract.pdf" />
              <input type="file" (change)="onFileSelected($event)" style="margin-top: 8px;" />
            </div>

            <!-- Footer Buttons -->
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

            <!-- Footer Buttons -->
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
      // Fetch default contract amount from linked quotation or booking
      if (agreement.booking?.quotation?.totalAmount) {
        this.newContract.contractAmount = Number(agreement.booking.quotation.totalAmount);
      } else if (agreement.booking?.bookingAmount) {
        this.newContract.contractAmount = Number(agreement.booking.bookingAmount) * 10; // estimate default
      }
    }
  }

  getAgreementStatusBadge(status: string): string {
    switch (status) {
      case 'DRAFT': return 'badge-draft';
      case 'ACTIVE': return 'badge-active';
      case 'REVISED': return 'badge-revised';
      case 'TERMINATED': return 'badge-terminated';
      default: return '';
    }
  }

  getContractStatusBadge(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge-active';
      case 'SUSPENDED': return 'badge-suspended';
      case 'COMPLETED': return 'badge-completed';
      case 'TERMINATED': return 'badge-terminated';
      default: return '';
    }
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
        
        // If they had a file selected, upload it immediately
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
