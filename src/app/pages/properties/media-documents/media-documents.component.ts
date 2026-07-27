import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';
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
      <div class="card media-card-item flex flex-col border" *ngFor="let m of filteredMedia">
        <img [src]="env.serverUrl + m.filePath" class="grid-img" />
        <div class="p-3">
          <span class="badge" [class.badge-qualified]="m.isFeatured" [class.badge-low]="!m.isFeatured">
            {{ m.isFeatured ? 'Featured' : 'Gallery' }}
          </span>
          <p class="font-mono font-xs text-secondary mt-2">File: {{ m.fileName }}</p>
          <p class="font-xs text-secondary">Project: <strong>{{ m.property?.propertyName }}</strong></p>
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
          <a [href]="env.serverUrl + d.filePath" target="_blank" class="btn btn-secondary btn-sm">Download File</a>
        </div>
      </div>

      <div *ngIf="filteredDocuments.length === 0" class="text-center py-6 text-secondary italic">
        No documents found matching configuration.
      </div>
    </div>
  `,
  styles: [`
    .media-deck-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .media-card-item {
      padding: 0;
      overflow: hidden;
      border-radius: var(--radius-md);
    }
    .grid-img {
      width: 100%;
      height: 140px;
      object-fit: cover;
    }
    .flex-wrap { flex-wrap: wrap; }
    .mt-2 { margin-top: 8px; }
  `]
})
export class MediaDocumentsComponent implements OnInit {
  env = environment;
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  propertiesList: any[] = [];
  viewMode = 'photos';
  selectedPropertyId = 0;

  allMedia: any[] = [];
  allDocuments: any[] = [];

  filteredMedia: any[] = [];
  filteredDocuments: any[] = [];

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
}
