import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api/finance';

  // --- Payment Methods ---
  getPaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/payment-methods`);
  }

  createPaymentMethod(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/payment-methods`, data);
  }

  // --- Payments Collections ---
  createPayment(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/payments`, data);
  }

  getPayments(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<any[]>(`${this.apiBase}/payments`, { params: httpParams });
  }

  getPayment(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/payments/${id}`);
  }

  approvePayment(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/payments/${id}/approve`, data);
  }

  rejectPayment(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/payments/${id}/reject`, data);
  }

  reversePayment(id: number, comment: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/payments/${id}/reverse`, { comment });
  }

  // --- Reschedule Installments ---
  rescheduleInstallment(id: number, dueDate: string, amount: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/installments/${id}/reschedule`, { dueDate, amount });
  }

  // --- Penalties ---
  getPenaltyConfigs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/penalties/config`);
  }

  createPenaltyConfig(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/penalties/config`, data);
  }

  deletePenaltyConfig(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/penalties/config/${id}`);
  }

  runDailyPenaltySweeper(): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/penalties/calculate-daily`, {});
  }

  getPenaltyTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/penalties/transactions`);
  }

  waivePenalty(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/penalties/waive/${id}`, data);
  }

  // --- Receipts & Templates ---
  getReceiptTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/receipt-templates`);
  }

  updateReceiptTemplate(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/receipt-templates/${id}`, data);
  }

  getReceipts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/receipts`);
  }

  reprintReceipt(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/receipts/${id}/reprint`, {});
  }

  // --- Outstanding Balances & Analytical Reports ---
  getCustomerBalances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/balances`);
  }

  getCustomerStatement(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/statements/customer/${customerId}`);
  }

  getAgingAnalysis(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/aging`);
  }

  getRevenueSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/collections`);
  }

  // --- Reminders ---
  getReminderConfigs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/reminders/config`);
  }

  updateReminderConfig(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/reminders/config`, data);
  }

  getReminderLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/reminders/logs`);
  }

  triggerReminderEngine(): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/reminders/trigger`, {});
  }
}
