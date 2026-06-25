import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrokerService } from '../../services/broker.service';
import { CrmService } from '../../services/crm.service';
import { PropertiesService } from '../../services/properties.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-broker-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Lead & Project Assignments</h1>
        <p>Assign prospective client leads and inventory development scopes to registered brokers</p>
      </div>
      <div class="app-header-actions" *ngIf="selectedBroker">
        <span class="badge badge-qualified">Selected: {{ selectedBroker.brokerName }}</span>
      </div>
    </header>

    <div class="leads-workspace-grid flex flex-col gap-6" style="padding-bottom: 40px;">
      <!-- Top Row: Select Broker -->
      <div class="card p-6">
        <div class="form-group" style="max-width: 400px; margin-bottom: 0;">
          <label for="brokerSelect" style="font-weight: 600; font-size: 14px;">Select Broker to Manage *</label>
          <select id="brokerSelect" class="form-control" [(ngModel)]="selectedBrokerId" (change)="onBrokerSelect()">
            <option [value]="null" disabled selected>-- Select a Broker --</option>
            <option *ngFor="let b of brokers" [value]="b.id">{{ b.brokerName }} ({{ b.brokerCode }})</option>
          </select>
        </div>
      </div>

      <div class="grid col-2 gap-6" *ngIf="selectedBroker">
        <!-- Assign Lead Form Card -->
        <div class="card p-6">
          <h3 class="margin-b-4 flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">person_add</span>
            Assign Client Lead to Broker
          </h3>
          <form (ngSubmit)="assignLead()" #leadForm="ngForm" class="modal-form">
            <div class="form-group margin-b-3">
              <label for="leadId">Select Lead *</label>
              <select id="leadId" name="leadId" [(ngModel)]="leadFormModel.leadId" required class="form-control">
                <option [value]="null" disabled selected>-- Choose Lead --</option>
                <option *ngFor="let lead of unassignedLeads" [value]="lead.id">{{ lead.fullName }} ({{ lead.primaryPhone }})</option>
              </select>
            </div>
            <div class="form-group margin-b-4">
              <label for="remarks">Assignment Remarks</label>
              <input type="text" id="remarks" name="remarks" [(ngModel)]="leadFormModel.remarks" placeholder="Notes for this assignment..." class="form-control">
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="!leadForm.valid || !leadFormModel.leadId">Assign Lead</button>
          </form>
        </div>

        <!-- Assign Project/Property Form Card -->
        <div class="card p-6">
          <h3 class="margin-b-4 flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">domain</span>
            Assign Project Scope to Broker
          </h3>
          <form (ngSubmit)="assignProject()" #projForm="ngForm" class="modal-form">
            <div class="form-group margin-b-3">
              <label for="propertyId">Select Project/Property *</label>
              <select id="propertyId" name="propertyId" [(ngModel)]="projFormModel.propertyId" required class="form-control">
                <option [value]="null" disabled selected>-- Choose Project --</option>
                <option *ngFor="let prop of properties" [value]="prop.id">{{ prop.propertyName }} ({{ prop.city }})</option>
              </select>
            </div>
            <div class="grid col-2 gap-3 margin-b-4">
              <div class="form-group">
                <label for="startDate">Start Date *</label>
                <input type="date" id="startDate" name="startDate" [(ngModel)]="projFormModel.startDate" required class="form-control">
              </div>
              <div class="form-group">
                <label for="endDate">End Date</label>
                <input type="date" id="endDate" name="endDate" [(ngModel)]="projFormModel.endDate" class="form-control">
              </div>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="!projForm.valid || !projFormModel.propertyId">Assign Project</button>
          </form>
        </div>
      </div>

      <!-- Active Assignments Tables -->
      <div class="grid col-2 gap-6" *ngIf="selectedBroker">
        <!-- Lead Assignments Table -->
        <div class="card p-6">
          <h3 class="margin-b-4">Active Leads Assigned</h3>
          <div class="table-container">
            <table class="leads-table">
              <thead>
                <tr>
                  <th style="width: 45%;">Lead</th>
                  <th style="width: 40%;">Assigned Info</th>
                  <th style="width: 15%;" class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedBrokerDetails?.leadAssignments">
                  <td>
                    <div class="flex flex-col">
                      <span class="font-semibold text-main">{{ item.lead?.fullName }}</span>
                      <span class="text-xs text-muted">{{ item.lead?.primaryPhone }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="text-xs font-semibold text-main">On: {{ item.assignedDate | date:'mediumDate' }}</span>
                      <span class="text-xs text-muted" *ngIf="item.remarks">"{{ item.remarks }}"</span>
                    </div>
                  </td>
                  <td class="text-right">
                    <button class="icon-btn text-danger" (click)="deactivateLeadAssignment(item.id)" title="Deactivate Assignment">
                      <span class="material-icons-outlined font-sm">link_off</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="!selectedBrokerDetails?.leadAssignments?.length">
                  <td colspan="3" class="text-center text-secondary py-6">
                    No active lead assignments.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Project Scope Assignments Table -->
        <div class="card p-6">
          <h3 class="margin-b-4">Active Project Scopes</h3>
          <div class="table-container">
            <table class="leads-table">
              <thead>
                <tr>
                  <th style="width: 45%;">Project / Location</th>
                  <th style="width: 40%;">Period</th>
                  <th style="width: 15%;" class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of selectedBrokerDetails?.projectAssignments">
                  <td>
                    <div class="flex flex-col">
                      <span class="font-semibold text-main">{{ item.property?.propertyName }}</span>
                      <span class="text-xs text-muted">{{ item.property?.city }} • Status: {{ item.statusId }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="text-xs font-mono text-secondary">
                      {{ item.startDate | date:'mediumDate' }} - {{ item.endDate ? (item.endDate | date:'mediumDate') : 'Indefinite' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button class="icon-btn text-danger" (click)="deleteProjectAssignment(item.id)" title="Remove Scope Assignment">
                      <span class="material-icons-outlined font-sm">delete</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="!selectedBrokerDetails?.projectAssignments?.length">
                  <td colspan="3" class="text-center text-secondary py-6">
                    No active property project scopes.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
  `]
})
export class BrokerAssignmentsComponent implements OnInit {
  private brokerService = inject(BrokerService);
  private crmService = inject(CrmService);
  private propertiesService = inject(PropertiesService);

  brokers: any[] = [];
  properties: any[] = [];
  unassignedLeads: any[] = [];
  
  selectedBrokerId: number | null = null;
  selectedBroker: any = null;
  selectedBrokerDetails: any = null;

  // Form models
  leadFormModel = {
    leadId: null as number | null,
    remarks: ''
  };
  projFormModel = {
    propertyId: null as number | null,
    startDate: '',
    endDate: ''
  };

  ngOnInit() {
    this.loadBrokers();
    this.loadProperties();
    this.loadLeads();
  }

  loadBrokers() {
    this.brokerService.getBrokers().subscribe(res => {
      this.brokers = res.filter(b => b.statusId === 'ACTIVE');
    });
  }

  loadProperties() {
    this.propertiesService.getProperties().subscribe(res => {
      this.properties = res;
    });
  }

  loadLeads() {
    this.crmService.getLeads({ limit: 100 }).subscribe(res => {
      // In this simple CRM context, we will fetch the leads list
      this.unassignedLeads = res.items || res;
    });
  }

  onBrokerSelect() {
    if (!this.selectedBrokerId) return;
    this.selectedBroker = this.brokers.find(b => b.id === Number(this.selectedBrokerId));
    this.refreshBrokerAssignments();
  }

  refreshBrokerAssignments() {
    if (!this.selectedBrokerId) return;
    this.brokerService.getBrokerById(Number(this.selectedBrokerId)).subscribe(res => {
      this.selectedBrokerDetails = res;
    });
  }

  assignLead() {
    if (!this.selectedBrokerId || !this.leadFormModel.leadId) return;
    this.brokerService.assignLead(Number(this.selectedBrokerId), this.leadFormModel).subscribe({
      next: () => {
        this.refreshBrokerAssignments();
        this.leadFormModel = { leadId: null, remarks: '' };
        this.loadLeads(); // refresh leads dropdown
      },
      error: err => console.error('Failed to assign lead', err)
    });
  }

  async deactivateLeadAssignment(assignmentId: number) {
    const confirm = await customConfirm(
      'Are you sure you want to release / deactivate this lead assignment?',
      'Deactivate Assignment'
    );
    if (confirm && this.selectedBrokerId) {
      this.brokerService.removeLeadAssignment(Number(this.selectedBrokerId), assignmentId).subscribe({
        next: () => {
          this.refreshBrokerAssignments();
        },
        error: err => console.error('Failed to remove assignment', err)
      });
    }
  }

  assignProject() {
    if (!this.selectedBrokerId || !this.projFormModel.propertyId) return;
    this.brokerService.assignProject(Number(this.selectedBrokerId), this.projFormModel).subscribe({
      next: () => {
        this.refreshBrokerAssignments();
        this.projFormModel = { propertyId: null, startDate: '', endDate: '' };
      },
      error: err => console.error('Failed to assign project scope', err)
    });
  }

  async deleteProjectAssignment(assignmentId: number) {
    const confirm = await customConfirm(
      'Are you sure you want to remove this broker assignment from the project scope?',
      'Remove Scope Assignment'
    );
    if (confirm && this.selectedBrokerId) {
      this.brokerService.removeProjectAssignment(Number(this.selectedBrokerId), assignmentId).subscribe({
        next: () => {
          this.refreshBrokerAssignments();
        },
        error: err => console.error('Failed to remove assignment', err)
      });
    }
  }
}
