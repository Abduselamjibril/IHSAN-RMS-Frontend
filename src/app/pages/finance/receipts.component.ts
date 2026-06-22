import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Receipts & Templates Management</h1>
        <p>View generated customer transaction receipts, reprint audits, and configure print layout design templates</p>
      </div>
    </header>

    <!-- Success Alert -->
    <div class="alert alert-success" *ngIf="successMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-qualified); color: var(--color-qualified); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">check_circle</span>
      <strong>Success:</strong>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <div class="alert alert-danger" *ngIf="errorMessage" style="margin-bottom: 24px; padding: 14px 18px; border-radius: var(--radius-md); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 14px; display: flex; align-items: center; gap: 10px;">
      <span class="material-icons-outlined" style="font-size: 20px;">error_outline</span>
      <strong>Error:</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'receipts'" 
        (click)="activeTab = 'receipts'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'receipts' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'receipts' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Receipts History
      </button>
      <button 
        class="tab-btn" 
        [class.active]="activeTab === 'templates'" 
        (click)="activeTab = 'templates'"
        style="padding: 10px 16px; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent;"
        [style.border-bottom-color]="activeTab === 'templates' ? 'var(--brand-primary)' : 'transparent'"
        [style.color]="activeTab === 'templates' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
      >
        Print Templates Layout
      </button>
    </div>

    <!-- Tab 1: Receipts History -->
    <div *ngIf="activeTab === 'receipts'" class="card glass-card">
      <h3 style="margin-bottom: 16px;">Issued Financial Receipts</h3>
      
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Payment Reference</th>
              <th>Customer</th>
              <th>Contract Reference</th>
              <th>Valuation Amount</th>
              <th>Issue Date</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of receipts">
              <td class="font-mono font-bold">#{{ r.receiptNumber }}</td>
              <td class="font-mono">#PAY-0{{ r.payment?.id }}</td>
              <td class="font-bold text-main">{{ r.payment?.customer?.fullName }}</td>
              <td class="font-mono">{{ r.payment?.contract?.contractNo }}</td>
              <td class="font-mono font-bold text-success">ETB {{ r.payment?.paymentAmount | number }}</td>
              <td>{{ r.receiptDate | date:'medium' }}</td>
              <td class="text-center">
                <div class="flex justify-center gap-2">
                  <!-- PDF Mock text file download link -->
                  <a 
                    [href]="'http://localhost:3000' + r.pdfUrl" 
                    target="_blank"
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">download</span>
                    Download PDF
                  </a>
                  <button 
                    class="btn btn-primary btn-xs flex align-center gap-1"
                    (click)="reprint(r.id)"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">print</span>
                    Reprint (Update Date)
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="receipts.length === 0">
              <td colspan="7" class="text-center py-6 text-secondary">
                No receipts generated yet. Receipts will be issued automatically when payments are approved.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Print Templates Layout -->
    <div *ngIf="activeTab === 'templates'" class="grid gap-6" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <!-- Left: Templates Selection & Editor -->
      <div class="card glass-card">
        <h3 style="margin-bottom: 16px;">Receipt Layout Editor</h3>
        
        <div class="form-group flex flex-col mb-4">
          <label>Select Template to Modify</label>
          <select [(ngModel)]="selectedTemplateId" (change)="onTemplateChange()" style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main);">
            <option *ngFor="let t of templates" [value]="t.id">
              {{ t.templateName }} {{ t.isDefault ? '(Default)' : '' }}
            </option>
          </select>
        </div>

        <form class="modal-form" (submit)="onSubmitTemplate($event)" *ngIf="selectedTemplate">
          <!-- Template Name * -->
          <div class="form-group flex flex-col">
            <label>Template Name * [REQUIRED]</label>
            <input type="text" [(ngModel)]="templateForm.templateName" name="templateName" required placeholder="e.g. Standard Layout" />
          </div>

          <!-- Company Logo -->
          <div class="form-group flex flex-col">
            <label>Company Logo URL / Text Tag</label>
            <input type="text" [(ngModel)]="templateForm.companyLogo" name="companyLogo" placeholder="e.g. assets/logo.png" />
          </div>

          <!-- Header Text -->
          <div class="form-group flex flex-col">
            <label>Header Brand Text</label>
            <input type="text" [(ngModel)]="templateForm.headerText" name="headerText" placeholder="e.g. IHSAN PROPERTIES PLC" />
          </div>

          <!-- Footer Text -->
          <div class="form-group flex flex-col">
            <label>Footer Disclaimer Text</label>
            <textarea [(ngModel)]="templateForm.footerText" name="footerText" placeholder="e.g. Thank you for your business..." rows="2"></textarea>
          </div>

          <!-- Signature Text -->
          <div class="form-group flex flex-col">
            <label>Authorized Signatory Text Seal</label>
            <input type="text" [(ngModel)]="templateForm.signatureText" name="signatureText" placeholder="e.g. Chief Finance Officer" />
          </div>

          <div class="form-row flex gap-4" style="margin-top: 12px;">
            <!-- QR Enabled -->
            <div class="form-group flex align-center gap-2">
              <input type="checkbox" id="qrEnabled" [(ngModel)]="templateForm.qrEnabled" name="qrEnabled" />
              <label for="qrEnabled">Embed Audit Verification QR Code</label>
            </div>

            <!-- Set as Default -->
            <div class="form-group flex align-center gap-2">
              <input type="checkbox" id="isDefault" [(ngModel)]="templateForm.isDefault" name="isDefault" />
              <label for="isDefault">Set as Active Default Template</label>
            </div>
          </div>

          <div style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              Save Template Changes
            </button>
          </div>
        </form>
      </div>

      <!-- Right: Real-time Live Layout Preview -->
      <div class="card glass-card flex flex-col" *ngIf="selectedTemplate">
        <h3 style="margin-bottom: 16px;">Live Layout Preview</h3>
        
        <div class="receipt-preview-container flex-1" style="background: white; color: #1e293b; padding: 24px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; font-family: monospace; font-size: 13px; line-height: 1.5; min-height: 380px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="text-center" style="border-bottom: 1px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px;">
              <div *ngIf="templateForm.companyLogo" style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">[{{ templateForm.companyLogo }}]</div>
              <h2 style="font-size: 15px; margin: 0; color: #0f172a; font-weight: 800;">{{ templateForm.headerText || 'BRAND HEADER TEXT' }}</h2>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">RECEIPT INVOICE: REC-10291920</div>
            </div>

            <div style="margin-bottom: 16px;">
              <div>Date Issued: {{ today | date:'mediumDate' }}</div>
              <div>Payment Ref: PAY-10291</div>
              <div>Customer: Abebe Kebede</div>
              <div>Contract Ref: SC-2026/001</div>
              <div style="font-weight: bold; margin-top: 8px; font-size: 14px;">Amount Received: ETB 150,000.00</div>
            </div>
          </div>

          <div>
            <div class="flex justify-between align-end" style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px; font-size: 11px;">
              <div style="max-width: 60%;">
                {{ templateForm.footerText || 'Footer note text...' }}
              </div>
              <div class="text-center" style="min-width: 100px;">
                <div *ngIf="templateForm.qrEnabled" style="font-size: 28px; margin-bottom: 4px; line-height: 1;">▚▞</div>
                <div style="font-size: 8px; border-top: 1px solid #94a3b8; padding-top: 4px; margin-top: 4px;">
                  {{ templateForm.signatureText || 'Signature Authority' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-success { color: var(--color-qualified) !important; }
    .badge-success { background-color: rgba(16, 185, 129, 0.15); color: var(--color-qualified); }
    .badge-disabled { background-color: rgba(239, 68, 68, 0.15); color: var(--color-lost); }
    .badge-indigo { background-color: var(--brand-primary-fade); color: var(--brand-primary); }
  `]
})
export class ReceiptsComponent implements OnInit {
  private financeService = inject(FinanceService);

  activeTab = 'receipts';
  receipts: any[] = [];
  templates: any[] = [];
  selectedTemplateId = 0;
  selectedTemplate: any = null;

  today = new Date();
  successMessage = '';
  errorMessage = '';

  templateForm = {
    templateName: '',
    companyLogo: '',
    headerText: '',
    footerText: '',
    signatureText: '',
    qrEnabled: true,
    isDefault: false
  };

  ngOnInit() {
    this.loadReceipts();
    this.loadTemplates();
  }

  loadReceipts() {
    this.financeService.getReceipts().subscribe({
      next: (res) => this.receipts = res,
      error: (err) => console.error('Error fetching receipts', err)
    });
  }

  loadTemplates() {
    this.financeService.getReceiptTemplates().subscribe({
      next: (res) => {
        this.templates = res;
        if (res.length > 0) {
          const defaultT = res.find((t: any) => t.isDefault) || res[0];
          this.selectedTemplateId = defaultT.id;
          this.selectedTemplate = defaultT;
          this.syncForm();
        }
      },
      error: (err) => console.error('Error fetching templates', err)
    });
  }

  onTemplateChange() {
    const t = this.templates.find(x => x.id == this.selectedTemplateId);
    if (t) {
      this.selectedTemplate = t;
      this.syncForm();
    }
  }

  syncForm() {
    if (!this.selectedTemplate) return;
    this.templateForm = {
      templateName: this.selectedTemplate.templateName || '',
      companyLogo: this.selectedTemplate.companyLogo || '',
      headerText: this.selectedTemplate.headerText || '',
      footerText: this.selectedTemplate.footerText || '',
      signatureText: this.selectedTemplate.signatureText || '',
      qrEnabled: !!this.selectedTemplate.qrEnabled,
      isDefault: !!this.selectedTemplate.isDefault
    };
  }

  reprint(id: number) {
    this.successMessage = '';
    this.errorMessage = '';
    this.financeService.reprintReceipt(id).subscribe({
      next: (res) => {
        this.successMessage = `Receipt #${res.receiptNumber} was reprinted. Issue timestamp refreshed!`;
        this.loadReceipts();
      },
      error: (err) => {
        console.error('Error reprinting receipt', err);
        this.errorMessage = err.error?.message || 'Reprint failed.';
      }
    });
  }

  onSubmitTemplate(event: Event) {
    event.preventDefault();
    if (!this.selectedTemplate) return;

    this.financeService.updateReceiptTemplate(this.selectedTemplate.id, this.templateForm).subscribe({
      next: (res) => {
        this.successMessage = `Print template Layout "${res.templateName}" updated successfully!`;
        this.loadTemplates();
      },
      error: (err) => {
        console.error('Error updating template', err);
        this.errorMessage = err.error?.message || 'Failed to update template.';
      }
    });
  }
}
