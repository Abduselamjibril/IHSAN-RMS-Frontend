import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Approval Workflows</h1>
        <p>Configure multi-level approval hierarchies, manage thresholds, and process pending vouchers</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openConfigModal()" *ngIf="activeTab === 'config'">
          <span class="material-icons-outlined">add_task</span> Configure Workflow
        </button>
      </div>
    </header>

    <!-- Tab navigation -->
    <div class="flex gap-4 border-bottom pb-2 margin-b-6">
      <button class="btn" [class.btn-primary]="activeTab === 'inbox'" [class.btn-secondary]="activeTab !== 'inbox'" (click)="setTab('inbox')">
        Approvals Inbox
      </button>
      <button class="btn" [class.btn-primary]="activeTab === 'config'" [class.btn-secondary]="activeTab !== 'config'" (click)="setTab('config')">
        Workflow Configurations
      </button>
    </div>

    <!-- Tab 1: Inbox (Active Instances) -->
    <div *ngIf="activeTab === 'inbox'" class="card p-6">
      <h3 class="margin-b-4">Vouchers Awaiting Approvals</h3>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">Workflow / Item</th>
              <th style="width: 20%;">Current Pending Level</th>
              <th style="width: 20%;">Initiator</th>
              <th style="width: 20%;">Approval Sequence Status</th>
              <th style="width: 15%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inst of activeInstances">
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main">{{ inst.workflowDefinition?.workflowName }}</span>
                  <span class="text-xs text-secondary">{{ inst.referenceTypeId }} ID: {{ inst.referenceId }}</span>
                </div>
              </td>
              <td>
                <div class="flex align-center gap-2" *ngIf="getCurrentStep(inst) as step">
                  <span class="badge badge-high" style="background-color: rgba(99,102,241,0.1); color: var(--brand-primary); font-size: 10px;">
                    Step {{ step.stepNumber }}
                  </span>
                  <span class="font-semibold text-main" style="font-size: 13px;">{{ step.stepName }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main" style="font-size: 13px;">
                    {{ inst.initiator?.firstName }} {{ inst.initiator?.lastName }}
                  </span>
                  <span class="text-xs text-secondary">{{ inst.initiatedDate | date:'medium' }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <span class="badge badge-qualified" style="width: fit-content; text-transform: uppercase;">
                    {{ inst.workflowStatusId }}
                  </span>
                  <span class="text-xs text-muted">
                    Approvals: {{ inst.approvals?.length || 0 }} step(s) completed
                  </span>
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  <button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" (click)="openApprovalDialog(inst, 'APPROVED')">
                    Approve
                  </button>
                  <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" (click)="openApprovalDialog(inst, 'REJECTED')">
                    Reject
                  </button>
                  <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; color: var(--color-qualified); background-color: rgba(16,185,129,0.1);" (click)="openApprovalDialog(inst, 'RETURNED')" title="Send Back">
                    Return
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!activeInstances.length">
              <td colspan="5" class="text-center text-secondary py-8">
                No active vouchers currently pending approval.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Workflow Configurations -->
    <div *ngIf="activeTab === 'config'" class="card p-6">
      <h3 class="margin-b-4">Workflow Sequence Mappings</h3>

      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 25%;">Workflow Name / Code</th>
              <th style="width: 20%;">Module</th>
              <th style="width: 45%;">Sequential Steps Hierarchy</th>
              <th style="width: 10%;" class="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of definitions">
              <td>
                <div class="flex flex-col">
                  <span class="font-semibold text-main">{{ d.workflowName }}</span>
                  <span class="text-xs text-secondary font-mono">{{ d.workflowCode }}</span>
                </div>
              </td>
              <td>
                <strong class="text-main" style="font-size: 13px;">{{ d.moduleName }}</strong>
              </td>
              <td>
                <div class="flex align-center gap-2 flex-wrap">
                  <div *ngFor="let s of sortSteps(d.steps); let last = last" class="flex align-center gap-2">
                    <div class="step-badge-circle" title="Threshold: ETB {{ s.approvalThreshold || 'None' }}">
                      {{ s.stepNumber }}: {{ s.role?.roleName }}
                    </div>
                    <span class="material-icons-outlined text-muted" *ngIf="!last" style="font-size: 14px;">arrow_forward</span>
                  </div>
                  <span *ngIf="!d.steps?.length" class="text-muted text-xs">No steps configured</span>
                </div>
              </td>
              <td class="text-right">
                <span class="badge badge-qualified">Active</span>
              </td>
            </tr>
            <tr *ngIf="!definitions.length">
              <td colspan="4" class="text-center text-secondary py-8">
                No approval workflows configured.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Update Workflow Configuration Modal -->
    <div class="modal-overlay" *ngIf="showConfigModal">
      <div class="modal-container card" style="max-width: 600px; width: 90%;">
        <div class="modal-header">
          <h2>Configure Workflow Sequencer</h2>
          <button class="close-btn" (click)="closeConfigModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <form (ngSubmit)="saveConfig()" #configForm="ngForm">
          <div class="modal-body flex flex-col gap-4">
            <div class="form-grid">
              <div class="form-group">
                <label for="workflowCode">Workflow Trigger Code *</label>
                <select id="workflowCode" name="workflowCode" [(ngModel)]="configModel.workflowCode" required class="form-control">
                  <option value="PROPERTY_APPROVAL">PROPERTY_APPROVAL</option>
                  <option value="SALE_APPROVAL">SALE_APPROVAL</option>
                  <option value="DISCOUNT_APPROVAL">DISCOUNT_APPROVAL</option>
                  <option value="PAYMENT_APPROVAL">PAYMENT_APPROVAL</option>
                  <option value="COMMISSION_APPROVAL">COMMISSION_APPROVAL</option>
                </select>
              </div>

              <div class="form-group">
                <label for="workflowName">Display Name *</label>
                <input type="text" id="workflowName" name="workflowName" [(ngModel)]="configModel.workflowName" required placeholder="e.g. Sales Contract Approval" class="form-control">
              </div>

              <div class="form-group col-span-2">
                <label for="moduleName">Source System Module *</label>
                <input type="text" id="moduleName" name="moduleName" [(ngModel)]="configModel.moduleName" required placeholder="e.g. Sales" class="form-control">
              </div>
            </div>

            <!-- Steps definition section -->
            <div class="border-top pt-4">
              <div class="flex justify-between items-center margin-b-3">
                <h4 style="margin: 0; font-size: 14px;">Approval Hierarchy Steps</h4>
                <button type="button" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" (click)="addStepRow()">
                  <span class="material-icons-outlined font-xs">add</span> Add Level Step
                </button>
              </div>

              <div class="flex flex-col gap-3">
                <div *ngFor="let row of configModel.steps; let idx = index" class="grid col-4 gap-2 align-center border p-2 rounded-md bg-glass">
                  <div class="flex align-center gap-2">
                    <span class="font-semibold text-main text-xs">Lv {{ row.stepNumber }}:</span>
                    <input type="text" name="stepName-{{idx}}" [(ngModel)]="row.stepName" required placeholder="Step Name" class="form-control" style="padding: 6px 10px; font-size: 12px;">
                  </div>
                  
                  <select name="roleId-{{idx}}" [(ngModel)]="row.roleId" required class="form-control" style="padding: 6px 10px; font-size: 12px;">
                    <option *ngFor="let r of roles" [value]="r.roleId">{{ r.roleName }}</option>
                  </select>

                  <input type="number" name="threshold-{{idx}}" [(ngModel)]="row.approvalThreshold" placeholder="Min Amount ETB" class="form-control" style="padding: 6px 10px; font-size: 12px;">

                  <button type="button" class="icon-btn text-danger" style="margin-left: auto;" (click)="removeStepRow(idx)">
                    <span class="material-icons-outlined font-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeConfigModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!configForm.valid || !configModel.steps.length">Save Workflow Map</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Review / Approval Decision Modal -->
    <div class="modal-overlay" *ngIf="showApprovalModal">
      <div class="modal-container card" style="max-width: 400px; width: 90%;">
        <div class="modal-header">
          <h2>Workflow Approval Decision</h2>
          <button class="close-btn" (click)="closeApprovalDialog()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <form (ngSubmit)="submitApprovalDecision()">
          <div class="modal-body flex flex-col gap-4">
            <p class="text-secondary text-sm">
              Confirm your approval decision (<strong>{{ approvalDecisionType }}</strong>) on item <strong>{{ selectedInstance?.referenceTypeId }} #{{ selectedInstance?.referenceId }}</strong>.
            </p>

            <div class="form-group">
              <label for="approvalRemarks">Approval Remarks / Notes</label>
              <textarea 
                id="approvalRemarks" 
                name="approvalRemarks" 
                [(ngModel)]="approvalRemarks" 
                placeholder="Explain approval reason or return details..." 
                class="form-control"
                style="height: 100px; resize: none;"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeApprovalDialog()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Decision</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .step-badge-circle {
      background-color: rgba(124,58,237,0.1);
      color: var(--brand-primary);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
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
  `]
})
export class WorkflowsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api';

  activeTab = 'inbox';
  definitions: any[] = [];
  activeInstances: any[] = [];
  roles: any[] = [];

  showConfigModal = false;
  showApprovalModal = false;

  configModel: any = { steps: [] };
  selectedInstance: any = null;
  approvalDecisionType = '';
  approvalRemarks = '';

  ngOnInit() {
    this.loadDefinitions();
    this.loadActiveInstances();
    this.loadRoles();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'inbox') this.loadActiveInstances();
    if (tab === 'config') this.loadDefinitions();
  }

  loadDefinitions() {
    this.http.get<any[]>(`${this.apiBase}/workflows/definitions`).subscribe({
      next: (res) => this.definitions = res,
      error: (err) => console.error('Failed to load definitions', err)
    });
  }

  loadActiveInstances() {
    this.http.get<any[]>(`${this.apiBase}/workflows/active`).subscribe({
      next: (res) => this.activeInstances = res,
      error: (err) => console.error('Failed to load active instances', err)
    });
  }

  loadRoles() {
    this.http.get<any[]>(`${this.apiBase}/roles`).subscribe({
      next: (res) => this.roles = res,
      error: (err) => console.error('Failed to load roles', err)
    });
  }

  sortSteps(steps: any[]): any[] {
    if (!steps) return [];
    return [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
  }

  getCurrentStep(inst: any): any {
    if (!inst.workflowDefinition?.steps) return null;
    return inst.workflowDefinition.steps.find((s: any) => s.stepNumber === inst.currentStepNumber);
  }

  openConfigModal() {
    this.configModel = {
      workflowCode: 'PROPERTY_APPROVAL',
      workflowName: '',
      moduleName: 'Property',
      steps: []
    };
    this.showConfigModal = true;
  }

  closeConfigModal() {
    this.showConfigModal = false;
  }

  addStepRow() {
    const nextNumber = this.configModel.steps.length + 1;
    this.configModel.steps.push({
      stepNumber: nextNumber,
      stepName: '',
      roleId: this.roles[0]?.roleId || '',
      approvalThreshold: null
    });
  }

  removeStepRow(idx: number) {
    this.configModel.steps.splice(idx, 1);
    // Recalculate level numbers
    this.configModel.steps.forEach((s: any, i: number) => {
      s.stepNumber = i + 1;
    });
  }

  saveConfig() {
    this.http.post(`${this.apiBase}/workflows/definitions`, this.configModel).subscribe({
      next: () => {
        this.loadDefinitions();
        this.closeConfigModal();
      },
      error: (err) => console.error('Failed to save definition config', err)
    });
  }

  openApprovalDialog(inst: any, decision: string) {
    this.selectedInstance = inst;
    this.approvalDecisionType = decision;
    this.approvalRemarks = '';
    this.showApprovalModal = true;
  }

  closeApprovalDialog() {
    this.showApprovalModal = false;
    this.selectedInstance = null;
  }

  submitApprovalDecision() {
    if (!this.selectedInstance) return;
    const payload = {
      instanceId: this.selectedInstance.workflowInstanceId,
      actionId: this.approvalDecisionType,
      remarks: this.approvalRemarks
    };

    this.http.post(`${this.apiBase}/workflows/approvals`, payload).subscribe({
      next: () => {
        this.loadActiveInstances();
        this.closeApprovalDialog();
      },
      error: (err) => console.error('Failed to submit approval decision', err)
    });
  }
}
