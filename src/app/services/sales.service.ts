import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../config';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private http = inject(HttpClient);
  private apiBase = `${environment.apiBase}/sales`;

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

  sendQuotationEmail(id: number, data: { recipientEmail: string; recipientPhone?: string; subject?: string; message?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/quotations/${id}/email`, data);
  }

  // --- Bookings ---
  getBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/bookings`);
  }

  createBooking(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/bookings`, data);
  }

  convertReservationToBooking(reservationId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/reservations/${reservationId}/convert-to-booking`, data);
  }

  approveBooking(id: number, approverId: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/bookings/${id}/approve`, { approverId });
  }

  rejectBooking(id: number, rejectionReason: string, reviewerId?: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/bookings/${id}/reject`, { rejectionReason, reviewerId });
  }

  financeReviewBooking(id: number, action: 'APPROVE' | 'REJECT', comment?: string, financeOfficerId?: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/bookings/${id}/finance-review`, { action, comment, financeOfficerId });
  }

  cancelBooking(id: number, cancellationReason?: string, cancelledById?: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/bookings/${id}/cancel`, { cancellationReason, cancelledById });
  }

  // --- Agreements ---
  getAgreements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/agreements`);
  }

  createAgreement(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/agreements`, data);
  }

  updateAgreementVersion(id: number, data: { changeRemarks?: string; agreementDocument?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/agreements/${id}/version`, data);
  }

  getAgreementHistory(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/agreements/${id}/history`);
  }

  // --- Contracts ---
  getContracts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/contracts`);
  }

  createContract(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/contracts`, data);
  }

  updateContractStatus(id: number, data: { status: string; remarks?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/contracts/${id}/status`, data);
  }

  createContractAmendment(id: number, data: { amendmentType: string; amendmentDescription: string; adjustedAmount?: number; effectiveDate?: string; remarks?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/contracts/${id}/amendments`, data);
  }

  getContractAmendments(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/contracts/${id}/amendments`);
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

  sendInstallmentReminder(installmentId: number, data: { channelCode?: string; customNote?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/installments/${installmentId}/remind`, data);
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

  updateCommissionStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiBase}/commissions/${id}/status`, { status });
  }

  terminateContract(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiBase}/contracts/${id}/terminate`, {});
  }

  // --- Dashboard Stats ---
  getSalesDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/stats`);
  }
}
