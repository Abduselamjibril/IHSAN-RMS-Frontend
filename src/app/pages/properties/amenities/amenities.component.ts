import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-amenities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Amenities Registry</h1>
        <p>Manage physical structures, features, and comfort amenities offered across projects</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          Add Amenity Master
        </button>
      </div>
    </header>

    <!-- Amenities Grid -->
    <div class="amenity-grid mt-4">
      <div class="card amenity-card border flex flex-col justify-between" *ngFor="let am of amenities">
        <div class="flex align-center gap-3">
          <span class="material-icons-outlined amenity-icon-display">{{ am.icon || 'star_outline' }}</span>
          <div>
            <h3 class="font-bold text-main">{{ am.amenityName }}</h3>
            <span class="badge" [class.badge-qualified]="am.isActive" [class.badge-low]="!am.isActive">
              {{ am.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
        <p class="text-secondary font-sm mt-3">{{ am.description || 'No description provided.' }}</p>
        <div class="card-actions flex justify-end gap-2 mt-4" style="border-top: 1px solid var(--border-color); padding-top: 10px;">
          <button class="btn btn-secondary btn-xs" (click)="openEditModal(am)">Edit</button>
          <button class="btn btn-danger btn-xs" (click)="onDelete(am.id)">Delete</button>
        </div>
      </div>

      <div *ngIf="amenities.length === 0" class="text-center py-6 text-secondary italic" style="grid-column: 1 / -1;">
        No amenities registered in database.
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center">
          <h2>{{ isEditing ? 'Edit Amenity Definition' : 'Register Amenity Block' }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeModal()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmit($event)">
            <div class="form-group flex flex-col">
              <label>Amenity Name *</label>
              <input type="text" [(ngModel)]="formModel.amenityName" name="aName" required />
            </div>
            <div class="form-group flex flex-col">
              <label>Icon Identifier (Material Icon string) *</label>
              <input type="text" [(ngModel)]="formModel.icon" name="aIcon" required placeholder="e.g. pool, local_parking, fitness_center" />
            </div>
            <div class="form-group flex flex-col">
              <label>Description</label>
              <textarea [(ngModel)]="formModel.description" name="aDesc" rows="3" placeholder="Brief outline..."></textarea>
            </div>
            <div class="modal-footer flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!formModel.amenityName || !formModel.icon">Save Amenity</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .amenity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
    .amenity-card {
      height: 100%;
    }
    .amenity-icon-display {
      font-size: 32px;
      color: var(--brand-primary);
      background-color: var(--brand-primary-light);
      padding: 8px;
      border-radius: var(--radius-md);
    }
    .mt-4 { margin-top: 16px; }
    .mt-3 { margin-top: 12px; }
  `]
})
export class AmenitiesComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  amenities: any[] = [];
  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  formModel = {
    amenityName: '',
    icon: '',
    description: '',
    isActive: true
  };

  ngOnInit() {
    this.loadAmenities();
  }

  loadAmenities() {
    this.propertiesService.getAmenities().subscribe({
      next: (res) => {
        this.amenities = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading amenities:', err)
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formModel = { amenityName: '', icon: 'star_outline', description: '', isActive: true };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(amenity: any) {
    this.isEditing = true;
    this.editingId = amenity.id;
    this.formModel = {
      amenityName: amenity.amenityName,
      icon: amenity.icon || 'star_outline',
      description: amenity.description || '',
      isActive: amenity.isActive ?? true
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.isEditing && this.editingId) {
      this.propertiesService.updateAmenity(this.editingId, this.formModel).subscribe({
        next: () => {
          this.closeModal();
          this.loadAmenities();
        },
        error: (err) => console.error('Error updating amenity:', err)
      });
    } else {
      this.propertiesService.createAmenity(this.formModel).subscribe({
        next: () => {
          this.closeModal();
          this.loadAmenities();
        },
        error: (err) => console.error('Error creating amenity:', err)
      });
    }
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this amenity definition?')) {
      this.propertiesService.deleteAmenity(id).subscribe({
        next: () => {
          this.loadAmenities();
        },
        error: (err) => console.error('Error deleting amenity:', err)
      });
    }
  }
}
