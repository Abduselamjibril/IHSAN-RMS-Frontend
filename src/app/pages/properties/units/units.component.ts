import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { customConfirm } from '../../../utils/confirm';
import { RouterLink } from '@angular/router';
import { PropertiesService } from '../../../services/properties.service';
import { DynamicDropdownComponent } from '../../../components/dynamic-dropdown/dynamic-dropdown.component';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DynamicDropdownComponent],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Units & Inventory</h1>
        <p>Real-time units registry, availability monitoring, and imports</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-secondary flex align-center gap-1" (click)="toggleColorPickerModal()">
          <span class="material-icons-outlined">palette</span>
          Status Colors
        </button>
        <button class="btn btn-secondary flex align-center gap-1" (click)="openImportModal()">
          <span class="material-icons-outlined">file_upload</span>
          Bulk Import CSV
        </button>
        <button class="btn btn-primary flex align-center gap-1" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          New Unit
        </button>
      </div>
    </header>

    <!-- Success Alert -->
    <div class="alert alert-success" *ngIf="successMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-qualified); color: var(--color-qualified); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">check_circle</span>
      <strong>Success:</strong>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Filters Panel -->
    <div class="card" style="margin-bottom: 24px; padding: 16px;">
      <div class="flex justify-between align-center gap-3 flex-wrap">
        <!-- Search box -->
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by code or number..." 
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchChange()" 
          />
        </div>

        <!-- Filter Selects -->
        <div class="flex align-center gap-2 flex-wrap">
          <select [(ngModel)]="filters.propertyId" (change)="onPropertyFilterChange()">
            <option [value]="0">All Properties</option>
            <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
          </select>

          <select [(ngModel)]="filters.buildingId" (change)="onBuildingFilterChange()" [disabled]="!filters.propertyId">
            <option [value]="0">All Buildings</option>
            <option *ngFor="let b of filterBuildings" [value]="b.id">{{ b.buildingName }}</option>
          </select>

          <select [(ngModel)]="filters.floorId" (change)="loadUnits()" [disabled]="!filters.buildingId">
            <option [value]="0">All Floors</option>
            <option *ngFor="let f of filterFloors" [value]="f.id">Floor {{ f.floorNumber }}</option>
          </select>

          <select [(ngModel)]="filters.unitTypeId" (change)="loadUnits()">
            <option [value]="0">All Unit Types</option>
            <option *ngFor="let t of unitTypes" [value]="t.id">{{ t.typeName }}</option>
          </select>

          <select [(ngModel)]="filters.unitStatusId" (change)="loadUnits()">
            <option [value]="0">All Statuses</option>
            <option *ngFor="let s of unitStatuses" [value]="s.id">{{ s.statusName }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Units Table -->
    <div class="card table-container">
      <table class="leads-table">
        <thead>
          <tr>
            <th>Unit Code</th>
            <th>Unit Number</th>
            <th>Property / Building</th>
            <th>Floor</th>
            <th>Unit Type</th>
            <th>Area (m²)</th>
            <th>Bed / Bath</th>
            <th>View</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of units">
            <td class="font-mono font-bold">
              {{ u.unitCode }}
              <span class="material-icons-outlined text-indigo font-xs" *ngIf="u.isFeatured" title="Featured" style="vertical-align: middle;">star</span>
            </td>
            <td>{{ u.unitNumber }}</td>
            <td>
              <div class="flex flex-col">
                <span class="font-bold">{{ u.property?.propertyName }}</span>
                <span class="text-secondary font-xs">{{ u.building?.buildingName }}</span>
              </div>
            </td>
            <td>Floor {{ u.floor?.floorNumber }}</td>
            <td>{{ u.unitType?.typeName }}</td>
            <td>{{ u.grossArea || u.areaSuperBuiltup || '-' }} m²</td>
            <td>{{ u.bedroomCount ?? '-' }} / {{ u.bathroomCount ?? '-' }}</td>
            <td>{{ u.viewType || '-' }}</td>
            <td>{{ u.currentPrice ? ('ETB ' + (u.currentPrice | number)) : 'Not Priced' }}</td>
            <td>
              <span class="badge" [ngStyle]="{'background-color': getStatusColor(u.unitStatus?.colorCode)}">
                {{ u.unitStatus?.statusName }}
              </span>
            </td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-xs" (click)="openStatusDrawer(u)">Manage Status</button>
                <button class="btn btn-danger btn-xs" (click)="onDelete(u.id)"><span class="material-icons-outlined font-xs">delete</span></button>
              </div>
            </td>
          </tr>
          <tr *ngIf="units.length === 0">
            <td colspan="11" class="text-center py-6 text-secondary italic">
              No units registered matching filters.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination flex justify-between align-center">
        <span class="pagination-info">Showing {{ units.length }} of {{ totalUnits }} units</span>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" [disabled]="filters.page <= 1" (click)="prevPage()">Prev</button>
          <button class="btn btn-secondary btn-sm" [disabled]="(filters.page * filters.limit) >= totalUnits" (click)="nextPage()">Next</button>
        </div>
      </div>
    </div>

    <!-- Create Unit Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Add New Development Unit</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitCreate($event)">
            
            <div class="alert alert-danger" *ngIf="errorMessage" style="margin-bottom: 16px; padding: 10px 14px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 13px; display: flex; align-items: center; gap: 8px;">
              <span class="material-icons-outlined" style="font-size: 18px;">error_outline</span>
              <span>{{ errorMessage }}</span>
            </div>
            
            <div class="form-group flex flex-col">
              <label>Unit Title / Label</label>
              <input type="text" [(ngModel)]="newUnit.title" name="title" placeholder="e.g. Luxury 2BHK Apartment" />
            </div>

            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Unit Code <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="newUnit.unitCode" name="uCode" required placeholder="e.g. APT-101" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Unit Number <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="newUnit.unitNumber" name="uNum" required placeholder="e.g. 101" />
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Select Property / Project <span class="text-danger" style="color: red;">*</span></label>
                <select [(ngModel)]="newUnit.propertyId" name="uProp" (change)="onCreatePropertyChange()" required>
                  <option [value]="0">Select Property</option>
                  <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Select Building Block <span class="text-danger" style="color: red;">*</span></label>
                <select [(ngModel)]="newUnit.buildingId" name="uBld" (change)="onCreateBuildingChange()" [disabled]="!newUnit.propertyId" required>
                  <option [value]="0">Select Building</option>
                  <option *ngFor="let b of formBuildings" [value]="b.id">{{ b.buildingName }}</option>
                </select>
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Select Floor Level <span class="text-danger" style="color: red;">*</span></label>
                <select [(ngModel)]="newUnit.floorId" name="uFlr" [disabled]="!newUnit.buildingId" required>
                  <option [value]="0">Select Floor</option>
                  <option *ngFor="let f of formFloors" [value]="f.id">Floor {{ f.floorNumber }} — {{ f.floorName }}</option>
                </select>
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Unit Type <span class="text-danger" style="color: red;">*</span></label>
                <app-dynamic-dropdown
                  [options]="unitTypes"
                  [(value)]="newUnit.unitTypeId"
                  displayKey="typeName"
                  valueKey="id"
                  placeholder="Select Unit Type"
                  (add)="onAddUnitType($event)"
                  (edit)="onEditUnitType($event)"
                  (delete)="onDeleteUnitType($event)"
                ></app-dynamic-dropdown>
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Unit Status (Optional)</label>
                <select [(ngModel)]="newUnit.unitStatusId" name="uStatus">
                  <option [value]="0">Select Status (Default: Available)</option>
                  <option *ngFor="let s of unitStatuses" [value]="s.id">{{ s.statusName }}</option>
                </select>
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Gross / Super Area (m²)</label>
                <input type="number" [(ngModel)]="newUnit.areaSuperBuiltup" name="areaSuper" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Net Carpet Area (m²)</label>
                <input type="number" [(ngModel)]="newUnit.netArea" name="netArea" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Balcony Area (m²)</label>
                <input type="number" [(ngModel)]="newUnit.balconyArea" name="balconyArea" />
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Bedrooms Count</label>
                <input type="number" [(ngModel)]="newUnit.bedrooms" name="bedrooms" placeholder="e.g. 2" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Bathrooms Count</label>
                <input type="number" [(ngModel)]="newUnit.bathroomCount" name="bathrooms" placeholder="e.g. 2" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Parking Slots</label>
                <input type="number" [(ngModel)]="newUnit.parkingSlotCount" name="parking" placeholder="e.g. 1" />
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Facing Direction</label>
                <input type="text" [(ngModel)]="newUnit.facing" name="facing" placeholder="e.g. East, North-West" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>View Type Description</label>
                <input type="text" [(ngModel)]="newUnit.viewType" name="viewType" placeholder="e.g. Garden View, Street View" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Floor Level Number</label>
                <input type="number" [(ngModel)]="newUnit.floorLevel" name="floorLevel" placeholder="e.g. 3" />
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3" style="display: flex; gap: 16px;">
              <div class="form-group flex-1 flex align-center gap-2">
                <input type="checkbox" [(ngModel)]="newUnit.isFurnished" name="isFurnished" id="chkFurnished" />
                <label for="chkFurnished">Is Furnished</label>
              </div>
              <div class="form-group flex-1 flex align-center gap-2">
                <input type="checkbox" [(ngModel)]="newUnit.isCornerUnit" name="isCornerUnit" id="chkCorner" />
                <label for="chkCorner">Is Corner Unit</label>
              </div>
              <div class="form-group flex-1 flex align-center gap-2">
                <input type="checkbox" [(ngModel)]="newUnit.isFeatured" name="isFeatured" id="chkFeatured" />
                <label for="chkFeatured">Is Featured</label>
              </div>
            </div>

            <div class="form-row flex gap-3 mt-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Inventory Tags (comma separated)</label>
                <input type="text" [(ngModel)]="newUnit.inventoryTags" name="tags" placeholder="e.g. Premium, Corner" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Base Price (ETB)</label>
                <input type="number" [(ngModel)]="basePrice" name="bPrice" placeholder="Base valuation price" />
              </div>
            </div>

            <div class="form-group flex flex-col mt-3">
              <label>Remarks</label>
              <textarea [(ngModel)]="newUnit.remarks" name="remarks" placeholder="Notes..." rows="2"></textarea>
            </div>

            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newUnit.unitCode || !newUnit.unitNumber || newUnit.floorId === 0 || !newUnit.unitTypeId">
                Save Unit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Bulk Import Modal -->
    <div class="modal-overlay" *ngIf="showImportModal" (click)="closeImportModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Bulk Import Unit Inventory (CSV)</h2>
          <button class="header-icon-btn close-btn" (click)="closeImportModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <div class="flex flex-col gap-3 p-2">
            <p class="text-secondary font-sm">
              Upload a standard CSV file with headers matching our database schema. You can download the template below to ensure correct columns and format before uploading.
            </p>
            
            <!-- Download Template Button -->
            <button 
              type="button" 
              class="btn btn-secondary flex align-center gap-2 justify-center" 
              (click)="downloadCsvTemplate()"
              style="margin-bottom: 16px; border-style: dashed; padding: 10px 14px; width: 100%; text-align: center;"
            >
              <span class="material-icons-outlined" style="font-size: 20px;">file_download</span>
              <span>Download sample-units-template.csv</span>
            </button>

            <label class="font-bold font-sm text-secondary" style="margin-bottom: 4px;">Upload CSV File</label>
            <input type="file" accept=".csv" (change)="onFileSelected($event)" style="padding: 10px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);" />
            
            <div class="flex justify-end gap-2 mt-4">
              <button class="btn btn-secondary" (click)="closeImportModal()">Cancel</button>
              <button class="btn btn-primary" (click)="onUploadCsv()" [disabled]="!selectedFile">Execute Import</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Colors Customizer Modal -->
    <div class="modal-overlay" *ngIf="showColorPickerModal" (click)="closeColorPickerModal()">
      <div class="modal-container" style="max-width: 450px;" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Configure Status Colors</h2>
          <button class="header-icon-btn close-btn" (click)="closeColorPickerModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="text-secondary font-sm mb-4">Set dynamic color representations for unit statuses. Changes will update unit badges instantly.</p>
          
          <div class="flex flex-col gap-4">
            <div *ngFor="let s of unitStatuses" class="flex align-center justify-between p-3 border" style="border-radius: var(--radius-md); background: var(--bg-card); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 12px; margin-bottom: 8px;">
              <div class="flex align-center gap-3" style="display: flex; align-items: center; gap: 12px;">
                <!-- Graphical Display of Color -->
                <div [style.background-color]="getStatusColor(s.colorCode)" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--border-color);"></div>
                <div>
                  <strong class="text-main" style="font-size: 14px;">{{ s.statusName }}</strong>
                </div>
              </div>
              
              <!-- Paint App / Color Chooser input -->
              <div class="flex align-center gap-2" style="display: flex; align-items: center; gap: 8px;">
                <input 
                  type="color" 
                  [value]="s.colorCode || '#28a745'" 
                  (change)="onStatusColorChange(s, $event)" 
                  style="border: none; background: transparent; cursor: pointer; width: 36px; height: 36px; padding: 0;"
                  title="Choose status color"
                />
                <span class="font-mono text-secondary font-xs" style="text-transform: uppercase; font-size: 11px;">{{ s.colorCode || '#28A745' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer flex justify-end gap-3" style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px; display: flex; justify-content: flex-end; gap: 12px;">
          <button class="btn btn-primary" (click)="closeColorPickerModal()">Done</button>
        </div>
      </div>
    </div>

    <!-- Slide-out Unit Status Drawer Details -->
    <div class="details-drawer-overlay" *ngIf="showStatusDrawer" (click)="closeStatusDrawer()">
      <div class="details-drawer" (click)="$event.stopPropagation()">
        <div class="drawer-header flex justify-between align-center">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-indigo" style="font-size: 28px;">apartment</span>
            <div>
              <h2>Unit: {{ selectedUnit?.unitCode }}</h2>
              <span class="text-secondary font-xs">Status Lifecycle</span>
            </div>
          </div>
          <button class="header-icon-btn close-btn" (click)="closeStatusDrawer()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="drawer-body">
          <!-- Unit Info Summary -->
          <div class="details-list" style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
            <div class="details-item" *ngIf="selectedUnit?.title">
              <span class="label">Title</span>
              <span class="val">{{ selectedUnit.title }}</span>
            </div>
            <div class="details-item">
              <span class="label">Type</span>
              <span class="val">{{ selectedUnit?.unitType?.typeName || '-' }}</span>
            </div>
            <div class="details-item">
              <span class="label">Area</span>
              <span class="val">{{ selectedUnit?.grossArea || selectedUnit?.areaSuperBuiltup || '-' }} m² <span class="text-secondary font-xs" *ngIf="selectedUnit?.netArea">(Net: {{ selectedUnit.netArea }} m²)</span></span>
            </div>
            <div class="details-item" *ngIf="selectedUnit?.balconyArea">
              <span class="label">Balcony Area</span>
              <span class="val">{{ selectedUnit.balconyArea }} m²</span>
            </div>
            <div class="details-item">
              <span class="label">Bedrooms / Bathrooms</span>
              <span class="val">{{ selectedUnit?.bedroomCount ?? '-' }} / {{ selectedUnit?.bathroomCount ?? '-' }}</span>
            </div>
            <div class="details-item" *ngIf="selectedUnit?.parkingSlotCount">
              <span class="label">Parking Slots</span>
              <span class="val">{{ selectedUnit.parkingSlotCount }}</span>
            </div>
            <div class="details-item" *ngIf="selectedUnit?.viewType">
              <span class="label">View Type</span>
              <span class="val">{{ selectedUnit.viewType }}</span>
            </div>
            <div class="details-item" *ngIf="selectedUnit?.floorLevel">
              <span class="label">Floor Level</span>
              <span class="val">{{ selectedUnit.floorLevel }}</span>
            </div>
            <div class="flex gap-2 flex-wrap" style="margin-top: 8px;">
              <span class="badge badge-indigo" *ngIf="selectedUnit?.isFurnished" style="font-size: 10px;">Furnished</span>
              <span class="badge badge-indigo" *ngIf="selectedUnit?.isCornerUnit" style="font-size: 10px;">Corner Unit</span>
              <span class="badge badge-qualified" *ngIf="selectedUnit?.isFeatured" style="font-size: 10px;">Featured</span>
            </div>
            <div class="details-item" *ngIf="selectedUnit?.remarks" style="margin-top: 8px;">
              <span class="label">Remarks</span>
              <span class="val" style="font-style: italic;">{{ selectedUnit.remarks }}</span>
            </div>
          </div>

          <div class="drawer-actions flex flex-col gap-2">
            <label class="font-bold text-secondary font-sm">Transition Status</label>
            <select [(ngModel)]="transitionStatusId" style="width: 100%;">
              <option *ngFor="let s of unitStatuses" [value]="s.id">{{ s.statusName }}</option>
            </select>
            <textarea placeholder="Reason for status update..." [(ngModel)]="transitionReason" rows="2" style="margin-top: 8px; padding: 8px; border: 1px solid var(--border-color); border-radius: var(--radius-md); outline: none;"></textarea>
            <button class="btn btn-primary btn-sm mt-2" (click)="onTransitionStatus()">Update Status</button>
          </div>

          <!-- Status history timeline -->
          <div class="drawer-section mt-4" *ngIf="statusHistory.length > 0">
            <h3>Lifecycle Log History</h3>
            <div class="activity-timeline mt-2">
              <div class="timeline-item" *ngFor="let h of statusHistory">
                <div class="timeline-body" style="padding-left: 12px; border-left: 2px solid var(--brand-primary); margin-left: 6px; padding-bottom: 12px;">
                  <div class="timeline-header flex justify-between">
                    <span class="badge" [style.background-color]="getStatusColor(h.newStatus?.colorCode)">
                      {{ h.newStatus?.statusName }}
                    </span>
                    <span class="timeline-date font-xs text-secondary">{{ h.changedAt | date:'short' }}</span>
                  </div>
                  <p class="timeline-text mt-1 text-main">{{ h.reason || 'No details provided.' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flex-wrap { flex-wrap: wrap; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
  `]
})
export class UnitsComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  units: any[] = [];
  totalUnits = 0;
  propertiesList: any[] = [];
  unitTypes: any[] = [];
  unitStatuses: any[] = [];

  // Filter dropdown builders
  filterBuildings: any[] = [];
  filterFloors: any[] = [];

  // Form buildings/floors
  formBuildings: any[] = [];
  formFloors: any[] = [];

  filters = {
    search: '',
    propertyId: 0,
    buildingId: 0,
    floorId: 0,
    unitStatusId: 0,
    unitTypeId: 0,
    bedrooms: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 8
  };

  newUnit = {
    unitCode: '',
    unitNumber: '',
    propertyId: 0,
    buildingId: 0,
    floorId: 0,
    unitTypeId: 0 as any,
    unitStatusId: 0,
    areaSuperBuiltup: null as number | null,
    netArea: null as number | null,
    balconyArea: null as number | null,
    bedrooms: null as number | null,
    bathroomCount: null as number | null,
    parkingSlotCount: null as number | null,
    facing: '',
    view: '',
    title: '',
    viewType: '',
    floorLevel: null as number | null,
    isFurnished: false,
    isCornerUnit: false,
    isFeatured: false,
    inventoryTags: '',
    remarks: ''
  };

  basePrice = null;
  customUnitTypeName = '';
  errorMessage = '';
  successMessage = '';
  showCreateModal = false;
  showImportModal = false;
  showColorPickerModal = false;
  selectedFile: File | null = null;
  searchTimeout: any;

  // Status Drawer state
  showStatusDrawer = false;
  selectedUnit: any = null;
  transitionStatusId = 0;
  transitionReason = '';
  statusHistory: any[] = [];

  toggleColorPickerModal() {
    this.showColorPickerModal = !this.showColorPickerModal;
    this.cdr.detectChanges();
  }

  closeColorPickerModal() {
    this.showColorPickerModal = false;
    this.cdr.detectChanges();
  }

  onStatusColorChange(status: any, event: any) {
    const newColor = event.target.value;
    status.colorCode = newColor;
    this.propertiesService.updateUnitStatus(status.id, { colorCode: newColor }).subscribe({
      next: (updatedStatus) => {
        const index = this.unitStatuses.findIndex(s => s.id === status.id);
        if (index > -1) {
          this.unitStatuses[index] = updatedStatus;
        }
        this.loadUnits();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error updating status color:', err)
    });
  }

  ngOnInit() {
    this.loadLookups();
    this.loadUnits();
  }

  loadLookups() {
    this.propertiesService.getProperties().subscribe({
      next: (res) => {
        this.propertiesList = res.items ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading properties:', err)
    });
    this.propertiesService.getUnitTypes().subscribe({
      next: (res) => this.unitTypes = res,
      error: (err) => console.error('Error loading unit types:', err)
    });
    this.propertiesService.getUnitStatuses().subscribe({
      next: (res) => {
        this.unitStatuses = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading unit statuses:', err);
        // Fallback to hardcoded if backend endpoint not available
        this.unitStatuses = [
          { id: 1, statusName: 'Available', colorCode: '#28a745' },
          { id: 2, statusName: 'Reserved', colorCode: '#ffc107' },
          { id: 3, statusName: 'Sold', colorCode: '#dc3545' },
          { id: 4, statusName: 'Blocked', colorCode: '#6c757d' },
          { id: 5, statusName: 'Maintenance', colorCode: '#17a2b8' }
        ];
      }
    });
  }

  loadUnits() {
    const activeFilters: any = {};
    if (this.filters.search) activeFilters.search = this.filters.search;
    if (this.filters.propertyId) activeFilters.propertyId = +this.filters.propertyId;
    if (this.filters.buildingId) activeFilters.buildingId = +this.filters.buildingId;
    if (this.filters.floorId) activeFilters.floorId = +this.filters.floorId;
    if (this.filters.unitTypeId) activeFilters.unitTypeId = +this.filters.unitTypeId;
    if (this.filters.unitStatusId) activeFilters.unitStatusId = +this.filters.unitStatusId;
    activeFilters.page = this.filters.page;
    activeFilters.limit = this.filters.limit;

    this.propertiesService.getUnits(activeFilters).subscribe({
      next: (res) => {
        this.units = res.items ?? [];
        this.totalUnits = res.total ?? 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading units:', err)
    });
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadUnits();
    }, 400);
  }

  // --- Dynamic Cascading Selects for Filters ---
  onPropertyFilterChange() {
    this.filters.buildingId = 0;
    this.filters.floorId = 0;
    this.filterBuildings = [];
    this.filterFloors = [];
    const prop = this.propertiesList.find((p) => +p.id === +this.filters.propertyId);
    if (prop) {
      this.filterBuildings = prop.buildings ?? [];
    }
    this.loadUnits();
  }

  onBuildingFilterChange() {
    this.filters.floorId = 0;
    this.filterFloors = [];
    const bld = this.filterBuildings.find((b) => +b.id === +this.filters.buildingId);
    if (bld) {
      this.filterFloors = bld.floors ?? [];
    }
    this.loadUnits();
  }

  // --- Dynamic Cascading Selects for Creation Form ---
  onCreatePropertyChange() {
    this.newUnit.buildingId = 0;
    this.newUnit.floorId = 0;
    this.formBuildings = [];
    this.formFloors = [];
    const prop = this.propertiesList.find((p) => +p.id === +this.newUnit.propertyId);
    if (prop) {
      this.formBuildings = prop.buildings ?? [];
    }
  }

  onCreateBuildingChange() {
    this.newUnit.floorId = 0;
    this.formFloors = [];
    const bld = this.formBuildings.find((b) => +b.id === +this.newUnit.buildingId);
    if (bld) {
      this.formFloors = bld.floors ?? [];
    }
  }

  // --- Pagination ---
  prevPage() {
    if (this.filters.page > 1) {
      this.filters.page--;
      this.loadUnits();
    }
  }

  nextPage() {
    if ((this.filters.page * this.filters.limit) < this.totalUnits) {
      this.filters.page++;
      this.loadUnits();
    }
  }

  getStatusColor(color: string | undefined): string {
    return color || '#28a745';
  }

  // --- CRUD Unit actions ---
  openCreateModal() {
    this.customUnitTypeName = '';
    this.errorMessage = '';
    this.basePrice = null;
    this.newUnit = {
      unitCode: '',
      unitNumber: '',
      propertyId: 0,
      buildingId: 0,
      floorId: 0,
      unitTypeId: 0,
      unitStatusId: 0,
      areaSuperBuiltup: null,
      netArea: null,
      balconyArea: null,
      bedrooms: null,
      bathroomCount: null,
      parkingSlotCount: null,
      facing: '',
      view: '',
      title: '',
      viewType: '',
      floorLevel: null,
      isFurnished: false,
      isCornerUnit: false,
      isFeatured: false,
      inventoryTags: '',
      remarks: ''
    };
    this.showCreateModal = true;
  }
  closeCreateModal() { this.showCreateModal = false; }

  onAddUnitType(payload: { name: string; description: string }) {
    this.propertiesService.createUnitType({ typeName: payload.name, description: payload.description }).subscribe({
      next: (res) => {
        this.loadLookups();
        this.newUnit.unitTypeId = res.id;
      },
      error: (err) => console.error('Error creating unit type:', err)
    });
  }

  onEditUnitType(event: { id: number; name: string }) {
    this.propertiesService.updateUnitType(event.id, { typeName: event.name }).subscribe({
      next: () => {
        this.loadLookups();
      },
      error: (err) => console.error('Error updating unit type:', err)
    });
  }

  onDeleteUnitType(id: number) {
    this.propertiesService.deleteUnitType(id).subscribe({
      next: () => {
        this.loadLookups();
      },
      error: (err) => console.error('Error deleting unit type:', err)
    });
  }

  onSubmitCreate(event: Event) {
    event.preventDefault();
    if (!this.newUnit.unitTypeId || this.newUnit.unitTypeId === 0) return;
    this.saveUnitWithTypeId(+this.newUnit.unitTypeId);
  }

  private saveUnitWithTypeId(typeId: number) {
    const payload: any = {
      unitCode: this.newUnit.unitCode,
      unitNumber: this.newUnit.unitNumber,
      propertyId: +this.newUnit.propertyId,
      buildingId: +this.newUnit.buildingId,
      floorId: +this.newUnit.floorId,
      unitTypeId: typeId,
      unitStatusId: this.newUnit.unitStatusId ? +this.newUnit.unitStatusId : undefined,
      title: this.newUnit.title || undefined,
      grossArea: this.newUnit.areaSuperBuiltup ? +this.newUnit.areaSuperBuiltup : undefined,
      netArea: this.newUnit.netArea ? +this.newUnit.netArea : undefined,
      balconyArea: this.newUnit.balconyArea ? +this.newUnit.balconyArea : undefined,
      bedroomCount: this.newUnit.bedrooms ? +this.newUnit.bedrooms : undefined,
      bathroomCount: this.newUnit.bathroomCount ? +this.newUnit.bathroomCount : undefined,
      parkingSlotCount: this.newUnit.parkingSlotCount ? +this.newUnit.parkingSlotCount : undefined,
      facingDirection: this.newUnit.facing || undefined,
      viewType: this.newUnit.viewType || undefined,
      floorLevel: this.newUnit.floorLevel ? +this.newUnit.floorLevel : undefined,
      isFurnished: this.newUnit.isFurnished,
      isCornerUnit: this.newUnit.isCornerUnit,
      isFeatured: this.newUnit.isFeatured,
      inventoryTags: this.newUnit.inventoryTags ? this.newUnit.inventoryTags.split(',').map(s => s.trim()).filter(s => s) : undefined,
      remarks: this.newUnit.remarks || undefined
    };

    this.errorMessage = '';
    this.propertiesService.createUnit(payload).subscribe({
      next: (createdUnit) => {
        // Save pricing if set
        if (this.basePrice) {
          this.propertiesService.createUnitPrice({
            unitId: createdUnit.id,
            basePrice: +this.basePrice,
            currencyCode: 'ETB',
            isActive: true
          }).subscribe();
        }
        this.closeCreateModal();
        this.successMessage = 'Unit registered successfully!';
        this.loadUnits();
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error creating unit:', err);
        this.errorMessage = err.error?.message || 'An error occurred while saving the unit.';
        setTimeout(() => {
          const modalBody = document.querySelector('.modal-body');
          if (modalBody) modalBody.scrollTop = 0;
        }, 50);
      }
    });
  }

  onDelete(id: number) {
    customConfirm('Are you sure you want to delete this unit?').then(confirmed => {
      if (confirmed) {
        this.propertiesService.deleteUnit(id).subscribe({
          next: () => this.loadUnits(),
          error: (err) => console.error('Error deleting unit:', err)
        });
      }
    });
  }

  // --- Bulk CSV Import ---
  openImportModal() {
    this.selectedFile = null;
    this.showImportModal = true;
  }
  closeImportModal() { this.showImportModal = false; }
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }
  downloadCsvTemplate() {
    const csvContent = 
      "property_code,building_code,floor_number,unit_number,unit_type_name,bedroom_count,bathroom_count,area,base_price\n" +
      "RVA,RVA-B1,1,101,Villa,3,3,180.50,5000000\n" +
      "RVA,RVA-B1,1,102,Apartment,2,2,120.00,3500000\n";
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "sample-units-template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  onUploadCsv() {
    if (!this.selectedFile) return;
    this.propertiesService.importUnitsCsv(this.selectedFile).subscribe({
      next: (res) => {
        alert(`CSV processed successfully! Records: ${res.totalRecords}, Loaded: ${res.successfulRecords}, Failed: ${res.failedRecords}`);
        this.closeImportModal();
        this.loadUnits();
      },
      error: (err) => console.error('CSV import failed:', err)
    });
  }

  // --- Status Transition Drawer ---
  openStatusDrawer(unit: any) {
    this.selectedUnit = unit;
    this.transitionStatusId = unit.unitStatus?.id ?? 1;
    this.transitionReason = '';
    this.statusHistory = [];
    this.showStatusDrawer = true;

    // Load full unit detail for status logs
    this.propertiesService.getUnit(unit.id).subscribe({
      next: (fullUnit) => {
        this.statusHistory = fullUnit.statusHistory ?? [];
      }
    });
  }
  closeStatusDrawer() { this.showStatusDrawer = false; }
  onTransitionStatus() {
    if (!this.selectedUnit) return;
    this.propertiesService.transitionUnitStatus(this.selectedUnit.id, {
      statusId: +this.transitionStatusId,
      reason: this.transitionReason
    }).subscribe({
      next: () => {
        this.closeStatusDrawer();
        this.loadUnits();
      },
      error: (err) => console.error('Status transition failed:', err)
    });
  }
}
