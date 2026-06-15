import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Buildings & Blocks</h1>
        <p>Global monitoring of constructed building blocks and handovers</p>
      </div>
    </header>

    <!-- Filters -->
    <div class="card" style="margin-bottom: 24px; padding: 16px;">
      <div class="flex justify-between align-center gap-4 flex-wrap">
        <div class="flex align-center gap-2">
          <label class="font-bold text-secondary font-sm">Project Filter:</label>
          <select [(ngModel)]="selectedPropertyId" (change)="onFilterChange()">
            <option [value]="0">All Projects</option>
            <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Buildings Table -->
    <div class="card table-container">
      <table class="leads-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Building Code</th>
            <th>Building Name</th>
            <th>Type</th>
            <th>Floors</th>
            <th>Units</th>
            <th>Elevators</th>
            <th>Construction Status</th>
            <th>Completion Progress</th>
            <th>Handover Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let b of filteredBuildings">
            <td class="font-bold">{{ b.property?.propertyName || 'Unassigned' }}</td>
            <td class="font-mono">{{ b.buildingCode }}</td>
            <td>{{ b.buildingName }}</td>
            <td>{{ b.buildingType || '-' }}</td>
            <td>
              <span>{{ b.totalFloors ?? b.floors?.length ?? 0 }}</span>
              <span class="text-secondary font-xs" *ngIf="b.basementFloors"> ({{ b.basementFloors }} basement)</span>
            </td>
            <td>{{ b.totalUnits ?? '-' }}</td>
            <td>{{ b.elevatorCount ?? 0 }}</td>
            <td>{{ b.constructionStatus || '-' }}</td>
            <td>
              <div class="flex align-center gap-2">
                <span class="font-xs text-secondary font-bold">{{ b.completionPercentage ?? 0 }}%</span>
                <div class="progress-track" style="width: 80px; height: 6px; background-color: var(--border-color); border-radius: 3px; overflow: hidden;">
                  <div class="progress-fill" [style.width.%]="b.completionPercentage ?? 0" style="height: 100%; background-color: var(--color-qualified);"></div>
                </div>
              </div>
            </td>
            <td>{{ b.handoverDate ? (b.handoverDate | date:'mediumDate') : 'Pending' }}</td>
            <td>
              <button class="btn btn-secondary btn-xs" (click)="openEditModal(b)">Edit</button>
            </td>
          </tr>
          <tr *ngIf="filteredBuildings.length === 0">
            <td colspan="11" class="text-center py-6 text-secondary italic">
              No buildings registered matching filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Building Modal -->
    <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>Update Building Parameters</h2>
          <button class="header-icon-btn close-btn" (click)="closeEditModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitEdit($event)">
            <div class="form-group flex flex-col">
              <label>Building Code <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="editingBuilding.buildingCode" name="bCode" required />
            </div>
            <div class="form-group flex flex-col">
              <label>Building Name <span class="text-danger" style="color: red;">*</span></label>
              <input type="text" [(ngModel)]="editingBuilding.buildingName" name="bName" required />
            </div>
            <div class="form-group flex flex-col">
              <label>Building Type</label>
              <input type="text" [(ngModel)]="editingBuilding.buildingType" name="bType" placeholder="e.g. Residential, Commercial" />
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Total Floors</label>
                <input type="number" [(ngModel)]="editingBuilding.totalFloors" name="totalFloors" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Basement Floors</label>
                <input type="number" [(ngModel)]="editingBuilding.basementFloors" name="basementFloors" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Elevators count</label>
                <input type="number" [(ngModel)]="editingBuilding.elevatorCount" name="elevators" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Completion percentage</label>
                <input type="number" [(ngModel)]="editingBuilding.completionPercentage" name="progress" min="0" max="100" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Total Units</label>
                <input type="number" [(ngModel)]="editingBuilding.totalUnits" name="totalUnits" />
              </div>
              <div class="form-group flex-1 flex flex-col">
                <label>Construction Status</label>
                <input type="text" [(ngModel)]="editingBuilding.constructionStatus" name="constStatus" placeholder="e.g. Planning, Under Construction" />
              </div>
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1 flex flex-col">
                <label>Handover Date</label>
                <input type="date" [(ngModel)]="editingBuilding.handoverDate" name="handover" />
              </div>
            </div>
            <div class="form-group flex flex-col">
              <label>Remarks</label>
              <textarea [(ngModel)]="editingBuilding.remarks" name="remarks" rows="2"></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flex-wrap {
      flex-wrap: wrap;
    }
  `]
})
export class BuildingsComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  propertiesList: any[] = [];
  allBuildings: any[] = [];
  filteredBuildings: any[] = [];
  selectedPropertyId = 0;

  // Editing state
  showEditModal = false;
  editingBuilding = {
    id: 0,
    buildingCode: '',
    buildingName: '',
    buildingType: '',
    totalFloors: 0,
    basementFloors: 0,
    elevatorCount: 2,
    totalUnits: 0,
    constructionStatus: '',
    completionPercentage: 0,
    handoverDate: '',
    remarks: ''
  };

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.propertiesService.getProperties().subscribe({
      next: (res) => {
        this.propertiesList = res.items ?? [];
        this.extractBuildings();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading properties list:', err)
    });
  }

  private extractBuildings() {
    const list: any[] = [];
    this.propertiesList.forEach((p) => {
      if (p.buildings) {
        p.buildings.forEach((b: any) => {
          list.push({ ...b, property: p });
        });
      }
    });
    this.allBuildings = list;
    this.onFilterChange();
  }

  onFilterChange() {
    if (+this.selectedPropertyId === 0) {
      this.filteredBuildings = [...this.allBuildings];
    } else {
      this.filteredBuildings = this.allBuildings.filter((b) => b.property && +b.property.id === +this.selectedPropertyId);
    }
    this.cdr.detectChanges();
  }

  openEditModal(building: any) {
    this.editingBuilding = {
      id: building.id,
      buildingCode: building.buildingCode,
      buildingName: building.buildingName,
      buildingType: building.buildingType || '',
      totalFloors: building.totalFloors || 0,
      basementFloors: building.basementFloors || 0,
      elevatorCount: building.elevatorCount ?? 0,
      totalUnits: building.totalUnits || 0,
      constructionStatus: building.constructionStatus || '',
      completionPercentage: building.completionPercentage ?? 0,
      handoverDate: building.handoverDate ? building.handoverDate.split('T')[0] : '',
      remarks: building.remarks || ''
    };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.cdr.detectChanges();
  }

  onSubmitEdit(event: Event) {
    event.preventDefault();
    const payload: any = {
      buildingCode: this.editingBuilding.buildingCode,
      buildingName: this.editingBuilding.buildingName,
      buildingType: this.editingBuilding.buildingType,
      totalFloors: +this.editingBuilding.totalFloors,
      basementFloors: +this.editingBuilding.basementFloors,
      elevatorCount: +this.editingBuilding.elevatorCount,
      totalUnits: +this.editingBuilding.totalUnits,
      constructionStatus: this.editingBuilding.constructionStatus,
      completionPercentage: +this.editingBuilding.completionPercentage,
      remarks: this.editingBuilding.remarks
    };
    if (this.editingBuilding.handoverDate) {
      payload.handoverDate = new Date(this.editingBuilding.handoverDate);
    }

    this.propertiesService.updateBuilding(this.editingBuilding.id, payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadAllData();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error updating building:', err)
    });
  }
}
