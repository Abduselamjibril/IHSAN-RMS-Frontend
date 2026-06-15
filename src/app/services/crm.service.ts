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

  getAgents(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/agents`);
  }

  createAgent(agentData: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/agents`, agentData);
  }

  updateAgent(id: number, agentData: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/agents/${id}`, agentData);
  }

  deleteAgent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/agents/${id}`);
  }

  getLeadSources(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/lead-sources`);
  }

  createLeadSource(sourceData: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/lead-sources`, sourceData);
  }

  updateLeadSource(id: number, sourceData: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/lead-sources/${id}`, sourceData);
  }

  deleteLeadSource(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/lead-sources/${id}`);
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

  addLeadNote(id: number, note: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/leads/${id}/notes`, { note });
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

  completeReminder(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/agents/reminders/${id}/complete`, {});
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/leads/stats`);
  }

  getAllLeadNotes(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.leadId) params = params.set('leadId', filters.leadId.toString());
    return this.http.get<any>(`${this.apiBase}/leads/notes/all`, { params });
  }

  getAllAttachments(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.leadId) params = params.set('leadId', filters.leadId.toString());
    return this.http.get<any>(`${this.apiBase}/leads/attachments/all`, { params });
  }

  getAllActivities(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.leadId) params = params.set('leadId', filters.leadId.toString());
    if (filters.activityType) params = params.set('activityType', filters.activityType);
    return this.http.get<any>(`${this.apiBase}/leads/activities/all`, { params });
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

  // Opportunity Methods
  convertLeadToOpportunity(leadId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/opportunities/convert/${leadId}`, data);
  }

  getOpportunities(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.stageId) params = params.set('stageId', filters.stageId.toString());
    if (filters.agentId) params = params.set('agentId', filters.agentId.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<any>(`${this.apiBase}/opportunities`, { params });
  }

  getOpportunityDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/opportunities/${id}`);
  }

  updateOpportunityStage(id: number, stageId: number): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/opportunities/${id}/stage`, { stageId });
  }

  closeOpportunityLost(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/opportunities/${id}/close-lost`, payload);
  }

  updateOpportunity(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/opportunities/${id}`, data);
  }

  addOpportunityActivity(id: number, activityData: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/opportunities/${id}/activity`, activityData);
  }

  addOpportunityNote(id: number, note: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/opportunities/${id}/notes`, { note });
  }

  getOpportunityForecast(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/opportunities/stats/forecast`);
  }

  getOpportunityMetadata(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/opportunities/metadata`);
  }
}
