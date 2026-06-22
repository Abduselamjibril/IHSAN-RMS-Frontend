import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingService } from '../../services/marketing.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Campaign Management</h1>
        <p>Plan marketing campaigns, allocate spending, and track conversion lifecycles</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary flex items-center gap-2" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span> Create Campaign
        </button>
      </div>
    </header>

    <div class="leads-workspace-grid">
      <!-- Campaigns Table Card -->
      <div class="leads-list-area card">
        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 35%;">Campaign Name</th>
                <th style="width: 15%;">Type</th>
                <th style="width: 20%;">Period</th>
                <th style="width: 15%;">Budget</th>
                <th style="width: 15%;">Status</th>
                <th style="width: 10%;" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of campaigns" (click)="selectCampaign(item)" [class.selected]="selectedCampaign?.id === item.id" class="cursor-pointer">
                <td>
                  <div class="contact-info flex align-center gap-3">
                    <div class="table-avatar">{{ getInitials(item.campaignName) }}</div>
                    <div class="flex flex-col">
                      <span class="lead-name font-semibold text-main">{{ item.campaignName }}</span>
                      <span class="lead-phone">{{ item.campaignCode }} <span class="text-muted font-xs" style="margin-left: 6px;">• {{ item.targetAudience || 'General' }}</span></span>
                    </div>
                  </div>
                </td>
                <td><span class="type-pill">{{ item.campaignType }}</span></td>
                <td>
                  <span class="text-secondary font-sm">
                    {{ item.startDate | date:'mediumDate' }} - {{ item.endDate ? (item.endDate | date:'mediumDate') : 'Continuous' }}
                  </span>
                </td>
                <td>
                  <span style="font-weight: 600; color: var(--text-main);">ETB {{ item.budgetAmount | number:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getBadgeClass(item.campaignStatus)">
                    {{ item.campaignStatus }}
                  </span>
                </td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button class="icon-btn text-indigo" (click)="openEditModal(item)" title="Edit" style="margin-right: 8px;">
                    <span class="material-icons-outlined font-sm">edit</span>
                  </button>
                  <button class="icon-btn text-danger" (click)="deleteCampaign(item.id)" title="Delete">
                    <span class="material-icons-outlined font-sm">delete</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!campaigns.length">
                <td colspan="6" class="text-center text-secondary py-8">
                  No campaigns registered. Click "Create Campaign" to add one.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Campaign Detail & Budget Allocation Tracker -->
      <div *ngIf="selectedCampaign" class="card p-6 border-indigo">
        <div class="flex justify-between items-start border-bottom pb-4 margin-b-4">
          <div>
            <span class="text-indigo text-xs uppercase tracking-wider font-semibold">Selected Campaign details</span>
            <h2>{{ selectedCampaign.campaignName }} ({{ selectedCampaign.campaignCode }})</h2>
          </div>
          <button class="header-icon-btn" (click)="selectedCampaign = null">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="grid col-3 gap-6">
          <!-- Information Card -->
          <div class="detail-card">
            <h4 class="font-semibold text-main">Objectives & Target</h4>
            <p class="text-secondary mt-2" style="font-size: 13px; line-height: 1.5;">{{ selectedCampaign.campaignObjective || 'No objective provided.' }}</p>
            <div class="mt-4">
              <span class="text-secondary text-xs">Target Audience:</span>
              <p class="font-semibold text-main">{{ selectedCampaign.targetAudience || 'General public' }}</p>
            </div>
          </div>

          <!-- Budget Utilization Progress Bar -->
          <div class="detail-card col-span-2">
            <h4 class="font-semibold text-main">Budget Utilization Tracker</h4>
            <div class="mt-4" *ngIf="campaignBudget">
              <div class="flex justify-between text-sm margin-b-2">
                <span class="text-secondary">Spent: <strong class="text-main">ETB {{ campaignBudget.utilizedBudget | number:'1.2-2' }}</strong></span>
                <span class="text-secondary">Total Budget: <strong class="text-main">ETB {{ campaignBudget.allocatedBudget | number:'1.2-2' }}</strong></span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill bg-indigo" [style.width.%]="getBudgetPercent()"></div>
              </div>
              <div class="flex justify-between text-xs text-secondary mt-2">
                <span>Remaining Free Budget: <strong>ETB {{ campaignBudget.remainingBudget | number:'1.2-2' }}</strong></span>
                <span class="font-semibold text-indigo">{{ getBudgetPercent() | number:'1.0-0' }}% Utilized</span>
              </div>
            </div>
            <div *ngIf="!campaignBudget" class="text-secondary py-4 text-center">
              Loading budget specifications...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Campaign Form Modal -->
    <div class="modal-overlay" *ngIf="showFormModal" (click)="closeFormModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h2>{{ editMode ? 'Edit' : 'Create' }} Marketing Campaign</h2>
          <button class="header-icon-btn close-btn" (click)="closeFormModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </header>

        <form (ngSubmit)="saveCampaign()" #campaignForm="ngForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="campaignCode">Campaign Code *</label>
                <input type="text" id="campaignCode" name="campaignCode" [(ngModel)]="formModel.campaignCode" required placeholder="e.g. CAMP-2026-RAMADAN">
              </div>

              <div class="form-group">
                <label for="campaignName">Campaign Name *</label>
                <input type="text" id="campaignName" name="campaignName" [(ngModel)]="formModel.campaignName" required placeholder="e.g. Ramadan Special Discount">
              </div>

              <div class="form-group">
                <label for="campaignType">Campaign Type *</label>
                <select id="campaignType" name="campaignType" [(ngModel)]="formModel.campaignType" required>
                  <option value="DIGITAL">DIGITAL</option>
                  <option value="SOCIAL_MEDIA">SOCIAL_MEDIA</option>
                  <option value="PRINT_MEDIA">PRINT_MEDIA</option>
                  <option value="BILLBOARD">BILLBOARD</option>
                  <option value="RADIO">RADIO</option>
                  <option value="TELEVISION">TELEVISION</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="EVENT">EVENT</option>
                  <option value="REFERRAL">REFERRAL</option>
                </select>
              </div>

              <div class="form-group">
                <label for="campaignStatus">Campaign Status</label>
                <select id="campaignStatus" name="campaignStatus" [(ngModel)]="formModel.campaignStatus">
                  <option value="DRAFT">DRAFT</option>
                  <option value="PLANNED">PLANNED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div class="form-group">
                <label for="startDate">Start Date *</label>
                <input type="date" id="startDate" name="startDate" [(ngModel)]="formModel.startDate" required>
              </div>

              <div class="form-group">
                <label for="endDate">End Date</label>
                <input type="date" id="endDate" name="endDate" [(ngModel)]="formModel.endDate">
              </div>

              <div class="form-group">
                <label for="budgetAmount">Allocated Budget (ETB) *</label>
                <input type="number" id="budgetAmount" name="budgetAmount" [(ngModel)]="formModel.budgetAmount" required min="0">
              </div>

              <div class="form-group">
                <label for="targetAudience">Target Audience</label>
                <input type="text" id="targetAudience" name="targetAudience" [(ngModel)]="formModel.targetAudience" placeholder="e.g. Diaspora Buyers, First Time Buyers">
              </div>

              <div class="form-group col-span-2">
                <label for="campaignObjective">Campaign Objective</label>
                <textarea id="campaignObjective" name="campaignObjective" [(ngModel)]="formModel.campaignObjective" rows="3" placeholder="Describe the objectives and expected outcomes of the campaign..."></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer flex justify-end gap-3" style="padding: 16px 24px; background-color: var(--bg-main); border-top: 1px solid var(--border-color); margin-top: 0;">
            <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!campaignForm.form.valid">
              {{ editMode ? 'Save Changes' : 'Create Campaign' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .border-indigo {
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }
    .border-bottom {
      border-bottom: 1px solid var(--border-color);
    }
    .pb-4 { padding-bottom: 16px; }
    .mt-4 { margin-top: 16px; }
    .mt-2 { margin-top: 8px; }
    .col-span-2 { grid-column: span 2; }
    .progress-bar-bg {
      height: 12px;
      background-color: var(--bg-main);
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 6px;
    }
    .bg-indigo { background-color: var(--brand-primary); }

    /* Custom local grid styling for budget details columns */
    .grid {
      display: grid;
    }
    .col-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .gap-6 {
      gap: 24px;
    }

    /* Modal Form Group Select Field Styles */
    .form-group select {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      outline: none;
      transition: var(--transition-fast);
      width: 100%;
      background-color: var(--bg-card);
    }
    .form-group select:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px rgba(76, 58, 147, 0.12);
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

  `]
})
export class CampaignsComponent implements OnInit {
  private marketingService = inject(MarketingService);

  campaigns: any[] = [];
  selectedCampaign: any = null;
  campaignBudget: any = null;

  showFormModal = false;
  editMode = false;
  formModel: any = {};

  ngOnInit() {
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.marketingService.getCampaigns().subscribe({
      next: (res) => this.campaigns = res,
      error: (err) => console.error('Failed to load campaigns', err)
    });
  }

  selectCampaign(campaign: any) {
    this.selectedCampaign = campaign;
    this.marketingService.getCampaignBudgets().subscribe({
      next: (budgets) => {
        this.campaignBudget = budgets.find((b: any) => b.campaign?.id === campaign.id);
      },
      error: (err) => console.error('Failed to load budget details', err)
    });
  }

  getBudgetPercent(): number {
    if (!this.campaignBudget || !this.campaignBudget.allocatedBudget) return 0;
    return (this.campaignBudget.utilizedBudget / this.campaignBudget.allocatedBudget) * 100;
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getBadgeClass(statusName: string): string {
    const s = (statusName || '').toLowerCase();
    if (s.includes('draft')) return 'badge-new';
    if (s.includes('planned')) return 'badge-proposal';
    if (s.includes('active')) return 'badge-qualified';
    if (s.includes('suspended')) return 'badge-contacted';
    if (s.includes('completed')) return 'badge-qualified';
    if (s.includes('cancelled')) return 'badge-lost';
    return 'badge-new';
  }

  openCreateModal() {
    this.editMode = false;
    this.formModel = {
      campaignCode: '',
      campaignName: '',
      campaignType: 'DIGITAL',
      campaignStatus: 'DRAFT',
      startDate: new Date().toISOString().slice(0,10),
      endDate: '',
      budgetAmount: 0,
      targetAudience: '',
      campaignObjective: ''
    };
    this.showFormModal = true;
  }

  openEditModal(campaign: any) {
    this.editMode = true;
    this.formModel = {
      id: campaign.id,
      campaignCode: campaign.campaignCode,
      campaignName: campaign.campaignName,
      campaignType: campaign.campaignType,
      campaignStatus: campaign.campaignStatus,
      startDate: new Date(campaign.startDate).toISOString().slice(0,10),
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0,10) : '',
      budgetAmount: campaign.budgetAmount,
      targetAudience: campaign.targetAudience,
      campaignObjective: campaign.campaignObjective
    };
    this.showFormModal = true;
  }

  closeFormModal() {
    this.showFormModal = false;
  }

  saveCampaign() {
    if (this.editMode) {
      this.marketingService.updateCampaign(this.formModel.id, this.formModel).subscribe({
        next: () => {
          this.closeFormModal();
          this.loadCampaigns();
          if (this.selectedCampaign?.id === this.formModel.id) {
            this.selectCampaign(this.formModel);
          }
        },
        error: (err) => console.error('Failed to update campaign', err)
      });
    } else {
      this.marketingService.createCampaign(this.formModel).subscribe({
        next: () => {
          this.closeFormModal();
          this.loadCampaigns();
        },
        error: (err) => console.error('Failed to create campaign', err)
      });
    }
  }

  deleteCampaign(id: number) {
    customConfirm('Are you sure you want to delete this campaign? This will remove related budgets and logs.').then(confirmed => {
      if (confirmed) {
        this.marketingService.deleteCampaign(id).subscribe({
          next: () => {
            this.loadCampaigns();
            if (this.selectedCampaign?.id === id) {
              this.selectedCampaign = null;
              this.campaignBudget = null;
            }
          },
          error: (err) => console.error('Failed to delete campaign', err)
        });
      }
    });
  }
}
