import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-floor-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header flex justify-between align-center" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div class="app-title-section">
        <h1>Floor Plans & Layouts</h1>
        <p>Interactive blueprints showing real-time unit status maps</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary flex align-center gap-2" (click)="openAddFloorModal()">
          <span class="material-icons-outlined font-sm">add</span> Add Floor Level
        </button>
      </div>
    </header>

    <!-- Selection Bar -->
    <div class="card glass-card" style="margin-bottom: 24px; padding: 18px;">
      <div class="flex gap-4 flex-wrap align-center" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
        <div class="select-group flex align-center gap-2" style="display: flex; align-items: center; gap: 8px;">
          <label class="font-bold text-secondary font-sm">Project:</label>
          <select [(ngModel)]="filters.propertyId" (change)="onPropertyChange()" style="padding: 8px 12px; min-width: 160px;">
            <option [value]="0">Select Project</option>
            <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
          </select>
        </div>

        <div class="select-group flex align-center gap-2" style="display: flex; align-items: center; gap: 8px;">
          <label class="font-bold text-secondary font-sm">Site Phase:</label>
          <select [(ngModel)]="filters.siteId" (change)="onSiteChange()" [disabled]="!filters.propertyId" style="padding: 8px 12px; min-width: 160px;">
            <option [value]="0">Select Site Phase</option>
            <option *ngFor="let s of sitesList" [value]="s.id">{{ s.siteName }}</option>
            <option [value]="-1">Unassigned Blocks</option>
          </select>
        </div>

        <div class="select-group flex align-center gap-2" style="display: flex; align-items: center; gap: 8px;">
          <label class="font-bold text-secondary font-sm">Building Block:</label>
          <select [(ngModel)]="filters.buildingId" (change)="onBuildingChange()" [disabled]="!filters.siteId || +filters.siteId === 0" style="padding: 8px 12px; min-width: 160px;">
            <option [value]="0">Select Block</option>
            <option *ngFor="let b of buildingsList" [value]="b.id">{{ b.buildingName }}</option>
          </select>
        </div>

        <div class="select-group flex align-center gap-2" style="display: flex; align-items: center; gap: 8px;">
          <label class="font-bold text-secondary font-sm">Floor Level:</label>
          <select [(ngModel)]="filters.floorId" (change)="onFloorChange()" [disabled]="!filters.buildingId || +filters.buildingId === 0" style="padding: 8px 12px; min-width: 160px;">
            <option [value]="0">Select Floor (Show All)</option>
            <option *ngFor="let f of floorsList" [value]="f.id">Floor {{ f.floorNumber }} - {{ f.floorName }}</option>
          </select>
        </div>

        <!-- Inline Action Buttons -->
        <div class="flex gap-2 ms-auto" *ngIf="filters.buildingId && +filters.buildingId !== 0" style="margin-left: auto; display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm flex align-center gap-1" (click)="openCreateFloorPlanModal()">
            <span class="material-icons-outlined font-sm">file_upload</span> Create Floor Plan
          </button>
          <button class="btn btn-primary btn-sm flex align-center gap-1" (click)="openAddFloorModal()">
            <span class="material-icons-outlined font-sm">add</span> + Add Floor Level
          </button>
        </div>
      </div>
    </div>

    <!-- Active Blueprint Layout status map -->
    <div class="floor-map-grid" *ngIf="filters.floorId && activeFloor">
      <!-- Blueprint Grid Canvas -->
      <div class="card canvas-card">
        <div class="flex justify-between align-center border-bottom pb-2 mb-3">
          <h3 class="font-bold" style="font-size: 15px;">Interactive Layout View</h3>
          <span class="badge badge-indigo">Floor {{ activeFloor.floorNumber }} ({{ activeFloor.floorType }})</span>
        </div>

        <div class="blueprint-legend flex gap-4 mt-2 justify-center" style="margin-bottom: 24px;">
          <span class="legend-badge"><span class="legend-dot" style="background-color: #10b981; box-shadow: 0 0 8px #10b981;"></span> Available</span>
          <span class="legend-badge"><span class="legend-dot" style="background-color: #f59e0b; box-shadow: 0 0 8px #f59e0b;"></span> Reserved</span>
          <span class="legend-badge"><span class="legend-dot" style="background-color: #ef4444; box-shadow: 0 0 8px #ef4444;"></span> Sold</span>
          <span class="legend-badge"><span class="legend-dot" style="background-color: #6c757d; box-shadow: 0 0 8px #6c757d;"></span> Blocked</span>
        </div>

        <div class="grid-layout-map">
          <div 
            *ngFor="let unit of activeFloor.units" 
            class="unit-block flex flex-col justify-center align-center cursor-pointer hover-lift"
            [style.border-color]="getStatusColor(unit.unitStatus?.colorCode)"
            [style.background-color]="getFillColor(unit.unitStatus?.colorCode)"
            [style.box-shadow]="getGlowShadow(unit.unitStatus?.statusName)"
            (click)="onUnitClick(unit)"
          >
            <span class="unit-code-lbl font-mono font-bold">{{ unit.unitCode }}</span>
            <span class="unit-num-lbl">{{ unit.unitNumber }}</span>
            <span class="unit-type-lbl font-xs text-secondary mt-1">{{ unit.unitType?.typeName }}</span>
          </div>
          
          <div *ngIf="!activeFloor.units || activeFloor.units.length === 0" class="text-center py-6 text-secondary italic" style="grid-column: 1 / -1;">
            No units mapped to this floor yet. Set them up in the <a routerLink="/properties/units">Units Directory</a>.
          </div>
        </div>
      </div>

      <!-- Upload Floor Plan File -->
      <div class="card flex flex-col justify-between">
        <h3 class="border-bottom pb-2" style="font-size: 15px;">Architectural Drawing</h3>
        <div class="upload-container border p-4 mt-3 flex flex-col gap-3 bg-main" style="border-style: dashed; border-radius: var(--radius-md); flex: 1; border-color: var(--text-muted);">
          <span class="material-icons-outlined text-muted" style="font-size: 44px; color: var(--brand-primary); text-align: center;">photo</span>
          
          <div *ngIf="activeFloor.floorPlan" class="mb-3 p-2 bg-white border" style="border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 12px; border-style: solid;">
            <span class="font-bold text-indigo">Active Blueprint:</span> {{ activeFloor.floorPlan.planName }} (v{{ activeFloor.floorPlan.versionNumber || 1 }})
            <p class="text-secondary font-xs italic mt-1" *ngIf="activeFloor.floorPlan.remarks">{{ activeFloor.floorPlan.remarks }}</p>
          </div>
          
          <p class="font-xs text-secondary text-center" style="line-height: 1.4;">Upload AutoCAD floorplan / map image for visual blueprint lookup reference</p>
          <input type="file" (change)="onFileSelected($event)" style="padding: 6px; background: white; border-radius: var(--radius-sm); font-size: 12px; max-width: 100%; border: 1px solid var(--border-color);" />
          <div class="flex flex-col gap-2">
            <div class="flex flex-col">
              <label class="font-xs text-secondary">Plan Name <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="planName" placeholder="e.g. Ground Floor Blueprint" style="background: white;" />
            </div>
            <div class="flex gap-2">
              <div class="flex-1 flex flex-col">
                <label class="font-xs text-secondary">Version</label>
                <input type="number" [(ngModel)]="planVersionNumber" min="1" style="background: white;" />
              </div>
              <div class="flex-1 flex flex-col">
                <label class="font-xs text-secondary">Scope</label>
                <select [(ngModel)]="planScope" style="background: white;">
                  <option value="floor">Floor Level</option>
                  <option value="building">Entire Building</option>
                  <option value="property">Full Property</option>
                </select>
              </div>
            </div>
            <div class="flex flex-col">
              <label class="font-xs text-secondary">Remarks</label>
              <input type="text" [(ngModel)]="planRemarks" placeholder="Notes about this plan..." style="background: white;" />
            </div>
          </div>
          <button class="btn btn-primary btn-sm mt-2 flex align-center gap-1" style="align-self: flex-end;" (click)="onUploadBlueprint()" [disabled]="!selectedFile || !planName.trim()">
            <span class="material-icons-outlined font-sm">file_upload</span>
            <span>Upload Blueprint</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Floors Directory List or Fallback when floor level is not selected -->
    <div *ngIf="!filters.floorId || +filters.floorId === 0">
      <!-- Show Floors Directory table if building is selected -->
      <div class="card animate-fade" *ngIf="filters.buildingId && +filters.buildingId !== 0">
        <div class="flex justify-between align-center border-bottom pb-2 mb-3">
          <div>
            <h3 class="font-bold" style="font-size: 15px;">Building Floors Directory</h3>
            <p class="font-xs text-secondary mt-1">Directory of floor levels in this building. Select a floor to load the interactive grid map.</p>
          </div>
        </div>
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Floor Level</th>
                <th>Type</th>
                <th>Units mapped</th>
                <th>Blueprint Drawing</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of floorsList">
                <td class="font-bold">
                  F{{ f.floorNumber }} - {{ f.floorName }}
                </td>
                <td>{{ f.floorType }}</td>
                <td>{{ f.units?.length ?? 0 }} / {{ f.totalUnits ?? 0 }} units</td>
                <td>
                  <span *ngIf="f.floorPlan" class="badge badge-indigo flex align-center gap-1 font-xs" style="display: inline-flex; align-items: center;" [title]="f.floorPlan.remarks || ''">
                    <span class="material-icons-outlined font-xs">file_present</span>
                    <span>{{ f.floorPlan.planName }} (v{{ f.floorPlan.versionNumber || 1 }})</span>
                  </span>
                  <span *ngIf="!f.floorPlan" class="text-secondary font-xs italic flex align-center gap-1">
                    <span class="material-icons-outlined font-xs text-muted">broken_image</span>
                    <span>No Blueprint</span>
                  </span>
                </td>
                <td>
                  <div class="flex gap-2 justify-end">
                    <button class="btn btn-primary btn-xs flex align-center gap-1" (click)="viewBlueprintMap(f.id)">
                      <span class="material-icons-outlined font-xs">grid_on</span> View Grid
                    </button>
                    <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openEditFloorModal(f)">
                      <span class="material-icons-outlined font-xs">edit</span> Edit
                    </button>
                    <button class="btn btn-danger btn-xs" (click)="onDeleteFloor(f.id)">
                      <span class="material-icons-outlined font-xs">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="floorsList.length === 0">
                <td colspan="5" class="text-center py-6 text-secondary italic">
                  No floor levels registered for this building block. Click "+ Add Floor Level" to create one.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Show prompt if building is not selected -->
      <!-- Show prompt if building is not selected -->
      <div class="card py-6 text-center text-secondary italic" *ngIf="!filters.buildingId || +filters.buildingId === 0" style="padding: 24px;">
        <span *ngIf="!filters.propertyId || +filters.propertyId === 0">Select Project in the dropdown filter above to begin.</span>
        <span *ngIf="(+filters.propertyId > 0) && (!filters.siteId || +filters.siteId === 0)">Select Site Phase in the dropdown filter above to list buildings.</span>
        <span *ngIf="(+filters.siteId !== 0) && (!filters.buildingId || +filters.buildingId === 0)">Select Building Block in the dropdown filter above to list floors.</span>
      </div>
    </div>

    <!-- Status Change Modal Overlay -->
    <div class="modal-overlay" *ngIf="showStatusModal" (click)="closeStatusModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Quick Update: Unit {{ selectedUnit?.unitCode }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeStatusModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitStatus($event)">
            <div class="form-group flex flex-col">
              <label>Update Unit Availability</label>
              <select [(ngModel)]="newStatusId" name="status" style="width: 100%;">
                <option [value]="1">Available</option>
                <option [value]="2">Reserved</option>
                <option [value]="3">Sold</option>
                <option [value]="4">Blocked</option>
                <option [value]="5">Maintenance</option>
              </select>
            </div>
            <div class="form-group flex flex-col">
              <label>Reason / Audit Note</label>
              <textarea placeholder="Audit explanation..." [(ngModel)]="statusReason" name="reason" rows="2"></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeStatusModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save status</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Floor Modal -->
    <div class="modal-overlay" *ngIf="showFloorModal" (click)="closeFloorModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Generate Floor Plan Level</h2>
          <button class="header-icon-btn" (click)="closeFloorModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitFloor($event)">
            <div class="form-group flex flex-col">
              <label>Project / Property <span class="text-danger" style="color: #ef4444;">*</span></label>
              <select [(ngModel)]="selectedPropertyIdForFloor" name="selectedPropertyIdForFloor" required (change)="onPropertyChangeInFloorModal()">
                <option [ngValue]="null" disabled>Select Project / Property</option>
                <option *ngFor="let p of propertiesList" [ngValue]="p.id">{{ p.propertyName }}</option>
              </select>
            </div>
            <div class="form-group flex flex-col">
              <label>Building Block <span class="text-danger" style="color: #ef4444;">*</span></label>
              <select [(ngModel)]="selectedBuildingIdForFloor" name="selectedBuildingIdForFloor" required>
                <option [ngValue]="null" disabled>Select Building Block</option>
                <option *ngFor="let b of buildingsListForFloorModal" [ngValue]="b.id">{{ b.buildingName }}</option>
              </select>
            </div>
            <div class="form-group flex flex-col">
              <label>Floor Number <span class="text-danger" style="color: red;">*</span></label>
              <input type="number" [(ngModel)]="newFloor.floorNumber" name="fNum" required />
            </div>
            <div class="form-group flex flex-col">
              <label>Floor Name <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="newFloor.floorName" name="fName" required placeholder="e.g. Ground Floor, 2nd Floor" />
            </div>
            <div class="form-group flex flex-col">
              <label>Floor Type</label>
              <select [(ngModel)]="newFloor.floorType" name="fType">
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Parking">Parking</option>
                <option value="Amenities">Amenities</option>
              </select>
            </div>
            <div class="form-group flex flex-col">
              <label>Total Units</label>
              <input type="number" [(ngModel)]="newFloor.totalUnits" name="totalUnits" />
            </div>
            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="newFloor.remarks" name="remarks" rows="2"></textarea>
            </div>

            <!-- Blueprint upload section -->
            <div class="card mt-4 p-4" style="background-color: var(--bg-main); border: 1px dashed var(--border-color); border-radius: var(--radius-md); margin-top: 16px; padding: 12px;">
              <h4 class="font-bold text-main mb-2" style="font-size: 13px; margin-bottom: 8px;">Optional: Upload Floor Plan Blueprint</h4>
              <div class="form-group flex flex-col">
                <label class="font-xs" style="font-size: 11px;">Blueprint File (.png, .jpg, .pdf)</label>
                <input type="file" (change)="onFloorPlanFileSelected($event, 'create')" style="padding: 6px; font-size: 12px; background: white;" />
              </div>
              <div class="form-row flex gap-3 mt-2" *ngIf="floorPlanFile" style="display: flex; gap: 8px; margin-top: 8px;">
                <div class="form-group flex-1 flex flex-col">
                  <label class="font-xs" style="font-size: 11px;">Blueprint Name *</label>
                  <input type="text" [(ngModel)]="floorPlanName" name="fpName" placeholder="e.g. Floor 1 Layout" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label class="font-xs" style="font-size: 11px;">Version</label>
                  <input type="number" [(ngModel)]="floorPlanVersion" name="fpVersion" min="1" />
                </div>
              </div>
              <div class="form-group flex flex-col mt-2" *ngIf="floorPlanFile" style="margin-top: 8px;">
                <label class="font-xs" style="font-size: 11px;">Remarks / Scope details</label>
                <input type="text" [(ngModel)]="floorPlanRemarks" name="fpRemarks" placeholder="Notes for this plan..." />
              </div>
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closeFloorModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newFloor.floorName || selectedPropertyIdForFloor === null || selectedBuildingIdForFloor === null">Save Floor</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Floor Modal -->
    <div class="modal-overlay" *ngIf="showEditFloorModal" (click)="closeEditFloorModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Edit Floor Level</h2>
          <button class="header-icon-btn" (click)="closeEditFloorModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitEditFloor($event)">
            <div class="form-group flex flex-col">
              <label>Floor Number <span class="text-danger" style="color: red;">*</span></label>
              <input type="number" [(ngModel)]="editFloor.floorNumber" name="fNum" required />
            </div>
            <div class="form-group flex flex-col">
              <label>Floor Name <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="editFloor.floorName" name="fName" required />
            </div>
            <div class="form-group flex flex-col">
              <label>Floor Type</label>
              <select [(ngModel)]="editFloor.floorType" name="fType">
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Parking">Parking</option>
                <option value="Amenities">Amenities</option>
              </select>
            </div>
            <div class="form-group flex flex-col">
              <label>Total Units</label>
              <input type="number" [(ngModel)]="editFloor.totalUnits" name="totalUnits" />
            </div>
            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="editFloor.remarks" name="remarks" rows="2"></textarea>
            </div>

            <!-- Floor Plan Edit Section -->
            <div class="card mt-4 p-4" style="background-color: var(--bg-main); border: 1px dashed var(--border-color); border-radius: var(--radius-md); margin-top: 16px; padding: 12px;">
              <h4 class="font-bold text-main mb-2" style="font-size: 13px; margin-bottom: 8px;">Upload / Update Floor Plan Blueprint</h4>
              <div *ngIf="editFloor?.floorPlan" class="mb-3 p-2 bg-white border" style="border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 12px;">
                <span class="font-bold text-indigo">Active Blueprint:</span> {{ editFloor.floorPlan.planName }} (v{{ editFloor.floorPlan.versionNumber || 1 }})
              </div>
              <div class="form-group flex flex-col">
                <label class="font-xs" style="font-size: 11px;">Blueprint File (.png, .jpg, .pdf)</label>
                <input type="file" (change)="onFloorPlanFileSelected($event, 'edit')" style="padding: 6px; font-size: 12px; background: white;" />
              </div>
              <div class="form-row flex gap-3 mt-2" *ngIf="editFloorPlanFile" style="display: flex; gap: 8px; margin-top: 8px;">
                <div class="form-group flex-1 flex flex-col">
                  <label class="font-xs" style="font-size: 11px;">Blueprint Name *</label>
                  <input type="text" [(ngModel)]="editFloorPlanName" name="editFpName" placeholder="e.g. Floor 1 Layout" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label class="font-xs" style="font-size: 11px;">Version</label>
                  <input type="number" [(ngModel)]="editFloorPlanVersion" name="editFpVersion" min="1" />
                </div>
              </div>
              <div class="form-group flex flex-col mt-2" *ngIf="editFloorPlanFile" style="margin-top: 8px;">
                <label class="font-xs" style="font-size: 11px;">Remarks / Scope details</label>
                <input type="text" [(ngModel)]="editFloorPlanRemarks" name="editFpRemarks" placeholder="Notes for this plan..." />
              </div>
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closeEditFloorModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editFloor.floorName">Save Floor</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Floor Plan Quick Modal -->
    <div class="modal-overlay" *ngIf="showCreateFloorPlanModal" (click)="closeCreateFloorPlanModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Create Floor Plan Blueprint</h2>
          <button class="header-icon-btn" (click)="closeCreateFloorPlanModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitCreateFloorPlan($event)">
            <div class="form-group flex flex-col">
              <label>Select Floor Level <span class="text-danger" style="color: red;">*</span></label>
              <select [(ngModel)]="quickFloorId" name="quickFloor" required style="width: 100%;">
                <option [value]="0">Select Floor Level</option>
                <option *ngFor="let f of floorsList" [value]="f.id">Floor {{ f.floorNumber }} - {{ f.floorName }}</option>
              </select>
            </div>

            <div class="form-group flex flex-col">
              <label>Blueprint File <span class="text-danger" style="color: red;">*</span></label>
              <input type="file" (change)="onFloorPlanFileSelected($event, 'quick')" style="padding: 6px; background: white;" required />
            </div>

            <div class="form-row flex gap-3 mt-2" style="display: flex; gap: 8px; margin-top: 8px;">
              <div class="form-group flex-1 flex flex-col">
                <label>Blueprint Name <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="quickPlanName" name="qpName" placeholder="e.g. Floor 1 Layout" required />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Version</label>
                <input type="number" [(ngModel)]="quickPlanVersion" name="qpVersion" min="1" />
              </div>
            </div>

            <div class="form-group flex flex-col mt-2">
              <label>Remarks / Scope details</label>
              <input type="text" [(ngModel)]="quickPlanRemarks" name="qpRemarks" placeholder="Notes for this plan..." />
            </div>

            <div class="modal-footer flex justify-end gap-3" style="margin-top: 16px;">
              <button type="button" class="btn btn-secondary" (click)="closeCreateFloorPlanModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!quickFloorId || !quickPlanFile || !quickPlanName">Upload Blueprint</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .floor-map-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }
    .canvas-card {
      min-height: 400px;
    }
    .legend-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-round);
      display: inline-block;
    }
    .grid-layout-map {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 16px;
      padding: 10px;
    }
    .unit-block {
      height: 110px;
      border-radius: var(--radius-md);
      transition: var(--transition-fast);
      text-align: center;
      border-width: 2.5px;
      border-style: solid;
    }
    .unit-code-lbl {
      font-size: 13px;
      color: var(--text-main);
    }
    .unit-num-lbl {
      font-size: 11px;
      color: var(--text-secondary);
    }
    .unit-type-lbl {
      font-size: 9px;
    }
    .border-bottom { border-bottom: 1px solid var(--border-color); }
    .pb-2 { padding-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-1 { margin-top: 4px; }
    .flex-wrap { flex-wrap: wrap; }
  `]
})
export class FloorPlansComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  propertiesList: any[] = [];
  sitesList: any[] = [];
  buildingsList: any[] = [];
  floorsList: any[] = [];
  activeFloor: any = null;

  filters = {
    propertyId: 0,
    siteId: 0,
    buildingId: 0,
    floorId: 0
  };

  // Status Change State
  showStatusModal = false;
  selectedUnit: any = null;
  newStatusId = 1;
  statusReason = '';

  // File Upload State
  selectedFile: File | null = null;
  planName = 'Blueprint Layout';
  planVersionNumber = 1;
  planScope = 'floor';
  planRemarks = '';

  // New Modals State
  showFloorModal = false;
  showEditFloorModal = false;
  showCreateFloorPlanModal = false;
  editFloor: any = null;

  selectedPropertyIdForFloor: number | null = null;
  selectedBuildingIdForFloor: number | null = null;
  buildingsListForFloorModal: any[] = [];

  // New Floor Form
  newFloor = {
    floorNumber: 1,
    floorName: '',
    floorType: 'Residential',
    totalUnits: 0,
    remarks: ''
  };

  // Blueprint Upload state for create
  floorPlanFile: File | null = null;
  floorPlanName = '';
  floorPlanVersion = 1;
  floorPlanRemarks = '';

  // Blueprint Upload state for edit
  editFloorPlanFile: File | null = null;
  editFloorPlanName = '';
  editFloorPlanVersion = 1;
  editFloorPlanRemarks = '';

  // Blueprint Upload state for quick create
  quickFloorId = 0;
  quickPlanFile: File | null = null;
  quickPlanName = '';
  quickPlanVersion = 1;
  quickPlanRemarks = '';

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties(onSuccess?: () => void) {
    this.propertiesService.getProperties().subscribe({
      next: (res) => {
        this.propertiesList = res.items ?? [];
        if (onSuccess) onSuccess();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading properties list:', err)
    });
  }

  onPropertyChange() {
    this.filters.siteId = 0;
    this.filters.buildingId = 0;
    this.filters.floorId = 0;
    this.sitesList = [];
    this.buildingsList = [];
    this.floorsList = [];
    this.activeFloor = null;

    const propId = +this.filters.propertyId;
    if (propId > 0) {
      this.propertiesService.getSites(propId).subscribe({
        next: (sites) => {
          this.sitesList = sites ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading sites:', err)
      });
    }
    this.cdr.detectChanges();
  }

  onSiteChange() {
    this.filters.buildingId = 0;
    this.filters.floorId = 0;
    this.buildingsList = [];
    this.floorsList = [];
    this.activeFloor = null;

    const prop = this.propertiesList.find((p) => +p.id === +this.filters.propertyId);
    if (prop) {
      const allBuildings = prop.buildings ?? [];
      const sId = +this.filters.siteId;
      if (sId === -1) {
        this.buildingsList = allBuildings.filter((b: any) => !b.site);
      } else if (sId > 0) {
        this.buildingsList = allBuildings.filter((b: any) => b.site && +b.site.id === sId);
      } else {
        this.buildingsList = [];
      }
    }
    this.cdr.detectChanges();
  }

  onBuildingChange() {
    this.filters.floorId = 0;
    this.floorsList = [];
    this.activeFloor = null;

    const bld = this.buildingsList.find((b) => +b.id === +this.filters.buildingId);
    if (bld) {
      this.floorsList = bld.floors ?? [];
    }
    this.cdr.detectChanges();
  }

  onFloorChange() {
    this.activeFloor = null;
    const fId = +this.filters.floorId;
    if (fId === 0) return;

    // Call service to find the active floor structure
    const bld = this.buildingsList.find((b) => +b.id === +this.filters.buildingId);
    if (bld) {
      const flr = bld.floors?.find((f: any) => +f.id === fId);
      if (flr) {
        this.activeFloor = flr;
      }
    }
    this.cdr.detectChanges();
  }

  refreshActiveFloor() {
    const prop = this.propertiesList.find((p) => +p.id === +this.filters.propertyId);
    if (prop) {
      this.propertiesService.getSites(prop.id).subscribe({
        next: (sites) => {
          this.sitesList = sites ?? [];
          const allBuildings = prop.buildings ?? [];
          const sId = +this.filters.siteId;
          if (sId === -1) {
            this.buildingsList = allBuildings.filter((b: any) => !b.site);
          } else if (sId > 0) {
            this.buildingsList = allBuildings.filter((b: any) => b.site && +b.site.id === sId);
          } else {
            this.buildingsList = [];
          }

          const bld = this.buildingsList.find((b) => +b.id === +this.filters.buildingId);
          if (bld) {
            this.floorsList = bld.floors ?? [];
            const flr = this.floorsList.find((f: any) => +f.id === +this.filters.floorId);
            if (flr) {
              this.activeFloor = flr;
            }
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  getStatusColor(color: string | undefined): string {
    return color || '#10b981';
  }

  getFillColor(color: string | undefined): string {
    if (!color) return 'rgba(16, 185, 129, 0.08)';
    // Convert status color code to a subtle opacity layout background
    return color + '15'; // Hex alpha code
  }

  getGlowShadow(status: string | undefined): string {
    switch (status) {
      case 'Available': return 'var(--shadow-glow-success)';
      case 'Reserved': return 'var(--shadow-glow-warning)';
      case 'Sold': return 'var(--shadow-glow-danger)';
      default: return 'none';
    }
  }

  onUnitClick(unit: any) {
    this.selectedUnit = unit;
    this.newStatusId = unit.unitStatus?.id ?? 1;
    this.statusReason = '';
    this.showStatusModal = true;
  }

  closeStatusModal() {
    this.showStatusModal = false;
  }

  onSubmitStatus(event: Event) {
    event.preventDefault();
    if (!this.selectedUnit) return;

    this.propertiesService.transitionUnitStatus(this.selectedUnit.id, {
      statusId: +this.newStatusId,
      reason: this.statusReason
    }).subscribe({
      next: () => {
        this.closeStatusModal();
        this.loadProperties(() => {
          this.refreshActiveFloor();
        });
      },
      error: (err) => console.error('Error changing status:', err)
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onUploadBlueprint() {
    if (!this.selectedFile || !this.planName.trim()) return;
    const options: any = {
      remarks: this.planRemarks || undefined
    };
    // Scope determines which IDs to send
    if (this.planScope === 'property' || this.planScope === 'building' || this.planScope === 'floor') {
      options.propertyId = +this.filters.propertyId || undefined;
    }
    if (this.planScope === 'building' || this.planScope === 'floor') {
      options.buildingId = +this.filters.buildingId || undefined;
    }
    if (this.planScope === 'floor') {
      options.floorId = +this.filters.floorId || undefined;
    }

    this.propertiesService.uploadFloorPlan(this.selectedFile, this.planName.trim(), options).subscribe({
      next: () => {
        alert('Blueprint uploaded successfully!');
        this.selectedFile = null;
        this.planName = 'Blueprint Layout';
        this.planVersionNumber = 1;
        this.planScope = 'floor';
        this.planRemarks = '';
        this.refreshAll();
      },
      error: (err) => console.error('Blueprint upload failed:', err)
    });
  }

  // --- New Handlers & Lifecycle Helper ---
  refreshAll() {
    this.loadProperties(() => {
      this.refreshActiveFloor();
    });
  }

  viewBlueprintMap(floorId: number) {
    this.filters.floorId = floorId;
    this.onFloorChange();
  }

  openAddFloorModal() {
    this.newFloor = { floorNumber: 1, floorName: '', floorType: 'Residential', totalUnits: 0, remarks: '' };
    this.resetFloorPlanForm();
    this.showFloorModal = true;

    if (this.filters.propertyId && +this.filters.propertyId !== 0) {
      this.selectedPropertyIdForFloor = +this.filters.propertyId;
      const prop = this.propertiesList.find(p => +p.id === +this.selectedPropertyIdForFloor!);
      this.buildingsListForFloorModal = prop ? (prop.buildings ?? []) : [];
    } else {
      this.selectedPropertyIdForFloor = null;
      this.buildingsListForFloorModal = [];
    }

    if (this.filters.buildingId && +this.filters.buildingId !== 0) {
      this.selectedBuildingIdForFloor = +this.filters.buildingId;
    } else {
      this.selectedBuildingIdForFloor = null;
    }

    this.cdr.detectChanges();
  }

  onPropertyChangeInFloorModal() {
    this.selectedBuildingIdForFloor = null;
    this.buildingsListForFloorModal = [];
    if (this.selectedPropertyIdForFloor) {
      const prop = this.propertiesList.find(p => +p.id === +this.selectedPropertyIdForFloor!);
      if (prop) {
        this.buildingsListForFloorModal = prop.buildings ?? [];
      }
    }
    this.cdr.detectChanges();
  }

  closeFloorModal() {
    this.showFloorModal = false;
    this.resetFloorPlanForm();
    this.cdr.detectChanges();
  }

  onFloorPlanFileSelected(event: any, mode: 'create' | 'edit' | 'quick') {
    const file = event.target.files[0];
    if (file) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      if (mode === 'create') {
        this.floorPlanFile = file;
        if (!this.floorPlanName) this.floorPlanName = baseName;
      } else if (mode === 'edit') {
        this.editFloorPlanFile = file;
        if (!this.editFloorPlanName) this.editFloorPlanName = baseName;
      } else if (mode === 'quick') {
        this.quickPlanFile = file;
        if (!this.quickPlanName) this.quickPlanName = baseName;
      }
    }
  }

  resetFloorPlanForm() {
    this.floorPlanFile = null;
    this.floorPlanName = '';
    this.floorPlanVersion = 1;
    this.floorPlanRemarks = '';
  }

  onSubmitFloor(event: Event) {
    event.preventDefault();
    const bId = this.selectedBuildingIdForFloor;
    const pId = this.selectedPropertyIdForFloor;
    if (!bId || !pId) return;
    const payload = {
      floorNumber: +this.newFloor.floorNumber,
      floorName: this.newFloor.floorName,
      floorType: this.newFloor.floorType,
      totalUnits: +this.newFloor.totalUnits,
      remarks: this.newFloor.remarks,
      buildingId: bId
    };
    this.propertiesService.createFloor(bId, payload).subscribe({
      next: (createdFloor) => {
        if (this.floorPlanFile && createdFloor && createdFloor.id) {
          this.propertiesService.uploadFloorPlan(this.floorPlanFile, this.floorPlanName || this.newFloor.floorName, {
            propertyId: pId,
            buildingId: bId,
            floorId: createdFloor.id,
            remarks: this.floorPlanRemarks,
            versionNumber: this.floorPlanVersion
          }).subscribe({
            next: () => {
              this.closeFloorModal();
              this.refreshAll();
            },
            error: (err) => {
              console.error('Error uploading floor plan blueprint:', err);
              this.closeFloorModal();
              this.refreshAll();
            }
          });
        } else {
          this.closeFloorModal();
          this.refreshAll();
        }
      },
      error: (err) => console.error('Error creating floor level:', err)
    });
  }

  openEditFloorModal(floor: any) {
    this.editFloor = { ...floor };
    this.resetEditFloorPlanForm();
    if (floor.floorPlan) {
      this.editFloorPlanName = floor.floorPlan.planName;
      this.editFloorPlanVersion = floor.floorPlan.versionNumber || 1;
      this.editFloorPlanRemarks = floor.floorPlan.remarks || '';
    } else {
      this.editFloorPlanName = `Floor ${floor.floorNumber} Blueprint`;
    }
    this.showEditFloorModal = true;
    this.cdr.detectChanges();
  }

  closeEditFloorModal() {
    this.showEditFloorModal = false;
    this.editFloor = null;
    this.cdr.detectChanges();
  }

  resetEditFloorPlanForm() {
    this.editFloorPlanFile = null;
    this.editFloorPlanName = '';
    this.editFloorPlanVersion = 1;
    this.editFloorPlanRemarks = '';
  }

  onSubmitEditFloor(event: Event) {
    event.preventDefault();
    if (!this.editFloor) return;
    const payload = {
      floorNumber: +this.editFloor.floorNumber,
      floorName: this.editFloor.floorName,
      floorType: this.editFloor.floorType,
      totalUnits: +this.editFloor.totalUnits,
      remarks: this.editFloor.remarks
    };
    this.propertiesService.updateFloor(this.editFloor.id, payload).subscribe({
      next: () => {
        if (this.editFloorPlanFile) {
          this.propertiesService.uploadFloorPlan(this.editFloorPlanFile, this.editFloorPlanName, {
            propertyId: +this.filters.propertyId,
            buildingId: +this.filters.buildingId,
            floorId: this.editFloor.id,
            remarks: this.editFloorPlanRemarks
          }).subscribe({
            next: () => {
              this.closeEditFloorModal();
              this.refreshAll();
            },
            error: (err) => {
              console.error('Error uploading floor plan blueprint:', err);
              this.closeEditFloorModal();
              this.refreshAll();
            }
          });
        } else {
          this.closeEditFloorModal();
          this.refreshAll();
        }
      },
      error: (err) => console.error('Error updating floor level:', err)
    });
  }

  onDeleteFloor(floorId: number) {
    if (confirm('Are you sure you want to delete this floor level? This will remove all associated units.')) {
      this.propertiesService.deleteFloor(floorId).subscribe({
        next: () => {
          this.refreshAll();
        },
        error: (err) => console.error('Error deleting floor:', err)
      });
    }
  }

  openCreateFloorPlanModal() {
    this.quickFloorId = 0;
    this.quickPlanFile = null;
    this.quickPlanName = '';
    this.quickPlanVersion = 1;
    this.quickPlanRemarks = '';
    this.showCreateFloorPlanModal = true;
    this.cdr.detectChanges();
  }

  closeCreateFloorPlanModal() {
    this.showCreateFloorPlanModal = false;
    this.cdr.detectChanges();
  }

  onSubmitCreateFloorPlan(event: Event) {
    event.preventDefault();
    if (!this.quickFloorId || !this.quickPlanFile || !this.quickPlanName.trim()) return;
    this.propertiesService.uploadFloorPlan(this.quickPlanFile, this.quickPlanName.trim(), {
      propertyId: +this.filters.propertyId,
      buildingId: +this.filters.buildingId,
      floorId: +this.quickFloorId,
      remarks: this.quickPlanRemarks
    }).subscribe({
      next: () => {
        this.closeCreateFloorPlanModal();
        this.refreshAll();
      },
      error: (err) => console.error('Error uploading floor plan:', err)
    });
  }
}
