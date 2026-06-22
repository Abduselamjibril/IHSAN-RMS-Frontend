import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { CrmService } from '../../services/crm.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Customers Directory</h1>
        <p>Manage real estate buyers, lead conversions, and customer records</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          New Customer
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

    <!-- Customer List Area -->
    <div class="card glass-card">
      <!-- Search/Filters -->
      <div class="filter-bar flex justify-between align-center gap-4" style="margin-bottom: 20px;">
        <div class="search-box" style="flex: 1; max-width: 400px;">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by customer name, phone or email..." 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()" 
          />
        </div>
      </div>

      <!-- Customers Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Nationality</th>
              <th>Linked CRM Lead</th>
              <th>Created Date</th>
              <th class="text-center" style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of filteredCustomers; let i = index">
              <td>
                <div class="flex align-center gap-2">
                  <div class="table-avatar">{{ getInitials(c.fullName) }}</div>
                  <span class="font-bold text-main">{{ c.fullName }}</span>
                </div>
              </td>
              <td>{{ c.primaryPhone }}</td>
              <td>{{ c.primaryEmail || '-' }}</td>
              <td>{{ c.nationality || '-' }}</td>
              <td>
                <span *ngIf="c.lead" class="badge badge-indigo">
                  {{ c.lead.fullName }} ({{ c.lead.leadCode }})
                </span>
                <span *ngIf="!c.lead" class="text-secondary italic">Direct Customer</span>
              </td>
              <td>{{ c.createdAt | date:'mediumDate' }}</td>
              <td>
                <div class="flex justify-center gap-2">
                  <button class="header-icon-btn edit-btn" title="Edit Customer" (click)="openEditModal(c)">
                    <span class="material-icons-outlined" style="font-size: 18px; color: var(--brand-primary);">edit</span>
                  </button>
                  <button class="header-icon-btn delete-btn" title="Delete Customer" (click)="onDeleteCustomer(c.id, c.fullName)">
                    <span class="material-icons-outlined" style="font-size: 18px; color: var(--color-lost);">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredCustomers.length === 0">
              <td colspan="7" class="text-center py-6 text-secondary">
                No customers registered yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Register Customer Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Register Customer Entity</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmit($event)">
            <!-- Form explanation -->
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Create a customer profile to associate with reservations, quotes, and contract bookings.
            </p>

            <!-- Full Name (Required) -->
            <div class="form-group flex flex-col">
               <label>Full Customer Name <span class="text-danger" style="color: red;">*</span> [REQUIRED]</label>
              <input type="text" [(ngModel)]="newCustomer.fullName" name="fullName" required placeholder="Enter customer full name (e.g. John Doe)" />
            </div>

            <div class="form-row flex gap-3">
              <!-- Primary Phone (Required) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Primary Phone <span class="text-danger" style="color: red;">*</span> [REQUIRED]</label>
                <input type="text" [(ngModel)]="newCustomer.primaryPhone" name="primaryPhone" required placeholder="e.g. +251911223344" />
              </div>

              <!-- Primary Email (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Email Address [OPTIONAL]</label>
                <input type="email" [(ngModel)]="newCustomer.primaryEmail" name="primaryEmail" placeholder="customer@email.com" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Nationality (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Nationality [OPTIONAL]</label>
                <input type="text" [(ngModel)]="newCustomer.nationality" name="nationality" placeholder="e.g. Ethiopian" />
              </div>

              <!-- Link Lead (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Link CRM Lead [OPTIONAL]</label>
                <select [(ngModel)]="newCustomer.leadId" name="leadId" (change)="onLeadSelectChange()">
                  <option [value]="null">-- Select Lead to Auto-Fill & Link --</option>
                  <option *ngFor="let l of getAvailableLeads()" [value]="l.id">{{ l.fullName }} ({{ l.primaryPhone }})</option>
                </select>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newCustomer.fullName || !newCustomer.primaryPhone">
                Save Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Customer Modal -->
    <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Edit Customer Profile</h2>
          <button class="header-icon-btn close-btn" (click)="closeEditModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onEditSubmit($event)">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Modify customer profile details. Modifying the linked lead is disabled to preserve audit integrity.
            </p>

            <!-- Full Name (Required) -->
            <div class="form-group flex flex-col">
              <label>Full Customer Name <span class="text-danger" style="color: red;">*</span> [REQUIRED]</label>
              <input type="text" [(ngModel)]="editCustomer.fullName" name="fullName" required placeholder="Enter customer full name" />
            </div>

            <div class="form-row flex gap-3">
              <!-- Primary Phone (Required) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Primary Phone <span class="text-danger" style="color: red;">*</span> [REQUIRED]</label>
                <input type="text" [(ngModel)]="editCustomer.primaryPhone" name="primaryPhone" required placeholder="e.g. +251911223344" />
              </div>

              <!-- Primary Email (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Email Address [OPTIONAL]</label>
                <input type="email" [(ngModel)]="editCustomer.primaryEmail" name="primaryEmail" placeholder="customer@email.com" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <!-- Nationality (Optional) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Nationality [OPTIONAL]</label>
                <input type="text" [(ngModel)]="editCustomer.nationality" name="nationality" placeholder="e.g. Ethiopian" />
              </div>

              <!-- Link Lead (Read Only) -->
              <div class="form-group flex-1 flex flex-col">
                <label>Linked CRM Lead [LOCKED]</label>
                <input type="text" [value]="editCustomer.leadName ? editCustomer.leadName : 'Direct Customer'" disabled style="background: rgba(255,255,255,0.05); color: var(--text-secondary);" />
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="modal-footer flex justify-end gap-3" style="margin-top: 24px;">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editCustomer.fullName || !editCustomer.primaryPhone">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-round);
      background-color: var(--brand-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
    .badge-indigo {
      background-color: var(--brand-primary-fade);
      color: var(--brand-primary);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
    }
    .edit-btn, .delete-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-sm);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .edit-btn:hover {
      background: rgba(var(--brand-primary-rgb), 0.15);
      border-color: var(--brand-primary);
    }
    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: var(--color-lost);
    }
  `]
})
export class CustomersComponent implements OnInit {
  private salesService = inject(SalesService);
  private crmService = inject(CrmService);

  customers: any[] = [];
  filteredCustomers: any[] = [];
  leads: any[] = [];

  searchQuery = '';
  showCreateModal = false;
  showEditModal = false;
  successMessage = '';
  errorMessage = '';

  newCustomer = {
    fullName: '',
    primaryPhone: '',
    primaryEmail: '',
    nationality: '',
    leadId: null as number | null
  };

  editCustomer = {
    id: 0,
    fullName: '',
    primaryPhone: '',
    primaryEmail: '',
    nationality: '',
    leadName: ''
  };

  ngOnInit() {
    this.loadCustomers();
    this.loadLeads();
  }

  loadCustomers() {
    this.salesService.getCustomers().subscribe({
      next: (res) => {
        this.customers = res;
        this.filteredCustomers = res;
      },
      error: (err) => console.error('Error fetching customers', err)
    });
  }

  loadLeads() {
    this.crmService.getLeads({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.leads = res.data || [];
      },
      error: (err) => console.error('Error fetching leads', err)
    });
  }

  getAvailableLeads(): any[] {
    const convertedLeadIds = this.customers
      .filter(c => c.lead && c.lead.id)
      .map(c => Number(c.lead.id));
    return this.leads.filter(l => !convertedLeadIds.includes(Number(l.id)));
  }

  onSearchChange() {
    if (!this.searchQuery.trim()) {
      this.filteredCustomers = this.customers;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredCustomers = this.customers.filter(c => 
      c.fullName.toLowerCase().includes(q) ||
      c.primaryPhone.toLowerCase().includes(q) ||
      (c.primaryEmail && c.primaryEmail.toLowerCase().includes(q))
    );
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.newCustomer = {
      fullName: '',
      primaryPhone: '',
      primaryEmail: '',
      nationality: '',
      leadId: null
    };
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openEditModal(customer: any) {
    this.showEditModal = true;
    this.editCustomer = {
      id: customer.id,
      fullName: customer.fullName || '',
      primaryPhone: customer.primaryPhone || '',
      primaryEmail: customer.primaryEmail || '',
      nationality: customer.nationality || '',
      leadName: customer.lead ? `${customer.lead.fullName} (${customer.lead.leadCode})` : ''
    };
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  onLeadSelectChange() {
    if (!this.newCustomer.leadId) return;
    const selectedLead = this.leads.find(l => l.id == this.newCustomer.leadId);
    if (selectedLead) {
      this.newCustomer.fullName = selectedLead.fullName || '';
      this.newCustomer.primaryPhone = selectedLead.primaryPhone || '';
      this.newCustomer.primaryEmail = selectedLead.primaryEmail || '';
      this.newCustomer.nationality = selectedLead.nationality || '';
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.newCustomer.fullName || !this.newCustomer.primaryPhone) return;

    this.salesService.createCustomer(this.newCustomer).subscribe({
      next: (res) => {
        this.successMessage = `Customer ${res.fullName} registered successfully!`;
        this.loadCustomers();
        this.closeCreateModal();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        console.error('Error creating customer', err);
        this.errorMessage = err.error?.message || 'Failed to register customer.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  onEditSubmit(event: Event) {
    event.preventDefault();
    if (!this.editCustomer.fullName || !this.editCustomer.primaryPhone) return;

    const payload = {
      fullName: this.editCustomer.fullName,
      primaryPhone: this.editCustomer.primaryPhone,
      primaryEmail: this.editCustomer.primaryEmail || null,
      nationality: this.editCustomer.nationality || null
    };

    this.salesService.updateCustomer(this.editCustomer.id, payload).subscribe({
      next: (res) => {
        this.successMessage = `Customer ${res.fullName} updated successfully!`;
        this.loadCustomers();
        this.closeEditModal();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        console.error('Error updating customer', err);
        this.errorMessage = err.error?.message || 'Failed to update customer.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  onDeleteCustomer(id: number, name: string) {
    customConfirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`).then(confirmed => {
      if (confirmed) {
        this.salesService.deleteCustomer(id).subscribe({
          next: () => {
            this.successMessage = `Customer "${name}" deleted successfully.`;
            this.loadCustomers();
            setTimeout(() => this.successMessage = '', 5000);
          },
          error: (err) => {
            console.error('Error deleting customer', err);
            this.errorMessage = err.error?.message || `Failed to delete customer "${name}".`;
            setTimeout(() => this.errorMessage = '', 5000);
          }
        });
      }
    });
  }
}
