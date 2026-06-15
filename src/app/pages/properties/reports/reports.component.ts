import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertiesService } from '../../../services/properties.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Inventory Analytics & Reports</h1>
        <p>Valuation summaries, sales pace logs, and data exports</p>
      </div>
    </header>

    <div class="reports-workspace grid gap-6" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
      
      <!-- Export Card -->
      <div class="card flex flex-col justify-between">
        <div>
          <h3>Export Inventory Records</h3>
          <p class="text-secondary font-sm mt-2">Generate CSV document listing active property codes, pricing details, and occupancy states.</p>
        </div>
        <button class="btn btn-primary mt-4" (click)="onExportCsv()">
          <span class="material-icons-outlined">file_download</span>
          Export Inventory CSV
        </button>
      </div>

      <!-- Occupancy rates summary -->
      <div class="card">
        <h3>Occupancy Ratios</h3>
        <div class="stats-pills mt-3 flex flex-col gap-2">
          <div class="flex justify-between align-center border-bottom pb-2" *ngFor="let p of stats?.byProperty">
            <span>{{ p.propertyName }}</span>
            <span class="font-bold text-indigo">{{ p.unitCount }} Units</span>
          </div>
          <div *ngIf="!stats?.byProperty || stats?.byProperty.length === 0" class="text-center py-6 text-secondary italic">
            No active project data loaded.
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .border-bottom { border-bottom: 1px solid var(--border-color); }
    .pb-2 { padding-bottom: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
  `]
})
export class ReportsComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  stats: any = null;

  ngOnInit() {
    this.propertiesService.getDashboardStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  onExportCsv() {
    this.propertiesService.getUnits().subscribe({
      next: (res) => {
        if (!res.items || res.items.length === 0) {
          alert('No units found to export.');
          return;
        }
        
        // Construct simple CSV string
        const headers = ['Unit Code', 'Unit Number', 'Property', 'Building', 'Floor', 'Type', 'Area', 'Price', 'Status'];
        const rows = res.items.map((u: any) => [
          u.unitCode,
          u.unitNumber,
          u.property?.propertyName || '',
          u.building?.buildingName || '',
          u.floor?.floorNumber || '',
          u.unitType?.typeName || '',
          u.areaSuperBuiltup || '',
          u.currentPrice || '',
          u.unitStatus?.statusName || ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "rems_inventory_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => console.error('Export failed:', err)
    });
  }
}
