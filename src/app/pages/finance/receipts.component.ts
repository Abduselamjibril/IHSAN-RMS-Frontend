import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
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
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="viewReceipt(r)"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">visibility</span>
                    View
                  </button>
                  <button 
                    class="btn btn-indigo btn-xs flex align-center gap-1"
                    (click)="downloadReceiptPdf(r, false)"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">file_download</span>
                    Download PDF
                  </button>
                  <button 
                    class="btn btn-indigo btn-xs flex align-center gap-1"
                    (click)="downloadReceiptPdf(r, true)"
                    style="padding: 4px 8px; font-size: 11px; background-color: var(--color-qualified); border-color: var(--color-qualified); color: white;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">print</span>
                    Print
                  </button>
                  <button 
                    class="btn btn-secondary btn-xs flex align-center gap-1"
                    (click)="reprint(r.id)"
                    style="padding: 4px 8px; font-size: 11px;"
                  >
                    <span class="material-icons-outlined" style="font-size: 14px;">refresh</span>
                    Reprint
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
    <div *ngIf="activeTab === 'templates'" class="templates-tab-container">
      
      <!-- Sub Tab Buttons -->
      <div class="flex gap-4" style="margin-bottom: 20px; background: rgba(30, 41, 59, 0.05); padding: 6px; border-radius: var(--radius-md); max-width: max-content;">
        <button 
          (click)="switchSubTab('branding')"
          [style.background]="templatesSubTab === 'branding' ? 'var(--bg-card)' : 'transparent'"
          [style.box-shadow]="templatesSubTab === 'branding' ? 'var(--shadow-sm)' : 'none'"
          [style.color]="templatesSubTab === 'branding' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
          style="padding: 8px 16px; font-weight: 600; font-size: 13px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 6px; transition: var(--transition-fast);"
        >
          <span class="material-icons-outlined" style="font-size: 18px;">branding_watermark</span>
          Branding & Identity
        </button>
        <button 
          (click)="switchSubTab('designer')"
          [style.background]="templatesSubTab === 'designer' ? 'var(--bg-card)' : 'transparent'"
          [style.box-shadow]="templatesSubTab === 'designer' ? 'var(--shadow-sm)' : 'none'"
          [style.color]="templatesSubTab === 'designer' ? 'var(--brand-primary)' : 'var(--text-secondary)'"
          style="padding: 8px 16px; font-weight: 600; font-size: 13px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 6px; transition: var(--transition-fast);"
        >
          <span class="material-icons-outlined" style="font-size: 18px;">dashboard</span>
          Visual Canvas Designer
        </button>
      </div>

      <div class="grid" style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px; align-items: start;">
        
        <!-- Left Column: Settings Form / Block Editor -->
        <div>
          
          <!-- Sub-Tab 1: Branding & Corporate Identity Form -->
          <div *ngIf="templatesSubTab === 'branding'" class="card glass-card flex flex-col gap-6" style="padding: 24px;">
            <div>
              <h3 style="margin-bottom: 6px;">Corporate Identity Settings</h3>
              <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 16px;">Configure organization detail tags, primary theme colors, font families, and media uploads.</p>
            </div>

            <!-- Identity Form -->
            <div class="grid gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Legal Company Name *</label>
                <input type="text" [(ngModel)]="orgSettings.companyName" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
              </div>
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">TIN Number</label>
                <input type="text" [(ngModel)]="orgSettings.tinNumber" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
              </div>
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">VAT Registration Number</label>
                <input type="text" [(ngModel)]="orgSettings.vatNumber" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
              </div>

              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Primary Font Family</label>
                <select [(ngModel)]="orgSettings.fontFamily" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main); height: 42px;">
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times-Roman">Times New Roman</option>
                  <option value="Courier">Courier</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Inter">Inter</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </select>
              </div>
            </div>

            <!-- Colors -->
            <div class="grid gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Primary Theme Accent Color</label>
                <div class="flex gap-2 align-center">
                  <input type="color" [(ngModel)]="orgSettings.primaryColor" (ngModelChange)="updatePreview()" style="border: none; width: 42px; height: 42px; padding: 0; border-radius: 4px; background: transparent; cursor: pointer;" />
                  <input type="text" [(ngModel)]="orgSettings.primaryColor" (ngModelChange)="updatePreview()" style="flex: 1; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
                </div>
              </div>
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Secondary Accent Color</label>
                <div class="flex gap-2 align-center">
                  <input type="color" [(ngModel)]="orgSettings.secondaryColor" (ngModelChange)="updatePreview()" style="border: none; width: 42px; height: 42px; padding: 0; border-radius: 4px; background: transparent; cursor: pointer;" />
                  <input type="text" [(ngModel)]="orgSettings.secondaryColor" (ngModelChange)="updatePreview()" style="flex: 1; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
                </div>
              </div>
            </div>

            <!-- Contact & Signatory Details -->
            <div class="grid gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Company Phone</label>
                <input type="text" [(ngModel)]="orgSettings.companyPhone" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
              </div>
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Company Email</label>
                <input type="email" [(ngModel)]="orgSettings.companyEmail" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
              </div>
              <div class="form-group flex flex-col" style="grid-column: span 2;">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Company Address</label>
                <textarea rows="2" [(ngModel)]="orgSettings.companyAddress" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main); resize: vertical;"></textarea>
              </div>
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Authorized Signatory Name</label>
                <input type="text" [(ngModel)]="orgSettings.authorizedSignatoryName" (ngModelChange)="updatePreview()" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
              </div>
              <div class="form-group flex flex-col">
                <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Authorized Signatory Title</label>
                <input type="text" [(ngModel)]="orgSettings.authorizedSignatoryTitle" (ngModelChange)="updatePreview()" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
              </div>
            </div>

            <!-- Media Uploads Section -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
              <h4 style="margin-bottom: 12px; font-size: 14px;">Media Branding Assets</h4>
              <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                
                <!-- Logo -->
                <div class="flex flex-col gap-2">
                  <span style="font-weight: 600; font-size: 12px;">Organization Logo (Circular/Square)</span>
                  <div *ngIf="orgSettings.logoPath" style="position: relative; border: 1px solid var(--border-color); padding: 8px; border-radius: var(--radius-sm); text-align: center; background: rgba(0, 0, 0, 0.05); min-height: 98px; display: flex; align-items: center; justify-content: center;">
                    <img [src]="orgSettings.logoPath" style="max-height: 80px; max-width: 100%; border-radius: 4px; object-fit: contain;" />
                    <button type="button" (click)="removeMediaAsset('logo')" style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.15); color: var(--color-lost); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                      <span class="material-icons-outlined" style="font-size: 16px;">close</span>
                    </button>
                  </div>
                  <div *ngIf="!orgSettings.logoPath" style="border: 2px dashed var(--border-color); border-radius: var(--radius-sm); padding: 16px; text-align: center; cursor: pointer; position: relative; min-height: 98px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span class="material-icons-outlined" style="font-size: 28px; color: var(--text-muted); margin-bottom: 4px;">image</span>
                    <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">Click to upload Logo</p>
                    <input type="file" accept="image/*" (change)="onFileSelected($event, 'logo')" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" />
                  </div>
                </div>

                <!-- Circular Seal Stamp -->
                <div class="flex flex-col gap-2">
                  <span style="font-weight: 600; font-size: 12px;">Official Company Seal Stamp</span>
                  <div *ngIf="orgSettings.companySealPath" style="position: relative; border: 1px solid var(--border-color); padding: 8px; border-radius: var(--radius-sm); text-align: center; background: rgba(0, 0, 0, 0.05); min-height: 98px; display: flex; align-items: center; justify-content: center;">
                    <img [src]="orgSettings.companySealPath" style="max-height: 80px; max-width: 100%; border-radius: 4px; object-fit: contain;" />
                    <button type="button" (click)="removeMediaAsset('seal')" style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.15); color: var(--color-lost); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                      <span class="material-icons-outlined" style="font-size: 16px;">close</span>
                    </button>
                  </div>
                  <div *ngIf="!orgSettings.companySealPath" style="border: 2px dashed var(--border-color); border-radius: var(--radius-sm); padding: 16px; text-align: center; cursor: pointer; position: relative; min-height: 98px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span class="material-icons-outlined" style="font-size: 28px; color: var(--text-muted); margin-bottom: 4px;">stars</span>
                    <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">Click to upload Seal</p>
                    <input type="file" accept="image/*" (change)="onFileSelected($event, 'seal')" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" />
                  </div>
                </div>

              </div>
            </div>

            <!-- HTML5 Signature Pad -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div>
                <h4 style="margin-bottom: 4px; font-size: 14px;">Authorized Signature Pad</h4>
                <p style="color: var(--text-secondary); font-size: 11px; margin: 0;">Draw your signature directly below. This transparent PNG will compile on receipts.</p>
              </div>

              <div class="flex gap-4" style="align-items: flex-start; flex-wrap: wrap;">
                <!-- Canvas Drawing -->
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: white; width: max-content; overflow: hidden; box-shadow: var(--shadow-sm);">
                  <canvas 
                    #sigCanvas 
                    width="400" 
                    height="150" 
                    style="display: block; cursor: crosshair; background: #fff;"
                    (mousedown)="startDrawing($event)"
                    (mousemove)="draw($event)"
                    (mouseup)="stopDrawing()"
                    (mouseleave)="stopDrawing()"
                    (touchstart)="startDrawing($event)"
                    (touchmove)="draw($event)"
                    (touchend)="stopDrawing()"
                  ></canvas>
                  <div class="flex justify-between" style="padding: 8px 12px; background: #f8fafc; border-top: 1px solid var(--border-color);">
                    <button type="button" (click)="clearSignature()" class="btn btn-secondary btn-xs flex align-center gap-1" style="padding: 4px 8px; font-size: 11px;">
                      <span class="material-icons-outlined" style="font-size: 14px;">clear</span> Clear
                    </button>
                    <button type="button" (click)="saveSignature()" class="btn btn-indigo btn-xs flex align-center gap-1" style="padding: 4px 8px; font-size: 11px;">
                      <span class="material-icons-outlined" style="font-size: 14px;">check</span> Save Signature
                    </button>
                  </div>
                </div>

                <!-- Preview Saved -->
                <div class="flex flex-col gap-2" style="min-width: 200px;">
                  <span style="font-weight: 600; font-size: 12px; color: var(--text-secondary);">Current Saved Signature</span>
                  <div *ngIf="savedSignatureUrl" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; background: white; text-align: center; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; min-height: 100px;">
                    <img [src]="savedSignatureUrl" style="max-height: 80px; max-width: 100%; object-fit: contain;" />
                  </div>
                  <div *ngIf="!savedSignatureUrl" style="border: 1px dashed var(--border-color); border-radius: var(--radius-sm); padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; min-height: 100px; display: flex; align-items: center; justify-content: center;">
                    No signature saved yet.
                  </div>
                </div>
              </div>
            </div>

            <!-- Save settings action -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 8px;">
              <button type="button" (click)="onSaveSettings()" class="btn btn-primary" style="width: 100%; display: flex; justify-content: center; gap: 8px;">
                <span class="material-icons-outlined">save</span>
                Save Corporate Branding Configurations
              </button>
            </div>
          </div>

          <!-- Sub-Tab 2: Visual Canvas Designer Block Editor -->
          <div *ngIf="templatesSubTab === 'designer'" class="card glass-card flex flex-col gap-4" style="padding: 24px;">
            <div>
              <h3 style="margin-bottom: 6px;">Visual Template Builder</h3>
              <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 12px;">Select layouts, add blocks, and drag blocks vertically to reorder receipt template segments.</p>
            </div>

            <!-- Template selection -->
            <div class="form-group flex flex-col">
              <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Active Layout Template</label>
              <select [(ngModel)]="selectedTemplateId" (change)="onTemplateChange()" style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main); height: 42px;">
                <option *ngFor="let t of templates" [value]="t.id">
                  {{ t.templateName }} {{ t.isDefault ? '(Default)' : '' }}
                </option>
              </select>
            </div>

            <div *ngIf="selectedTemplate" class="flex flex-col gap-4">
              <!-- Template name -->
              <div class="form-row flex gap-4">
                <div class="form-group flex flex-col flex-1">
                  <label style="font-weight: 600; font-size: 12px; margin-bottom: 6px;">Template Layout Name *</label>
                  <input type="text" [(ngModel)]="templateForm.templateName" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
                </div>
                <div class="form-group flex align-center gap-2" style="margin-top: 24px;">
                  <input type="checkbox" id="designerIsDefault" [(ngModel)]="templateForm.isDefault" />
                  <label for="designerIsDefault" style="font-size: 12px; font-weight: 600;">Set Default</label>
                </div>
              </div>

              <!-- Block Adder Toolbar -->
              <div style="background: rgba(30, 41, 59, 0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
                <span style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--text-secondary); display: block; margin-bottom: 8px;">+ Click to Append Block Cards</span>
                <div class="flex gap-2 flex-wrap">
                  <button type="button" (click)="addBlock('header_image')" class="btn btn-secondary btn-xs flex align-center gap-1" style="padding: 6px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border-color);">
                    <span class="material-icons-outlined" style="font-size: 14px; color: var(--brand-primary);">image</span> Banner
                  </button>
                  <button type="button" (click)="addBlock('title')" class="btn btn-secondary btn-xs flex align-center gap-1" style="padding: 6px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border-color);">
                    <span class="material-icons-outlined" style="font-size: 14px; color: var(--brand-primary);">title</span> Title
                  </button>
                  <button type="button" (click)="addBlock('paragraph')" class="btn btn-secondary btn-xs flex align-center gap-1" style="padding: 6px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border-color);">
                    <span class="material-icons-outlined" style="font-size: 14px; color: var(--brand-primary);">notes</span> Paragraph
                  </button>
                  <button type="button" (click)="addBlock('table')" class="btn btn-secondary btn-xs flex align-center gap-1" style="padding: 6px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border-color);">
                    <span class="material-icons-outlined" style="font-size: 14px; color: var(--brand-primary);">table_chart</span> Table
                  </button>
                  <button type="button" (click)="addBlock('signatures')" class="btn btn-secondary btn-xs flex align-center gap-1" style="padding: 6px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border-color);">
                    <span class="material-icons-outlined" style="font-size: 14px; color: var(--brand-primary);">history_edu</span> Signature
                  </button>
                  <button type="button" (click)="addBlock('footer_image')" class="btn btn-secondary btn-xs flex align-center gap-1" style="padding: 6px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border-color);">
                    <span class="material-icons-outlined" style="font-size: 14px; color: var(--brand-primary);">subtitles</span> Footer
                  </button>
                </div>
              </div>

              <!-- Reorderable block card list -->
              <div class="flex flex-col gap-3" style="max-height: 480px; overflow-y: auto; padding-right: 4px;">
                <div 
                  *ngFor="let block of templateStructure; let i = index" 
                  class="block-card"
                  draggable="true"
                  (dragstart)="onDragStart($event, i)"
                  (dragover)="onDragOver($event, i)"
                  (drop)="onDrop($event, i)"
                  style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card); display: flex; flex-direction: column; cursor: grab; transition: var(--transition-fast); box-shadow: var(--shadow-sm);"
                >
                  <!-- Card Top Header (Drag Handle) -->
                  <div class="flex justify-between align-center" style="padding: 10px 14px; border-bottom: 1px solid var(--border-color); background: rgba(30, 41, 59, 0.02);">
                    <div class="flex align-center gap-2">
                      <span class="material-icons-outlined" style="font-size: 18px; color: var(--text-muted); cursor: grab;">drag_indicator</span>
                      <span class="badge" [class.badge-indigo]="block.type==='header_image'||block.type==='footer_image'" [class.badge-success]="block.type==='table'||block.type==='signatures'" style="text-transform: uppercase; font-size: 10px; font-weight: 700; padding: 2px 6px;">
                        {{ block.type }}
                      </span>
                      <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Block #{{ i + 1 }}</span>
                    </div>
                    
                    <div class="flex gap-2 align-center">
                      <button type="button" (click)="toggleBlockExpand(i)" style="color: var(--text-secondary); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                        <span class="material-icons-outlined" style="font-size: 18px;">{{ expandedBlockIndex === i ? 'expand_less' : 'expand_more' }}</span>
                      </button>
                      <button type="button" (click)="deleteBlock(i)" style="color: var(--color-lost); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                        <span class="material-icons-outlined" style="font-size: 18px;">delete_outline</span>
                      </button>
                    </div>
                  </div>

                  <!-- Expanded Inspector panel inside card -->
                  <div *ngIf="expandedBlockIndex === i" style="padding: 14px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px; background: rgba(255, 255, 255, 0.4);">
                    
                    <!-- Config: header_image / footer_image -->
                    <div *ngIf="block.type === 'header_image' || block.type === 'footer_image'" class="flex flex-col gap-3">
                      <div class="flex gap-4">
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Height Limit (px)</label>
                          <input type="range" min="30" max="250" [(ngModel)]="block.maxHeight" (ngModelChange)="updatePreview()" style="width: 100%;" />
                          <span style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">Value: {{ block.maxHeight }}px</span>
                        </div>
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Object Fit Aspect Mode</label>
                          <select [(ngModel)]="block.objectFit" (ngModelChange)="updatePreview()" style="padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; height: 34px;">
                            <option value="contain">Contain (No crop)</option>
                            <option value="cover">Cover (Aspect fill/crop)</option>
                            <option value="fill">Fill (Stretch)</option>
                          </select>
                        </div>
                      </div>
                      <div *ngIf="block.type === 'footer_image'" class="form-group flex flex-col">
                        <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Footer Text Disclaimer Fallback</label>
                        <textarea rows="2" [(ngModel)]="block.text" (ngModelChange)="updatePreview()" style="padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; font-size: 12px; color: var(--text-main);"></textarea>
                      </div>
                    </div>

                    <!-- Config: Title -->
                    <div *ngIf="block.type === 'title'" class="flex flex-col gap-3">
                      <div class="form-group flex flex-col">
                        <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Title Banner Heading</label>
                        <input type="text" [(ngModel)]="block.text" (ngModelChange)="updatePreview()" style="padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; font-size: 12px; color: var(--text-main);" />
                      </div>
                      <div class="flex gap-4">
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Text Alignment</label>
                          <select [(ngModel)]="block.align" (ngModelChange)="updatePreview()" style="padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; height: 34px;">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Font Size (px)</label>
                          <input type="number" [(ngModel)]="block.fontSize" (ngModelChange)="updatePreview()" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
                        </div>
                      </div>
                    </div>

                    <!-- Config: Paragraph -->
                    <div *ngIf="block.type === 'paragraph'" class="flex flex-col gap-3">
                      <div class="form-group flex flex-col">
                        <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Paragraph Content Text</label>
                        <textarea rows="4" [(ngModel)]="block.text" (ngModelChange)="updatePreview()" style="padding: 8px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; font-size: 12px; font-family: monospace; color: var(--text-main);"></textarea>
                        <div style="font-size: 10px; color: var(--text-secondary); margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
                          <strong>Placeholders:</strong> 
                          <span style="background: rgba(0,0,0,0.05); padding: 1px 3px; border-radius: 2px;">{{ '{' }}{{ '{' }}customer_name{{ '}' }}{{ '}' }}</span>
                          <span style="background: rgba(0,0,0,0.05); padding: 1px 3px; border-radius: 2px;">{{ '{' }}{{ '{' }}payment_amount{{ '}' }}{{ '}' }}</span>
                          <span style="background: rgba(0,0,0,0.05); padding: 1px 3px; border-radius: 2px;">{{ '{' }}{{ '{' }}contract_no{{ '}' }}{{ '}' }}</span>
                          <span style="background: rgba(0,0,0,0.05); padding: 1px 3px; border-radius: 2px;">{{ '{' }}{{ '{' }}receipt_no{{ '}' }}{{ '}' }}</span>
                        </div>
                      </div>
                      <div class="flex gap-4">
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Text Alignment</label>
                          <select [(ngModel)]="block.align" (ngModelChange)="updatePreview()" style="padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; height: 34px;">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                            <option value="justify">Justify</option>
                          </select>
                        </div>
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Font Size (px)</label>
                          <input type="number" [(ngModel)]="block.fontSize" (ngModelChange)="updatePreview()" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
                        </div>
                      </div>
                    </div>

                    <!-- Config: Table -->
                    <div *ngIf="block.type === 'table'" class="flex flex-col gap-3">
                      <div class="form-group flex flex-col">
                        <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Table Layout Style</label>
                        <select [(ngModel)]="block.style" (ngModelChange)="updatePreview()" style="padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; height: 34px;">
                          <option value="bordered">Bordered Card Box</option>
                          <option value="minimal">Minimal Accent Line</option>
                        </select>
                      </div>
                      
                      <!-- Rows editor -->
                      <div class="flex flex-col gap-2">
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Table Row Content Entries</span>
                        <div *ngFor="let row of block.rows; let rIdx = index" class="flex gap-2 align-center">
                          <input type="text" [(ngModel)]="row.label" (ngModelChange)="updatePreview()" placeholder="Label" style="flex: 1; padding: 6px 8px; font-size: 11px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
                          <input type="text" [(ngModel)]="row.value" (ngModelChange)="updatePreview()" placeholder="Value Binding" style="flex: 1.2; padding: 6px 8px; font-size: 11px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; color: var(--text-main);" />
                          <button type="button" (click)="block.rows.splice(rIdx, 1); updatePreview()" style="color: var(--color-lost); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
                            <span class="material-icons-outlined" style="font-size: 16px;">remove_circle_outline</span>
                          </button>
                        </div>
                        <button type="button" (click)="block.rows.push({label:'', value:''}); updatePreview()" class="btn btn-secondary btn-xs flex align-center gap-1" style="max-width: max-content; padding: 4px 8px; font-size: 10px; margin-top: 4px;">
                          <span class="material-icons-outlined" style="font-size: 12px;">add</span> Add Table Row
                        </button>
                      </div>
                    </div>

                    <!-- Config: Signatures -->
                    <div *ngIf="block.type === 'signatures'" class="flex flex-col gap-3">
                      <div class="flex gap-4">
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Signatory Columns</label>
                          <select [(ngModel)]="block.layout" (ngModelChange)="updatePreview()" style="padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; height: 34px;">
                            <option value="single_seal">Single centered Seal stamp</option>
                            <option value="double_sign_seal">Double columns: Seal left, Signature right</option>
                          </select>
                        </div>
                        <div class="form-group flex flex-col flex-1">
                          <label style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Circular Stamp Seal Size (px)</label>
                          <input type="range" min="30" max="150" [(ngModel)]="block.sealSize" (ngModelChange)="updatePreview()" style="width: 100%;" />
                          <span style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">Value: {{ block.sealSize }}px</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- Action buttons to Save / Reset layout -->
              <div class="flex gap-3" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                <button type="button" (click)="syncForm()" class="btn btn-secondary flex-1 flex justify-center gap-2">
                  <span class="material-icons-outlined">undo</span>
                  Discard Changes
                </button>
                <button type="button" (click)="onSubmitTemplate($event)" class="btn btn-primary flex-1 flex justify-center gap-2">
                  <span class="material-icons-outlined">save</span>
                  Save Visual Layout Design
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: Real-time Live Scaling A4 Sandbox Preview -->
        <div class="flex flex-col gap-4">
          <div class="flex justify-between align-center">
            <h4 style="margin: 0; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
              <span class="material-icons-outlined" style="color: var(--brand-primary);">print_preview</span>
              Live A4 Sandbox Sheet Preview
            </h4>
            <span class="badge badge-indigo" style="font-size: 10px; font-weight: 700; padding: 2px 8px; color: var(--brand-primary); background-color: var(--brand-primary-fade);">
              Zoom: {{ (scaleFactor * 100) | number:'1.0-0' }}%
            </span>
          </div>

          <!-- Preview Wrapper scaling sandbox -->
          <div class="preview-outer-wrapper" #previewWrapper style="overflow: hidden; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #0f172a; padding: 24px 12px; display: flex; justify-content: center; align-items: flex-start; min-height: 900px; box-sizing: border-box;">
            
            <div class="a4-preview-sheet" 
                 [style.transform]="'scale(' + scaleFactor + ')'"
                 [style.transform-origin]="'top center'"
                 [style.font-family]="orgSettings.fontFamily || 'Helvetica'"
                 [style.padding]="'0'"
                 [style.--sheet-padding]="templateTheme.padding + 'px'"
                 style="background: white; color: #1e293b; width: 595px; min-height: 842px; transition: transform 0.2s ease; box-shadow: 0 10px 25px rgba(0,0,0,0.3); flex-shrink: 0; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; border-radius: 4px; position: relative; overflow: hidden;"
            >
              <!-- Dynamic Block Render list -->
              <div class="flex flex-col" style="gap: 20px; flex: 1;">
                <div *ngFor="let block of templateStructure; let i = index; let isFirst = first; let isLast = last" 
                     [style.padding-left]="((block.type === 'header_image' && orgSettings.headerImagePath) || (block.type === 'footer_image' && orgSettings.footerImagePath)) && (block.objectFit === 'fill' || block.objectFit === 'cover') ? '0' : 'var(--sheet-padding)'"
                     [style.padding-right]="((block.type === 'header_image' && orgSettings.headerImagePath) || (block.type === 'footer_image' && orgSettings.footerImagePath)) && (block.objectFit === 'fill' || block.objectFit === 'cover') ? '0' : 'var(--sheet-padding)'"
                     [style.padding-top]="isFirst ? (((block.type === 'header_image' && orgSettings.headerImagePath || block.type === 'footer_image' && orgSettings.footerImagePath) && (block.objectFit === 'fill' || block.objectFit === 'cover')) ? '0' : 'var(--sheet-padding)') : '0'"
                     [style.padding-bottom]="isLast ? (((block.type === 'header_image' && orgSettings.headerImagePath || block.type === 'footer_image' && orgSettings.footerImagePath) && (block.objectFit === 'fill' || block.objectFit === 'cover')) ? '0' : 'var(--sheet-padding)') : '0'"
                     [style.margin-top]="isLast ? 'auto' : '0'"
                     style="position: relative; width: 100%; box-sizing: border-box;">
                  
                  <!-- Block: header_image -->
                  <div *ngIf="block.type === 'header_image'" [style.min-height]="block.maxHeight + 'px'" style="width: 100%; display: flex; justify-content: center; align-items: center;">
                    <!-- Image render if path configured -->
                    <img *ngIf="orgSettings.headerImagePath" [src]="orgSettings.headerImagePath" [style.max-height]="block.maxHeight + 'px'" [style.height]="block.maxHeight + 'px'" [style.object-fit]="block.objectFit" style="width: 100%; display: block;" />
                    
                    <!-- Fallback letterhead layout -->
                    <div *ngIf="!orgSettings.headerImagePath" class="flex justify-between align-center" style="width: 100%; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; box-sizing: border-box;">
                      <div class="flex align-center gap-3">
                        <img *ngIf="orgSettings.logoPath" [src]="orgSettings.logoPath" style="height: 50px; width: 50px; object-fit: contain; border-radius: 4px;" />
                        <div *ngIf="!orgSettings.logoPath" style="height: 50px; width: 50px; border-radius: 4px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #94a3b8; border: 1px solid #cbd5e1;">L</div>
                        <div style="text-align: left;">
                          <h2 style="font-size: 13px; font-weight: bold; margin: 0; color: #0f172a; text-transform: uppercase;">{{ orgSettings.companyName || 'IHSAN PROPERTIES PLC' }}</h2>
                          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">TIN: {{ orgSettings.tinNumber || '0000000000' }} | VAT: {{ orgSettings.vatNumber || '00000-0' }}</div>
                        </div>
                      </div>
                      <div style="text-align: right; font-size: 8px; color: #64748b; line-height: 1.4;">
                        <div>{{ orgSettings.companyAddress || 'Bole, Addis Ababa' }}</div>
                        <div>Tel: {{ orgSettings.companyPhone || '+251-11' }}</div>
                        <div>Email: {{ orgSettings.companyEmail || 'info@ihsan.com' }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Block: title -->
                  <div *ngIf="block.type === 'title'" [style.text-align]="block.align" [style.font-size]="block.fontSize + 'px'" [style.color]="orgSettings.primaryColor || '#4F46E5'" style="font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin: 4px 0;">
                    {{ compileTokenText(block.text, mockReceipt, orgSettings) }}
                  </div>

                  <!-- Block: paragraph -->
                  <div *ngIf="block.type === 'paragraph'" [style.text-align]="block.align" [style.font-size]="block.fontSize + 'px'" style="line-height: 1.6; color: #334155; white-space: pre-wrap; margin: 4px 0;">
                    {{ compileTokenText(block.text, mockReceipt, orgSettings) }}
                  </div>

                  <!-- Block: table -->
                  <div *ngIf="block.type === 'table'" style="margin: 4px 0; width: 100%;">
                    
                    <!-- Table Style: Bordered Card -->
                    <div *ngIf="block.style === 'bordered'" [style.border-color]="orgSettings.primaryColor || '#4F46E5'" style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                      <!-- Header row -->
                      <div [style.background]="(orgSettings.primaryColor || '#4F46E5') + '15'" [style.border-color]="orgSettings.primaryColor || '#4F46E5'" style="display: flex; font-weight: bold; border-bottom: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px;">
                        <div style="flex: 1; color: #0f172a;">Description Element</div>
                        <div style="flex: 1; text-align: right; color: #0f172a;">Value Details</div>
                      </div>
                      <!-- Rows -->
                      <div *ngFor="let row of block.rows" style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px;">
                        <div style="flex: 1; font-weight: bold; color: #475569;">{{ compileTokenText(row.label, mockReceipt, orgSettings) }}</div>
                        <div style="flex: 1; text-align: right; color: #0f172a;">{{ compileTokenText(row.value, mockReceipt, orgSettings) }}</div>
                      </div>
                    </div>

                    <!-- Table Style: Minimal -->
                    <div *ngIf="block.style === 'minimal'" style="width: 100%;">
                      <div [style.border-top]="'3px solid ' + (orgSettings.primaryColor || '#4F46E5')" style="margin-bottom: 4px;"></div>
                      <div *ngFor="let row of block.rows" style="display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 6px 4px; font-size: 11px;">
                        <span style="font-weight: bold; color: #475569;">{{ compileTokenText(row.label, mockReceipt, orgSettings) }}</span>
                        <span style="color: #0f172a;">{{ compileTokenText(row.value, mockReceipt, orgSettings) }}</span>
                      </div>
                    </div>

                  </div>

                  <!-- Block: signatures -->
                  <div *ngIf="block.type === 'signatures'" style="margin: 8px 0; width: 100%;">
                    
                    <!-- Layout: Double Column -->
                    <div *ngIf="block.layout === 'double_sign_seal'" class="flex justify-between" style="align-items: flex-end; width: 100%;">
                      <!-- Seal left -->
                      <div class="text-center" style="display: flex; flex-direction: column; align-items: center; width: 150px;">
                        <div [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="display: flex; align-items: center; justify-content: center;">
                          <img *ngIf="orgSettings.companySealPath" [src]="orgSettings.companySealPath" [style.max-height]="block.sealSize + 'px'" style="max-width: 100%; object-fit: contain;" />
                          <div *ngIf="!orgSettings.companySealPath" [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>
                        </div>
                        <div style="font-size: 9px; margin-top: 4px; color: #64748b; font-weight: bold;">Corporate Seal Stamp</div>
                      </div>
                      
                      <!-- Signature right -->
                      <div class="text-center" style="display: flex; flex-direction: column; align-items: center; width: 180px;">
                        <div style="height: 60px; display: flex; align-items: center; justify-content: center; width: 100%; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;">
                          <img *ngIf="savedSignatureUrl" [src]="savedSignatureUrl" style="max-height: 50px; max-width: 100%; object-fit: contain;" />
                          <div *ngIf="!savedSignatureUrl" style="font-family: 'Courier New', Courier, monospace; font-style: italic; font-size: 14px; font-weight: bold; color: #1e3a8a;">
                            {{ orgSettings.authorizedSignatoryName || 'Abebe Manager' }}
                          </div>
                        </div>
                        <div style="font-size: 8px; color: #475569; font-weight: bold;">
                          {{ orgSettings.authorizedSignatoryTitle || 'General Manager' }}
                        </div>
                      </div>
                    </div>

                    <!-- Layout: Single Seal -->
                    <div *ngIf="block.layout === 'single_seal'" class="flex flex-col align-center text-center" style="width: 100%; margin: 0 auto;">
                      <div [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto;">
                        <img *ngIf="orgSettings.companySealPath" [src]="orgSettings.companySealPath" [style.max-height]="block.sealSize + 'px'" style="max-width: 100%; object-fit: contain;" />
                        <div *ngIf="!orgSettings.companySealPath" [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>
                      </div>
                      <div style="font-size: 9px; color: #64748b; font-weight: bold;">
                        {{ orgSettings.authorizedSignatoryTitle || 'Authorized CFO Signatory' }}
                      </div>
                    </div>

                  </div>

                  <!-- Block: footer_image -->
                  <div *ngIf="block.type === 'footer_image'" style="width: 100%;" [style.margin-top]="block.objectFit === 'fill' ? '0' : '4px'">
                    <img *ngIf="orgSettings.footerImagePath" [src]="orgSettings.footerImagePath" [style.max-height]="block.maxHeight + 'px'" [style.height]="block.maxHeight + 'px'" [style.object-fit]="block.objectFit" style="width: 100%; display: block;" />
                    
                    <div *ngIf="!orgSettings.footerImagePath && block.text" style="font-size: 10px; color: #64748b; text-align: center; line-height: 1.5; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                      {{ compileTokenText(block.text, mockReceipt, orgSettings) }}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- View Receipt A4 Modal Overlay -->
    <div class="modal-backdrop" *ngIf="selectedViewReceipt" (click)="selectedViewReceipt = null" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 40px 0;">
      <div class="modal-container glass-card" (click)="$event.stopPropagation()" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); max-width: 850px; width: 90%; display: flex; flex-direction: column; max-height: 90vh; box-shadow: var(--shadow-lg);">
        <!-- Modal Top Bar -->
        <div class="modal-header flex justify-between align-center" style="padding: 16px 24px; border-bottom: 1px solid var(--border-color);">
          <h3 style="margin: 0; font-size: 16px;" class="text-main">Receipt Viewer</h3>
          <div class="flex gap-2">
            <button class="btn btn-indigo btn-sm flex align-center gap-1" (click)="downloadReceiptPdf(selectedViewReceipt, false)" style="background-color: var(--brand-primary-fade); border-color: var(--brand-primary-fade); color: var(--brand-primary);">
              <span class="material-icons-outlined" style="font-size: 16px;">file_download</span>
              Download PDF
            </button>
            <button class="btn btn-primary btn-sm flex align-center gap-1" (click)="downloadReceiptPdf(selectedViewReceipt, true)">
              <span class="material-icons-outlined" style="font-size: 16px;">print</span>
              Print
            </button>
            <button class="btn btn-secondary btn-sm flex align-center" (click)="selectedViewReceipt = null">
              <span class="material-icons-outlined" style="font-size: 16px;">close</span>
            </button>
          </div>
        </div>
        
        <!-- Modal Body (A4 Preview) -->
        <div class="modal-body" style="padding: 24px; overflow-y: auto; display: flex; justify-content: center; background: #0f172a;">
          <!-- Mimic A4 page container -->
          <div id="a4-preview-sheet" 
               [style.font-family]="orgSettings.fontFamily || 'Helvetica'"
               [style.padding]="'0'"
               [style.--sheet-padding]="templateTheme.padding + 'px'"
               style="background: white; color: #1e293b; width: 100%; max-width: 600px; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); line-height: 1.6; display: flex; flex-direction: column; justify-content: space-between; min-height: 750px; box-sizing: border-box; overflow: hidden;">
            
            <div class="flex flex-col" style="gap: 20px; flex: 1; width: 100%;">
              <div *ngFor="let block of templateStructure; let i = index; let isFirst = first; let isLast = last"
                   [style.padding-left]="((block.type === 'header_image' && orgSettings.headerImagePath) || (block.type === 'footer_image' && orgSettings.footerImagePath)) && (block.objectFit === 'fill' || block.objectFit === 'cover') ? '0' : 'var(--sheet-padding)'"
                   [style.padding-right]="((block.type === 'header_image' && orgSettings.headerImagePath) || (block.type === 'footer_image' && orgSettings.footerImagePath)) && (block.objectFit === 'fill' || block.objectFit === 'cover') ? '0' : 'var(--sheet-padding)'"
                   [style.padding-top]="isFirst ? (((block.type === 'header_image' && orgSettings.headerImagePath || block.type === 'footer_image' && orgSettings.footerImagePath) && (block.objectFit === 'fill' || block.objectFit === 'cover')) ? '0' : 'var(--sheet-padding)') : '0'"
                   [style.padding-bottom]="isLast ? (((block.type === 'header_image' && orgSettings.headerImagePath || block.type === 'footer_image' && orgSettings.footerImagePath) && (block.objectFit === 'fill' || block.objectFit === 'cover')) ? '0' : 'var(--sheet-padding)') : '0'"
                   [style.margin-top]="isLast ? 'auto' : '0'"
                   style="position: relative; width: 100%; box-sizing: border-box;">
                
                <!-- Block: header_image -->
                <div *ngIf="block.type === 'header_image'" [style.min-height]="block.maxHeight + 'px'" style="width: 100%; display: flex; justify-content: center; align-items: center;">
                  <img *ngIf="orgSettings.headerImagePath" [src]="orgSettings.headerImagePath" [style.max-height]="block.maxHeight + 'px'" [style.height]="block.maxHeight + 'px'" [style.object-fit]="block.objectFit" style="width: 100%; display: block;" />
                  
                  <div *ngIf="!orgSettings.headerImagePath" class="flex justify-between align-center" style="width: 100%; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; box-sizing: border-box;">
                    <div class="flex align-center gap-3">
                      <img *ngIf="orgSettings.logoPath" [src]="orgSettings.logoPath" style="height: 50px; width: 50px; object-fit: contain; border-radius: 4px;" />
                      <div *ngIf="!orgSettings.logoPath" style="height: 50px; width: 50px; border-radius: 4px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #94a3b8; border: 1px solid #cbd5e1;">L</div>
                      <div style="text-align: left;">
                        <h2 style="font-size: 14px; font-weight: bold; margin: 0; color: #0f172a; text-transform: uppercase;">{{ orgSettings.companyName || 'IHSAN PROPERTIES PLC' }}</h2>
                        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">TIN: {{ orgSettings.tinNumber || '0000000000' }} | VAT: {{ orgSettings.vatNumber || '00000-0' }}</div>
                      </div>
                    </div>
                    <div style="text-align: right; font-size: 8px; color: #64748b; line-height: 1.4;">
                      <div>{{ orgSettings.companyAddress || 'Bole, Addis Ababa' }}</div>
                      <div>Tel: {{ orgSettings.companyPhone || '+251-11' }}</div>
                      <div>Email: {{ orgSettings.companyEmail || 'info@ihsan.com' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Block: title -->
                <div *ngIf="block.type === 'title'" [style.text-align]="block.align" [style.font-size]="block.fontSize + 'px'" [style.color]="orgSettings.primaryColor || '#4F46E5'" style="font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin: 4px 0;">
                  {{ compileTokenText(block.text, selectedViewReceipt, orgSettings) }}
                </div>

                <!-- Block: paragraph -->
                <div *ngIf="block.type === 'paragraph'" [style.text-align]="block.align" [style.font-size]="block.fontSize + 'px'" style="line-height: 1.6; color: #334155; white-space: pre-wrap; margin: 4px 0;">
                  {{ compileTokenText(block.text, selectedViewReceipt, orgSettings) }}
                </div>

                <!-- Block: table -->
                <div *ngIf="block.type === 'table'" style="margin: 4px 0; width: 100%;">
                  <div *ngIf="block.style === 'bordered'" [style.border-color]="orgSettings.primaryColor || '#4F46E5'" style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div [style.background]="(orgSettings.primaryColor || '#4F46E5') + '15'" [style.border-color]="orgSettings.primaryColor || '#4F46E5'" style="display: flex; font-weight: bold; border-bottom: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px;">
                      <div style="flex: 1; color: #0f172a;">Description Element</div>
                      <div style="flex: 1; text-align: right; color: #0f172a;">Value Details</div>
                    </div>
                    <div *ngFor="let row of block.rows" style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px;" class="last:border-b-0">
                      <div style="flex: 1; font-weight: bold; color: #475569;">{{ compileTokenText(row.label, selectedViewReceipt, orgSettings) }}</div>
                      <div style="flex: 1; text-align: right; color: #0f172a;">{{ compileTokenText(row.value, selectedViewReceipt, orgSettings) }}</div>
                    </div>
                  </div>

                  <div *ngIf="block.style === 'minimal'" style="width: 100%;">
                    <div [style.border-top]="'3px solid ' + (orgSettings.primaryColor || '#4F46E5')" style="margin-bottom: 4px;"></div>
                    <div *ngFor="let row of block.rows" style="display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 6px 4px; font-size: 11px;">
                      <span style="font-weight: bold; color: #475569;">{{ compileTokenText(row.label, selectedViewReceipt, orgSettings) }}</span>
                      <span style="color: #0f172a;">{{ compileTokenText(row.value, selectedViewReceipt, orgSettings) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Block: signatures -->
                <div *ngIf="block.type === 'signatures'" style="margin: 8px 0; width: 100%;">
                  <div *ngIf="block.layout === 'double_sign_seal'" class="flex justify-between" style="align-items: flex-end; width: 100%;">
                    <div class="text-center" style="display: flex; flex-direction: column; align-items: center; width: 150px;">
                      <div [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="display: flex; align-items: center; justify-content: center;">
                        <img *ngIf="orgSettings.companySealPath" [src]="orgSettings.companySealPath" [style.max-height]="block.sealSize + 'px'" style="max-width: 100%; object-fit: contain;" />
                        <div *ngIf="!orgSettings.companySealPath" [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>
                      </div>
                      <div style="font-size: 9px; margin-top: 4px; color: #64748b; font-weight: bold;">Corporate Seal Stamp</div>
                    </div>
                    
                    <div class="text-center" style="display: flex; flex-direction: column; align-items: center; width: 180px;">
                      <div style="height: 60px; display: flex; align-items: center; justify-content: center; width: 100%; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;">
                        <img *ngIf="savedSignatureUrl" [src]="savedSignatureUrl" style="max-height: 50px; max-width: 100%; object-fit: contain;" />
                        <div *ngIf="!savedSignatureUrl" style="font-family: 'Courier New', Courier, monospace; font-style: italic; font-size: 14px; font-weight: bold; color: #1e3a8a;">
                          {{ orgSettings.authorizedSignatoryName || 'Abebe Manager' }}
                        </div>
                      </div>
                      <div style="font-size: 8px; color: #475569; font-weight: bold;">
                        {{ orgSettings.authorizedSignatoryTitle || 'General Manager' }}
                      </div>
                    </div>
                  </div>

                  <div *ngIf="block.layout === 'single_seal'" class="flex flex-col align-center text-center" style="width: 100%; margin: 0 auto;">
                    <div [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto;">
                      <img *ngIf="orgSettings.companySealPath" [src]="orgSettings.companySealPath" [style.max-height]="block.sealSize + 'px'" style="max-width: 100%; object-fit: contain;" />
                      <div *ngIf="!orgSettings.companySealPath" [style.height]="block.sealSize + 'px'" [style.width]="block.sealSize + 'px'" style="border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>
                    </div>
                    <div style="font-size: 9px; color: #64748b; font-weight: bold;">
                      {{ orgSettings.authorizedSignatoryTitle || 'Authorized CFO Signatory' }}
                    </div>
                  </div>
                </div>

                <!-- Block: footer_image -->
                <div *ngIf="block.type === 'footer_image'" style="width: 100%;" [style.margin-top]="block.objectFit === 'fill' ? '0' : '4px'">
                  <img *ngIf="orgSettings.footerImagePath" [src]="orgSettings.footerImagePath" [style.max-height]="block.maxHeight + 'px'" [style.height]="block.maxHeight + 'px'" [style.object-fit]="block.objectFit" style="width: 100%; display: block;" />
                  
                  <div *ngIf="!orgSettings.footerImagePath && block.text" style="font-size: 10px; color: #64748b; text-align: center; line-height: 1.5; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                    {{ compileTokenText(block.text, selectedViewReceipt, orgSettings) }}
                  </div>
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
export class ReceiptsComponent implements OnInit, AfterViewInit {
  private financeService = inject(FinanceService);

  activeTab = 'receipts';
  templatesSubTab = 'branding'; // 'branding' | 'designer'
  receipts: any[] = [];
  templates: any[] = [];
  selectedTemplateId = 0;
  selectedTemplate: any = null;
  selectedViewReceipt: any = null;

  today = new Date();
  successMessage = '';
  errorMessage = '';

  // Org Settings State
  orgSettings = {
    companyName: 'IHSAN Properties & Business Service PLC',
    tinNumber: '',
    vatNumber: '',

    primaryColor: '#4F46E5',
    secondaryColor: '#1E293B',
    fontFamily: 'Helvetica',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    logoPath: '',
    companySealPath: '',
    headerImagePath: '',
    footerImagePath: '',
    authorizedSignatoryName: '',
    authorizedSignatoryTitle: ''
  };

  // Signature URL preview
  savedSignatureUrl = '';

  // Template Form (Legacy compatibility)
  templateForm = {
    templateName: '',
    companyLogo: '',
    headerText: '',
    footerText: '',
    signatureText: '',
    qrEnabled: true,
    isDefault: false
  };

  // Visual Template Designer Theme & Structure
  templateTheme = {
    primaryColor: '#4F46E5',
    fontFamily: 'Helvetica',
    padding: 20
  };
  templateStructure: any[] = [];
  expandedBlockIndex: number | null = null;

  // HTML5 Signature Pad Properties
  @ViewChild('sigCanvas') sigCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  isDrawing = false;
  lastX = 0;
  lastY = 0;

  // Live scaling sandbox properties
  @ViewChild('previewWrapper') previewWrapper!: ElementRef;
  scaleFactor = 1;

  // HTML5 Drag and Drop Properties
  draggedIndex: number | null = null;

  // Realistic mock receipt for sandbox preview
  mockReceipt = {
    receiptNumber: 'REC-20260622',
    receiptDate: new Date(),
    payment: {
      paymentReference: 'PAY-102919',
      paymentAmount: 150000.00,
      paymentDate: new Date(),
      customer: {
        fullName: 'Abebe Kebede'
      },
      contract: {
        contractNo: 'SC-2026/001',
        contractAmount: 1200000.00
      },
      paymentMethod: {
        paymentMethodName: 'Bank Transfer'
      }
    }
  };

  ngOnInit() {
    this.loadReceipts();
    this.loadTemplates();
    this.loadSettings();
    this.loadSignature();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateScale();
    }, 200);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateScale();
  }

  switchSubTab(subTab: string) {
    this.templatesSubTab = subTab;
    if (subTab === 'branding') {
      setTimeout(() => {
        this.initSignaturePad();
      }, 150);
    }
  }

  // --- API Load Methods ---
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

  loadSettings() {
    this.financeService.getSettings().subscribe({
      next: (res) => {
        if (res) {
          this.orgSettings = {
            companyName: res.companyName || 'IHSAN Properties & Business Service PLC',
            tinNumber: res.tinNumber || '',
            vatNumber: res.vatNumber || '',

            primaryColor: res.primaryColor || '#4F46E5',
            secondaryColor: res.secondaryColor || '#1E293B',
            fontFamily: res.fontFamily || 'Helvetica',
            companyAddress: res.companyAddress || '',
            companyPhone: res.companyPhone || '',
            companyEmail: res.companyEmail || '',
            logoPath: res.logoPath || '',
            companySealPath: res.companySealPath || '',
            headerImagePath: res.headerImagePath || '',
            footerImagePath: res.footerImagePath || '',
            authorizedSignatoryName: res.authorizedSignatoryName || '',
            authorizedSignatoryTitle: res.authorizedSignatoryTitle || ''
          };
          this.updatePreview();
        }
      },
      error: (err) => console.error('Error fetching settings', err)
    });
  }

  loadSignature() {
    this.financeService.getUserSignature().subscribe({
      next: (res) => {
        if (res && res.signaturePngPath) {
          this.savedSignatureUrl = 'http://localhost:3000' + res.signaturePngPath;
        } else {
          this.savedSignatureUrl = '';
        }
        this.updatePreview();
      },
      error: (err) => console.error('Error fetching signature', err)
    });
  }

  onSaveSettings() {
    this.successMessage = '';
    this.errorMessage = '';
    this.financeService.updateSettings(this.orgSettings).subscribe({
      next: (res) => {
        this.successMessage = 'Corporate Branding Configurations saved successfully!';
        this.loadSettings();
      },
      error: (err) => {
        console.error('Error saving settings', err);
        this.errorMessage = err.error?.message || 'Failed to save settings.';
      }
    });
  }

  // --- HTML5 Canvas Signature Pad ---
  initSignaturePad() {
    if (!this.sigCanvas) return;
    const canvas = this.sigCanvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#1E293B';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  startDrawing(e: MouseEvent | TouchEvent) {
    this.isDrawing = true;
    const coords = this.getCoords(e);
    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  draw(e: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const coords = this.getCoords(e);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(coords.x, coords.y);
    this.ctx.stroke();
    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    if (!this.sigCanvas) return;
    const canvas = this.sigCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  saveSignature() {
    if (!this.sigCanvas) return;
    const canvas = this.sigCanvas.nativeElement;
    
    // Check if drawing canvas is empty
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      this.errorMessage = 'Please draw a signature before saving.';
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';
    const base64 = canvas.toDataURL('image/png');
    this.financeService.saveUserSignature(base64).subscribe({
      next: (res) => {
        this.successMessage = 'Authorized signature saved successfully!';
        this.loadSignature();
        this.clearSignature();
      },
      error: (err) => {
        console.error('Error saving signature', err);
        this.errorMessage = err.error?.message || 'Failed to save signature.';
      }
    });
  }

  private getCoords(e: MouseEvent | TouchEvent) {
    const canvas = this.sigCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    } else {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
  }

  // --- Media Asset Picker Helpers ---
  onFileSelected(event: any, type: 'logo' | 'seal' | 'header' | 'footer') {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'File size must be under 2MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result;
      if (type === 'logo') this.orgSettings.logoPath = base64;
      else if (type === 'seal') this.orgSettings.companySealPath = base64;
      else if (type === 'header') this.orgSettings.headerImagePath = base64;
      else if (type === 'footer') this.orgSettings.footerImagePath = base64;
      this.updatePreview();
    };
    reader.readAsDataURL(file);
  }

  removeMediaAsset(type: 'logo' | 'seal' | 'header' | 'footer') {
    if (type === 'logo') this.orgSettings.logoPath = '';
    else if (type === 'seal') this.orgSettings.companySealPath = '';
    else if (type === 'header') this.orgSettings.headerImagePath = '';
    else if (type === 'footer') this.orgSettings.footerImagePath = '';
    this.updatePreview();
  }

  // --- Templates Management & Synced Forms ---
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

    if (this.selectedTemplate.templateContent) {
      try {
        const parsed = JSON.parse(this.selectedTemplate.templateContent);
        this.templateTheme = parsed.theme || { primaryColor: '#4F46E5', fontFamily: 'Helvetica', padding: 20 };
        this.templateStructure = parsed.structure || [];
      } catch (e) {
        this.loadDefaultStructure();
      }
    } else {
      this.loadDefaultStructure();
    }
    this.updatePreview();
  }

  loadDefaultStructure() {
    this.templateTheme = {
      primaryColor: '#4F46E5',
      fontFamily: 'Helvetica',
      padding: 20
    };
    this.templateStructure = [
      { id: 'block-1', type: 'header_image', maxHeight: 80, objectFit: 'contain' },
      { id: 'block-2', type: 'title', text: 'OFFICIAL RECEIPT', align: 'center', fontSize: 20 },
      { id: 'block-3', type: 'paragraph', text: 'This is an official confirmation of the payment received from {{customer_name}} under contract {{contract_no}}.', align: 'left', fontSize: 12 },
      { 
        id: 'block-4', 
        type: 'table', 
        style: 'bordered', 
        rows: [
          { label: 'Receipt Number', value: '{{receipt_no}}' },
          { label: 'Payment Date', value: '{{payment_date}}' },
          { label: 'Contract Number', value: '{{contract_no}}' },
          { label: 'Payment Method', value: '{{payment_method}}' }
        ] 
      },
      { 
        id: 'block-5', 
        type: 'table', 
        style: 'bordered', 
        rows: [
          { label: 'Amount Received', value: 'ETB {{payment_amount}}' },
          { label: 'Remaining Outstanding Balance', value: 'ETB {{outstanding_balance}}' }
        ] 
      },
      { id: 'block-6', type: 'signatures', layout: 'double_sign_seal', sealSize: 70 },
      { id: 'block-7', type: 'footer_image', maxHeight: 50, objectFit: 'contain', text: 'Receipt verified. Thank you for choosing IHSAN.' }
    ];
  }

  // --- Dynamic Block Modification ---
  addBlock(type: string) {
    const id = 'block-' + Date.now();
    let newBlock: any = { id, type };

    if (type === 'header_image') {
      newBlock.maxHeight = 80;
      newBlock.objectFit = 'contain';
    } else if (type === 'title') {
      newBlock.text = 'OFFICIAL RECEIPT';
      newBlock.align = 'center';
      newBlock.fontSize = 20;
    } else if (type === 'paragraph') {
      newBlock.text = 'This receipt confirms that the amount of ETB {{payment_amount}} has been received from {{customer_name}} under contract {{contract_no}} on {{payment_date}}.';
      newBlock.align = 'left';
      newBlock.fontSize = 12;
    } else if (type === 'table') {
      newBlock.style = 'bordered';
      newBlock.rows = [
        { label: 'Receipt Number', value: '{{receipt_no}}' },
        { label: 'Payment Date', value: '{{payment_date}}' },
        { label: 'Contract Number', value: '{{contract_no}}' },
        { label: 'Customer Name', value: '{{customer_name}}' },
        { label: 'Outstanding Balance', value: 'ETB {{outstanding_balance}}' }
      ];
    } else if (type === 'signatures') {
      newBlock.layout = 'double_sign_seal';
      newBlock.sealSize = 70;
    } else if (type === 'footer_image') {
      newBlock.maxHeight = 50;
      newBlock.objectFit = 'contain';
      newBlock.text = 'Receipt verified. Thank you for choosing IHSAN.';
    }

    this.templateStructure.push(newBlock);
    this.updatePreview();
  }

  deleteBlock(index: number) {
    this.templateStructure.splice(index, 1);
    this.updatePreview();
  }

  toggleBlockExpand(index: number) {
    this.expandedBlockIndex = this.expandedBlockIndex === index ? null : index;
  }

  // --- HTML5 Native Drag & Drop reordering ---
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      const movedItem = this.templateStructure.splice(this.draggedIndex, 1)[0];
      this.templateStructure.splice(index, 0, movedItem);
      this.templateStructure = [...this.templateStructure];
      this.updatePreview();
    }
    this.draggedIndex = null;
  }

  // --- Live sandbox previews scaling ---
  updateScale() {
    if (this.previewWrapper) {
      const parentWidth = this.previewWrapper.nativeElement.offsetWidth - 24;
      this.scaleFactor = Math.min(1, parentWidth / 595);
    }
  }

  updatePreview() {
    this.templateStructure = [...this.templateStructure];
    setTimeout(() => this.updateScale(), 50);
  }

  // --- Token replacements compiler ---
  compileTokenText(text: string, receipt: any, settings: any): string {
    if (!text || !receipt) return text || '';
    let result = text;
    const tokens: Record<string, string> = {
      'receipt_no': receipt.receiptNumber || '',
      'receipt_number': receipt.receiptNumber || '',
      'payment_ref': receipt.payment?.paymentReference || '',
      'payment_reference': receipt.payment?.paymentReference || '',
      'customer_name': receipt.payment?.customer?.fullName || '',
      'customer_fullname': receipt.payment?.customer?.fullName || '',
      'contract_no': receipt.payment?.contract?.contractNo || '',
      'contract_number': receipt.payment?.contract?.contractNo || '',
      'payment_amount': Number(receipt.payment?.paymentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      'payment_method': receipt.payment?.paymentMethod?.paymentMethodName || '',
      'payment_date': receipt.payment?.paymentDate ? new Date(receipt.payment.paymentDate).toLocaleDateString() : new Date(receipt.receiptDate).toLocaleDateString(),
      'outstanding_balance': Number((receipt.payment?.contract?.contractAmount || 0) - (receipt.payment?.paymentAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      'tin_number': settings?.tinNumber || '',
      'vat_number': settings?.vatNumber || '',

    };

    Object.keys(tokens).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), tokens[key]);
    });
    return result;
  }

  // --- Action triggers ---
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
    this.onSaveTemplate();
  }

  onSaveTemplate() {
    if (!this.selectedTemplate) return;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      templateName: this.templateForm.templateName,
      companyLogo: this.orgSettings.logoPath, // Keep logo path synchronized
      headerText: this.orgSettings.companyName, // Synchronize header text
      footerText: this.templateForm.footerText,
      signatureText: this.templateForm.signatureText,
      qrEnabled: this.templateForm.qrEnabled,
      isDefault: this.templateForm.isDefault,
      templateContent: JSON.stringify({
        theme: this.templateTheme,
        structure: this.templateStructure
      })
    };

    this.financeService.updateReceiptTemplate(this.selectedTemplate.id, payload).subscribe({
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

  viewReceipt(r: any) {
    this.selectedViewReceipt = r;
    // Auto sync selected template to matching template of the receipt
    if (r.receiptTemplate) {
      const t = this.templates.find(x => x.id == r.receiptTemplate.id);
      if (t) {
        this.selectedTemplate = t;
        this.selectedTemplateId = t.id;
        this.syncForm();
      }
    }
  }

  downloadReceiptPdf(r: any, autoPrint = true) {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to download/print the receipt PDF.');
      return;
    }

    const template = r.receiptTemplate || this.selectedTemplate || { qrEnabled: true };
    const font = this.orgSettings.fontFamily || 'Helvetica';
    
    // Helper: resolve image URLs for the about:blank popup context
    // Base64 data URIs pass through, relative paths get prefixed with backend origin
    const resolveUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
      return 'http://localhost:3000' + (url.startsWith('/') ? '' : '/') + url;
    };

    let structure = this.templateStructure;
    let theme = this.templateTheme;
    
    const activeTemplate = r.receiptTemplate || this.selectedTemplate;
    if (activeTemplate && activeTemplate.templateContent) {
      try {
        const parsed = JSON.parse(activeTemplate.templateContent);
        if (parsed.structure) structure = parsed.structure;
        if (parsed.theme) theme = parsed.theme;
      } catch (e) {
        console.error('Failed to parse template content', e);
      }
    }

    // Compile all blocks to HTML string
    let blocksHtml = '';
    
    structure.forEach((block: any, idx: number) => {
      const isFirst = idx === 0;
      const isLast = idx === structure.length - 1;

      // Padding calculations for breakout layout
      const isHeaderFill = block.type === 'header_image' && this.orgSettings.headerImagePath && (block.objectFit === 'fill' || block.objectFit === 'cover');
      const isFooterFill = block.type === 'footer_image' && this.orgSettings.footerImagePath && (block.objectFit === 'fill' || block.objectFit === 'cover');
      const isHeaderFooterFill = isHeaderFill || isFooterFill;

      const padLeft = isHeaderFooterFill ? '0' : 'var(--sheet-padding)';
      const padRight = isHeaderFooterFill ? '0' : 'var(--sheet-padding)';
      const padTop = isFirst ? (isHeaderFooterFill ? '0' : 'var(--sheet-padding)') : '0';
      const padBottom = isLast ? (isHeaderFooterFill ? '0' : 'var(--sheet-padding)') : '0';
      
      const marginTop = isLast ? 'auto' : '0';

      const paddingStyle = `padding-left: ${padLeft}; padding-right: ${padRight}; padding-top: ${padTop}; padding-bottom: ${padBottom}; margin: 0; margin-top: ${marginTop}; box-sizing: border-box;`;

      let blockContent = '';

      if (block.type === 'header_image') {
        if (this.orgSettings.headerImagePath) {
          blockContent = `
            <div style="min-height: ${block.maxHeight}px; width: 100%; display: flex; justify-content: center; align-items: center;">
              <img src="${resolveUrl(this.orgSettings.headerImagePath)}" crossorigin="anonymous" style="max-height: ${block.maxHeight}px; height: ${block.maxHeight}px; object-fit: ${block.objectFit}; width: 100%; display: block;" />
            </div>
          `;
        } else {
          const logoHtml = this.orgSettings.logoPath ? `<img src="${resolveUrl(this.orgSettings.logoPath)}" crossorigin="anonymous" style="height: 50px; width: 50px; object-fit: contain; border-radius: 4px;" />` : `<div style="height: 50px; width: 50px; border-radius: 4px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #94a3b8; border: 1px solid #cbd5e1;">L</div>`;
          blockContent = `
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${logoHtml}
                <div style="text-align: left;">
                  <h2 style="font-size: 14px; font-weight: bold; margin: 0; color: #0f172a; text-transform: uppercase;">${this.orgSettings.companyName || 'IHSAN PROPERTIES PLC'}</h2>
                  <div style="font-size: 9px; color: #64748b; margin-top: 2px;">TIN: ${this.orgSettings.tinNumber || '0000000000'} | VAT: ${this.orgSettings.vatNumber || '00000-0'}</div>
                </div>
              </div>
              <div style="text-align: right; font-size: 8px; color: #64748b; line-height: 1.4;">
                <div>${this.orgSettings.companyAddress || 'Bole, Addis Ababa'}</div>
                <div>Tel: ${this.orgSettings.companyPhone || '+251-11'}</div>
                <div>Email: ${this.orgSettings.companyEmail || 'info@ihsan.com'}</div>
              </div>
            </div>
          `;
        }
      } else if (block.type === 'title') {
        const titleText = this.compileTokenText(block.text, r, this.orgSettings);
        blockContent = `
          <div style="text-align: ${block.align}; font-size: ${block.fontSize}px; color: ${this.orgSettings.primaryColor || '#4F46E5'}; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
            ${titleText}
          </div>
        `;
      } else if (block.type === 'paragraph') {
        const bodyText = this.compileTokenText(block.text, r, this.orgSettings);
        blockContent = `
          <div style="text-align: ${block.align}; font-size: ${block.fontSize}px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
            ${bodyText}
          </div>
        `;
      } else if (block.type === 'table') {
        if (block.style === 'bordered') {
          let rowsHtml = '';
          block.rows.forEach((row: any) => {
            rowsHtml += `
              <div style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px;">
                <div style="flex: 1; font-weight: bold; color: #475569;">${this.compileTokenText(row.label, r, this.orgSettings)}</div>
                <div style="flex: 1; text-align: right; color: #0f172a;">${this.compileTokenText(row.value, r, this.orgSettings)}</div>
              </div>
            `;
          });
          blockContent = `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; border-color: ${this.orgSettings.primaryColor || '#4F46E5'}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="display: flex; font-weight: bold; border-bottom: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px; background: ${(this.orgSettings.primaryColor || '#4F46E5') + '15'}; border-color: ${this.orgSettings.primaryColor || '#4F46E5'};">
                <div style="flex: 1; color: #0f172a;">Description Element</div>
                <div style="flex: 1; text-align: right; color: #0f172a;">Value Details</div>
              </div>
              ${rowsHtml}
            </div>
          `;
        } else {
          let rowsHtml = '';
          block.rows.forEach((row: any) => {
            rowsHtml += `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 6px 4px; font-size: 11px;">
                <span style="font-weight: bold; color: #475569;">${this.compileTokenText(row.label, r, this.orgSettings)}</span>
                <span style="color: #0f172a;">${this.compileTokenText(row.value, r, this.orgSettings)}</span>
              </div>
            `;
          });
          blockContent = `
            <div style="width: 100%;">
              <div style="border-top: 3px solid ${this.orgSettings.primaryColor || '#4F46E5'}; margin-bottom: 4px;"></div>
              ${rowsHtml}
            </div>
          `;
        }
      } else if (block.type === 'signatures') {
        if (block.layout === 'double_sign_seal') {
          const sealImg = this.orgSettings.companySealPath ? `<img src="${resolveUrl(this.orgSettings.companySealPath)}" crossorigin="anonymous" style="max-height: ${block.sealSize}px; object-fit: contain;" />` : `<div style="height: ${block.sealSize}px; width: ${block.sealSize}px; border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>`;
          const sigImg = this.savedSignatureUrl ? `<img src="${resolveUrl(this.savedSignatureUrl)}" crossorigin="anonymous" style="max-height: 50px; max-width: 100%; object-fit: contain;" />` : `<div style="font-family: 'Courier New', Courier, monospace; font-style: italic; font-size: 14px; font-weight: bold; color: #1e3a8a;">${this.orgSettings.authorizedSignatoryName || 'Abebe Manager'}</div>`;
          blockContent = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
              <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 150px;">
                <div style="height: ${block.sealSize}px; width: ${block.sealSize}px; display: flex; align-items: center; justify-content: center;">
                  ${sealImg}
                </div>
                <div style="font-size: 9px; margin-top: 4px; color: #64748b; font-weight: bold;">Corporate Seal Stamp</div>
              </div>
              <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 180px;">
                <div style="height: 60px; display: flex; align-items: center; justify-content: center; width: 100%; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;">
                  ${sigImg}
                </div>
                <div style="font-size: 8px; color: #475569; font-weight: bold;">${this.orgSettings.authorizedSignatoryTitle || 'General Manager'}</div>
              </div>
            </div>
          `;
        } else {
          const sealImg = this.orgSettings.companySealPath ? `<img src="${resolveUrl(this.orgSettings.companySealPath)}" crossorigin="anonymous" style="max-height: ${block.sealSize}px; object-fit: contain;" />` : `<div style="height: ${block.sealSize}px; width: ${block.sealSize}px; border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; font-weight: bold;">[OFFICIAL SEAL]</div>`;
          blockContent = `
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%;">
              <div style="height: ${block.sealSize}px; width: ${block.sealSize}px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
                ${sealImg}
              </div>
              <div style="font-size: 9px; color: #64748b; font-weight: bold;">${this.orgSettings.authorizedSignatoryTitle || 'Authorized CFO Signatory'}</div>
            </div>
          `;
        }
      } else if (block.type === 'footer_image') {
        if (this.orgSettings.footerImagePath) {
          blockContent = `
            <div style="width: 100%;">
              <img src="${resolveUrl(this.orgSettings.footerImagePath)}" crossorigin="anonymous" style="max-height: ${block.maxHeight}px; height: ${block.maxHeight}px; object-fit: ${block.objectFit}; width: 100%; display: block;" />
            </div>
          `;
        } else if (block.text) {
          blockContent = `
            <div style="font-size: 10px; color: #64748b; text-align: center; line-height: 1.5; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
               ${this.compileTokenText(block.text, r, this.orgSettings)}
            </div>
          `;
        }
      }

      blocksHtml += `
        <div style="${paddingStyle} width: 100%;">
          ${blockContent}
        </div>
      `;
    });

    const qrCodeHtml = '';

    const htmlContent = `
      <html>
        <head>
          <title>Receipt ${r.receiptNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
            
            body {
              background: #f1f5f9;
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              font-family: '${font}', sans-serif;
              color: #1e293b;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .a4-sheet {
              --sheet-padding: ${theme.padding || 20}px;
              background: white;
              width: 210mm;
              min-height: 297mm;
              padding: 0;
              box-sizing: border-box;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }

            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                background: white;
                padding: 0;
                margin: 0;
              }
              .a4-sheet {
                --sheet-padding: 15mm;
                box-shadow: none;
                border: none;
                width: 210mm;
                height: 297mm;
                padding: 0;
                box-sizing: border-box;
                overflow: hidden;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="a4-sheet">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 20px; width: 100%;">
              ${blocksHtml}
            </div>
            ${qrCodeHtml}
          </div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            document.fonts.ready.then(() => {
              const images = Array.from(document.querySelectorAll('img'));
              const promises = images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve;
                });
              });
              
              Promise.all(promises).then(() => {
                setTimeout(() => {
                  ${autoPrint ? `
                  window.print();
                  ` : `
                  const element = document.querySelector('.a4-sheet');
                  const opt = {
                    margin:       0,
                    filename:     'Receipt-${r.receiptNumber}.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2.5, useCORS: true, logging: false },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                  };
                  html2pdf().from(element).set(opt).save().then(() => {
                    setTimeout(() => window.close(), 1000);
                  }).catch(err => {
                    console.error(err);
                    window.print();
                  });
                  `}
                }, 500);
              });
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
