import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';
import { AuthService } from '../../../services/auth.service';
import { customConfirm } from '../../../utils/confirm';
import { environment } from '../../../config';

@Component({
  selector: 'app-media-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Media & Documents Gallery</h1>
        <p>Central repository for legal contracts, floor plans, and photography uploads</p>
      </div>
    </header>

    <div class="card p-6" style="margin-bottom: 24px;">
      <div class="flex gap-4 align-center flex-wrap">
        <label class="font-bold text-secondary font-sm">Scope Project:</label>
        <select [(ngModel)]="selectedPropertyId" (change)="onPropertyChange()">
          <option [value]="0">All Projects</option>
          <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
        </select>

        <div class="drawer-tabs flex gap-4" style="margin-bottom: 0; border: none;">
          <button class="drawer-tab-btn" [class.active]="viewMode === 'photos'" (click)="viewMode = 'photos'">Photography Media</button>
          <button class="drawer-tab-btn" [class.active]="viewMode === 'docs'" (click)="viewMode = 'docs'">Legal Documents</button>
        </div>
      </div>
    </div>

    <!-- Photos Grid view -->
    <div class="media-deck-grid" *ngIf="viewMode === 'photos'">
      <div class="card media-card-item flex flex-col border hover-lift" *ngFor="let m of filteredMedia; let idx = index" style="background: var(--bg-card); overflow: hidden; border-radius: var(--radius-md);">
        <div class="relative" style="height: 150px; overflow: hidden; cursor: pointer; background: #0f172a; display: flex; align-items: center; justify-content: center;" (click)="openImagePreview(m)">
          <img [src]="authService.getDownloadUrl(m.filePath)" style="max-width: 100%; max-height: 100%; object-fit: cover; width: 100%; height: 100%;" />
          <span class="badge absolute top-2 right-2 badge-xs" [class.badge-qualified]="m.isFeatured" [class.badge-low]="!m.isFeatured" style="font-size: 10px; padding: 2px 6px; color: white;">
            {{ m.isFeatured ? '★ Featured Cover' : (m.mediaType || 'Gallery') }}
          </span>
        </div>
        <div class="p-3 flex-1 flex flex-col justify-between">
          <div>
            <p class="font-mono font-xs text-secondary">File: {{ m.fileName }}</p>
            <p class="font-xs text-secondary mt-1">Project: <strong class="text-main">{{ m.property?.propertyName }}</strong></p>
          </div>
          <div class="flex justify-between align-center pt-2 mt-2 border-top">
            <button *ngIf="!m.isFeatured" type="button" class="btn btn-secondary btn-xs flex align-center gap-1" (click)="onSetFeaturedMedia(m)" title="Set as Project Cover Photo">
              <span class="material-icons-outlined text-indigo font-xs">star</span> Set Cover
            </button>
            <span *ngIf="m.isFeatured" class="font-xs font-bold text-green flex align-center gap-1">
              <span class="material-icons-outlined font-xs">check_circle</span> Cover Photo
            </span>
            <button type="button" class="btn btn-danger btn-xs flex align-center justify-center" (click)="onDeleteMedia(m.id)" title="Delete Photo" style="padding: 4px 8px; background-color: rgba(239, 68, 68, 0.1); color: var(--color-lost); border: none;">
              <span class="material-icons-outlined font-xs">delete</span>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="filteredMedia.length === 0" class="text-center py-6 text-secondary italic" style="grid-column: 1 / -1;">
        No photography media uploads found. Go to a property's details to upload media.
      </div>
    </div>

    <!-- Documents List view -->
    <div class="docs-list-grid flex flex-col gap-3" *ngIf="viewMode === 'docs'">
      <div class="card doc-item-row flex justify-between align-center p-3 border" *ngFor="let d of filteredDocuments">
        <div class="flex align-center gap-3">
          <span class="material-icons-outlined text-indigo" style="font-size: 32px;">description</span>
          <div>
            <h4 class="font-bold text-main">{{ d.documentName }}</h4>
            <span class="badge badge-indigo font-xs">{{ d.documentCategory }}</span>
            <span class="text-secondary font-xs" style="margin-left: 12px;">Project: {{ d.property?.propertyName }}</span>
          </div>
        </div>
        <div class="flex align-center gap-3">
          <span class="text-secondary font-xs">{{ (d.fileSize / 1024) | number:'1.0-0' }} KB</span>
          <a [href]="authService.getDownloadUrl(d.filePath)" target="_blank" class="btn btn-secondary btn-sm flex align-center gap-1">
            <span class="material-icons-outlined font-sm">file_download</span> Download
          </a>
          <button type="button" class="btn btn-danger btn-sm flex align-center justify-center" (click)="onDeleteDocument(d.id)" style="padding: 6px; background-color: rgba(239, 68, 68, 0.1); color: var(--color-lost); border: none;">
            <span class="material-icons-outlined font-sm">delete</span>
          </button>
        </div>
      </div>

      <div *ngIf="filteredDocuments.length === 0" class="text-center py-6 text-secondary italic">
        No documents found matching configuration.
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div class="modal-overlay" *ngIf="showImagePreviewModal" (click)="closeImagePreview()" style="backdrop-filter: blur(6px); background: rgba(15, 23, 42, 0.75);">
      <div class="modal-container" style="max-width: 900px; width: 90vw; background: var(--bg-card); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-xl);" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color);">
          <h2 style="font-size: 16px; margin: 0;">{{ previewImage?.fileName || 'Media Preview' }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeImagePreview()"><span class="material-icons-outlined">close</span></button>
        </div>
        <div class="modal-body text-center" style="padding: 16px; background: #0f172a; min-height: 350px; display: flex; align-items: center; justify-content: center;">
          <img [src]="authService.getDownloadUrl(previewImage?.filePath)" style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: var(--radius-md);" />
        </div>
        <div class="modal-footer flex justify-between align-center" style="padding: 12px 20px; border-top: 1px solid var(--border-color);">
          <a [href]="authService.getDownloadUrl(previewImage?.filePath)" target="_blank" class="btn btn-secondary btn-sm flex align-center gap-1">
            <span class="material-icons-outlined font-sm">file_download</span> Download Original
          </a>
          <button type="button" class="btn btn-primary btn-sm" (click)="closeImagePreview()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .media-deck-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
    .media-card-item {
      padding: 0;
      overflow: hidden;
      border-radius: var(--radius-md);
    }
    .grid-img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }
    .flex-wrap { flex-wrap: wrap; }
    .mt-2 { margin-top: 8px; }
  `]
})
export class MediaDocumentsComponent implements OnInit {
  env = environment;
  private propertiesService = inject(PropertiesService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  propertiesList: any[] = [];
  viewMode = 'photos';
  selectedPropertyId = 0;

  allMedia: any[] = [];
  allDocuments: any[] = [];

  filteredMedia: any[] = [];
  filteredDocuments: any[] = [];

  showImagePreviewModal = false;
  previewImage: any = null;

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.propertiesService.getProperties().subscribe({
      next: (res) => {
        this.propertiesList = res.items ?? [];
        this.extractAssets();
      },
      error: (err) => console.error('Error loading properties list:', err)
    });
  }

  private extractAssets() {
    const mediaList: any[] = [];
    const docList: any[] = [];

    this.propertiesList.forEach((p) => {
      if (p.media) {
        p.media.forEach((m: any) => {
          mediaList.push({ ...m, property: p });
        });
      }
      if (p.documents) {
        p.documents.forEach((d: any) => {
          docList.push({ ...d, property: p });
        });
      }
    });

    this.allMedia = mediaList;
    this.allDocuments = docList;
    this.onPropertyChange();
  }

  onPropertyChange() {
    const propId = +this.selectedPropertyId;
    if (propId === 0) {
      this.filteredMedia = [...this.allMedia];
      this.filteredDocuments = [...this.allDocuments];
    } else {
      this.filteredMedia = this.allMedia.filter((m) => m.property && +m.property.id === propId);
      this.filteredDocuments = this.allDocuments.filter((d) => d.property && +d.property.id === propId);
    }
    this.cdr.detectChanges();
  }

  onSetFeaturedMedia(media: any) {
    if (!media.property) return;
    this.propertiesService.setFeaturedMedia(media.property.id, media.id).subscribe({
      next: () => {
        this.loadProperties();
      },
      error: (err) => console.error('Error setting cover photo:', err)
    });
  }

  onDeleteMedia(mediaId: number) {
    customConfirm('Are you sure you want to permanently delete this photo from the media gallery?', 'Delete Photo').then((confirmed) => {
      if (confirmed) {
        this.propertiesService.deleteMedia(mediaId).subscribe({
          next: () => {
            this.loadProperties();
          },
          error: (err) => console.error('Error deleting photo:', err)
        });
      }
    });
  }

  onDeleteDocument(docId: number) {
    customConfirm('Are you sure you want to permanently delete this document?', 'Delete Document').then((confirmed) => {
      if (confirmed) {
        this.propertiesService.deleteDocument(docId).subscribe({
          next: () => {
            this.loadProperties();
          },
          error: (err) => console.error('Error deleting document:', err)
        });
      }
    });
  }

  openImagePreview(media: any) {
    this.previewImage = media;
    this.showImagePreviewModal = true;
    this.cdr.detectChanges();
  }

  closeImagePreview() {
    this.showImagePreviewModal = false;
    this.previewImage = null;
    this.cdr.detectChanges();
  }
}
