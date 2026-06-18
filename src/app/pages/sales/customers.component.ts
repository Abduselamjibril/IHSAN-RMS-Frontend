import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { CrmService } from '../../services/crm.service';

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
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Nationality</th>
              <th>Linked CRM Lead</th>
              <th>Created Date</th>
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
            </tr>
            <tr *ngIf="filteredCustomers.length === 0">
              <td colspan="6" class="text-center py-6 text-secondary">
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
                  <option *ngFor="let l of leads" [value]="l.id">{{ l.fullName }} ({{ l.primaryPhone }})</option>
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
  successMessage = '';
  errorMessage = '';

  newCustomer = {
    fullName: '',
    primaryPhone: '',
    primaryEmail: '',
    nationality: '',
    leadId: null as number | null
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
      },
      error: (err) => {
        console.error('Error creating customer', err);
        this.errorMessage = err.error?.message || 'Failed to register customer.';
      }
    });
  }
}
