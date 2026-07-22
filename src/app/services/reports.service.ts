import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../config';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBase;

  // --- Dashboard APIs ---
  getKpis(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/kpis`);
  }

  getRealTimeStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/realtime`);
  }

  getSalesTrends(freq: 'daily' | 'monthly' | 'annual' = 'monthly'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/dashboard/trends/sales`, {
      params: new HttpParams().set('freq', freq)
    });
  }

  getRevenueTrends(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/trends/revenue`);
  }

  getCollectionTrends(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/trends/collections`);
  }

  getLeadTrends(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/trends/leads`);
  }

  getBrokerTrends(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/dashboard/trends/brokers`);
  }

  // --- Reports APIs ---
  getTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/reports`);
  }

  getSalesReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/sales`, { params: this.getHttpParams(query) });
  }

  getInventoryAvailabilityReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/inventory/availability`, { params: this.getHttpParams(query) });
  }

  getInventoryAgingReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/inventory/aging`, { params: this.getHttpParams(query) });
  }

  getPropertyAvailabilityReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/properties/availability`, { params: this.getHttpParams(query) });
  }

  getRevenueReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/revenue`, { params: this.getHttpParams(query) });
  }

  getCollectionReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/collections`, { params: this.getHttpParams(query) });
  }

  getReceivablesReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/outstanding-balances`, { params: this.getHttpParams(query) });
  }

  getLeadFunnelReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/lead-conversions`, { params: this.getHttpParams(query) });
  }

  getBrokerCommissionsReport(query?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/reports/broker-commissions`, { params: this.getHttpParams(query) });
  }

  exportReport(reportCode: string, query: any, columns: string[]): Observable<Blob> {
    return this.http.post(`${this.apiBase}/reports/export`, {
      reportCode,
      query,
      columns
    }, { responseType: 'blob' });
  }

  private getHttpParams(query?: any): HttpParams {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          params = params.set(key, query[key].toString());
        }
      });
    }
    return params;
  }
}
