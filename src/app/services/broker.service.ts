import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../config';

@Injectable({
  providedIn: 'root'
})
export class BrokerService {
  private http = inject(HttpClient);
  private apiBase = `${environment.apiBase}/brokers`;

  // --- Dashboard ---
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard`);
  }

  // --- Brokers Directory ---
  getBrokers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiBase);
  }

  getBrokerById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/${id}`);
  }

  createBroker(data: any): Observable<any> {
    return this.http.post<any>(this.apiBase, data);
  }

  updateBroker(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/${id}`, data);
  }

  deleteBroker(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/${id}`);
  }

  // --- Bank Accounts ---
  addBankAccount(brokerId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/${brokerId}/bank-accounts`, data);
  }

  deleteBankAccount(brokerId: number, accountId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/${brokerId}/bank-accounts/${accountId}`);
  }

  // --- Documents ---
  uploadDocument(brokerId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/${brokerId}/documents`, formData);
  }

  deleteDocument(brokerId: number, docId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/${brokerId}/documents/${docId}`);
  }

  // --- Project / Property Assignments ---
  assignProject(brokerId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/${brokerId}/projects`, data);
  }

  removeProjectAssignment(brokerId: number, assignmentId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/${brokerId}/projects/${assignmentId}`);
  }

  // --- Lead Assignments ---
  assignLead(brokerId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/${brokerId}/leads`, data);
  }

  removeLeadAssignment(brokerId: number, assignmentId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/${brokerId}/leads/${assignmentId}`);
  }

  // --- Commission Plans ---
  getCommissionPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/commission-plans/all`);
  }

  getCommissionPlanById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/commission-plans/${id}`);
  }

  createCommissionPlan(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/commission-plans`, data);
  }

  assignProjectCommissionPlan(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/commission-plans/projects`, data);
  }

  getProjectCommissionPlans(propertyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/commission-plans/projects/${propertyId}`);
  }

  getAllProjectCommissionPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/commission-plans/projects/all`);
  }

  // --- Sales Attributions ---
  logBrokerSale(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/sales`, data);
  }

  getSalesAttributed(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/sales/all`);
  }

  // --- Commissions ---
  getCommissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/commissions/all`);
  }

  approveCommission(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/commissions/${id}/approve`, {});
  }

  addAdjustment(commissionId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/commissions/${commissionId}/adjust`, data);
  }

  // --- Payout Ledger ---
  getPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/payments/all`);
  }

  recordPayment(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/payments`, data);
  }

  // --- Broker Performance Targets ---
  setTarget(brokerId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/${brokerId}/targets`, data);
  }

  getTargets(brokerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/${brokerId}/targets`);
  }
}
