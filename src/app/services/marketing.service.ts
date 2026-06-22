import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarketingService {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api/marketing';

  // --- Campaigns ---
  getCampaigns(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/campaigns`);
  }

  getCampaignById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/campaigns/${id}`);
  }

  createCampaign(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/campaigns`, data);
  }

  updateCampaign(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/campaigns/${id}`, data);
  }

  deleteCampaign(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/campaigns/${id}`);
  }

  getCampaignBudgets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/campaigns/budgets`);
  }

  // --- Advertisements ---
  getAdvertisements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/advertisements`);
  }

  getAdvertisementById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/advertisements/${id}`);
  }

  createAdvertisement(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/advertisements`, data);
  }

  updateAdvertisement(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/advertisements/${id}`, data);
  }

  deleteAdvertisement(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/advertisements/${id}`);
  }

  // --- Ad Expenses & Performance ---
  getAdExpenses(adId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/advertisements/${adId}/expenses`);
  }

  recordAdExpense(adId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/advertisements/${adId}/expenses`, data);
  }

  getAdPerformances(adId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/advertisements/${adId}/performances`);
  }

  recordAdPerformance(adId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/advertisements/${adId}/performances`, data);
  }

  // --- Lead Attribution ---
  getMarketingLeads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/leads`);
  }

  trackMarketingLead(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/leads`, data);
  }

  // --- Reports & Dashboard ---
  getCampaignPerformanceReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/reports/performance`);
  }

  getLeadSourceAnalysisReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/reports/lead-sources`);
  }

  getDashboardKpis(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/dashboard/kpis`);
  }

  getDashboardCharts(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/dashboard/charts`);
  }
}
