import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Notification Template Designer</h1>
        <p>Create and customize multi-channel delivery templates with dynamic variable substitutions.</p>
      </div>
      <div class="header-actions flex gap-2">
        <button class="btn btn-secondary flex align-center gap-2" (click)="triggerManualSweep()">
          <span class="material-icons-outlined">play_circle</span>
          Run Daily Sweep
        </button>
        <button class="btn btn-primary flex align-center gap-2" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          New Template
        </button>
      </div>
    </header>

    <div class="template-summary">
      <div class="template-summary-card"><span class="material-icons-outlined blue">article</span><div><small>Active templates</small><strong>{{ templates.length }}</strong></div></div>
      <div class="template-summary-card"><span class="material-icons-outlined green">category</span><div><small>Categories</small><strong>{{ categories.length }}</strong></div></div>
      <div class="template-summary-card"><span class="material-icons-outlined gold">send</span><div><small>Delivery channels</small><strong>{{ channels.length }}</strong></div></div>
    </div>

    <div class="grid grid-cols-4 gap-6 margin-y-4">
      <!-- Templates Table -->
      <div class="col-span-3 card p-6">
        <div class="flex justify-between align-center mb-6">
          <h3 class="text-main">System Templates</h3>
          <div class="search-box">
            <span class="material-icons-outlined">search</span>
            <input type="text" placeholder="Search templates..." [(ngModel)]="searchQuery" />
          </div>
        </div>

        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 25%;">Template Info</th>
                <th style="width: 20%;">Category</th>
                <th style="width: 15%;">Channel</th>
                <th style="width: 25%;">Subject/Title Template</th>
                <th style="width: 15%;" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of getFilteredTemplates()">
                <td>
                  <div class="flex flex-col">
                    <span class="font-bold text-main">{{ t.templateName }}</span>
                    <span class="text-muted font-xs font-mono">{{ t.templateCode }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge badge-active">{{ t.category?.categoryName || 'General' }}</span>
                </td>
                <td>
                  <div class="flex align-center gap-1 text-secondary">
                    <span class="material-icons-outlined font-sm">{{ getChannelIcon(t.channel?.channelCode) }}</span>
                    <span>{{ t.channel?.channelName }}</span>
                  </div>
                </td>
                <td class="text-secondary font-sm">
                  {{ t.subjectTemplate || 'N/A' }}
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <button class="btn btn-secondary btn-sm" (click)="openEditModal(t)">Edit</button>
                    <button class="btn btn-secondary btn-sm btn-delete" (click)="deleteTemplate(t.id)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="getFilteredTemplates().length === 0">
                <td colspan="5" class="text-center py-8 text-secondary">
                  No templates match search criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Settings Column -->
      <div class="flex flex-col gap-6">
        <!-- Variable Reference Box -->
        <div class="card p-6 bg-light">
          <h4 class="text-main mb-3">Placeholders Dictionary</h4>
          <p class="font-xs text-secondary mb-4">
            Embed these tokens in your subject or body template. The system dynamically replaces them at dispatch.
          </p>

          <div class="variables-list flex flex-col gap-3">
            <div class="variable-item p-2 rounded bg-white border">
              <span class="font-mono font-bold text-indigo font-xs">{{ '{{CustomerName}}' }}</span>
              <p class="font-xxs text-muted mt-1">Full name of the target customer/client.</p>
            </div>
            <div class="variable-item p-2 rounded bg-white border">
              <span class="font-mono font-bold text-indigo font-xs">{{ '{{PaymentAmount}}' }}</span>
              <p class="font-xxs text-muted mt-1">Currency installment amount (in ETB).</p>
            </div>
            <div class="variable-item p-2 rounded bg-white border">
              <span class="font-mono font-bold text-indigo font-xs">{{ '{{DueDate}}' }}</span>
              <p class="font-xxs text-muted mt-1">Deadline or scheduled payment date.</p>
            </div>
            <div class="variable-item p-2 rounded bg-white border">
              <span class="font-mono font-bold text-indigo font-xs">{{ '{{UnitCode}}' }}</span>
              <p class="font-xxs text-muted mt-1">Inventory unit reference code.</p>
            </div>
          </div>
        </div>

        <!-- Telegram Setup Wizard Settings -->
        <div class="card p-6 bg-light">
          <h4 class="text-main mb-3 flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">telegram</span>
            Telegram MTProto Setup Wizard
          </h4>
          <p class="font-xs text-secondary mb-4">
            Connect the system userbot to send direct notifications without touching a terminal.
          </p>

          <div class="flex flex-col gap-3">
            <div class="flex justify-between align-center p-2 rounded bg-white border">
              <span class="font-xs text-secondary font-bold">Status:</span>
              <span class="badge" [class.badge-active]="telegramStatus.isConnected" [class.badge-draft]="telegramStatus.isSimulation">
                {{ telegramStatus.isConnected ? 'Connected & Authorized' : 'Mock Simulation Mode' }}
              </span>
            </div>

            <!-- Error Banner -->
            <div class="alert-banner error p-2 rounded text-red bg-red-light font-xs border-red" *ngIf="wizardError" style="color: #ef4444; background: #fee2e2; border: 1px solid #fca5a5;">
              <strong>Error:</strong> {{ wizardError }}
            </div>

            <!-- Step 1: Input Credentials -->
            <div *ngIf="telegramStep === 1" class="flex flex-col gap-3">
              <div class="form-group">
                <label>Telegram API ID</label>
                <input type="number" [(ngModel)]="telegramConfig.telegramApiId" placeholder="e.g. 123456" />
              </div>

              <div class="form-group">
                <label>Telegram API Hash</label>
                <input type="password" [(ngModel)]="telegramConfig.telegramApiHash" placeholder="Enter API Hash" />
                <span class="font-xxs text-muted" *ngIf="telegramConfig.telegramApiHashMasked">Saved: {{ telegramConfig.telegramApiHashMasked }}</span>
              </div>

              <div class="form-group">
                <label>Phone Number (with Country Code)</label>
                <input type="text" [(ngModel)]="telegramPhone" placeholder="e.g. +251911..." />
              </div>

              <button 
                class="btn btn-secondary flex align-center gap-2 mt-2" 
                style="width: 100%; justify-content: center;"
                [disabled]="isRequestingCode" 
                (click)="requestCode()"
              >
                <span class="material-icons-outlined" *ngIf="!isRequestingCode">send</span>
                {{ isRequestingCode ? 'Requesting Code...' : 'Request Login Code' }}
              </button>
            </div>

            <!-- Step 2: Verification Code -->
            <div *ngIf="telegramStep === 2" class="flex flex-col gap-3">
              <div class="p-3 bg-white border rounded font-xs text-secondary">
                Verification code sent to <strong>{{ telegramPhone }}</strong>. Please check your Telegram app.
              </div>

              <div class="form-group">
                <label>Verification Code</label>
                <input type="text" [(ngModel)]="verificationCode" placeholder="Enter 5-digit code" />
              </div>

              <div class="form-group">
                <label>2FA Password (Optional)</label>
                <input type="password" [(ngModel)]="twoFactorPassword" placeholder="Enter 2FA password if enabled" />
              </div>

              <div class="flex gap-2 mt-2">
                <button 
                  class="btn btn-secondary flex-grow flex align-center gap-2" 
                  style="justify-content: center;"
                  [disabled]="isVerifyingCode" 
                  (click)="verifyCode()"
                >
                  <span class="material-icons-outlined" *ngIf="!isVerifyingCode">verified_user</span>
                  {{ isVerifyingCode ? 'Verifying...' : 'Verify & Login' }}
                </button>
                <button 
                  class="btn btn-muted" 
                  (click)="resetWizard()"
                  [disabled]="isVerifyingCode"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Form Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen" (click)="closeModal()">
      <div class="modal-content template-modal" role="dialog" aria-modal="true" aria-label="Notification template editor" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div><span class="modal-kicker">NOTIFICATION STUDIO</span><h3>{{ editingTemplateId ? 'Edit Notification Template' : 'New Notification Template' }}</h3></div>
          <button class="close-btn" (click)="closeModal()" title="Close">&times;</button>
        </div>

        <div class="modal-body flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label>Template Code <span class="text-danger">*</span></label>
              <input type="text" [(ngModel)]="form.templateCode" placeholder="e.g. PAYMENT_ALERT" [disabled]="!!editingTemplateId" />
            </div>
            <div class="form-group">
              <label>Template Name <span class="text-danger">*</span></label>
              <input type="text" [(ngModel)]="form.templateName" placeholder="e.g. Due Payment Alert" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label>Category <span class="text-danger">*</span></label>
              <select [(ngModel)]="form.categoryId">
                <option *ngFor="let c of categories" [value]="c.id">{{ c.categoryName }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Delivery Channel <span class="text-danger">*</span></label>
              <select [(ngModel)]="form.channelId">
                <option *ngFor="let ch of channels" [value]="ch.id">{{ ch.channelName }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Subject / Title Template</label>
            <input type="text" [(ngModel)]="form.subjectTemplate" placeholder="e.g. Installment Overdue Notice" />
          </div>

          <div class="form-group">
            <label>Body Template <span class="text-danger">*</span></label>
            <textarea rows="6" [(ngModel)]="form.bodyTemplate" [placeholder]="'Dear {{CustomerName}},\\nYour payment is due...'"></textarea>
          </div>
        </div>

        <div class="modal-footer flex justify-end gap-2">
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="saveTemplate()">Save Template</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .template-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; margin: 25px 0; }
    .template-summary-card { min-height: 95px; padding: 18px 22px; display: flex; align-items: center; gap: 15px; border: 1px solid var(--border-color); border-radius: 18px; background: var(--bg-card); box-shadow: 0 6px 16px rgba(12,56,97,.05); }
    .template-summary-card > .material-icons-outlined { width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; border-radius: 13px; color: white; font-size: 22px; }
    .template-summary-card .blue { background: #087fce; } .template-summary-card .green { background: #10b981; } .template-summary-card .gold { background: #e7a72e; }
    .template-summary-card small { display: block; color: var(--text-secondary); font-size: 12px; } .template-summary-card strong { color: var(--text-main); font-size: 19px; }
    .col-span-3.card { border-radius: 18px; } .variable-item { background: var(--bg-main) !important; border-color: var(--border-color) !important; border-radius: 10px; }
    .font-xxs { font-size: 11px; }
    .btn-delete:hover {
      background: var(--error-color, #ef4444) !important;
      color: white !important;
      border-color: var(--error-color, #ef4444) !important;
    }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-content {
      background: var(--bg-card);
      border-radius: 20px;
      box-shadow: 0 28px 70px rgba(0, 0, 0, .33);
      width: min(980px, 94vw);
      max-width: 980px;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(128, 193, 238, .3);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalSlideUp {
      from {
        transform: translateY(24px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    .modal-header {
      padding: 20px 26px;
      background: linear-gradient(118deg, #061c3d, #087fce);
      border: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header h3 { color: #fff; margin-top: 4px; font-size: 20px; }
    .modal-kicker { color: #f4c764; font-size: 10px; font-weight: 800; letter-spacing: 1px; }
    .modal-body {
      padding: 26px;
    }
    .modal-footer {
      padding: 16px 26px;
      border-top: 1px solid var(--border-color);
      background: var(--bg-main);
    }
    @media (max-width: 900px) { .template-summary { grid-template-columns: 1fr; gap: 12px; } .grid-cols-4 { grid-template-columns: 1fr !important; } .col-span-3 { grid-column: auto !important; } }
  `]
})
export class NotificationTemplatesComponent implements OnInit {
  private service = inject(NotificationsService);

  templates: any[] = [];
  categories: any[] = [];
  channels: any[] = [];

  searchQuery = '';
  isModalOpen = false;
  editingTemplateId: number | null = null;

  form = {
    templateCode: '',
    templateName: '',
    categoryId: 0,
    channelId: 0,
    subjectTemplate: '',
    bodyTemplate: ''
  };

  // Telegram Dynamic settings state and Wizard properties
  telegramConfig = {
    telegramApiId: null as number | null,
    telegramApiHash: '',
    telegramSessionString: '',
    telegramApiHashMasked: '',
    telegramSessionStringMasked: ''
  };
  telegramStatus = {
    isConnected: false,
    isSimulation: true
  };
  
  telegramStep = 1;
  telegramPhone = '';
  verificationCode = '';
  twoFactorPassword = '';
  wizardError = '';
  isRequestingCode = false;
  isVerifyingCode = false;

  ngOnInit() {
    this.loadData();
    this.loadTelegramSettings();
  }

  loadData() {
    this.service.getTemplates().subscribe({
      next: (res) => this.templates = res,
      error: (err) => console.error('Error fetching templates:', err)
    });

    this.service.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
        if (this.categories.length > 0) this.form.categoryId = this.categories[0].id;
      },
      error: (err) => console.error('Error loading categories:', err)
    });

    this.service.getChannels().subscribe({
      next: (res) => {
        this.channels = res;
        if (this.channels.length > 0) this.form.channelId = this.channels[0].id;
      },
      error: (err) => console.error('Error loading channels:', err)
    });
  }

  loadTelegramSettings() {
    this.service.getTelegramConfig().subscribe({
      next: (config) => {
        this.telegramConfig.telegramApiId = config.telegramApiId;
        this.telegramConfig.telegramApiHashMasked = config.telegramApiHashMasked;
        this.telegramConfig.telegramSessionStringMasked = config.telegramSessionStringMasked;
      },
      error: (err) => console.error('Error loading telegram settings:', err)
    });

    this.service.getTelegramStatus().subscribe({
      next: (status) => this.telegramStatus = status,
      error: (err) => console.error('Error loading telegram status:', err)
    });
  }

  requestCode() {
    if (!this.telegramConfig.telegramApiId || !this.telegramConfig.telegramApiHash || !this.telegramPhone) {
      alert('Please enter API ID, API Hash, and Phone Number.');
      return;
    }

    this.isRequestingCode = true;
    this.wizardError = '';

    this.service.requestTelegramCode(
      this.telegramConfig.telegramApiId,
      this.telegramConfig.telegramApiHash,
      this.telegramPhone
    ).subscribe({
      next: (res) => {
        this.isRequestingCode = false;
        if (res.success) {
          this.telegramStep = 2;
        } else {
          this.wizardError = res.error || 'Failed to request verification code.';
        }
      },
      error: (err) => {
        this.isRequestingCode = false;
        this.wizardError = err.error?.message || err.message || 'Request failed.';
      }
    });
  }

  verifyCode() {
    if (!this.verificationCode) {
      alert('Please enter the verification code.');
      return;
    }

    this.isVerifyingCode = true;
    this.wizardError = '';

    this.service.verifyTelegramCode(
      this.telegramPhone,
      this.verificationCode,
      this.twoFactorPassword
    ).subscribe({
      next: (res) => {
        this.isVerifyingCode = false;
        if (res.success) {
          alert('Telegram userbot authorized and connected successfully!');
          this.resetWizard();
          this.loadTelegramSettings();
        } else {
          this.wizardError = res.error || 'Verification failed.';
        }
      },
      error: (err) => {
        this.isVerifyingCode = false;
        this.wizardError = err.error?.message || err.message || 'Verification failed.';
      }
    });
  }

  resetWizard() {
    this.telegramStep = 1;
    this.verificationCode = '';
    this.twoFactorPassword = '';
    this.wizardError = '';
    this.telegramPhone = '';
  }

  getFilteredTemplates(): any[] {
    if (!this.searchQuery) return this.templates;
    const query = this.searchQuery.toLowerCase();
    return this.templates.filter(t => 
      t.templateName.toLowerCase().includes(query) || 
      t.templateCode.toLowerCase().includes(query)
    );
  }

  openCreateModal() {
    this.editingTemplateId = null;
    this.form = {
      templateCode: '',
      templateName: '',
      categoryId: this.categories[0]?.id || 0,
      channelId: this.channels[0]?.id || 0,
      subjectTemplate: '',
      bodyTemplate: ''
    };
    this.isModalOpen = true;
  }

  openEditModal(template: any) {
    this.editingTemplateId = template.id;
    this.form = {
      templateCode: template.templateCode,
      templateName: template.templateName,
      categoryId: template.category?.id || 0,
      channelId: template.channel?.id || 0,
      subjectTemplate: template.subjectTemplate || '',
      bodyTemplate: template.bodyTemplate || ''
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveTemplate() {
    if (!this.form.templateCode || !this.form.templateName || !this.form.bodyTemplate) {
      alert('Please fill in all required fields.');
      return;
    }

    const selectedCategory = this.categories.find(c => Number(c.id) === Number(this.form.categoryId));
    const selectedChannel = this.channels.find(ch => Number(ch.id) === Number(this.form.channelId));

    if (!selectedCategory || !selectedChannel) {
      alert('Invalid Category or Channel selection.');
      return;
    }

    const payload = {
      templateCode: this.form.templateCode,
      templateName: this.form.templateName,
      subjectTemplate: this.form.subjectTemplate || null,
      bodyTemplate: this.form.bodyTemplate,
      categoryCode: selectedCategory.categoryCode,
      channelCode: selectedChannel.channelCode,
      variables: []
    };

    if (this.editingTemplateId) {
      const updatePayload = {
        templateName: this.form.templateName,
        subjectTemplate: this.form.subjectTemplate || null,
        bodyTemplate: this.form.bodyTemplate,
        isActive: true
      };
      this.service.updateTemplate(this.editingTemplateId, updatePayload).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        },
        error: (err) => alert('Error saving template: ' + (err.error?.message || err.message))
      });
    } else {
      this.service.createTemplate(payload).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        },
        error: (err) => alert('Error creating template: ' + (err.error?.message || err.message))
      });
    }
  }

  deleteTemplate(id: number) {
    if (confirm('Are you sure you want to delete this template?')) {
      this.service.deleteTemplate(id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert('Failed to delete template: ' + err.message)
      });
    }
  }

  triggerManualSweep() {
    this.service.runPaymentReminders().subscribe({
      next: (res) => alert(res.message || 'Payment reminders sweep triggered successfully!'),
      error: (err) => alert('Failed to trigger daily sweep: ' + err.message)
    });
  }

  getChannelIcon(code: string): string {
    switch (code) {
      case 'EMAIL': return 'email';
      case 'TELEGRAM': return 'telegram';
      case 'INAPP': return 'inbox';
      default: return 'notifications';
    }
  }
}
