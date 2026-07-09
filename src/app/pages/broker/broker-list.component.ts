import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrokerService } from '../../services/broker.service';
import { customConfirm } from '../../utils/confirm';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-broker-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Broker Directory</h1>
        <p>Manage and onboard property brokers, configure bank details, and track credentials</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()" *ngIf="authService.hasPermission('broker.list.create', 'create')">
          <span class="material-icons-outlined">add</span> Onboard Broker
        </button>
      </div>
    </header>

    <div class="leads-workspace-grid flex flex-col gap-6" style="padding-bottom: 40px;">
      <!-- Brokers list -->
      <div class="leads-list-area card">
        <div class="flex justify-between items-center pb-3 border-bottom margin-b-3">
          <div class="header-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" placeholder="Search brokers..." [(ngModel)]="searchQuery" (input)="filterBrokers()">
          </div>
          <div class="flex gap-2">
            <select class="form-control" [(ngModel)]="filterType" (change)="filterBrokers()" style="padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 13px;">
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 40%;">Broker Name</th>
                <th style="width: 15%;">Type</th>
                <th style="width: 25%;">Phone / Email</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 10%;" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredBrokers" (click)="selectBroker(item)" [class.selected]="selectedBroker?.id === item.id" class="cursor-pointer">
                <td>
                  <div class="contact-info flex align-center gap-3">
                    <div class="table-avatar">{{ getInitials(item.brokerName) }}</div>
                    <div class="flex flex-col">
                      <span class="lead-name font-semibold text-main">{{ item.brokerName }}</span>
                      <span class="lead-phone">{{ item.brokerCode }} <span *ngIf="item.city" class="text-muted font-xs">• {{ item.city }}</span></span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="type-pill">{{ item.brokerTypeId }}</span>
                </td>
                <td>
                  <div class="flex flex-col">
                    <span class="font-sm font-semibold text-main">{{ item.phoneNumber }}</span>
                    <span class="text-xs text-muted" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ item.emailAddress || 'No Email' }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge" [class.badge-qualified]="item.statusId === 'ACTIVE'" [class.badge-lost]="item.statusId === 'INACTIVE'" [class.badge-high]="item.statusId === 'BLACKLISTED'">
                    {{ item.statusId }}
                  </span>
                </td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button class="icon-btn text-indigo" (click)="openEditModal(item)" title="Edit" style="margin-right: 8px;">
                    <span class="material-icons-outlined font-sm">edit</span>
                  </button>
                  <button class="icon-btn text-danger" (click)="deactivateBroker(item)" title="Deactivate">
                    <span class="material-icons-outlined font-sm">block</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!filteredBrokers.length">
                <td colspan="5" class="text-center text-secondary py-8">
                  No brokers found matching current filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Broker Details Bottom Card -->
      <div *ngIf="selectedBroker" class="card p-6 border-indigo margin-t-6" style="border-radius: 16px; position: relative;">
        <!-- Header Section -->
        <div class="flex justify-between items-center border-bottom pb-4 margin-b-4">
          <div class="flex align-center gap-4">
            <div class="avatar-lg">{{ getInitials(selectedBroker.brokerName) }}</div>
            <div class="flex flex-col">
              <span class="text-indigo text-xs uppercase tracking-wider font-semibold">Broker Portfolio Profile</span>
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--text-main);">{{ selectedBroker.brokerName }} ({{ selectedBroker.brokerCode }})</h2>
            </div>
          </div>
          <button class="header-icon-btn close-btn" (click)="selectedBroker = null" style="background-color: var(--bg-main) !important; border: 1px solid var(--border-color) !important; border-radius: 50%; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
            <span class="material-icons-outlined" style="color: var(--text-secondary);">close</span>
          </button>
        </div>

        <!-- Content Grid -->
        <div class="flex flex-col gap-6">
          
          <!-- Metadata Cards Row -->
          <div class="grid col-3 gap-4">
            <div class="detail-card">
              <span class="text-secondary">Trade License / TIN</span>
              <strong>{{ selectedBroker.tradeLicenseNumber || 'N/A' }} / {{ selectedBroker.tinNumber || 'N/A' }}</strong>
            </div>
            <div class="detail-card">
              <span class="text-secondary">Address Details</span>
              <strong>{{ selectedBroker.address || 'N/A' }}, {{ selectedBroker.city || '' }}</strong>
            </div>
            <div class="detail-card">
              <span class="text-secondary">Remarks / Onboarding Notes</span>
              <p style="margin: 0; font-size: 13px; color: var(--text-main);">{{ selectedBroker.remarks || 'No remarks provided.' }}</p>
            </div>
          </div>

          <!-- Bottom Columns: Bank and Documents -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; border-top: 1px solid var(--border-color); padding-top: 24px;">
            
            <!-- Bank Accounts Column -->
            <div>
              <div class="flex justify-between items-center pb-2" style="border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 16px;">
                <h4 class="font-semibold text-main flex items-center gap-2" style="margin: 0; font-size: 15px;">
                  <span class="material-icons-outlined text-indigo" style="font-size: 20px;">account_balance</span>
                  Bank Routing Configurations
                </h4>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" (click)="openAddBankModal()">
                  <span class="material-icons-outlined" style="font-size: 14px;">add</span> Add Bank Account
                </button>
              </div>

              <div class="flex flex-col gap-3" style="max-height: 250px; overflow-y: auto; padding-right: 4px;">
                <div *ngFor="let bank of selectedBrokerDetails?.bankAccounts" class="flex justify-between items-center border p-3 rounded-md bg-glass" style="border-radius: 10px;">
                  <div class="flex align-center gap-3">
                    <span class="material-icons-outlined text-secondary" style="font-size: 24px;">payment</span>
                    <div class="flex flex-col">
                      <span class="font-semibold text-main" style="font-size: 13px;">{{ bank.bankName }}</span>
                      <span class="text-xs text-secondary">Acc: {{ bank.accountNumber }} • Holder: {{ bank.accountName }}</span>
                    </div>
                  </div>
                  <div class="flex align-center gap-3">
                    <span *ngIf="bank.isDefault" class="badge badge-qualified" style="font-size: 9px; padding: 2px 6px;">Default</span>
                    <button class="icon-btn text-danger" (click)="deleteBankAccount(bank.id)" title="Remove Account">
                      <span class="material-icons-outlined" style="font-size: 16px;">delete</span>
                    </button>
                  </div>
                </div>
                <div *ngIf="!selectedBrokerDetails?.bankAccounts?.length" class="text-center text-secondary py-6 border rounded-md" style="border-style: dashed; background-color: rgba(255,255,255,0.01);">
                  <span class="material-icons-outlined text-muted" style="font-size: 32px; display: block; margin-bottom: 6px;">credit_card_off</span>
                  No bank accounts configured.
                </div>
              </div>
            </div>

            <!-- Documents Column -->
            <div>
              <div class="flex justify-between items-center pb-2" style="border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 16px;">
                <h4 class="font-semibold text-main flex items-center gap-2" style="margin: 0; font-size: 15px;">
                  <span class="material-icons-outlined text-indigo" style="font-size: 20px;">folder</span>
                  Onboarding Credentials
                </h4>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" (click)="openAddDocModal()">
                  <span class="material-icons-outlined" style="font-size: 14px;">upload</span> Upload Document
                </button>
              </div>

              <div class="flex flex-col gap-3" style="max-height: 250px; overflow-y: auto; padding-right: 4px;">
                <div *ngFor="let doc of selectedBrokerDetails?.documents" class="flex justify-between items-center border p-3 rounded-md bg-glass" style="border-radius: 10px;">
                  <div class="flex align-center gap-3" style="flex: 1; min-width: 0;">
                    <span class="material-icons-outlined text-secondary" style="font-size: 24px;">insert_drive_file</span>
                    <div class="flex flex-col" style="flex: 1; min-width: 0;">
                      <span class="font-semibold text-main" style="font-size: 13px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ doc.documentName }}</span>
                      <span class="text-xs text-secondary">{{ doc.documentTypeId }} • Expiry: {{ doc.expiryDate ? (doc.expiryDate | date:'mediumDate') : 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="flex align-center gap-2">
                    <a [href]="'http://localhost:3000' + doc.filePath" target="_blank" class="icon-btn text-indigo" title="View Document" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background-color: var(--bg-main);">
                      <span class="material-icons-outlined" style="font-size: 16px;">visibility</span>
                    </a>
                    <button class="icon-btn text-danger" (click)="deleteDocument(doc.id)" title="Remove Document" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background-color: var(--bg-main);">
                      <span class="material-icons-outlined" style="font-size: 16px;">delete</span>
                    </button>
                  </div>
                </div>
                <div *ngIf="!selectedBrokerDetails?.documents?.length" class="text-center text-secondary py-6 border rounded-md" style="border-style: dashed; background-color: rgba(255,255,255,0.01);">
                  <span class="material-icons-outlined text-muted" style="font-size: 32px; display: block; margin-bottom: 6px;">no_accounts</span>
                  No credential documents uploaded.
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>

    <!-- Onboard / Edit Broker Modal -->
    <div class="modal-overlay" *ngIf="showBrokerModal" (click)="closeBrokerModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 600px;">
        <header class="modal-header">
          <h2>{{ editMode ? 'Edit' : 'Onboard' }} Broker</h2>
          <button class="header-icon-btn close-btn" (click)="closeBrokerModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="saveBroker()" #brokerForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group col-span-2">
                <label for="brokerName">Broker Name *</label>
                <input type="text" id="brokerName" name="brokerName" [(ngModel)]="brokerFormModel.brokerName" required placeholder="Full Name or Company Name">
              </div>

              <div class="form-group">
                <label for="brokerTypeId">Broker Type *</label>
                <select id="brokerTypeId" name="brokerTypeId" [(ngModel)]="brokerFormModel.brokerTypeId" required class="form-control">
                  <option value="INDIVIDUAL">Individual Broker</option>
                  <option value="COMPANY">Broker Company</option>
                </select>
              </div>

              <div class="form-group">
                <label for="phoneNumber">Phone Number *</label>
                <input type="text" id="phoneNumber" name="phoneNumber" [(ngModel)]="brokerFormModel.phoneNumber" required placeholder="+251-912-...">
              </div>

              <div class="form-group">
                <label for="alternatePhoneNumber">Alternate Phone</label>
                <input type="text" id="alternatePhoneNumber" name="alternatePhoneNumber" [(ngModel)]="brokerFormModel.alternatePhoneNumber" placeholder="+251-911-...">
              </div>

              <div class="form-group">
                <label for="emailAddress">Email Address</label>
                <input type="email" id="emailAddress" name="emailAddress" [(ngModel)]="brokerFormModel.emailAddress" placeholder="broker@gmail.com">
              </div>

              <div class="form-group">
                <label for="tinNumber">TIN Number</label>
                <input type="text" id="tinNumber" name="tinNumber" [(ngModel)]="brokerFormModel.tinNumber" placeholder="TIN Number (10 Digits)">
              </div>

              <div class="form-group">
                <label for="tradeLicenseNumber">Trade License</label>
                <input type="text" id="tradeLicenseNumber" name="tradeLicenseNumber" [(ngModel)]="brokerFormModel.tradeLicenseNumber" placeholder="License Code">
              </div>

              <div class="form-group">
                <label for="city">City</label>
                <input type="text" id="city" name="city" [(ngModel)]="brokerFormModel.city" placeholder="Addis Ababa">
              </div>

              <div class="form-group">
                <label for="address">Address</label>
                <input type="text" id="address" name="address" [(ngModel)]="brokerFormModel.address" placeholder="Sub City, Woreda, H.No">
              </div>

              <div class="form-group" *ngIf="editMode">
                <label for="statusId">Status</label>
                <select id="statusId" name="statusId" [(ngModel)]="brokerFormModel.statusId" required class="form-control">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BLACKLISTED">Blacklisted</option>
                </select>
              </div>

              <div class="form-group col-span-2">
                <label for="remarks">Remarks</label>
                <textarea id="remarks" name="remarks" [(ngModel)]="brokerFormModel.remarks" placeholder="Additional details, commission tiers preferred, background notes..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeBrokerModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!brokerForm.valid">{{ editMode ? 'Save Changes' : 'Onboard' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Bank Account Modal -->
    <div class="modal-overlay" *ngIf="showBankModal" (click)="closeBankModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 450px;">
        <header class="modal-header">
          <h2>Add Bank Routing Details</h2>
          <button class="header-icon-btn close-btn" (click)="closeBankModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="saveBankAccount()" #bankForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group col-span-2">
                <label for="bankName">Bank Name *</label>
                <input type="text" id="bankName" name="bankName" [(ngModel)]="bankFormModel.bankName" required placeholder="Commercial Bank of Ethiopia, Awash, etc.">
              </div>

              <div class="form-group col-span-2">
                <label for="accountName">Account Holder Name *</label>
                <input type="text" id="accountName" name="accountName" [(ngModel)]="bankFormModel.accountName" required placeholder="Account Holder Full Name">
              </div>

              <div class="form-group col-span-2">
                <label for="accountNumber">Account Number *</label>
                <input type="text" id="accountNumber" name="accountNumber" [(ngModel)]="bankFormModel.accountNumber" required placeholder="Bank Account Number">
              </div>

              <div class="form-group col-span-2 flex align-center gap-2">
                <input type="checkbox" id="isDefault" name="isDefault" [(ngModel)]="bankFormModel.isDefault">
                <label for="isDefault" style="margin-bottom: 0; cursor: pointer;">Set as default payment routing account</label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeBankModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!bankForm.valid">Add Account</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Upload Document Modal -->
    <div class="modal-overlay" *ngIf="showDocModal" (click)="closeDocModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 450px;">
        <header class="modal-header">
          <h2>Upload Credential Document</h2>
          <button class="header-icon-btn close-btn" (click)="closeDocModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="uploadDoc()" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group col-span-2">
                <label for="documentName">Document Name *</label>
                <input type="text" id="documentName" name="documentName" [(ngModel)]="docFormModel.documentName" required [ngModelOptions]="{standalone: true}" placeholder="e.g. Trade License Copy, Passport Photo">
              </div>

              <div class="form-group col-span-2">
                <label for="documentTypeId">Document Type *</label>
                <select id="documentTypeId" name="documentTypeId" [(ngModel)]="docFormModel.documentTypeId" required [ngModelOptions]="{standalone: true}" class="form-control">
                  <option value="TRADE_LICENSE">Trade License</option>
                  <option value="TIN_CERTIFICATE">TIN Certificate</option>
                  <option value="ID_CARD">National ID / Passport</option>
                  <option value="OTHER">Other Credential</option>
                </select>
              </div>

              <div class="form-group col-span-2">
                <label for="expiryDate">Expiration Date</label>
                <input type="date" id="expiryDate" name="expiryDate" [(ngModel)]="docFormModel.expiryDate" [ngModelOptions]="{standalone: true}">
              </div>

              <div class="form-group col-span-2">
                <label for="file">Document File *</label>
                <input type="file" id="file" (change)="onFileSelected($event)" required>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDocModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!docFormModel.documentName || !docFormModel.documentTypeId || !selectedFile">Upload</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .type-pill {
      background-color: var(--brand-primary-light);
      color: var(--brand-primary);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 11px;
    }
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      outline: none;
    }
    .form-control:focus {
      border-color: var(--brand-primary);
    }
    .detail-card {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      padding: 16px;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }
    .detail-card:hover {
      border-color: var(--brand-primary);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.05);
    }
    .detail-card .text-secondary {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    .detail-card strong {
      font-size: 13px;
      color: var(--text-main);
    }
    .detail-card p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .avatar-lg {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary) 0%, #2f2070 100%);
      color: white;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 10px rgba(76, 58, 147, 0.2);
    }
  `]
})
export class BrokerListComponent implements OnInit {
  private brokerService = inject(BrokerService);
  public authService = inject(AuthService);

  brokers: any[] = [];
  filteredBrokers: any[] = [];
  selectedBroker: any = null;
  selectedBrokerDetails: any = null;

  searchQuery = '';
  filterType = 'ALL';

  // Modal displays
  showBrokerModal = false;
  showBankModal = false;
  showDocModal = false;
  editMode = false;

  // Forms model
  brokerFormModel: any = {};
  bankFormModel: any = {};
  docFormModel: any = {};
  selectedFile: File | null = null;

  ngOnInit() {
    this.loadBrokers();
  }

  loadBrokers() {
    this.brokerService.getBrokers().subscribe({
      next: (res) => {
        this.brokers = res;
        this.filterBrokers();
        if (this.selectedBroker) {
          const updated = res.find(b => b.id === this.selectedBroker.id);
          if (updated) {
            this.selectBroker(updated);
          } else {
            this.selectedBroker = null;
            this.selectedBrokerDetails = null;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load brokers', err);
      }
    });
  }

  filterBrokers() {
    let list = this.brokers;
    if (this.filterType !== 'ALL') {
      list = list.filter(b => b.brokerTypeId === this.filterType);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(b => b.brokerName.toLowerCase().includes(q) || b.brokerCode.toLowerCase().includes(q));
    }
    this.filteredBrokers = list;
  }

  selectBroker(broker: any) {
    this.selectedBroker = broker;
    this.brokerService.getBrokerById(broker.id).subscribe({
      next: (res) => {
        this.selectedBrokerDetails = res;
      },
      error: (err) => {
        console.error('Failed to load broker portfolio details', err);
      }
    });
  }

  // --- Broker Onboarding CRUD ---
  openCreateModal() {
    this.editMode = false;
    this.brokerFormModel = {
      brokerTypeId: 'INDIVIDUAL',
      brokerName: '',
      tradeLicenseNumber: '',
      tinNumber: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      emailAddress: '',
      address: '',
      city: '',
      remarks: ''
    };
    this.showBrokerModal = true;
  }

  openEditModal(broker: any) {
    this.editMode = true;
    this.brokerFormModel = { ...broker };
    this.showBrokerModal = true;
  }

  closeBrokerModal() {
    this.showBrokerModal = false;
  }

  saveBroker() {
    if (this.editMode) {
      this.brokerService.updateBroker(this.brokerFormModel.id, this.brokerFormModel).subscribe({
        next: () => {
          this.loadBrokers();
          this.closeBrokerModal();
        },
        error: (err) => console.error('Failed to update broker', err)
      });
    } else {
      this.brokerService.createBroker(this.brokerFormModel).subscribe({
        next: (res) => {
          this.loadBrokers();
          this.selectBroker(res);
          this.closeBrokerModal();
        },
        error: (err) => console.error('Failed to onboard broker', err)
      });
    }
  }

  async deactivateBroker(broker: any) {
    const confirm = await customConfirm(
      `Are you sure you want to deactivate the broker "${broker.brokerName}"? This will restrict them from attributing new sales.`,
      'Deactivate Broker'
    );
    if (confirm) {
      this.brokerService.deleteBroker(broker.id).subscribe({
        next: () => {
          this.loadBrokers();
        },
        error: (err) => console.error('Failed to deactivate broker', err)
      });
    }
  }

  // --- Bank Accounts Routing ---
  openAddBankModal() {
    this.bankFormModel = {
      bankName: '',
      accountName: this.selectedBroker.brokerName,
      accountNumber: '',
      isDefault: true
    };
    this.showBankModal = true;
  }

  closeBankModal() {
    this.showBankModal = false;
  }

  saveBankAccount() {
    this.brokerService.addBankAccount(this.selectedBroker.id, this.bankFormModel).subscribe({
      next: () => {
        this.selectBroker(this.selectedBroker);
        this.closeBankModal();
      },
      error: (err) => console.error('Failed to add bank account', err)
    });
  }

  async deleteBankAccount(accountId: number) {
    const confirm = await customConfirm(
      'Are you sure you want to remove this bank account payment routing setting?',
      'Delete Bank Account'
    );
    if (confirm) {
      this.brokerService.deleteBankAccount(this.selectedBroker.id, accountId).subscribe({
        next: () => {
          this.selectBroker(this.selectedBroker);
        },
        error: (err) => console.error('Failed to remove bank account', err)
      });
    }
  }

  // --- Documents Upload ---
  openAddDocModal() {
    this.docFormModel = {
      documentName: '',
      documentTypeId: 'TRADE_LICENSE',
      expiryDate: ''
    };
    this.selectedFile = null;
    this.showDocModal = true;
  }

  closeDocModal() {
    this.showDocModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadDoc() {
    if (!this.selectedFile) return;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('documentName', this.docFormModel.documentName);
    formData.append('documentTypeId', this.docFormModel.documentTypeId);
    if (this.docFormModel.expiryDate) {
      formData.append('expiryDate', this.docFormModel.expiryDate);
    }

    this.brokerService.uploadDocument(this.selectedBroker.id, formData).subscribe({
      next: () => {
        this.selectBroker(this.selectedBroker);
        this.closeDocModal();
      },
      error: (err) => console.error('Failed to upload document', err)
    });
  }

  async deleteDocument(docId: number) {
    const confirm = await customConfirm(
      'Are you sure you want to remove this credential document?',
      'Delete Document'
    );
    if (confirm) {
      this.brokerService.deleteDocument(this.selectedBroker.id, docId).subscribe({
        next: () => {
          this.selectBroker(this.selectedBroker);
        },
        error: (err) => console.error('Failed to remove document', err)
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'BR';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
