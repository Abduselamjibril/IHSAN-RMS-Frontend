import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrokerService } from '../../services/broker.service';
import { PropertiesService } from '../../services/properties.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-broker-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Commission Plans Configuration</h1>
        <p>Define percentage, fixed rate, and progressive tiered commission structures, and assign them to properties</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreatePlanModal()">
          <span class="material-icons-outlined">add</span> Create Commission Plan
        </button>
      </div>
    </header>

    <div class="leads-workspace-grid flex flex-col gap-6" style="padding-bottom: 40px;">
      
      <!-- Top Section: Grid containing Plan list and Mapping Form -->
      <div class="grid col-3 gap-6">
        
        <!-- List of Plans (2 columns span) -->
        <div class="card p-6 col-span-2">
          <h3 class="margin-b-4">Available Commission Plans</h3>
          <div class="table-container">
            <table class="leads-table">
              <thead>
                <tr>
                  <th style="width: 30%;">Plan Name</th>
                  <th style="width: 15%;">Type</th>
                  <th style="width: 25%;">Validity Period</th>
                  <th style="width: 20%;">Structure Summary</th>
                  <th style="width: 10%;" class="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of plans" (click)="selectPlan(item)" [class.selected]="selectedPlan?.id === item.id" class="cursor-pointer">
                  <td>
                    <div class="flex flex-col">
                      <span class="font-semibold text-main">{{ item.commissionPlanName }}</span>
                      <span class="text-xs text-muted">{{ item.commissionPlanCode }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="type-pill">{{ item.commissionTypeId }}</span>
                  </td>
                  <td>
                    <span class="text-xs font-mono text-secondary">
                      {{ item.effectiveFromDate | date:'mediumDate' }} - {{ item.effectiveToDate ? (item.effectiveToDate | date:'mediumDate') : 'Permanent' }}
                    </span>
                  </td>
                  <td>
                    <span class="text-sm font-semibold text-indigo" *ngIf="item.commissionTypeId === 'PERCENTAGE'">
                      {{ item.details?.[0]?.commissionPercent }}% Rate
                    </span>
                    <span class="text-sm font-semibold text-indigo" *ngIf="item.commissionTypeId === 'FIXED'">
                      ETB {{ item.details?.[0]?.fixedAmount | number }} Flat
                    </span>
                    <span class="text-sm font-semibold text-indigo" *ngIf="item.commissionTypeId === 'TIERED'">
                      {{ item.details?.length || 0 }} progressive tiers
                    </span>
                  </td>
                  <td class="text-right">
                    <span class="material-icons-outlined font-sm text-secondary">chevron_right</span>
                  </td>
                </tr>
                <tr *ngIf="!plans.length">
                  <td colspan="5" class="text-center text-secondary py-6">
                    No commission plans registered.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Project Commission Plan Mapping Form -->
        <div class="card p-6">
          <h3 class="margin-b-4 flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">link</span>
            Map Plan to Project
          </h3>
          <form (ngSubmit)="assignPlanToProject()" #mappingForm="ngForm" class="modal-form">
            <div class="form-group margin-b-3">
              <label for="mapPropertyId">Select Project/Property *</label>
              <select id="mapPropertyId" name="mapPropertyId" [(ngModel)]="mappingFormModel.propertyId" required class="form-control">
                <option [value]="null" disabled selected>-- Choose Project --</option>
                <option *ngFor="let prop of properties" [value]="prop.id">{{ prop.propertyName }}</option>
              </select>
            </div>
            <div class="form-group margin-b-3">
              <label for="mapPlanId">Select Commission Plan *</label>
              <select id="mapPlanId" name="mapPlanId" [(ngModel)]="mappingFormModel.commissionPlanId" required class="form-control">
                <option [value]="null" disabled selected>-- Choose Plan --</option>
                <option *ngFor="let p of plans" [value]="p.id">{{ p.commissionPlanName }}</option>
              </select>
            </div>
            <div class="form-group margin-b-4">
              <label for="mapFromDate">Effective Start Date *</label>
              <input type="date" id="mapFromDate" name="mapFromDate" [(ngModel)]="mappingFormModel.effectiveFromDate" required class="form-control">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;" [disabled]="!mappingForm.valid">Map Plan</button>
          </form>
        </div>

      </div>

      <!-- Plan Detailed Specification Drawer -->
      <div *ngIf="selectedPlan" class="card p-6 border-indigo">
        <div class="flex justify-between items-center border-bottom pb-3 margin-b-4">
          <div>
            <span class="text-indigo text-xs uppercase tracking-wider font-semibold">Tiers & Parameter Breakdown</span>
            <h2>{{ selectedPlan.commissionPlanName }} Details</h2>
          </div>
          <button class="header-icon-btn" (click)="selectedPlan = null">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr *ngIf="selectedPlan.commissionTypeId === 'TIERED'">
                <th>From Amount (ETB)</th>
                <th>To Amount (ETB)</th>
                <th>Percentage Rate</th>
                <th>Fixed Bonus Amount (ETB)</th>
              </tr>
              <tr *ngIf="selectedPlan.commissionTypeId === 'PERCENTAGE'">
                <th>Attribute Parameter</th>
                <th>Percentage Rate</th>
              </tr>
              <tr *ngIf="selectedPlan.commissionTypeId === 'FIXED'">
                <th>Attribute Parameter</th>
                <th>Fixed Payout Amount</th>
              </tr>
            </thead>
            <tbody>
              <!-- Tiered list rendering -->
              <ng-container *ngIf="selectedPlan.commissionTypeId === 'TIERED'">
                <tr *ngFor="let d of selectedPlan.details">
                  <td>ETB {{ d.fromAmount | number:'1.2-2' }}</td>
                  <td>{{ d.toAmount ? 'ETB ' + (d.toAmount | number:'1.2-2') : 'And Above' }}</td>
                  <td>{{ d.commissionPercent ? d.commissionPercent + '%' : '0%' }}</td>
                  <td>ETB {{ d.fixedAmount ? (d.fixedAmount | number:'1.2-2') : '0.00' }}</td>
                </tr>
              </ng-container>

              <!-- Percentage list rendering -->
              <ng-container *ngIf="selectedPlan.commissionTypeId === 'PERCENTAGE'">
                <tr *ngFor="let d of selectedPlan.details">
                  <td>Standard attributed sales volume</td>
                  <td class="font-semibold text-indigo">{{ d.commissionPercent }}% of total sale value</td>
                </tr>
              </ng-container>

              <!-- Fixed list rendering -->
              <ng-container *ngIf="selectedPlan.commissionTypeId === 'FIXED'">
                <tr *ngFor="let d of selectedPlan.details">
                  <td>Standard flat per-unit closed booking fee</td>
                  <td class="font-semibold text-indigo">ETB {{ d.fixedAmount | number:'1.2-2' }}</td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Commission Plan Modal -->
    <div class="modal-overlay" *ngIf="showPlanModal" (click)="closeCreatePlanModal()">
      <div class="modal-container" (click)="$event.stopPropagation()" style="max-width: 600px;">
        <header class="modal-header">
          <h2>Create Commission Plan Structure</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreatePlanModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="saveCommissionPlan()" #planForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="commissionPlanCode">Plan Code *</label>
                <input type="text" id="commissionPlanCode" name="commissionPlanCode" [(ngModel)]="planFormModel.commissionPlanCode" required placeholder="e.g. SCH-5PCT">
              </div>

              <div class="form-group">
                <label for="commissionPlanName">Plan Name *</label>
                <input type="text" id="commissionPlanName" name="commissionPlanName" [(ngModel)]="planFormModel.commissionPlanName" required placeholder="e.g. Standard 5% Commission">
              </div>

              <div class="form-group">
                <label for="commissionTypeId">Commission Type *</label>
                <select id="commissionTypeId" name="commissionTypeId" [(ngModel)]="planFormModel.commissionTypeId" required class="form-control" (change)="onPlanTypeChange()">
                  <option value="PERCENTAGE">Percentage rate</option>
                  <option value="FIXED">Fixed Amount Flat</option>
                  <option value="TIERED">Progressive Tiered Scale</option>
                </select>
              </div>

              <div class="form-group">
                <label for="effectiveFromDate">Effective From *</label>
                <input type="date" id="effectiveFromDate" name="effectiveFromDate" [(ngModel)]="planFormModel.effectiveFromDate" required class="form-control">
              </div>

              <div class="form-group">
                <label for="effectiveToDate">Effective To</label>
                <input type="date" id="effectiveToDate" name="effectiveToDate" [(ngModel)]="planFormModel.effectiveToDate" class="form-control">
              </div>
            </div>

            <!-- Detail configurations rows -->
            <div class="border-top mt-4 pt-4">
              <div class="flex justify-between items-center margin-b-3">
                <h4 class="font-semibold text-main">Structure Parameters</h4>
                <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" *ngIf="planFormModel.commissionTypeId === 'TIERED'" (click)="addDetailRow()">
                  <span class="material-icons-outlined font-xs">add</span> Add Tier Row
                </button>
              </div>

              <!-- Renders rows based on selected plan type -->
              <div class="flex flex-col gap-3">
                <!-- PERCENTAGE -->
                <div *ngIf="planFormModel.commissionTypeId === 'PERCENTAGE'" class="grid col-2 gap-3">
                  <div class="form-group">
                    <label>Commission Percent (%) *</label>
                    <input type="number" [(ngModel)]="planFormModel.details[0].commissionPercent" name="pctInput" required placeholder="5.0" class="form-control">
                  </div>
                </div>

                <!-- FIXED -->
                <div *ngIf="planFormModel.commissionTypeId === 'FIXED'" class="grid col-2 gap-3">
                  <div class="form-group">
                    <label>Flat Amount (ETB) *</label>
                    <input type="number" [(ngModel)]="planFormModel.details[0].fixedAmount" name="fixedInput" required placeholder="50000" class="form-control">
                  </div>
                </div>

                <!-- TIERED -->
                <div *ngIf="planFormModel.commissionTypeId === 'TIERED'" class="flex flex-col gap-3">
                  <div *ngFor="let tier of planFormModel.details; let idx = index" class="border p-3 rounded-md bg-glass flex flex-col gap-2 relative">
                    <button type="button" class="icon-btn text-danger" style="position: absolute; right: 10px; top: 10px;" (click)="removeDetailRow(idx)">
                      <span class="material-icons-outlined font-sm">close</span>
                    </button>
                    <span class="text-indigo font-bold text-xs uppercase tracking-wider">Tier #{{ idx + 1 }}</span>
                    <div class="grid col-4 gap-2">
                      <div class="form-group">
                        <label class="font-xs">From Amount *</label>
                        <input type="number" [(ngModel)]="tier.fromAmount" name="from-{{idx}}" required placeholder="0" class="form-control" style="padding: 6px 10px; font-size: 12px;">
                      </div>
                      <div class="form-group">
                        <label class="font-xs">To Amount</label>
                        <input type="number" [(ngModel)]="tier.toAmount" name="to-{{idx}}" placeholder="10000000" class="form-control" style="padding: 6px 10px; font-size: 12px;">
                      </div>
                      <div class="form-group">
                        <label class="font-xs">Percent (%)</label>
                        <input type="number" [(ngModel)]="tier.commissionPercent" name="pct-{{idx}}" placeholder="1.5" class="form-control" style="padding: 6px 10px; font-size: 12px;">
                      </div>
                      <div class="form-group">
                        <label class="font-xs">Fixed Bonus (ETB)</label>
                        <input type="number" [(ngModel)]="tier.fixedAmount" name="bonus-{{idx}}" placeholder="5000" class="form-control" style="padding: 6px 10px; font-size: 12px;">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeCreatePlanModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!planForm.valid">Create Plan</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .type-pill {
      background-color: var(--brand-primary-light);
      color: var(--brand-primary);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 11px;
    }
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      outline: none;
    }
    .form-control:focus {
      border-color: var(--brand-primary);
    }
    .font-xs {
      font-size: 11px;
      margin-bottom: 2px;
    }
  `]
})
export class BrokerPlansComponent implements OnInit {
  private brokerService = inject(BrokerService);
  private propertiesService = inject(PropertiesService);

  plans: any[] = [];
  properties: any[] = [];
  selectedPlan: any = null;

  showPlanModal = false;
  planFormModel: any = {};
  mappingFormModel: any = {};

  ngOnInit() {
    this.loadPlans();
    this.loadProperties();
  }

  loadPlans() {
    this.brokerService.getCommissionPlans().subscribe(res => {
      this.plans = res;
    });
  }

  loadProperties() {
    this.propertiesService.getProperties().subscribe(res => {
      this.properties = res;
    });
  }

  selectPlan(plan: any) {
    this.selectedPlan = plan;
  }

  openCreatePlanModal() {
    this.planFormModel = {
      commissionPlanCode: '',
      commissionPlanName: '',
      commissionTypeId: 'PERCENTAGE',
      effectiveFromDate: '',
      effectiveToDate: '',
      details: [{ commissionPercent: null, fixedAmount: null }]
    };
    this.showPlanModal = true;
  }

  closeCreatePlanModal() {
    this.showPlanModal = false;
  }

  onPlanTypeChange() {
    const type = this.planFormModel.commissionTypeId;
    if (type === 'TIERED') {
      this.planFormModel.details = [{
        fromAmount: 0,
        toAmount: null,
        commissionPercent: null,
        fixedAmount: null
      }];
    } else {
      this.planFormModel.details = [{
        commissionPercent: null,
        fixedAmount: null
      }];
    }
  }

  addDetailRow() {
    this.planFormModel.details.push({
      fromAmount: 0,
      toAmount: null,
      commissionPercent: null,
      fixedAmount: null
    });
  }

  removeDetailRow(idx: number) {
    if (this.planFormModel.details.length > 1) {
      this.planFormModel.details.splice(idx, 1);
    }
  }

  saveCommissionPlan() {
    this.brokerService.createCommissionPlan(this.planFormModel).subscribe({
      next: () => {
        this.loadPlans();
        this.closeCreatePlanModal();
      },
      error: err => console.error('Failed to create plan', err)
    });
  }

  assignPlanToProject() {
    this.brokerService.assignProjectCommissionPlan(this.mappingFormModel).subscribe({
      next: () => {
        this.mappingFormModel = { propertyId: null, commissionPlanId: null, effectiveFromDate: '' };
        alert('Plan successfully mapped to project scope!');
      },
      error: err => console.error('Failed to map plan', err)
    });
  }
}
