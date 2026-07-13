import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertiesService } from '../../../services/properties.service';
import { DynamicDropdownComponent } from '../../../components/dynamic-dropdown/dynamic-dropdown.component';
import { customConfirm } from '../../../utils/confirm';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-properties-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DynamicDropdownComponent],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Properties Directory</h1>
        <p>Manage projects, buildings, and development units</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary flex align-center gap-2" (click)="openCreateModal()" *ngIf="authService.hasPermission('properties.sites.create', 'create')">
          <span class="material-icons-outlined">add</span>
          New Property
        </button>
      </div>
    </header>

    <!-- Success Alert -->
    <div class="alert alert-success" *ngIf="successMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-qualified); color: var(--color-qualified); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">check_circle</span>
      <strong>Success:</strong>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Filter Bar -->
    <div class="card glass-card" style="margin-bottom: 24px; padding: 18px;">
      <div class="flex justify-between align-center gap-4 flex-wrap">
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by code, name, city..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="filters.propertyTypeId" (change)="loadProperties()" style="padding: 8px 14px; min-width: 170px;">
            <option [value]="0">All Property Types</option>
            <option *ngFor="let t of propertyTypes" [value]="t.id">{{ t.typeName }}</option>
          </select>

          <div class="search-box">
            <span class="material-icons-outlined" style="left: 12px;">place</span>
            <input 
              type="text" 
              placeholder="Filter by City" 
              [(ngModel)]="filters.city" 
              (ngModelChange)="onSearchChange()"
              style="padding: 8px 12px 8px 36px; border-radius: var(--radius-md); border: 1px solid var(--border-color); width: 180px; background-color: var(--bg-main);"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Grid -->
    <div class="properties-grid">
      <div class="property-card card hover-lift" *ngFor="let p of properties">
        <div class="p-accent-banner"></div>
        <div class="p-card-body">
          <div class="p-header">
            <div class="p-icon-container">
              <span class="material-icons-outlined prop-icon">business</span>
            </div>
            <div class="p-titles">
              <h3>{{ p.propertyName }}</h3>
              <span class="p-code-badge font-mono">{{ p.propertyCode }}</span>
            </div>
          </div>
          <p class="p-desc">{{ p.description || 'No description provided.' }}</p>
          
          <div class="p-info-list">
            <div class="p-info-row">
              <span class="material-icons-outlined text-secondary font-sm">place</span>
              <span class="p-info-text">{{ p.address || p.subCity || 'No address' }}, {{ p.city }}</span>
            </div>
            <div class="p-info-row" *ngIf="p.developerName">
              <span class="material-icons-outlined text-secondary font-sm">engineering</span>
              <span class="p-info-text">{{ p.developerName }}</span>
            </div>
            <div class="p-info-row" *ngIf="p.contactPhone">
              <span class="material-icons-outlined text-secondary font-sm">phone</span>
              <span class="p-info-text">{{ p.contactPhone }}</span>
            </div>
            <div class="p-info-row" *ngIf="p.totalLandArea">
              <span class="material-icons-outlined text-secondary font-sm">square_foot</span>
              <span class="p-info-text">{{ p.totalLandArea | number }} m² land</span>
            </div>
            <div class="p-info-row" *ngIf="p.launchDate || p.completionDate">
              <span class="material-icons-outlined text-secondary font-sm">event</span>
              <span class="p-info-text">
                <span *ngIf="p.launchDate">Launch: {{ p.launchDate | date:'shortDate' }}</span>
                <span *ngIf="p.launchDate && p.completionDate"> — </span>
                <span *ngIf="p.completionDate">Complete: {{ p.completionDate | date:'shortDate' }}</span>
              </span>
            </div>
          </div>

          <div class="p-footer">
            <div class="flex gap-2 align-center">
              <span class="badge badge-indigo">{{ p.propertyType?.typeName || 'Development' }}</span>
              <span class="badge badge-qualified" *ngIf="p.propertyStatus" style="font-size: 10px;">{{ p.propertyStatus }}</span>
            </div>
            <div class="actions">
              <a [routerLink]="['/properties/details', p.id]" class="btn btn-secondary btn-sm flex align-center gap-1">
                <span class="material-icons-outlined font-sm">edit</span>
                <span>Manage</span>
              </a>
              <button class="btn btn-danger btn-sm" (click)="onDelete(p.id)" style="padding: 8px;">
                <span class="material-icons-outlined font-sm">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="properties.length === 0" class="text-center py-6 text-secondary italic" style="grid-column: 1 / -1;">
        No properties found matching filters.
      </div>
    </div>

    <!-- Create Property Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Register New Property / Project</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmit($event)">
            
            <div class="alert alert-danger" *ngIf="errorMessage" style="margin-bottom: 16px; padding: 10px 14px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 13px; display: flex; align-items: center; gap: 8px;">
              <span class="material-icons-outlined" style="font-size: 18px;">error_outline</span>
              <span>{{ errorMessage }}</span>
            </div>
            
            <div class="form-group flex flex-col">
              <label>Property Code <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="newProperty.propertyCode" name="propertyCode" required placeholder="e.g. GV-001" />
            </div>

            <div class="form-group flex flex-col">
              <label>Property Name <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="newProperty.propertyName" name="propertyName" required placeholder="e.g. Green View Towers" />
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Property Type <span class="text-danger" style="color: red;">*</span></label>
                <app-dynamic-dropdown
                  [options]="propertyTypes"
                  [(value)]="newProperty.propertyTypeId"
                  displayKey="typeName"
                  valueKey="id"
                  placeholder="Select Property Type"
                  (add)="onAddPropertyType($event)"
                  (edit)="onEditPropertyType($event)"
                  (delete)="onDeletePropertyType($event)"
                ></app-dynamic-dropdown>
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Description</label>
              <textarea [(ngModel)]="newProperty.description" name="description" placeholder="Project overview..." rows="3"></textarea>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Country</label>
                <input type="text" [(ngModel)]="newProperty.country" name="country" placeholder="Ethiopia" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>City</label>
                <input type="text" [(ngModel)]="newProperty.city" name="city" placeholder="Addis Ababa" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Sub-City</label>
                <input type="text" [(ngModel)]="newProperty.subCity" name="subCity" placeholder="Bole" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Address Details</label>
                <input type="text" [(ngModel)]="newProperty.address" name="address" placeholder="Behind Skylight Hotel" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Latitude</label>
                <input type="number" [(ngModel)]="newProperty.latitude" name="latitude" placeholder="e.g. 9.0300" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Longitude</label>
                <input type="number" [(ngModel)]="newProperty.longitude" name="longitude" placeholder="e.g. 38.7400" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Total Land Area (m²)</label>
                <input type="number" [(ngModel)]="newProperty.totalLandArea" name="totalLandArea" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Total Built-up Area (m²)</label>
                <input type="number" [(ngModel)]="newProperty.totalBuiltupArea" name="totalBuiltupArea" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Launch Date</label>
                <input type="date" [(ngModel)]="newProperty.launchDate" name="launchDate" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Completion Date</label>
                <input type="date" [(ngModel)]="newProperty.completionDate" name="completionDate" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Property Status</label>
                <select [(ngModel)]="newProperty.propertyStatus" name="propertyStatus">
                  <option value="">Select Status</option>
                  <option value="Planned">Planned</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Completed">Completed</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Developer Name</label>
                <input type="text" [(ngModel)]="newProperty.developerName" name="developerName" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Contact Phone</label>
                <input type="text" [(ngModel)]="newProperty.contactPhone" name="contactPhone" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Contact Email</label>
                <input type="email" [(ngModel)]="newProperty.contactEmail" name="contactEmail" />
              </div>
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Website</label>
                <input type="url" [(ngModel)]="newProperty.website" name="website" placeholder="https://" />
              </div>
            </div>

            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="newProperty.remarks" name="remarks" placeholder="Additional notes..." rows="2"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newProperty.propertyCode || !newProperty.propertyName || !newProperty.propertyTypeId">
                Save Property
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    .property-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border-color);
      transition: var(--transition-normal);
      padding: 0 !important;
    }
    .p-accent-banner {
      height: 5px;
      background: var(--brand-primary-gradient);
    }
    .p-card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
      flex: 1;
    }
    .p-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .p-icon-container {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.12));
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(76, 58, 147, 0.05);
    }
    .prop-icon {
      font-size: 24px;
      color: var(--brand-primary);
    }
    .p-titles h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
    }
    .p-code-badge {
      font-size: 11px;
      color: var(--brand-primary);
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .p-desc {
      font-size: 13px;
      color: var(--text-secondary);
      flex: 1;
      line-height: 1.45;
      margin: 4px 0;
    }
    .p-info-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px dashed var(--border-color);
      padding-top: 12px;
      margin-top: 4px;
    }
    .p-info-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .p-info-text {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .p-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 14px;
      margin-top: auto;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .flex-wrap {
      flex-wrap: wrap;
    }
  `]
})
export class PropertiesListComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  public authService = inject(AuthService);

  properties: any[] = [];
  propertyTypes: any[] = [];
  showCreateModal = false;

  filters = {
    search: '',
    propertyTypeId: 0,
    city: ''
  };

  newProperty = {
    propertyCode: '',
    propertyName: '',
    description: '',
    address: '',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    subCity: '',
    propertyTypeId: 0 as any,
    latitude: null as number | null,
    longitude: null as number | null,
    totalLandArea: null as number | null,
    totalBuiltupArea: null as number | null,
    launchDate: '',
    completionDate: '',
    propertyStatus: '',
    developerName: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    remarks: ''
  };

  customTypeName = '';
  errorMessage = '';
  successMessage = '';
  searchTimeout: any;

  ngOnInit() {
    this.loadPropertyTypes();
    this.loadProperties();
  }

  loadPropertyTypes() {
    this.propertiesService.getPropertyTypes().subscribe({
      next: (res) => {
        this.propertyTypes = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading property types:', err)
    });
  }

  loadProperties() {
    const reqFilters: any = {};
    if (this.filters.search) reqFilters.search = this.filters.search;
    if (this.filters.propertyTypeId) reqFilters.propertyTypeId = +this.filters.propertyTypeId;
    if (this.filters.city) reqFilters.city = this.filters.city;

    console.log('DEBUG: loadProperties called with filters:', JSON.stringify(this.filters), 'reqFilters:', JSON.stringify(reqFilters));

    this.propertiesService.getProperties(reqFilters).subscribe({
      next: (res) => {
        console.log('DEBUG: loadProperties success response items count:', res?.items?.length, 'res:', JSON.stringify(res));
        this.properties = res.items ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading properties:', err)
    });
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProperties();
    }, 400);
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.errorMessage = '';
    this.customTypeName = '';
    this.newProperty = {
      propertyCode: '',
      propertyName: '',
      description: '',
      address: '',
      country: 'Ethiopia',
      city: 'Addis Ababa',
      subCity: '',
      propertyTypeId: 0,
      latitude: null,
      longitude: null,
      totalLandArea: null,
      totalBuiltupArea: null,
      launchDate: '',
      completionDate: '',
      propertyStatus: '',
      developerName: '',
      contactPhone: '',
      contactEmail: '',
      website: '',
      remarks: ''
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  onAddPropertyType(payload: { name: string; description: string }) {
    this.propertiesService.createPropertyType({ typeName: payload.name, description: payload.description }).subscribe({
      next: (res) => {
        this.loadPropertyTypes();
        this.newProperty.propertyTypeId = res.id;
      },
      error: (err) => console.error('Error creating property type:', err)
    });
  }

  onEditPropertyType(event: { id: number; name: string }) {
    this.propertiesService.updatePropertyType(event.id, { typeName: event.name }).subscribe({
      next: () => {
        this.loadPropertyTypes();
      },
      error: (err) => console.error('Error updating property type:', err)
    });
  }

  onDeletePropertyType(id: number) {
    this.propertiesService.deletePropertyType(id).subscribe({
      next: () => {
        this.loadPropertyTypes();
      },
      error: (err) => console.error('Error deleting property type:', err)
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.newProperty.propertyTypeId || this.newProperty.propertyTypeId === 0) return;
    this.savePropertyWithTypeId(+this.newProperty.propertyTypeId);
  }

  private savePropertyWithTypeId(typeId: number) {
    const payload: any = {
      ...this.newProperty,
      propertyTypeId: typeId
    };

    if (!payload.launchDate) delete payload.launchDate;
    if (!payload.completionDate) delete payload.completionDate;

    this.errorMessage = '';
    this.propertiesService.createProperty(payload).subscribe({
      next: (res) => {
        this.closeCreateModal();
        this.router.navigate(['/properties/details', res.id]);
      },
      error: (err) => {
        console.error('Error saving property:', err);
        this.errorMessage = err.error?.message || 'An error occurred while saving the property.';
        setTimeout(() => {
          const modalBody = document.querySelector('.modal-body');
          if (modalBody) modalBody.scrollTop = 0;
        }, 50);
      }
    });
  }

  onDelete(id: number) {
    customConfirm('Are you sure you want to delete this property?').then(confirmed => {
      if (confirmed) {
        this.propertiesService.deleteProperty(id).subscribe({
          next: () => this.loadProperties(),
          error: (err) => console.error('Error deleting property:', err)
        });
      }
    });
  }
}
