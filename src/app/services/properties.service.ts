import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:3000/api';

  // --- Dashboard ---
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/inventory/dashboard`);
  }

  // --- Properties ---
  getProperties(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.propertyTypeId) params = params.set('propertyTypeId', filters.propertyTypeId.toString());
    if (filters.city) params = params.set('city', filters.city);
    return this.http.get<any>(`${this.apiBase}/properties`, { params });
  }

  getProperty(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/properties/${id}`);
  }

  createProperty(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/properties`, data);
  }

  updateProperty(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/properties/${id}`, data);
  }

  deleteProperty(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/properties/${id}`);
  }

  // --- Buildings ---
  createBuilding(propertyId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/properties/${propertyId}/buildings`, data);
  }

  getBuilding(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/properties/buildings/${id}`);
  }

  updateBuilding(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/properties/buildings/${id}`, data);
  }

  deleteBuilding(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/properties/buildings/${id}`);
  }

  // --- Floors ---
  createFloor(buildingId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/properties/buildings/${buildingId}/floors`, data);
  }

  updateFloor(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/properties/floors/${id}`, data);
  }

  deleteFloor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/properties/floors/${id}`);
  }

  // --- Units & Inventory ---
  getUnits(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.propertyId) params = params.set('propertyId', filters.propertyId.toString());
    if (filters.buildingId) params = params.set('buildingId', filters.buildingId.toString());
    if (filters.floorId) params = params.set('floorId', filters.floorId.toString());
    if (filters.unitStatusId) params = params.set('unitStatusId', filters.unitStatusId.toString());
    if (filters.unitTypeId) params = params.set('unitTypeId', filters.unitTypeId.toString());
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.bedrooms) params = params.set('bedrooms', filters.bedrooms.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<any>(`${this.apiBase}/units`, { params });
  }

  getUnit(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/units/${id}`);
  }

  createUnit(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/units`, data);
  }

  updateUnit(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/units/${id}`, data);
  }

  deleteUnit(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/units/${id}`);
  }

  transitionUnitStatus(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/units/${id}/status`, data);
  }

  importUnitsCsv(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiBase}/units/import`, formData);
  }

  // --- Pricing & Promotions ---
  createUnitPrice(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/unit-prices`, data);
  }

  createPromotion(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/unit-prices/promotions`, data);
  }

  getActivePromotions(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/unit-prices/promotions/active`);
  }

  getPromotions(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/unit-prices/promotions`, { params });
  }

  updatePromotion(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/unit-prices/promotions/${id}`, data);
  }

  deactivatePromotion(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiBase}/unit-prices/promotions/${id}/deactivate`, {});
  }

  // --- Media & Floor Plans Upload ---
  uploadPropertyMedia(propertyId: number, file: File, options: { isFeatured?: boolean; displayOrder?: number; mediaType?: string } = {}): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('propertyId', propertyId.toString());
    if (options.isFeatured !== undefined) formData.append('isFeatured', options.isFeatured ? 'true' : 'false');
    if (options.displayOrder !== undefined) formData.append('displayOrder', options.displayOrder.toString());
    if (options.mediaType) formData.append('mediaType', options.mediaType);
    return this.http.post<any>(`${this.apiBase}/property-media`, formData);
  }

  uploadPropertyDocument(propertyId: number, file: File, options: { documentCategory?: string; documentName?: string; versionNumber?: number; expiryDate?: string; remarks?: string } = {}): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('propertyId', propertyId.toString());
    if (options.documentCategory) formData.append('documentCategory', options.documentCategory);
    if (options.documentName) formData.append('documentName', options.documentName);
    if (options.versionNumber !== undefined) formData.append('versionNumber', options.versionNumber.toString());
    if (options.expiryDate) formData.append('expiryDate', options.expiryDate);
    if (options.remarks) formData.append('remarks', options.remarks);
    return this.http.post<any>(`${this.apiBase}/property-media/documents`, formData);
  }

  uploadFloorPlan(file: File, planName: string, options: { propertyId?: number; buildingId?: number; floorId?: number; unitId?: number; remarks?: string; versionNumber?: number } = {}): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('planName', planName);
    if (options.propertyId) formData.append('propertyId', options.propertyId.toString());
    if (options.buildingId) formData.append('buildingId', options.buildingId.toString());
    if (options.floorId) formData.append('floorId', options.floorId.toString());
    if (options.unitId) formData.append('unitId', options.unitId.toString());
    if (options.remarks) formData.append('remarks', options.remarks);
    if (options.versionNumber !== undefined) formData.append('versionNumber', options.versionNumber.toString());
    return this.http.post<any>(`${this.apiBase}/property-media/floorplans`, formData);
  }

  // --- Master Lookups Dynamic CRUD ---
  getPropertyTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/property-types`);
  }
  createPropertyType(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/property-types`, data);
  }
  updatePropertyType(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/property-types/${id}`, data);
  }
  deletePropertyType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/property-types/${id}`);
  }

  getUnitStatusHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/units/status-history`);
  }

  getUnitStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/unit-statuses`);
  }

  updateUnitStatus(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/unit-statuses/${id}`, data);
  }

  getUnitTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/unit-types`);
  }
  createUnitType(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/unit-types`, data);
  }
  updateUnitType(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/unit-types/${id}`, data);
  }
  deleteUnitType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/unit-types/${id}`);
  }

  getAmenities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/amenities`);
  }
  createAmenity(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/amenities`, data);
  }
  updateAmenity(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/amenities/${id}`, data);
  }
  deleteAmenity(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/amenities/${id}`);
  }

  // --- Sites ---
  getSites(propertyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/properties/${propertyId}/sites`);
  }
  createSite(propertyId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/properties/${propertyId}/sites`, data);
  }
  updateSite(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/properties/sites/${id}`, data);
  }
  deleteSite(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/properties/sites/${id}`);
  }
}
