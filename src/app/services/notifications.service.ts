import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api/notifications';

  // --- Inbox / Read Alerts ---
  getInbox(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/inbox`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiBase}/unread-count`);
  }

  markAsRead(recipientId: number): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/read`, { recipientId });
  }

  // --- Delivery Audit Logs / Stats ---
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/history`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/stats`);
  }

  // --- User Preferences Toggle Matrix ---
  getPreferences(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/preferences`);
  }

  updatePreferences(preferences: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/preferences`, { preferences });
  }

  // --- Categories & Channels ---
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/categories`);
  }

  getChannels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/channels`);
  }

  // --- Templates CRUD for Admin ---
  getTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/templates`);
  }

  createTemplate(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/templates`, data);
  }

  updateTemplate(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/templates/${id}`, data);
  }

  deleteTemplate(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/templates/${id}`);
  }

  // --- Trigger Manual Sweep ---
  runPaymentReminders(): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/payment-reminders/run`, {});
  }

  // --- Telegram Settings & Status ---
  getTelegramConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/telegram/config`);
  }

  getTelegramStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/telegram/status`);
  }

  saveTelegramConfig(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/telegram/config`, data);
  }

  requestTelegramCode(apiId: number, apiHash: string, phoneNumber: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/telegram/request-code`, { apiId, apiHash, phoneNumber });
  }

  verifyTelegramCode(phoneNumber: string, code: string, password?: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/telegram/verify-code`, { phoneNumber, code, password });
  }
}
