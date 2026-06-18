import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api/sales';

  // --- Customers ---
  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/customers`);
  }

  getCustomer(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/customers/${id}`);
  }

  createCustomer(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/customers`, data);
  }

  updateCustomer(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/customers/${id}`, data);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/customers/${id}`);
  }

  // --- Reservations ---
  getReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/reservations`);
  }

  createReservation(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/reservations`, data);
  }

  extendReservation(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/reservations/extend`, data);
  }

  cancelReservation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/reservations/${id}/cancel`, {});
  }

  // --- Quotations & Pricing ---
  calculateQuotationPrice(propertyId: number, unitId: number): Observable<any> {
    const params = new HttpParams()
      .set('propertyId', propertyId.toString())
      .set('unitId', unitId.toString());
    return this.http.get<any>(`${this.apiBase}/pricing/calculate`, { params });
  }

  getQuotations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/quotations`);
  }

  createQuotation(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/quotations`, data);
  }

  // --- Bookings ---
  getBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/bookings`);
  }

  createBooking(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/bookings`, data);
  }

  approveBooking(id: number, approverId: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/bookings/${id}/approve`, { approverId });
  }

  cancelBooking(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/bookings/${id}/cancel`, {});
  }

  // --- Agreements ---
  getAgreements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/agreements`);
  }

  createAgreement(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/agreements`, data);
  }

  // --- Contracts ---
  getContracts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/contracts`);
  }

  createContract(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/contracts`, data);
  }

  uploadContractDocument(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/contracts/${id}/document`, data);
  }

  uploadContractDocumentFile(id: number, file: File, fileName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    return this.http.post<any>(`${this.apiBase}/contracts/${id}/document/upload`, formData);
  }

  deleteContractDocument(docId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/contracts/documents/${docId}`);
  }

  // --- Installments ---
  getInstallmentPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/installments/plans`);
  }

  generateInstallmentPlan(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/installments/plan`, data);
  }

  payInstallment(scheduleId: number, paidAmount: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/installments/schedules/${scheduleId}/pay`, { paidAmount });
  }

  // --- Discount Workflow ---
  getDiscountRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/discounts`);
  }

  createDiscountRequest(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/discounts`, data);
  }

  approveDiscountRequest(id: number, approverId: number, comment: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/discounts/${id}/approve`, { approverId, comment });
  }

  rejectDiscountRequest(id: number, approverId: number, comment: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/discounts/${id}/reject`, { approverId, comment });
  }

  // --- Commissions ---
  getCommissionRules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/commissions/rules`);
  }

  createCommissionRule(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/commissions/rules`, data);
  }

  getCommissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/commissions`);
  }

  // --- Dashboard Stats ---
  getSalesDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/stats`);
  }
}
