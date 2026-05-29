import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CrmService {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api';

  getMetadata(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/agents/metadata`);
  }

  getLeads(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.statusId) params = params.set('statusId', filters.statusId.toString());
    if (filters.sourceId) params = params.set('sourceId', filters.sourceId.toString());
    if (filters.agentId) params = params.set('agentId', filters.agentId.toString());
    if (filters.budgetMin) params = params.set('budgetMin', filters.budgetMin.toString());
    if (filters.budgetMax) params = params.set('budgetMax', filters.budgetMax.toString());
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<any>(`${this.apiBase}/leads`, { params });
  }

  getLeadDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/leads/${id}`);
  }

  createLead(leadData: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/leads`, leadData);
  }

  updateLead(id: number, leadData: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/leads/${id}`, leadData);
  }

  assignAgent(id: number, agentId: number): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/leads/${id}/assign`, { agentId });
  }

  updateStatus(id: number, statusId: number): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/leads/${id}/status`, { statusId });
  }

  addActivity(id: number, activityData: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/leads/${id}/activity`, activityData);
  }

  addContact(leadId: number, contactData: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/leads/${leadId}/contacts`, contactData);
  }

  getContacts(leadId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/leads/${leadId}/contacts`);
  }

  uploadAttachment(leadId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiBase}/leads/${leadId}/attachments`, formData);
  }

  getAttachments(leadId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/leads/${leadId}/attachments`);
  }

  getReminders(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/agents/reminders`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/leads/stats`);
  }

  getExportUrl(filters: any): string {
    let queryParts: string[] = [];
    if (filters.search) queryParts.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.statusId) queryParts.push(`statusId=${filters.statusId}`);
    if (filters.sourceId) queryParts.push(`sourceId=${filters.sourceId}`);
    if (filters.agentId) queryParts.push(`agentId=${filters.agentId}`);
    if (filters.budgetMin) queryParts.push(`budgetMin=${filters.budgetMin}`);
    if (filters.budgetMax) queryParts.push(`budgetMax=${filters.budgetMax}`);
    if (filters.dateFrom) queryParts.push(`dateFrom=${encodeURIComponent(filters.dateFrom)}`);
    if (filters.dateTo) queryParts.push(`dateTo=${encodeURIComponent(filters.dateTo)}`);

    const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return `${this.apiBase}/leads/export${queryStr}`;
  }
}
