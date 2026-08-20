import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-verify-receipt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="verify-container">
      <div class="verify-card">
        <!-- Header Brand -->
        <div class="verify-header">
          <div class="brand-badge">
            <span class="material-icons-outlined" style="font-size: 28px; color: #4F46E5;">verified</span>
            <div>
              <h1 class="brand-title">IHSAN PROPERTIES</h1>
              <p class="brand-subtitle">Official Receipt Verification Portal</p>
            </div>
          </div>
        </div>

        <!-- Search Input if needed -->
        <div class="search-bar" *ngIf="!loading">
          <div class="input-wrapper">
            <span class="material-icons-outlined search-icon">search</span>
            <input 
              type="text" 
              [(ngModel)]="receiptNoInput" 
              placeholder="Enter Receipt Number (e.g. REC-10151340)" 
              (keyup.enter)="lookupReceipt()"
            />
            <button class="btn btn-primary" (click)="lookupReceipt()">Verify Receipt</button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <span class="material-icons-outlined spin-icon">autorenew</span>
          <p>Verifying cryptographic record with IHSAN RMS Ledger...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="error-state">
          <span class="material-icons-outlined error-icon">gpp_bad</span>
          <h3>Receipt Verification Failed</h3>
          <p>{{ error }}</p>
        </div>

        <!-- Verified Success State -->
        <div *ngIf="receiptData && !loading && !error" class="verified-body">
          <div class="authenticity-banner">
            <div class="banner-icon">
              <span class="material-icons-outlined">verified_user</span>
            </div>
            <div>
              <h2>GENUINE & AUTHENTIC RECEIPT</h2>
              <p>Cryptographically validated against the official IHSAN financial database.</p>
            </div>
          </div>

          <!-- Details Grid -->
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Receipt Number</span>
              <span class="detail-value font-mono font-bold text-primary">#{{ receiptData.receiptNumber }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Payment Status</span>
              <span class="badge badge-success font-bold">{{ receiptData.paymentStatus }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Customer Profile</span>
              <span class="detail-value font-bold">{{ receiptData.customerName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contract Number</span>
              <span class="detail-value font-mono">{{ receiptData.contractNumber }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Payment Reference</span>
              <span class="detail-value font-mono">{{ receiptData.paymentReference }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Payment Method</span>
              <span class="detail-value">{{ receiptData.paymentMethod }}</span>
            </div>
            <div class="detail-item highlight-item">
              <span class="detail-label">Total Amount Paid</span>
              <span class="detail-value font-mono font-bold amount-text">ETB {{ receiptData.amountPaid | number:'1.2-2' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Issue Date</span>
              <span class="detail-value font-mono">{{ receiptData.paymentDate | date:'medium' }}</span>
            </div>
          </div>

          <!-- QR & Authenticity Seal -->
          <div class="seal-section">
            <div class="qr-box">
              <img 
                [src]="'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + currentUrl" 
                alt="Verification QR Code" 
                width="100" 
                height="100"
              />
              <span class="font-xs text-secondary mt-1">Scan to Re-verify</span>
            </div>
            <div class="seal-details">
              <p class="font-xs text-secondary">
                <strong>Issuing Organization:</strong> {{ receiptData.issuer }}<br>
                <strong>System Verification Timestamp:</strong> {{ receiptData.verificationTimestamp | date:'medium' }}<br>
                <strong>Security Seal ID:</strong> <span class="font-mono">{{ receiptData.receiptNumber }}-AUTH-{{ receiptData.amountPaid }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="verify-footer">
          <p class="font-xs text-secondary text-center">
            © 2026 IHSAN Properties & Business Service PLC. All rights reserved. | Official REMS Portal
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .verify-card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      width: 100%;
      max-width: 680px;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      color: #f8fafc;
    }
    .verify-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-badge {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      margin: 0;
      color: #ffffff;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 2px 0 0 0;
    }
    .search-bar {
      margin-bottom: 24px;
    }
    .input-wrapper {
      display: flex;
      align-items: center;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 6px 12px;
      gap: 10px;
    }
    .search-icon {
      color: #94a3b8;
      font-size: 20px;
    }
    .input-wrapper input {
      flex: 1;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 14px;
      outline: none;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #4F46E5;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .loading-state, .error-state {
      text-align: center;
      padding: 40px 20px;
    }
    .spin-icon {
      font-size: 40px;
      color: #4F46E5;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .error-icon {
      font-size: 48px;
      color: #ef4444;
      margin-bottom: 12px;
    }
    .authenticity-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 24px;
    }
    .banner-icon {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .banner-icon span {
      font-size: 28px;
    }
    .authenticity-banner h2 {
      font-size: 16px;
      font-weight: 700;
      color: #10b981;
      margin: 0;
    }
    .authenticity-banner p {
      font-size: 12px;
      color: #94a3b8;
      margin: 4px 0 0 0;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .detail-item {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .highlight-item {
      grid-column: span 2;
      background: rgba(79, 70, 229, 0.1);
      border-color: rgba(79, 70, 229, 0.3);
    }
    .detail-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 600;
    }
    .detail-value {
      font-size: 15px;
      color: #ffffff;
    }
    .amount-text {
      font-size: 22px;
      color: #34d399;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      width: fit-content;
    }
    .badge-success {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .text-primary {
      color: #818cf8;
    }
    .seal-section {
      display: flex;
      align-items: center;
      gap: 20px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .qr-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #ffffff;
      padding: 8px;
      border-radius: 8px;
    }
    .seal-details {
      flex: 1;
      line-height: 1.6;
    }
    .verify-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
    }
  `]
})
export class VerifyReceiptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private financeService = inject(FinanceService);

  receiptNoInput = '';
  receiptData: any = null;
  loading = false;
  error = '';
  currentUrl = window.location.href;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const receiptNo = params['receiptNo'] || params['code'];
      if (receiptNo) {
        this.receiptNoInput = receiptNo;
        this.lookupReceipt();
      }
    });
  }

  lookupReceipt() {
    if (!this.receiptNoInput || !this.receiptNoInput.trim()) return;

    this.loading = true;
    this.error = '';
    this.receiptData = null;
    this.currentUrl = `${window.location.origin}/verify-receipt?receiptNo=${this.receiptNoInput.trim()}`;

    this.financeService.verifyReceipt(this.receiptNoInput.trim()).subscribe({
      next: (res) => {
        this.receiptData = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Receipt verification failed', err);
        this.error = err.error?.message || `Receipt "${this.receiptNoInput}" could not be verified. It may be invalid or not yet approved.`;
        this.loading = false;
      }
    });
  }
}
