import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-unit-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Unit Status Ledger</h1>
        <p>Audit trail of all unit status updates, lock periods, and sales</p>
      </div>
    </header>

    <!-- Filters -->
    <div class="card" style="margin-bottom: 24px; padding: 16px;">
      <div class="flex gap-3 flex-wrap">
        <select [(ngModel)]="selectedPropertyId" (change)="onFilterChange()">
          <option [value]="0">All Projects</option>
          <option *ngFor="let p of propertiesList" [value]="p.id">{{ p.propertyName }}</option>
        </select>
      </div>
    </div>

    <!-- Timeline Ledger card -->
    <div class="card p-6">
      <h3 style="margin-bottom: 20px;">Chronological Status Changes</h3>
      
      <div class="activity-timeline">
        <div class="timeline-item flex gap-4" *ngFor="let log of filteredHistory" style="margin-bottom: 20px; position: relative;">
          <!-- Left dot indicator -->
          <div class="timeline-line" style="position: absolute; left: 15px; top: 32px; bottom: -20px; width: 2px; background-color: var(--border-color);"></div>
          
          <div class="timeline-dot" [style.background-color]="getStatusColor(log.newStatus?.colorCode)" style="width: 32px; height: 32px; border-radius: var(--radius-round); display: flex; align-items: center; justify-content: center; color: white; z-index: 1;">
            <span class="material-icons-outlined font-sm">sync</span>
          </div>

          <!-- Body contents -->
          <div class="timeline-body card border" style="flex: 1; padding: 14px;">
            <div class="flex justify-between align-center flex-wrap gap-2">
              <div>
                <strong>Unit {{ log.unit?.unitCode }}</strong>
                <span class="text-secondary font-xs"> ({{ log.unit?.property?.propertyName }})</span>
              </div>
              <span class="font-xs text-secondary font-bold">{{ log.changedAt | date:'medium' }}</span>
            </div>
            
            <div class="flex align-center gap-2 mt-2">
              <span class="badge badge-low">From: {{ log.oldStatus?.statusName || 'Available' }}</span>
              <span class="material-icons-outlined font-sm text-secondary">arrow_forward</span>
              <span class="badge" [style.background-color]="getStatusColor(log.newStatus?.colorCode)">To: {{ log.newStatus?.statusName }}</span>
            </div>

            <p class="mt-2 text-secondary font-sm italic" style="margin-top: 8px;">
              <strong>Reason:</strong> {{ log.reason || 'No description provided.' }}
            </p>
          </div>
        </div>

        <div *ngIf="filteredHistory.length === 0" class="text-center py-6 text-secondary italic">
          No status logs found matching selection.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flex-wrap { flex-wrap: wrap; }
    .mt-2 { margin-top: 8px; }
  `]
})
export class UnitStatusComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  propertiesList: any[] = [];
  allHistoryLogs: any[] = [];
  filteredHistory: any[] = [];
  selectedPropertyId = 0;

  ngOnInit() {
    this.loadProperties();
    this.loadStatusHistory();
  }

  loadProperties() {
    this.propertiesService.getProperties().subscribe({
      next: (res) => {
        this.propertiesList = res.items ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading properties list:', err)
    });
  }

  loadStatusHistory() {
    this.propertiesService.getUnitStatusHistory().subscribe({
      next: (res) => {
        this.allHistoryLogs = res ?? [];
        this.onFilterChange();
      },
      error: (err) => console.error('Error loading unit status history:', err)
    });
  }

  onFilterChange() {
    if (+this.selectedPropertyId === 0) {
      this.filteredHistory = [...this.allHistoryLogs];
    } else {
      this.filteredHistory = this.allHistoryLogs.filter((log) => log.unit?.property && +log.unit.property.id === +this.selectedPropertyId);
    }
    this.cdr.detectChanges();
  }

  getStatusColor(color: string | undefined): string {
    return color || '#28a745';
  }
}
