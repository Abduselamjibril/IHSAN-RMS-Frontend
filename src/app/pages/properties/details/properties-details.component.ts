import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertiesService } from '../../../services/properties.service';
import { DynamicDropdownComponent } from '../../../components/dynamic-dropdown/dynamic-dropdown.component';
import { customConfirm } from '../../../utils/confirm';
import { environment } from '../../../config';

@Component({
  selector: 'app-properties-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DynamicDropdownComponent],
  template: `
    <div *ngIf="property">
      <header class="app-header">
        <div class="app-title-section flex align-center gap-3">
          <a routerLink="/properties/list" class="header-icon-btn flex align-center justify-center" style="border-radius: var(--radius-round); width: 36px; height: 36px;">
            <span class="material-icons-outlined" style="font-size: 20px;">arrow_back</span>
          </a>
          <div>
            <h1>{{ property.propertyName }}</h1>
            <p>Project Code: <span class="font-mono text-indigo font-bold">{{ property.propertyCode }}</span> | Type: {{ property.propertyType?.typeName }}</p>
          </div>
        </div>
        <div class="app-header-actions flex gap-2" style="display: flex; gap: 8px;">
          <button class="btn btn-secondary flex align-center gap-2" (click)="openEditModal()">
            <span class="material-icons-outlined font-sm">edit</span> Edit Project
          </button>
          <button class="btn btn-primary flex align-center gap-2" (click)="openAddFloorModal()">
            <span class="material-icons-outlined font-sm">add</span> Add Floor Level
          </button>
        </div>
      </header>

      <!-- Property Summary Grid -->
      <div class="prop-details-grid">
        <!-- Main details card -->
        <div class="card p-info-card glass-card">
          <div class="info-header border-bottom">
            <span class="material-icons-outlined text-indigo">info</span>
            <h3>Project Description</h3>
          </div>
          <p class="description">{{ property.description || 'No description available for this project.' }}</p>
          <div class="details-list">
            <div class="details-item">
              <span class="label">Address Details</span>
              <span class="val">{{ property.address || 'Not Specified' }}</span>
            </div>
            <div class="details-item">
              <span class="label">Sub-City / Zone</span>
              <span class="val">{{ property.subCity || 'Not Specified' }}</span>
            </div>
            <div class="details-item">
              <span class="label">City / Country</span>
              <span class="val">{{ property.city || 'Addis Ababa' }}, {{ property.country || 'Ethiopia' }}</span>
            </div>
            <div class="details-item" *ngIf="property.latitude || property.longitude">
              <span class="label">GPS Coordinates</span>
              <span class="val font-mono">{{ property.latitude }}, {{ property.longitude }}</span>
            </div>
            <div class="details-item" *ngIf="property.totalLandArea">
              <span class="label">Total Land Area</span>
              <span class="val">{{ property.totalLandArea | number }} m²</span>
            </div>
            <div class="details-item" *ngIf="property.totalBuiltupArea">
              <span class="label">Total Built-up Area</span>
              <span class="val">{{ property.totalBuiltupArea | number }} m²</span>
            </div>
            <div class="details-item" *ngIf="property.propertyStatus">
              <span class="label">Project Status</span>
              <span class="val"><span class="badge badge-indigo">{{ property.propertyStatus }}</span></span>
            </div>
            <div class="details-item" *ngIf="property.launchDate">
              <span class="label">Launch Date</span>
              <span class="val">{{ property.launchDate | date:'mediumDate' }}</span>
            </div>
            <div class="details-item" *ngIf="property.completionDate">
              <span class="label">Completion Date</span>
              <span class="val">{{ property.completionDate | date:'mediumDate' }}</span>
            </div>
            <div class="details-item" *ngIf="property.developerName">
              <span class="label">Developer</span>
              <span class="val">{{ property.developerName }}</span>
            </div>
            <div class="details-item" *ngIf="property.contactPhone">
              <span class="label">Contact Phone</span>
              <span class="val">{{ property.contactPhone }}</span>
            </div>
            <div class="details-item" *ngIf="property.contactEmail">
              <span class="label">Contact Email</span>
              <span class="val">{{ property.contactEmail }}</span>
            </div>
            <div class="details-item" *ngIf="property.website">
              <span class="label">Website</span>
              <span class="val"><a [href]="property.website" target="_blank" class="text-indigo">{{ property.website }}</a></span>
            </div>
            <div class="details-item" *ngIf="property.remarks">
              <span class="label">Remarks</span>
              <span class="val">{{ property.remarks }}</span>
            </div>
          </div>

          <!-- Associated Amenities -->
          <div *ngIf="property.amenities && property.amenities.length > 0" class="mt-4 pt-4" style="border-top: 1px solid var(--border-color); margin-top: 16px; padding-top: 16px;">
            <h4 class="font-xs text-secondary font-bold" style="text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 8px; font-size: 11px;">Property Amenities</h4>
            <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span *ngFor="let am of property.amenities" class="flex align-center gap-1 font-xs font-bold" style="display: inline-flex; align-items: center; gap: 4px; background-color: var(--brand-primary-light); color: var(--brand-primary); padding: 4px 8px; border-radius: var(--radius-sm); font-size: 11px;">
                <span class="material-icons-outlined" style="font-size: 14px;">{{ am.icon || 'star_outline' }}</span>
                <span>{{ am.amenityName }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Stats Card -->
        <div class="card p-stats-card flex flex-col justify-between hover-lift">
          <div class="info-header border-bottom">
            <span class="material-icons-outlined text-indigo">analytics</span>
            <h3>Project Summary</h3>
          </div>
          <div class="stats-row flex justify-between align-center">
            <div class="stat-box">
              <span class="stat-number">{{ property.buildings?.length ?? 0 }}</span>
              <span class="stat-label">Buildings</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">{{ getUnitsCount() }}</span>
              <span class="stat-label">Total Units</span>
            </div>
            <div class="stat-box">
              <span class="stat-number text-green">{{ getAvailableUnitsCount() }}</span>
              <span class="stat-label">Available</span>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="flex justify-between font-xs text-secondary mb-1">
              <span class="font-bold">Sales Progress</span>
              <span class="font-bold">{{ getSoldPercentage() }}% Sold</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="getSoldPercentage()"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Selection -->
      <div class="drawer-tabs flex gap-4" style="margin-top: 32px; border-bottom: 2px solid var(--border-color);">
        <button class="drawer-tab-btn" [class.active]="activeTab === 'overview'" (click)="selectTab('overview')">
          <span class="material-icons-outlined font-sm">domain</span> Buildings & Blocks
        </button>
        <button class="drawer-tab-btn" [class.active]="activeTab === 'units'" (click)="selectTab('units')">
          <span class="material-icons-outlined font-sm">apartment</span> Inventory Units
        </button>
        <button class="drawer-tab-btn" [class.active]="activeTab === 'amenities'" (click)="selectTab('amenities')">
          <span class="material-icons-outlined font-sm">pool</span> Amenities Master
        </button>
        <button class="drawer-tab-btn" [class.active]="activeTab === 'documents'" (click)="selectTab('documents')">
          <span class="material-icons-outlined font-sm">photo_library</span> Media & Documents
        </button>
      </div>

      <!-- TAB 1: Buildings & Blocks -->
      <div class="tab-content animate-fade" *ngIf="activeTab === 'overview'">
        <div class="flex justify-between align-center" style="margin-bottom: 20px;">
          <h3>Sites & Buildings Hierarchy</h3>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm flex align-center gap-2" (click)="openSiteModal()">
              <span class="material-icons-outlined font-sm">add_business</span> Add Site / Phase
            </button>
            <button class="btn btn-primary btn-sm flex align-center gap-2" (click)="openBuildingModal()">
              <span class="material-icons-outlined font-sm">add</span> Add Building
            </button>
          </div>
        </div>

        <!-- Grouped by Site -->
        <div class="sites-container flex flex-col gap-4">
          <div class="site-section card" *ngFor="let site of property.sites" style="overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-card); margin-bottom: 16px;">
            <!-- Site Header -->
            <div class="site-header flex justify-between align-center p-3" style="background: rgba(99, 102, 241, 0.03); border-bottom: 1px solid var(--border-color); padding: 12px 16px; display: flex; align-items: center;">
              <div class="flex align-center gap-2" (click)="toggleSiteCollapse(site.id)" style="cursor: pointer; flex: 1; user-select: none; display: flex; align-items: center;">
                <span class="material-icons-outlined text-secondary" [style.transform]="isSiteCollapsed(site.id) ? 'rotate(-90deg)' : 'none'" style="font-size: 20px; transition: transform 0.2s ease;">expand_more</span>
                <div>
                  <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--color-main);">{{ site.siteName }}</h4>
                  <p class="text-secondary font-xs flex align-center gap-1" style="margin: 2px 0 0 0; display: inline-flex; align-items: center; gap: 4px;" *ngIf="site.siteLocation">
                    <span class="material-icons-outlined" style="font-size: 13px;">location_on</span>
                    {{ site.siteLocation }}
                  </p>
                </div>
              </div>
              <div class="flex align-center gap-3" style="display: flex; align-items: center; gap: 12px;" (click)="$event.stopPropagation()">
                <div class="flex gap-1" style="display: flex; gap: 4px;">
                  <button type="button" class="btn btn-secondary btn-xs" style="padding: 4px; min-width: 28px; height: 28px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center;" (click)="openSiteModal(site)" title="Edit Site">
                    <span class="material-icons-outlined font-sm" style="font-size: 16px;">edit</span>
                  </button>
                  <button type="button" class="btn btn-danger btn-xs" style="padding: 4px; min-width: 28px; height: 28px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); color: var(--color-lost); border: none; display: inline-flex; align-items: center; justify-content: center;" (click)="onDeleteSite(site.id)" title="Delete Site">
                    <span class="material-icons-outlined font-sm" style="font-size: 16px;">delete</span>
                  </button>
                </div>
                <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openBuildingModal(site.id)" style="padding: 4px 10px; font-size: 11px; height: 28px; background-color: var(--brand-primary-light); color: var(--brand-primary); border: none; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px;">
                  <span class="material-icons-outlined font-xs" style="font-size: 14px;">add</span> Add Building
                </button>
              </div>
            </div>

            <!-- Site Buildings Grid -->
            <div class="site-body p-3" *ngIf="!isSiteCollapsed(site.id)" style="padding: 16px;">
              <div class="buildings-list-grid" *ngIf="site.buildings?.length > 0">
                <div class="building-card card hover-lift" *ngFor="let b of site.buildings" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 240px; background: var(--bg-main);">
                  <div class="p-accent-banner"></div>
                  <div class="b-card-content" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 16px;">
                    <div>
                      <div class="b-header flex justify-between align-center" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                          <h4 class="font-bold text-main" style="margin: 0; font-size: 15px;">{{ b.buildingName }}</h4>
                          <span class="badge badge-indigo font-mono" style="margin-top: 4px; display: inline-block;">{{ b.buildingCode }}</span>
                        </div>
                        <button type="button" class="btn btn-secondary btn-xs" style="padding: 4px; min-width: 28px; height: 28px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center;" (click)="openEditBuildingModal(b)" title="Edit Building">
                          <span class="material-icons-outlined font-sm" style="font-size: 16px;">edit</span>
                        </button>
                      </div>

                      <div class="b-details" style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                        <div class="b-detail-item" *ngIf="b.buildingType">
                          <span class="label">Type</span>
                          <span class="val">{{ b.buildingType }}</span>
                        </div>
                        <div class="b-detail-item">
                          <span class="label">Floors</span>
                          <span class="val">{{ b.totalFloors ?? b.floors?.length ?? 0 }}</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.basementFloors">
                          <span class="label">Basement</span>
                          <span class="val">{{ b.basementFloors }}</span>
                        </div>
                        <div class="b-detail-item">
                          <span class="label">Elevators</span>
                          <span class="val">{{ b.elevatorCount ?? 0 }}</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.totalUnits">
                          <span class="label">Total Units</span>
                          <span class="val">{{ b.totalUnits }}</span>
                        </div>
                        <div class="b-detail-item">
                          <span class="label">Completion</span>
                          <span class="val text-indigo">{{ b.completionPercentage ?? 0 }}%</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.constructionStatus">
                          <span class="label">Status</span>
                          <span class="val">{{ b.constructionStatus }}</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.handoverDate">
                          <span class="label">Handover</span>
                          <span class="val">{{ b.handoverDate | date:'mediumDate' }}</span>
                        </div>
                      </div>
                      <p class="text-secondary font-xs mt-2" *ngIf="b.remarks" style="margin-top: 8px; font-style: italic;">{{ b.remarks }}</p>

                      <!-- Floors checklist -->
                      <div class="floors-row mt-3" *ngIf="b.floors?.length > 0" style="margin-top: 12px;">
                        <h5 class="text-secondary font-xs font-bold" style="text-transform: uppercase; letter-spacing: 0.3px; font-size: 10px; margin-bottom: 6px;">Floor Levels:</h5>
                        <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
                          <span *ngFor="let f of b.floors" class="floor-badge" [title]="f.floorType">
                            F{{ f.floorNumber }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="b-footer flex justify-between align-center mt-4 pt-3" style="border-top: 1px solid var(--border-color); margin-top: 16px; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                      <div class="flex gap-2" style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openManageFloorsModal(b)" style="padding: 6px 10px; font-size: 11px; height: 30px; display: inline-flex; align-items: center; gap: 4px;">
                          <span class="material-icons-outlined font-sm" style="font-size: 14px;">settings</span> Manage Floors
                        </button>
                        <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openAddFloorModal(b.id)" style="padding: 6px 10px; font-size: 11px; height: 30px; display: inline-flex; align-items: center; background-color: var(--brand-primary-light); color: var(--brand-primary); border: none; border-radius: var(--radius-sm); gap: 4px;">
                          <span class="material-icons-outlined font-sm" style="font-size: 14px;">add</span> Add Level
                        </button>
                      </div>
                      <button class="btn btn-danger btn-xs flex align-center justify-center" (click)="onDeleteBuilding(b.id)" style="padding: 6px; width: 30px; height: 30px; border-radius: var(--radius-sm); border: none; background-color: rgba(239, 68, 68, 0.1); color: var(--color-lost); display: inline-flex; align-items: center; justify-content: center;" title="Remove Building">
                        <span class="material-icons-outlined font-sm" style="font-size: 16px;">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="site.buildings?.length === 0" class="text-center py-4 text-secondary font-xs italic">
                No buildings registered under this site phase yet.
              </div>
            </div>
          </div>

          <!-- Unassigned Buildings Section -->
          <div class="site-section card" *ngIf="property.unassignedBuildings && property.unassignedBuildings.length > 0" style="overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-card); margin-bottom: 16px;">
            <!-- Header -->
            <div class="site-header flex justify-between align-center p-3" style="background: rgba(0, 0, 0, 0.02); border-bottom: 1px solid var(--border-color); padding: 12px 16px; display: flex; align-items: center;">
              <div class="flex align-center gap-2" (click)="toggleSiteCollapse(0)" style="cursor: pointer; flex: 1; user-select: none; display: flex; align-items: center;">
                <span class="material-icons-outlined text-secondary" [style.transform]="isSiteCollapsed(0) ? 'rotate(-90deg)' : 'none'" style="font-size: 20px; transition: transform 0.2s ease;">expand_more</span>
                <div>
                  <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--color-main);">Unassigned / Legacy Blocks</h4>
                  <p class="text-secondary font-xs" style="margin: 2px 0 0 0;">Buildings not mapped to a specific site phase</p>
                </div>
              </div>
              <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openBuildingModal()" style="padding: 4px 10px; font-size: 11px; height: 28px; background-color: var(--brand-primary-light); color: var(--brand-primary); border: none; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px;">
                <span class="material-icons-outlined font-xs" style="font-size: 14px;">add</span> Add Building
              </button>
            </div>

            <!-- Unassigned Buildings Grid -->
            <div class="site-body p-3" *ngIf="!isSiteCollapsed(0)" style="padding: 16px;">
              <div class="buildings-list-grid">
                <div class="building-card card hover-lift" *ngFor="let b of property.unassignedBuildings" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 240px; background: var(--bg-main);">
                  <div class="p-accent-banner" style="background: linear-gradient(135deg, #a1a1aa 0%, #71717a 100%);"></div>
                  <div class="b-card-content" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 16px;">
                    <div>
                      <div class="b-header flex justify-between align-center" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                          <h4 class="font-bold text-main" style="margin: 0; font-size: 15px;">{{ b.buildingName }}</h4>
                          <span class="badge badge-indigo font-mono" style="margin-top: 4px; display: inline-block;">{{ b.buildingCode }}</span>
                        </div>
                        <button type="button" class="btn btn-secondary btn-xs" style="padding: 4px; min-width: 28px; height: 28px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center;" (click)="openEditBuildingModal(b)" title="Edit Building">
                          <span class="material-icons-outlined font-sm" style="font-size: 16px;">edit</span>
                        </button>
                      </div>

                      <div class="b-details" style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                        <div class="b-detail-item" *ngIf="b.buildingType">
                          <span class="label">Type</span>
                          <span class="val">{{ b.buildingType }}</span>
                        </div>
                        <div class="b-detail-item">
                          <span class="label">Floors</span>
                          <span class="val">{{ b.totalFloors ?? b.floors?.length ?? 0 }}</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.basementFloors">
                          <span class="label">Basement</span>
                          <span class="val">{{ b.basementFloors }}</span>
                        </div>
                        <div class="b-detail-item">
                          <span class="label">Elevators</span>
                          <span class="val">{{ b.elevatorCount ?? 0 }}</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.totalUnits">
                          <span class="label">Total Units</span>
                          <span class="val">{{ b.totalUnits }}</span>
                        </div>
                        <div class="b-detail-item">
                          <span class="label">Completion</span>
                          <span class="val text-indigo">{{ b.completionPercentage ?? 0 }}%</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.constructionStatus">
                          <span class="label">Status</span>
                          <span class="val">{{ b.constructionStatus }}</span>
                        </div>
                        <div class="b-detail-item" *ngIf="b.handoverDate">
                          <span class="label">Handover</span>
                          <span class="val">{{ b.handoverDate | date:'mediumDate' }}</span>
                        </div>
                      </div>
                      <p class="text-secondary font-xs mt-2" *ngIf="b.remarks" style="margin-top: 8px; font-style: italic;">{{ b.remarks }}</p>

                      <!-- Floors checklist -->
                      <div class="floors-row mt-3" *ngIf="b.floors?.length > 0" style="margin-top: 12px;">
                        <h5 class="text-secondary font-xs font-bold" style="text-transform: uppercase; letter-spacing: 0.3px; font-size: 10px; margin-bottom: 6px;">Floor Levels:</h5>
                        <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
                          <span *ngFor="let f of b.floors" class="floor-badge" [title]="f.floorType">
                            F{{ f.floorNumber }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="b-footer flex justify-between align-center mt-4 pt-3" style="border-top: 1px solid var(--border-color); margin-top: 16px; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                      <div class="flex gap-2" style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openManageFloorsModal(b)" style="padding: 6px 10px; font-size: 11px; height: 30px; display: inline-flex; align-items: center; gap: 4px;">
                          <span class="material-icons-outlined font-sm" style="font-size: 14px;">settings</span> Manage Floors
                        </button>
                        <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openAddFloorModal(b.id)" style="padding: 6px 10px; font-size: 11px; height: 30px; display: inline-flex; align-items: center; background-color: var(--brand-primary-light); color: var(--brand-primary); border: none; border-radius: var(--radius-sm); gap: 4px;">
                          <span class="material-icons-outlined font-sm" style="font-size: 14px;">add</span> Add Level
                        </button>
                      </div>
                      <button class="btn btn-danger btn-xs flex align-center justify-center" (click)="onDeleteBuilding(b.id)" style="padding: 6px; width: 30px; height: 30px; border-radius: var(--radius-sm); border: none; background-color: rgba(239, 68, 68, 0.1); color: var(--color-lost); display: inline-flex; align-items: center; justify-content: center;" title="Remove Building">
                        <span class="material-icons-outlined font-sm" style="font-size: 16px;">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Zero State -->
        <div *ngIf="(!property.sites || property.sites.length === 0) && (!property.unassignedBuildings || property.unassignedBuildings.length === 0)" class="text-center py-6 card glass-card" style="padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span class="material-icons-outlined text-secondary" style="font-size: 48px; margin-bottom: 12px; display: block;">domain_disabled</span>
          <p class="text-main font-bold" style="margin: 0; font-size: 16px;">No Sites or Buildings Registered</p>
          <p class="text-secondary font-xs mt-1" style="max-width: 320px; margin: 8px auto 16px; font-size: 13px;">Add a site phase to group your building blocks, or register a flat building block directly.</p>
          <div class="flex justify-center gap-3" style="display: flex; gap: 12px;">
            <button class="btn btn-secondary btn-sm flex align-center gap-1" (click)="openSiteModal()" style="display: inline-flex; align-items: center; gap: 4px;">
              <span class="material-icons-outlined font-xs" style="font-size: 14px;">add_business</span> Add Site Phase
            </button>
            <button class="btn btn-primary btn-sm flex align-center gap-1" (click)="openBuildingModal()" style="display: inline-flex; align-items: center; gap: 4px;">
              <span class="material-icons-outlined font-xs" style="font-size: 14px;">add</span> Add Building Block
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: Units List -->
      <div class="tab-content animate-fade" *ngIf="activeTab === 'units'">
        <div class="flex justify-between align-center" style="margin-bottom: 20px;">
          <h3>Inventory Units</h3>
          <a routerLink="/properties/units" class="btn btn-secondary btn-sm flex align-center gap-1">
            <span>Full Inventory Manager</span>
            <span class="material-icons-outlined font-sm">east</span>
          </a>
        </div>

        <div class="table-container card">
          <table class="leads-table">
            <thead>
              <tr>
                <th>Unit Code</th>
                <th>Unit Number</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Unit Type</th>
                <th>Area (m²)</th>
                <th>Bed / Bath</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of getPropertyUnits()">
                <td class="font-mono font-bold">{{ u.unitCode }}</td>
                <td>{{ u.unitNumber }}</td>
                <td>{{ u.building?.buildingName || '-' }}</td>
                <td>Floor {{ u.floor?.floorNumber ?? '-' }}</td>
                <td>{{ u.unitType?.typeName || '-' }}</td>
                <td>{{ u.areaSuperBuiltup || u.grossArea || '-' }} m²</td>
                <td>{{ u.bedroomCount ?? '-' }} / {{ u.bathroomCount ?? '-' }}</td>
                <td>{{ u.currentPrice ? ('ETB ' + (u.currentPrice | number)) : 'Not Priced' }}</td>
                <td>
                  <span class="badge" [ngStyle]="{'background-color': getStatusColor(u.unitStatus?.colorCode), 'color': '#fff'}">
                    {{ u.unitStatus?.statusName || 'Available' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="getPropertyUnits().length === 0">
                <td colspan="9" class="text-center py-6 text-secondary">
                  No units registered under this property.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: Amenities -->
      <div class="tab-content animate-fade" *ngIf="activeTab === 'amenities'">
        <div class="card p-6">
          <h3 class="border-bottom pb-2 mb-4">Property Amenities Mapping</h3>
          <div class="amenities-checklist">
            <div class="amenity-item-check flex align-center justify-between hover-lift" *ngFor="let am of allAmenities" [class.editing]="editingAmenityId === am.id">
              
              <!-- Normal Mode -->
              <ng-container *ngIf="editingAmenityId !== am.id">
                <div class="flex align-center gap-3" style="flex: 1; overflow: hidden;">
                  <input 
                    type="checkbox" 
                    [id]="'am_' + am.id" 
                    [checked]="hasAmenity(am.id)"
                    (change)="toggleAmenityAssociation(am.id, $event)"
                  />
                  <label [for]="'am_' + am.id" class="flex align-center gap-3" style="cursor: pointer; flex: 1; overflow: hidden;">
                    <div class="amenity-icon-box">
                      <span class="material-icons-outlined">{{ am.icon || 'star_outline' }}</span>
                    </div>
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      <strong class="text-main" style="font-size: 13px; display: block;">{{ am.amenityName }}</strong>
                      <p class="text-secondary font-xs" style="margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ am.description || 'No description provided.' }}</p>
                    </div>
                  </label>
                </div>
                
                <div class="item-actions flex gap-1">
                  <button type="button" class="btn btn-secondary btn-xs action-btn" (click)="startEditAmenity(am, $event)">
                    <span class="material-icons-outlined">edit</span>
                  </button>
                  <button type="button" class="btn btn-danger btn-xs action-btn" (click)="deleteAmenity(am.id, $event)">
                    <span class="material-icons-outlined">delete</span>
                  </button>
                </div>
              </ng-container>

              <!-- Inline Edit Mode -->
              <ng-container *ngIf="editingAmenityId === am.id">
                <div class="flex flex-col gap-2 w-full p-1" (click)="$event.stopPropagation()">
                  <div class="flex gap-2">
                    <input type="text" [(ngModel)]="editAmenityName" class="inline-edit-input" style="flex: 2; margin-right: 0;" placeholder="Amenity Name *" />
                    <input type="text" [(ngModel)]="editAmenityIcon" class="inline-edit-input" style="flex: 1; margin-right: 0;" placeholder="Icon string *" />
                  </div>
                  <input type="text" [(ngModel)]="editAmenityDesc" class="inline-edit-input" placeholder="Description..." />
                  
                  <div class="flex gap-2 justify-end mt-1">
                    <button type="button" class="btn btn-primary btn-xs flex align-center gap-1" (click)="saveEditAmenity(am, $event)">
                      <span class="material-icons-outlined font-sm">check</span> Save
                    </button>
                    <button type="button" class="btn btn-secondary btn-xs flex align-center gap-1" (click)="cancelEditAmenity($event)">
                      <span class="material-icons-outlined font-sm">close</span> Cancel
                    </button>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- Add New Inline Card -->
            <div class="amenity-item-check flex align-center justify-center" style="border: 1px dashed var(--border-color); background: var(--bg-card); min-height: 80px; padding: 12px;">
              <ng-container *ngIf="!isAddingAmenity">
                <button type="button" class="flex align-center justify-center gap-1 w-full text-indigo font-bold font-sm" (click)="isAddingAmenity = true" style="border: none; background: transparent; height: 100%; cursor: pointer;">
                  <span class="material-icons-outlined">add</span>
                  <span>Add New Amenity Master</span>
                </button>
              </ng-container>
              <ng-container *ngIf="isAddingAmenity">
                <div class="flex flex-col gap-2 w-full">
                  <input type="text" [(ngModel)]="newAmenityName" placeholder="New Amenity Name..." class="inline-edit-input" style="width: 100%; margin-right: 0;" (keydown.enter)="saveNewAmenity()" />
                  <div class="flex gap-2 justify-end">
                    <button type="button" class="btn btn-primary btn-xs" (click)="saveNewAmenity()" [disabled]="!newAmenityName.trim()">Save</button>
                    <button type="button" class="btn btn-secondary btn-xs" (click)="isAddingAmenity = false">Cancel</button>
                  </div>
                </div>
              </ng-container>
            </div>

            <div *ngIf="allAmenities.length === 0 && !isAddingAmenity" class="text-center py-6 text-secondary italic" style="grid-column: 1 / -1;">
              No amenities registered in master database.
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: Documents and Media -->
      <div class="tab-content animate-fade" *ngIf="activeTab === 'documents'">
        <div class="docs-media-grid">
          <!-- Documents Upload -->
          <div class="card">
            <div class="info-header border-bottom">
              <span class="material-icons-outlined text-indigo">folder</span>
              <h3>Project Documents</h3>
            </div>
            <div class="upload-box border mt-3 p-3 flex flex-col gap-2 bg-main" style="border-radius: var(--radius-md);">
              <label class="font-bold font-sm">Upload New Document</label>
              <input type="file" (change)="onFileSelected($event, 'doc')" style="padding: 6px; border: 1px dashed var(--border-color); background: white; border-radius: var(--radius-sm);" />
              <div class="form-row flex gap-2">
                <div class="flex-1 flex flex-col">
                  <label class="font-xs text-secondary">Document Name</label>
                  <input type="text" [(ngModel)]="docName" placeholder="Custom document name" style="background: white;" />
                </div>
                <div class="flex-1 flex flex-col">
                  <label class="font-xs text-secondary">Category</label>
                  <select [(ngModel)]="docCategory" style="flex: 1; background: white;">
                    <option value="Title Deed">Title Deed</option>
                    <option value="Construction Permit">Construction Permit</option>
                    <option value="Ground Layout">Ground Layout</option>
                    <option value="Registry Agreement">Registry Agreement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div class="form-row flex gap-2">
                <div class="flex-1 flex flex-col">
                  <label class="font-xs text-secondary">Version Number</label>
                  <input type="number" [(ngModel)]="docVersionNumber" min="1" style="background: white;" />
                </div>
                <div class="flex-1 flex flex-col">
                  <label class="font-xs text-secondary">Expiry Date</label>
                  <input type="date" [(ngModel)]="docExpiryDate" style="background: white;" />
                </div>
              </div>
              <div class="flex flex-col">
                <label class="font-xs text-secondary">Remarks</label>
                <input type="text" [(ngModel)]="docRemarks" placeholder="Notes about this document" style="background: white;" />
              </div>
              <div class="flex justify-end mt-1">
                <button class="btn btn-primary btn-sm" (click)="onUploadDocument()">Upload</button>
              </div>
            </div>
            
            <div class="attachments-list flex flex-col gap-2 mt-4">
              <div *ngFor="let d of property.documents" class="attachment-card border bg-main flex justify-between align-center p-3">
                <div class="flex align-center gap-3" style="flex: 1; overflow: hidden;">
                  <div class="doc-icon-box">
                    <span class="material-icons-outlined">description</span>
                  </div>
                  <div class="flex flex-col" style="overflow: hidden;">
                    <span class="font-bold font-sm text-main">{{ d.documentName }}</span>
                    <span class="text-secondary font-xs">
                      {{ d.documentCategory }} • {{ (d.fileSize / 1024) | number:'1.0-0' }} KB
                      <span *ngIf="d.versionNumber"> • v{{ d.versionNumber }}</span>
                    </span>
                    <span class="text-secondary font-xs" *ngIf="d.expiryDate">Expires: {{ d.expiryDate | date:'mediumDate' }}</span>
                    <span class="text-secondary font-xs" *ngIf="d.remarks" style="font-style: italic;">{{ d.remarks }}</span>
                  </div>
                </div>
                <a [href]="env.serverUrl + d.filePath" target="_blank" class="btn btn-secondary btn-xs flex align-center gap-1">
                  <span class="material-icons-outlined font-xs">file_download</span>
                  <span>Download</span>
                </a>
              </div>
              <div *ngIf="!property.documents || property.documents.length === 0" class="text-center py-6 text-secondary italic font-sm">
                No project documents uploaded yet.
              </div>
            </div>
          </div>

          <!-- Media Gallery -->
          <div class="card">
            <div class="info-header border-bottom">
              <span class="material-icons-outlined text-indigo">photo_library</span>
              <h3>Property Media Gallery</h3>
            </div>
            <div class="upload-box border mt-3 p-3 flex flex-col gap-2 bg-main" style="border-radius: var(--radius-md);">
              <label class="font-bold font-sm">Upload Photo / Video</label>
              <input type="file" (change)="onFileSelected($event, 'media')" style="padding: 6px; border: 1px dashed var(--border-color); background: white; border-radius: var(--radius-sm);" />
              <div class="form-row flex gap-2">
                <div class="flex-1 flex flex-col">
                  <label class="font-xs text-secondary">Media Type</label>
                  <select [(ngModel)]="mediaType" style="background: white;">
                    <option value="Photo">Photo</option>
                    <option value="Video">Video</option>
                    <option value="3D Tour">3D Tour</option>
                    <option value="Drone Shot">Drone Shot</option>
                  </select>
                </div>
                <div class="flex-1 flex flex-col">
                  <label class="font-xs text-secondary">Display Order</label>
                  <input type="number" [(ngModel)]="mediaDisplayOrder" min="0" style="background: white;" />
                </div>
              </div>
              <div class="flex justify-between align-center mt-1">
                <div class="flex align-center gap-2">
                  <input type="checkbox" id="featured_media" [(ngModel)]="isFeatured" />
                  <label for="featured_media" class="font-sm font-bold text-secondary">Featured Cover Photo</label>
                </div>
                <button class="btn btn-primary btn-sm" (click)="onUploadMedia()">Upload Photo</button>
              </div>
            </div>

            <div class="media-grid-row flex flex-wrap gap-3 mt-4">
              <div *ngFor="let m of property.media" class="media-box border relative hover-lift" style="width: calc(33.333% - 10px); min-width: 110px;">
                <img [src]="env.serverUrl + m.filePath" style="width: 100%; height: 95px; object-fit: cover;" />
                <span class="badge absolute top-2 right-2 badge-xs" [class.badge-qualified]="m.isFeatured" [class.badge-low]="!m.isFeatured" style="font-size: 8px; padding: 2px 5px; color: white;">
                  {{ m.isFeatured ? 'Cover' : (m.mediaType || 'Gallery') }}
                </span>
              </div>
              <div *ngIf="!property.media || property.media.length === 0" class="text-center py-6 text-secondary italic font-sm" style="width: 100%;">
                No gallery photos uploaded yet.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Building Modal -->
      <div class="modal-overlay" *ngIf="showBuildingModal" (click)="closeBuildingModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header flex justify-between align-center">
            <h2>{{ isEditingBuilding ? 'Edit Building Block' : 'Add Building Block' }}</h2>
            <button class="header-icon-btn" (click)="closeBuildingModal()"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body">
            <form class="modal-form" (submit)="onSubmitBuilding($event)">
              
              <div class="alert alert-danger" *ngIf="buildingErrorMessage" style="margin-bottom: 16px; padding: 10px 14px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 13px; display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-outlined" style="font-size: 18px;">error_outline</span>
                <span>{{ buildingErrorMessage }}</span>
              </div>
              <div class="form-group flex flex-col">
                <label>Site Phase / Plot Association</label>
                <select [(ngModel)]="newBuilding.siteId" name="siteId">
                  <option [ngValue]="null">Unassigned / None</option>
                  <option *ngFor="let s of property.sites" [value]="s.id">{{ s.siteName }}</option>
                </select>
              </div>
              <div class="form-group flex flex-col">
                <label>Building Code <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="newBuilding.buildingCode" name="bCode" required placeholder="e.g. BLK-A" />
              </div>
              <div class="form-group flex flex-col">
                <label>Building Name <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="newBuilding.buildingName" name="bName" required placeholder="e.g. Block A" />
              </div>
              <div class="form-group flex flex-col">
                <label>Building Type</label>
                <input type="text" [(ngModel)]="newBuilding.buildingType" name="bType" placeholder="e.g. Residential, Commercial" />
              </div>
              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Total Floors</label>
                  <input type="number" [(ngModel)]="newBuilding.totalFloors" name="totalFloors" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Basement Floors</label>
                  <input type="number" [(ngModel)]="newBuilding.basementFloors" name="basementFloors" />
                </div>
              </div>
              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Elevators</label>
                  <input type="number" [(ngModel)]="newBuilding.elevatorCount" name="elevators" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Completion %</label>
                  <input type="number" [(ngModel)]="newBuilding.completionPercentage" name="progress" />
                </div>
              </div>
              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Total Units</label>
                  <input type="number" [(ngModel)]="newBuilding.totalUnits" name="totalUnits" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Construction Status</label>
                  <input type="text" [(ngModel)]="newBuilding.constructionStatus" name="constStatus" placeholder="e.g. Under Construction" />
                </div>
              </div>
              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Handover Date</label>
                  <input type="date" [(ngModel)]="newBuilding.handoverDate" name="handover" />
                </div>
              </div>
              <div class="form-group flex flex-col">
                <label>Remarks</label>
                <textarea [(ngModel)]="newBuilding.remarks" name="remarks" rows="2"></textarea>
              </div>
              <div class="modal-footer flex justify-end gap-3">
                <button type="button" class="btn btn-secondary" (click)="closeBuildingModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!newBuilding.buildingCode || !newBuilding.buildingName">
                  {{ isEditingBuilding ? 'Save Changes' : 'Save Block' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Add/Edit Site Modal -->
      <div class="modal-overlay" *ngIf="showSiteModal" (click)="closeSiteModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header flex justify-between align-center">
            <h2>{{ isEditingSite ? 'Edit Site Phase' : 'Add Site Phase' }}</h2>
            <button class="header-icon-btn" (click)="closeSiteModal()"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body">
            <form class="modal-form" (submit)="onSubmitSite($event)">
              <div class="alert alert-danger" *ngIf="siteErrorMessage" style="margin-bottom: 16px; padding: 10px 14px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 13px; display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-outlined" style="font-size: 18px;">error_outline</span>
                <span>{{ siteErrorMessage }}</span>
              </div>
              <div class="form-group flex flex-col">
                <label>Site / Phase Name <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="siteForm.siteName" name="siteName" required placeholder="e.g. Phase 2, Plot B Complex" />
              </div>
              <div class="form-group flex flex-col">
                <label>Site Location</label>
                <input type="text" [(ngModel)]="siteForm.siteLocation" name="siteLocation" placeholder="e.g. North Sector, Addis Ababa" />
              </div>
              <div class="modal-footer flex justify-end gap-3" style="margin-top: 20px;">
                <button type="button" class="btn btn-secondary" (click)="closeSiteModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!siteForm.siteName.trim()">Save Site</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Add Floor Modal -->
      <div class="modal-overlay" *ngIf="showFloorModal" (click)="closeFloorModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header flex justify-between align-center">
            <h2>Generate Floor Plan Levels</h2>
            <button class="header-icon-btn" (click)="closeFloorModal()"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body">
            <form class="modal-form" (submit)="onSubmitFloor($event)">
              
              <div class="alert alert-danger" *ngIf="floorErrorMessage" style="margin-bottom: 16px; padding: 10px 14px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 13px; display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-outlined" style="font-size: 18px;">error_outline</span>
                <span>{{ floorErrorMessage }}</span>
              </div>
              <div class="form-group flex flex-col">
                <label>Project / Property <span class="text-danger" style="color: #ef4444;">*</span></label>
                <select [(ngModel)]="selectedPropertyIdForFloor" name="selectedPropertyIdForFloor" required (change)="onPropertyChangeInFloorModal()">
                  <option [ngValue]="null" disabled>Select Project / Property</option>
                  <option *ngFor="let p of allProperties" [ngValue]="p.id">{{ p.propertyName }}</option>
                </select>
              </div>
              <div class="form-group flex flex-col">
                <label>Building Block <span class="text-danger" style="color: #ef4444;">*</span></label>
                <select [(ngModel)]="selectedBuildingIdForFloor" name="selectedBuildingIdForFloor" required>
                  <option [ngValue]="null" disabled>Select Building Block</option>
                  <option *ngFor="let b of buildingsListForFloorModal" [ngValue]="b.id">{{ b.buildingName }} ({{ b.buildingCode }})</option>
                </select>
              </div>
              <div class="form-group flex flex-col">
                <label>Floor Number <span class="text-danger" style="color: red;">*</span></label>
                <input type="number" [(ngModel)]="newFloor.floorNumber" name="fNum" required />
              </div>
              <div class="form-group flex flex-col">
                <label>Floor Name <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="newFloor.floorName" name="fName" required placeholder="e.g. Ground Floor, 2nd Floor" />
              </div>
              <div class="form-group flex flex-col">
                <label>Floor Type</label>
                <select [(ngModel)]="newFloor.floorType" name="fType">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Parking">Parking</option>
                  <option value="Amenities">Amenities</option>
                </select>
              </div>
              <div class="form-group flex flex-col">
                <label>Total Units</label>
                <input type="number" [(ngModel)]="newFloor.totalUnits" name="totalUnits" />
              </div>
              <div class="form-group flex flex-col">
                <label>Remarks</label>
                <textarea [(ngModel)]="newFloor.remarks" name="remarks" rows="2"></textarea>
              </div>

              <!-- Optional Floor Plan Section -->
              <div class="card mt-4 p-4" style="background-color: var(--bg-main); border: 1px dashed var(--border-color); border-radius: var(--radius-md); margin-top: 16px; padding: 12px;">
                <h4 class="font-bold text-main mb-2" style="font-size: 13px; margin-bottom: 8px;">Optional: Associate Floor Plan Blueprint</h4>
                <div class="form-group flex flex-col">
                  <label class="font-xs" style="font-size: 11px;">Blueprint File (.png, .jpg, .pdf)</label>
                  <input type="file" (change)="onFloorPlanFileSelected($event, 'create')" style="padding: 6px; font-size: 12px; background: white;" />
                </div>
                <div class="form-row flex gap-3 mt-2" *ngIf="floorPlanFile" style="display: flex; gap: 8px; margin-top: 8px;">
                  <div class="form-group flex-1 flex flex-col">
                    <label class="font-xs" style="font-size: 11px;">Blueprint Name *</label>
                    <input type="text" [(ngModel)]="floorPlanName" name="fpName" placeholder="e.g. Floor 1 Layout" />
                  </div>
                  <div class="form-group flex-1 flex flex-col">
                    <label class="font-xs" style="font-size: 11px;">Version</label>
                    <input type="number" [(ngModel)]="floorPlanVersion" name="fpVersion" min="1" />
                  </div>
                </div>
                <div class="form-group flex flex-col mt-2" *ngIf="floorPlanFile" style="margin-top: 8px;">
                  <label class="font-xs" style="font-size: 11px;">Remarks / Scope details</label>
                  <input type="text" [(ngModel)]="floorPlanRemarks" name="fpRemarks" placeholder="Notes for this plan..." />
                </div>
              </div>

              <div class="modal-footer flex justify-end gap-3" style="margin-top: 16px;">
                <button type="button" class="btn btn-secondary" (click)="closeFloorModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!newFloor.floorName || selectedPropertyIdForFloor === null || selectedBuildingIdForFloor === null">Save Floor</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit Property Modal -->
      <div class="modal-overlay" *ngIf="showEditModal" (click)="closeEditModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header flex justify-between align-center">
            <h2>Edit Property / Project Details</h2>
            <button class="header-icon-btn" (click)="closeEditModal()"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body">
            <form class="modal-form" (submit)="onSubmitEditProperty($event)">
              
              <div class="alert alert-danger" *ngIf="editErrorMessage" style="margin-bottom: 16px; padding: 10px 14px; border-radius: var(--radius-sm); background-color: rgba(239, 68, 68, 0.1); border: 1px solid var(--color-lost); color: var(--color-lost); font-size: 13px; display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-outlined" style="font-size: 18px;">error_outline</span>
                <span>{{ editErrorMessage }}</span>
              </div>

              <div class="form-group flex flex-col">
                <label>Property Code (Read-Only)</label>
                <input type="text" [value]="property.propertyCode" disabled style="background-color: var(--bg-main); color: var(--text-secondary); cursor: not-allowed;" />
              </div>

              <div class="form-group flex flex-col">
                <label>Property Name *</label>
                <input type="text" [(ngModel)]="editProperty.propertyName" name="propertyName" required placeholder="e.g. Green View Towers" />
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Property Type *</label>
                  <app-dynamic-dropdown
                    [options]="propertyTypes"
                    [(value)]="editProperty.propertyTypeId"
                    displayKey="typeName"
                    valueKey="id"
                    placeholder="Select Property Type"
                    (add)="onAddPropertyType($event)"
                    (edit)="onEditPropertyType($event)"
                    (delete)="onDeletePropertyType($event)"
                  ></app-dynamic-dropdown>
                </div>
              </div>

              <div class="form-group flex flex-col">
                <label>Description</label>
                <textarea [(ngModel)]="editProperty.description" name="description" placeholder="Project overview..." rows="3"></textarea>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Country</label>
                  <input type="text" [(ngModel)]="editProperty.country" name="country" placeholder="Ethiopia" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>City</label>
                  <input type="text" [(ngModel)]="editProperty.city" name="city" placeholder="Addis Ababa" />
                </div>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Sub-City</label>
                  <input type="text" [(ngModel)]="editProperty.subCity" name="subCity" placeholder="Bole" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Address Details</label>
                  <input type="text" [(ngModel)]="editProperty.address" name="address" placeholder="Behind Skylight Hotel" />
                </div>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Latitude</label>
                  <input type="number" [(ngModel)]="editProperty.latitude" name="latitude" placeholder="e.g. 9.0300" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Longitude</label>
                  <input type="number" [(ngModel)]="editProperty.longitude" name="longitude" placeholder="e.g. 38.7400" />
                </div>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Total Land Area (m²)</label>
                  <input type="number" [(ngModel)]="editProperty.totalLandArea" name="totalLandArea" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Total Built-up Area (m²)</label>
                  <input type="number" [(ngModel)]="editProperty.totalBuiltupArea" name="totalBuiltupArea" />
                </div>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Launch Date</label>
                  <input type="date" [(ngModel)]="editProperty.launchDate" name="launchDate" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Completion Date</label>
                  <input type="date" [(ngModel)]="editProperty.completionDate" name="completionDate" />
                </div>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Property Status</label>
                  <select [(ngModel)]="editProperty.propertyStatus" name="propertyStatus">
                    <option value="">Select Status</option>
                    <option value="Planned">Planned</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Completed">Completed</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Developer Name</label>
                  <input type="text" [(ngModel)]="editProperty.developerName" name="developerName" />
                </div>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Contact Phone</label>
                  <input type="text" [(ngModel)]="editProperty.contactPhone" name="contactPhone" />
                </div>
                <div class="form-group flex-1 flex flex-col">
                  <label>Contact Email</label>
                  <input type="email" [(ngModel)]="editProperty.contactEmail" name="contactEmail" />
                </div>
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 flex flex-col">
                  <label>Website</label>
                  <input type="url" [(ngModel)]="editProperty.website" name="website" placeholder="https://" />
                </div>
              </div>

              <div class="form-group flex flex-col">
                <label>Remarks</label>
                <textarea [(ngModel)]="editProperty.remarks" name="remarks" placeholder="Additional notes..." rows="2"></textarea>
              </div>

              <div class="modal-footer flex justify-end gap-3">
                <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!editProperty.propertyName || !editProperty.propertyTypeId">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Manage Building Floors Modal -->
      <div class="modal-overlay" *ngIf="showManageFloorsModal" (click)="closeManageFloorsModal()">
        <div class="modal-container" style="max-width: 700px;" (click)="$event.stopPropagation()">
          <div class="modal-header flex justify-between align-center">
            <div>
              <h2>Manage Floors: {{ selectedBuildingForManage?.buildingName }}</h2>
              <p class="font-xs text-secondary mt-1">Directory of floor levels and blueprints</p>
            </div>
            <button class="header-icon-btn" (click)="closeManageFloorsModal()"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body">
            <div class="flex flex-col gap-3" style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
              
              <div *ngFor="let f of selectedBuildingForManage?.floors" class="card border p-3 flex justify-between align-center hover-lift" style="display: flex; justify-content: space-between; align-items: center; border-radius: var(--radius-md); padding: 16px; background-color: var(--bg-main); border: 1px solid var(--border-color); transition: transform 0.2s ease;">
                
                <!-- Floor Info -->
                <div class="flex align-center gap-3" style="display: flex; align-items: center; gap: 12px;">
                  <!-- Large Level Circle Badge -->
                  <div class="flex align-center justify-center font-bold" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: var(--radius-round); background: var(--brand-primary-light); color: var(--brand-primary); font-size: 15px; flex-shrink: 0;">
                    F{{ f.floorNumber }}
                  </div>
                  <div>
                    <h4 class="font-bold text-main" style="margin: 0; font-size: 14px;">{{ f.floorName }}</h4>
                    <div class="flex align-center gap-2 mt-1" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                      <span class="badge badge-indigo font-xs" style="font-size: 11px; padding: 2px 6px;">{{ f.floorType }}</span>
                      <span class="text-secondary font-xs" style="font-size: 11px;">• {{ f.units?.length ?? 0 }} / {{ f.totalUnits ?? 0 }} Units</span>
                    </div>
                  </div>
                </div>

                <!-- Blueprint Info -->
                <div class="flex-1 px-4" style="flex: 1; padding: 0 16px;">
                  <div *ngIf="f.floorPlan" class="flex align-center gap-2" style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-icons-outlined text-indigo" style="font-size: 18px;">file_present</span>
                    <div style="font-size: 12px; line-height: 1.2;">
                      <strong class="text-main" style="display: block;">{{ f.floorPlan.planName }}</strong>
                      <span class="text-secondary font-xs">Version {{ f.floorPlan.versionNumber || 1 }}</span>
                    </div>
                  </div>
                  <div *ngIf="!f.floorPlan" class="text-secondary font-xs italic flex align-center gap-2" style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                    <span class="material-icons-outlined text-muted" style="font-size: 18px;">broken_image</span>
                    <span>No blueprint associated</span>
                  </div>
                </div>

                <!-- Action Button Group -->
                <div class="flex gap-2" style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-xs flex align-center gap-1" (click)="openEditFloorModal(f)" style="padding: 6px 12px; font-size: 12px; height: 32px; display: inline-flex; align-items: center;">
                    <span class="material-icons-outlined font-sm" style="font-size: 14px;">edit</span> Edit
                  </button>
                  <button class="btn btn-danger btn-xs flex align-center justify-center" (click)="onDeleteFloor(f.id)" style="padding: 6px; width: 32px; height: 32px; border-radius: var(--radius-sm); border: none; background-color: rgba(239, 68, 68, 0.1); color: var(--color-lost); display: inline-flex; align-items: center; justify-content: center;" title="Delete Level">
                    <span class="material-icons-outlined font-sm" style="font-size: 16px;">delete</span>
                  </button>
                </div>

              </div>

              <!-- Fallback -->
              <div *ngIf="!selectedBuildingForManage?.floors || selectedBuildingForManage.floors.length === 0" class="text-center py-6 text-secondary italic border-dashed p-4" style="border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                No floors registered for this building block yet.
              </div>

            </div>
          </div>
          <div class="modal-footer flex justify-end gap-3">
            <button type="button" class="btn btn-secondary" (click)="closeManageFloorsModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- Edit Floor Modal -->
      <div class="modal-overlay" *ngIf="showEditFloorModal" (click)="closeEditFloorModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header flex justify-between align-center">
            <h2>Edit Floor: {{ editFloor?.floorName }}</h2>
            <button class="header-icon-btn" (click)="closeEditFloorModal()"><span class="material-icons-outlined">close</span></button>
          </div>
          <div class="modal-body">
            <form class="modal-form" (submit)="onSubmitEditFloor($event)">
              <div class="form-group flex flex-col">
                <label>Floor Number <span class="text-danger" style="color: red;">*</span></label>
                <input type="number" [(ngModel)]="editFloor.floorNumber" name="fNum" required />
              </div>
              <div class="form-group flex flex-col">
                <label>Floor Name <span class="text-danger" style="color: red;">*</span></label>
                <input type="text" [(ngModel)]="editFloor.floorName" name="fName" required />
              </div>
              <div class="form-group flex flex-col">
                <label>Floor Type</label>
                <select [(ngModel)]="editFloor.floorType" name="fType">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Parking">Parking</option>
                  <option value="Amenities">Amenities</option>
                </select>
              </div>
              <div class="form-group flex flex-col">
                <label>Total Units</label>
                <input type="number" [(ngModel)]="editFloor.totalUnits" name="totalUnits" />
              </div>
              <div class="form-group flex flex-col">
                <label>Remarks</label>
                <textarea [(ngModel)]="editFloor.remarks" name="remarks" rows="2"></textarea>
              </div>

              <!-- Floor Plan Blueprint Edit Section -->
              <div class="card mt-4 p-4" style="background-color: var(--bg-main); border: 1px dashed var(--border-color); border-radius: var(--radius-md); margin-top: 16px; padding: 12px;">
                <h4 class="font-bold text-main mb-2" style="font-size: 13px; margin-bottom: 8px;">Upload / Update Floor Plan Blueprint</h4>
                <div *ngIf="editFloor?.floorPlan" class="mb-3 p-2 bg-white border" style="border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 12px;">
                  <span class="font-bold text-indigo">Active Blueprint:</span> {{ editFloor.floorPlan.planName }} (v{{ editFloor.floorPlan.versionNumber || 1 }})
                  <p class="text-secondary font-xs italic mt-1" *ngIf="editFloor.floorPlan.remarks">{{ editFloor.floorPlan.remarks }}</p>
                </div>
                <div class="form-group flex flex-col">
                  <label class="font-xs" style="font-size: 11px;">Blueprint File (.png, .jpg, .pdf)</label>
                  <input type="file" (change)="onFloorPlanFileSelected($event, 'edit')" style="padding: 6px; font-size: 12px; background: white;" />
                </div>
                <div class="form-row flex gap-3 mt-2" *ngIf="editFloorPlanFile" style="display: flex; gap: 8px; margin-top: 8px;">
                  <div class="form-group flex-1 flex flex-col">
                    <label class="font-xs" style="font-size: 11px;">Blueprint Name *</label>
                    <input type="text" [(ngModel)]="editFloorPlanName" name="editFpName" placeholder="e.g. Floor 1 Layout" />
                  </div>
                  <div class="form-group flex-1 flex flex-col">
                    <label class="font-xs" style="font-size: 11px;">Version</label>
                    <input type="number" [(ngModel)]="editFloorPlanVersion" name="editFpVersion" min="1" />
                  </div>
                </div>
                <div class="form-group flex flex-col mt-2" *ngIf="editFloorPlanFile" style="margin-top: 8px;">
                  <label class="font-xs" style="font-size: 11px;">Remarks / Scope details</label>
                  <input type="text" [(ngModel)]="editFloorPlanRemarks" name="editFpRemarks" placeholder="Notes for this plan..." />
                </div>
              </div>

              <div class="modal-footer flex justify-end gap-3" style="margin-top: 16px;">
                <button type="button" class="btn btn-secondary" (click)="closeEditFloorModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!editFloor.floorName">Save Floor</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prop-details-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }
    .p-info-card .description {
      font-size: 14px;
      color: var(--text-main);
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .details-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
    }
    .details-item {
      display: flex;
      justify-content: space-between;
    }
    .details-item .label {
      color: var(--text-secondary);
      font-weight: 500;
    }
    .details-item .val {
      color: var(--text-main);
      font-weight: 600;
    }
    .stats-row {
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 0;
      margin: 16px 0;
    }
    .stat-box {
      text-align: center;
    }
    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: var(--brand-primary);
      display: block;
    }
    .stat-label {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
    }
    .progress-track {
      height: 8px;
      background-color: var(--bg-main);
      border-radius: var(--radius-round);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background-color: var(--color-qualified);
      border-radius: var(--radius-round);
    }
    .tab-content {
      margin-top: 24px;
    }
    .buildings-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .building-card {
      display: flex;
      flex-direction: column;
    }
    .building-card h4 {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
    }
    .b-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
      margin-top: 12px;
      text-align: center;
    }
    .b-detail-item {
      display: flex;
      flex-direction: column;
    }
    .b-detail-item .label {
      font-size: 10px;
      color: var(--text-secondary);
      text-transform: uppercase;
    }
    .b-detail-item .val {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
    }
    .floor-badge {
      font-size: 11px;
      font-weight: 700;
      background-color: var(--brand-primary-light);
      color: var(--brand-primary);
      padding: 3px 8px;
      border-radius: 4px;
    }
    .amenities-checklist {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .amenity-item-check {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px;
      background-color: var(--bg-main);
      cursor: pointer;
      position: relative;
      transition: var(--transition-normal);
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 80px;
    }
    .amenity-item-check.editing {
      background-color: var(--bg-card);
      border-color: var(--brand-primary);
      cursor: default;
    }
    .item-actions {
      opacity: 0;
      transition: opacity 0.2s ease;
      display: flex;
      gap: 4px;
    }
    .amenity-item-check:hover .item-actions {
      opacity: 1;
    }
    .amenity-item-check .action-btn {
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .amenity-item-check .action-btn span {
      font-size: 16px;
    }
    .inline-edit-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 13px;
      outline: none;
      background-color: var(--bg-card);
      transition: var(--transition-fast);
    }
    .inline-edit-input:focus {
      border-color: var(--brand-primary);
    }
    .docs-media-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    .media-box {
      width: calc(33.333% - 8px);
      min-width: 100px;
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .badge-xs {
      font-size: 9px;
      padding: 2px 6px;
    }
  `]
})
export class PropertiesDetailsComponent implements OnInit {
  env = environment;
  private route = inject(ActivatedRoute);
  private propertiesService = inject(PropertiesService);
  private cdr = inject(ChangeDetectorRef);

  property: any = null;
  allAmenities: any[] = [];
  activeTab = 'overview';
  allProperties: any[] = [];
  selectedPropertyIdForFloor: number | null = null;
  selectedBuildingIdForFloor: number | null = null;
  buildingsListForFloorModal: any[] = [];

  // Edit property modal state
  showEditModal = false;
  editProperty: any = {};
  editErrorMessage = '';
  propertyTypes: any[] = [];

  // Building modal state
  showBuildingModal = false;
  isEditingBuilding = false;
  editingBuildingId: number | null = null;
  newBuilding = {
    buildingCode: '',
    buildingName: '',
    buildingType: '',
    totalFloors: 0,
    basementFloors: 0,
    elevatorCount: 2,
    totalUnits: 0,
    constructionStatus: '',
    completionPercentage: 0,
    handoverDate: '',
    remarks: '',
    siteId: null as number | null
  };

  // Site modal state
  showSiteModal = false;
  isEditingSite = false;
  editingSiteId: number | null = null;
  siteForm = {
    siteName: '',
    siteLocation: '',
  };
  siteErrorMessage = '';
  collapsedSites: { [key: number]: boolean } = {};

  toggleSiteCollapse(siteId: number) {
    this.collapsedSites[siteId] = !this.collapsedSites[siteId];
    this.cdr.detectChanges();
  }

  isSiteCollapsed(siteId: number): boolean {
    return !!this.collapsedSites[siteId];
  }

  // Floor modal state
  showFloorModal = false;
  selectedBuildingId: number | null = null;
  newFloor = {
    floorNumber: 1,
    floorName: '',
    floorType: 'Residential',
    totalUnits: 0,
    remarks: ''
  };

  // Manage building floors state
  showManageFloorsModal = false;
  showEditFloorModal = false;
  selectedBuildingForManage: any = null;
  editFloor: any = null;

  // Blueprint Upload state for create
  floorPlanFile: File | null = null;
  floorPlanName = '';
  floorPlanVersion = 1;
  floorPlanRemarks = '';

  // Blueprint Upload state for edit
  editFloorPlanFile: File | null = null;
  editFloorPlanName = '';
  editFloorPlanVersion = 1;
  editFloorPlanRemarks = '';

  // Upload state
  selectedFile: File | null = null;
  docCategory = 'Title Deed';
  docName = '';
  docVersionNumber = 1;
  docExpiryDate = '';
  docRemarks = '';
  isFeatured = false;
  mediaType = 'Photo';
  mediaDisplayOrder = 0;

  // Inline Amenities state
  editingAmenityId: number | null = null;
  editAmenityName = '';
  editAmenityIcon = '';
  editAmenityDesc = '';

  isAddingAmenity = false;
  newAmenityName = '';

  buildingErrorMessage = '';
  floorErrorMessage = '';

  ngOnInit() {
    this.loadPropertyDetails();
    this.loadAmenities();
    this.loadPropertyTypes();
  }

  selectTab(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  loadPropertyDetails() {
    const id = +this.route.snapshot.params['id'];
    this.propertiesService.getProperty(id).subscribe({
      next: (res) => {
        this.property = res;
        this.refreshSelectedBuildingForManage();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading property details:', err)
    });
  }

  refreshSelectedBuildingForManage() {
    if (this.selectedBuildingForManage && this.property) {
      const bld = this.property.buildings?.find((b: any) => +b.id === +this.selectedBuildingForManage.id);
      if (bld) {
        this.selectedBuildingForManage = bld;
      }
    }
  }

  loadAmenities() {
    this.propertiesService.getAmenities().subscribe({
      next: (res) => {
        this.allAmenities = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading master amenities:', err)
    });
  }

  getUnitsCount(): number {
    if (!this.property || !this.property.buildings) return 0;
    return this.property.buildings.reduce((sum: number, b: any) => {
      const bUnits = b.floors?.reduce((fSum: number, f: any) => fSum + (f.units?.length ?? 0), 0) ?? 0;
      return sum + bUnits;
    }, 0);
  }

  getAvailableUnitsCount(): number {
    if (!this.property || !this.property.buildings) return 0;
    return this.property.buildings.reduce((sum: number, b: any) => {
      const bAvailable = b.floors?.reduce((fSum: number, f: any) => {
        const aUnits = f.units?.filter((u: any) => u.unitStatus?.statusName === 'Available').length ?? 0;
        return fSum + aUnits;
      }, 0) ?? 0;
      return sum + bAvailable;
    }, 0);
  }

  getPropertyUnits(): any[] {
    if (!this.property || !this.property.buildings) return [];
    const list: any[] = [];
    this.property.buildings.forEach((b: any) => {
      b.floors?.forEach((f: any) => {
        f.units?.forEach((u: any) => {
          list.push({ ...u, building: b, floor: f });
        });
      });
    });
    return list;
  }

  getSoldPercentage(): number {
    const total = this.getUnitsCount();
    if (total === 0) return 0;
    if (!this.property || !this.property.buildings) return 0;
    const sold = this.property.buildings.reduce((sum: number, b: any) => {
      const bSold = b.floors?.reduce((fSum: number, f: any) => {
        const sUnits = f.units?.filter((u: any) => u.unitStatus?.statusName === 'Sold').length ?? 0;
        return fSum + sUnits;
      }, 0) ?? 0;
      return sum + bSold;
    }, 0);
    return Math.round((sold / total) * 100);
  }

  getStatusColor(color: string | undefined): string {
    return color || '#28a745';
  }

  // --- Dynamic Amenities Association Checkbox mapping ---
  hasAmenity(amenityId: number): boolean {
    if (!this.property || !this.property.amenities) return false;
    return this.property.amenities.some((a: any) => +a.id === +amenityId || (a.amenity && +a.amenity.id === +amenityId));
  }

  toggleAmenityAssociation(amenityId: number, event: any) {
    const checked = event.target.checked;
    let currentIds = (this.property.amenities || []).map((a: any) => +a.id) as number[];
    if (checked) {
      if (!currentIds.includes(+amenityId)) {
        currentIds.push(+amenityId);
      }
    } else {
      currentIds = currentIds.filter(id => +id !== +amenityId);
    }

    this.propertiesService.updateProperty(this.property.id, {
      amenityIds: currentIds
    }).subscribe({
      next: () => {
        this.loadPropertyDetails();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error updating property amenities:', err)
    });
  }

  startEditAmenity(am: any, event: Event) {
    event.stopPropagation();
    this.editingAmenityId = am.id;
    this.editAmenityName = am.amenityName;
    this.editAmenityIcon = am.icon || 'star_outline';
    this.editAmenityDesc = am.description || '';
    this.cdr.detectChanges();
  }

  saveEditAmenity(am: any, event: Event) {
    event.stopPropagation();
    if (!this.editAmenityName.trim()) return;
    const payload = {
      amenityName: this.editAmenityName.trim(),
      icon: this.editAmenityIcon.trim() || 'star_outline',
      description: this.editAmenityDesc.trim(),
      isActive: am.isActive ?? true
    };
    this.propertiesService.updateAmenity(am.id, payload).subscribe({
      next: () => {
        this.editingAmenityId = null;
        this.loadAmenities();
        this.loadPropertyDetails();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error updating amenity:', err)
    });
  }

  cancelEditAmenity(event: Event) {
    event.stopPropagation();
    this.editingAmenityId = null;
    this.cdr.detectChanges();
  }

  deleteAmenity(id: number, event: Event) {
    event.stopPropagation();
    customConfirm('Are you sure you want to delete this amenity definition? This will remove it from all properties.').then(confirmed => {
      if (confirmed) {
        this.propertiesService.deleteAmenity(id).subscribe({
          next: () => {
            this.loadAmenities();
            this.loadPropertyDetails();
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error deleting amenity:', err)
        });
      }
    });
  }

  saveNewAmenity() {
    if (!this.newAmenityName.trim()) return;
    const payload = {
      amenityName: this.newAmenityName.trim(),
      icon: 'star_outline',
      description: 'Added inline from property details',
      isActive: true
    };
    this.propertiesService.createAmenity(payload).subscribe({
      next: () => {
        this.isAddingAmenity = false;
        this.newAmenityName = '';
        this.loadAmenities();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error creating amenity:', err)
    });
  }

  // --- Building Methods ---
  openBuildingModal(siteId?: number) {
    this.showBuildingModal = true;
    this.isEditingBuilding = false;
    this.editingBuildingId = null;
    this.buildingErrorMessage = '';
    this.newBuilding = {
      buildingCode: '',
      buildingName: '',
      buildingType: '',
      totalFloors: 0,
      basementFloors: 0,
      elevatorCount: 2,
      totalUnits: 0,
      constructionStatus: '',
      completionPercentage: 0,
      handoverDate: '',
      remarks: '',
      siteId: siteId || null
    };
    this.cdr.detectChanges();
  }

  openEditBuildingModal(building: any) {
    this.showBuildingModal = true;
    this.isEditingBuilding = true;
    this.editingBuildingId = building.id;
    this.buildingErrorMessage = '';
    this.newBuilding = {
      buildingCode: building.buildingCode,
      buildingName: building.buildingName,
      buildingType: building.buildingType || '',
      totalFloors: building.totalFloors || 0,
      basementFloors: building.basementFloors || 0,
      elevatorCount: building.elevatorCount ?? 0,
      totalUnits: building.totalUnits || 0,
      constructionStatus: building.constructionStatus || '',
      completionPercentage: building.completionPercentage ?? 0,
      handoverDate: building.handoverDate ? building.handoverDate.split('T')[0] : '',
      remarks: building.remarks || '',
      siteId: building.site ? building.site.id : null
    };
    this.cdr.detectChanges();
  }

  closeBuildingModal() {
    this.showBuildingModal = false;
    this.isEditingBuilding = false;
    this.editingBuildingId = null;
    this.cdr.detectChanges();
  }

  onSubmitBuilding(event: Event) {
    event.preventDefault();
    this.buildingErrorMessage = '';
    const payload: any = {
      buildingCode: this.newBuilding.buildingCode,
      buildingName: this.newBuilding.buildingName,
      buildingType: this.newBuilding.buildingType,
      totalFloors: +this.newBuilding.totalFloors,
      basementFloors: +this.newBuilding.basementFloors,
      elevatorCount: +this.newBuilding.elevatorCount,
      totalUnits: +this.newBuilding.totalUnits,
      constructionStatus: this.newBuilding.constructionStatus,
      completionPercentage: +this.newBuilding.completionPercentage,
      remarks: this.newBuilding.remarks,
      propertyId: this.property.id,
      siteId: this.newBuilding.siteId ? +this.newBuilding.siteId : null
    };
    if (this.newBuilding.handoverDate) {
      payload.handoverDate = new Date(this.newBuilding.handoverDate);
    } else {
      payload.handoverDate = null;
    }

    if (this.isEditingBuilding && this.editingBuildingId) {
      this.propertiesService.updateBuilding(this.editingBuildingId, payload).subscribe({
        next: () => {
          this.closeBuildingModal();
          this.loadPropertyDetails();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating building block:', err);
          this.buildingErrorMessage = err.error?.message || 'An error occurred while updating the building.';
          this.cdr.detectChanges();
          setTimeout(() => {
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) modalBody.scrollTop = 0;
          }, 50);
        }
      });
    } else {
      this.propertiesService.createBuilding(this.property.id, payload).subscribe({
        next: () => {
          this.closeBuildingModal();
          this.loadPropertyDetails();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating building block:', err);
          this.buildingErrorMessage = err.error?.message || 'An error occurred while creating the building.';
          this.cdr.detectChanges();
          setTimeout(() => {
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) modalBody.scrollTop = 0;
          }, 50);
        }
      });
    }
  }

  onDeleteBuilding(id: number) {
    customConfirm('Are you sure you want to remove this building block?').then(confirmed => {
      if (confirmed) {
        this.propertiesService.deleteBuilding(id).subscribe({
          next: () => {
            this.loadPropertyDetails();
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error deleting building:', err)
        });
      }
    });
  }

  // --- Site Methods ---
  openSiteModal(site?: any) {
    this.showSiteModal = true;
    this.siteErrorMessage = '';
    if (site) {
      this.isEditingSite = true;
      this.editingSiteId = site.id;
      this.siteForm = {
        siteName: site.siteName,
        siteLocation: site.siteLocation || '',
      };
    } else {
      this.isEditingSite = false;
      this.editingSiteId = null;
      this.siteForm = {
        siteName: '',
        siteLocation: '',
      };
    }
    this.cdr.detectChanges();
  }

  closeSiteModal() {
    this.showSiteModal = false;
    this.cdr.detectChanges();
  }

  onSubmitSite(event: Event) {
    event.preventDefault();
    this.siteErrorMessage = '';
    if (!this.siteForm.siteName.trim()) {
      this.siteErrorMessage = 'Site name is required';
      return;
    }

    const payload = {
      siteName: this.siteForm.siteName.trim(),
      siteLocation: this.siteForm.siteLocation.trim() || null,
      propertyId: this.property.id
    };

    if (this.isEditingSite && this.editingSiteId) {
      this.propertiesService.updateSite(this.editingSiteId, payload).subscribe({
        next: () => {
          this.closeSiteModal();
          this.loadPropertyDetails();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating site:', err);
          this.siteErrorMessage = err.error?.message || 'An error occurred while updating the site.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.propertiesService.createSite(this.property.id, payload).subscribe({
        next: () => {
          this.closeSiteModal();
          this.loadPropertyDetails();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error creating site:', err);
          this.siteErrorMessage = err.error?.message || 'An error occurred while creating the site.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  onDeleteSite(siteId: number) {
    customConfirm('Are you sure you want to remove this site? Note: This will also soft-delete all buildings associated with this site.').then(confirmed => {
      if (confirmed) {
        this.propertiesService.deleteSite(siteId).subscribe({
          next: () => {
            this.loadPropertyDetails();
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error deleting site:', err)
        });
      }
    });
  }

  openAddFloorModal(buildingId?: number) {
    this.showFloorModal = true;
    this.floorErrorMessage = '';
    this.newFloor = { floorNumber: 1, floorName: '', floorType: 'Residential', totalUnits: 0, remarks: '' };
    this.resetFloorPlanForm();

    if (this.allProperties.length === 0) {
      this.propertiesService.getProperties().subscribe({
        next: (res) => {
          this.allProperties = res.items ?? [];
          this.setupPropertyAndBuildingSelection(buildingId);
        },
        error: (err) => {
          console.error('Error loading properties list:', err);
          this.setupPropertyAndBuildingSelection(buildingId);
        }
      });
    } else {
      this.setupPropertyAndBuildingSelection(buildingId);
    }
  }

  setupPropertyAndBuildingSelection(buildingId?: number) {
    if (this.property) {
      this.selectedPropertyIdForFloor = this.property.id;
      const prop = this.allProperties.find(p => +p.id === +this.property.id);
      this.buildingsListForFloorModal = prop ? (prop.buildings ?? []) : (this.property.buildings ?? []);
    } else {
      this.selectedPropertyIdForFloor = null;
      this.buildingsListForFloorModal = [];
    }

    if (buildingId) {
      this.selectedBuildingIdForFloor = buildingId;
    } else {
      this.selectedBuildingIdForFloor = null;
    }
    this.cdr.detectChanges();
  }

  onPropertyChangeInFloorModal() {
    this.selectedBuildingIdForFloor = null;
    this.buildingsListForFloorModal = [];
    if (this.selectedPropertyIdForFloor) {
      const prop = this.allProperties.find(p => +p.id === +this.selectedPropertyIdForFloor!);
      if (prop) {
        this.buildingsListForFloorModal = prop.buildings ?? [];
      }
    }
    this.cdr.detectChanges();
  }

  closeFloorModal() {
    this.showFloorModal = false;
    this.resetFloorPlanForm();
    this.cdr.detectChanges();
  }
  onFloorPlanFileSelected(event: any, mode: 'create' | 'edit') {
    const file = event.target.files[0];
    if (file) {
      if (mode === 'create') {
        this.floorPlanFile = file;
        if (!this.floorPlanName) {
          this.floorPlanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        }
      } else {
        this.editFloorPlanFile = file;
        if (!this.editFloorPlanName) {
          this.editFloorPlanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        }
      }
    }
  }
  resetFloorPlanForm() {
    this.floorPlanFile = null;
    this.floorPlanName = '';
    this.floorPlanVersion = 1;
    this.floorPlanRemarks = '';
  }
  resetEditFloorPlanForm() {
    this.editFloorPlanFile = null;
    this.editFloorPlanName = '';
    this.editFloorPlanVersion = 1;
    this.editFloorPlanRemarks = '';
  }
  onSubmitFloor(event: Event) {
    event.preventDefault();
    const bId = this.selectedBuildingIdForFloor;
    const pId = this.selectedPropertyIdForFloor;
    if (!bId || !pId) return;
    this.floorErrorMessage = '';
    const payload = {
      floorNumber: +this.newFloor.floorNumber,
      floorName: this.newFloor.floorName,
      floorType: this.newFloor.floorType,
      totalUnits: +this.newFloor.totalUnits,
      remarks: this.newFloor.remarks,
      buildingId: bId
    };
    this.propertiesService.createFloor(bId, payload).subscribe({
      next: (createdFloor) => {
        if (this.floorPlanFile && createdFloor && createdFloor.id) {
          this.propertiesService.uploadFloorPlan(this.floorPlanFile, this.floorPlanName || this.newFloor.floorName, {
            propertyId: pId,
            buildingId: bId,
            floorId: createdFloor.id,
            remarks: this.floorPlanRemarks,
            versionNumber: this.floorPlanVersion
          }).subscribe({
            next: () => {
              this.resetFloorPlanForm();
              this.closeFloorModal();
              this.loadPropertyDetails();
            },
            error: (err) => {
              console.error('Error uploading floor plan blueprint:', err);
              this.resetFloorPlanForm();
              this.closeFloorModal();
              this.loadPropertyDetails();
            }
          });
        } else {
          this.closeFloorModal();
          this.loadPropertyDetails();
        }
      },
      error: (err) => {
        console.error('Error generating floor layout:', err);
        this.floorErrorMessage = err.error?.message || 'An error occurred while creating the floor.';
        this.cdr.detectChanges();
        setTimeout(() => {
          const modalBody = document.querySelector('.modal-body');
          if (modalBody) modalBody.scrollTop = 0;
        }, 50);
      }
    });
  }

  // --- Manage Floors Methods ---
  openManageFloorsModal(building: any) {
    this.selectedBuildingForManage = building;
    this.showManageFloorsModal = true;
    this.cdr.detectChanges();
  }
  closeManageFloorsModal() {
    this.showManageFloorsModal = false;
    this.selectedBuildingForManage = null;
    this.cdr.detectChanges();
  }
  openEditFloorModal(floor: any, event?: Event) {
    if (event) event.stopPropagation();
    this.editFloor = { ...floor };
    this.resetEditFloorPlanForm();
    if (floor.floorPlan) {
      this.editFloorPlanName = floor.floorPlan.planName;
      this.editFloorPlanVersion = floor.floorPlan.versionNumber || 1;
      this.editFloorPlanRemarks = floor.floorPlan.remarks || '';
    } else {
      this.editFloorPlanName = `Floor ${floor.floorNumber} Blueprint`;
    }
    this.showEditFloorModal = true;
    this.cdr.detectChanges();
  }
  closeEditFloorModal() {
    this.showEditFloorModal = false;
    this.editFloor = null;
    this.cdr.detectChanges();
  }
  onSubmitEditFloor(event: Event) {
    event.preventDefault();
    if (!this.editFloor) return;
    const payload = {
      floorNumber: +this.editFloor.floorNumber,
      floorName: this.editFloor.floorName,
      floorType: this.editFloor.floorType,
      totalUnits: +this.editFloor.totalUnits,
      remarks: this.editFloor.remarks
    };
    this.propertiesService.updateFloor(this.editFloor.id, payload).subscribe({
      next: () => {
        if (this.editFloorPlanFile) {
          this.propertiesService.uploadFloorPlan(this.editFloorPlanFile, this.editFloorPlanName, {
            propertyId: this.property.id,
            buildingId: this.editFloor.buildingId || this.selectedBuildingForManage?.id,
            floorId: this.editFloor.id,
            remarks: this.editFloorPlanRemarks
          }).subscribe({
            next: () => {
              this.resetEditFloorPlanForm();
              this.closeEditFloorModal();
              this.loadPropertyDetails();
            },
            error: (err) => {
              console.error('Error uploading floor plan blueprint:', err);
              this.resetEditFloorPlanForm();
              this.closeEditFloorModal();
              this.loadPropertyDetails();
            }
          });
        } else {
          this.closeEditFloorModal();
          this.loadPropertyDetails();
        }
      },
      error: (err) => console.error('Error updating floor level:', err)
    });
  }
  onDeleteFloor(floorId: number, event?: Event) {
    if (event) event.stopPropagation();
    customConfirm('Are you sure you want to delete this floor level? This will remove all associated units.').then(confirmed => {
      if (confirmed) {
        this.propertiesService.deleteFloor(floorId).subscribe({
          next: () => {
            this.loadPropertyDetails();
          },
          error: (err) => console.error('Error deleting floor:', err)
        });
      }
    });
  }

  // --- Media & Doc Upload logic ---
  onFileSelected(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onUploadDocument() {
    if (!this.selectedFile) return;
    this.propertiesService.uploadPropertyDocument(this.property.id, this.selectedFile, {
      documentCategory: this.docCategory,
      documentName: this.docName || undefined,
      versionNumber: this.docVersionNumber,
      expiryDate: this.docExpiryDate || undefined,
      remarks: this.docRemarks || undefined
    }).subscribe({
      next: () => {
        this.selectedFile = null;
        this.docName = '';
        this.docVersionNumber = 1;
        this.docExpiryDate = '';
        this.docRemarks = '';
        this.loadPropertyDetails();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error uploading document:', err)
    });
  }

  onUploadMedia() {
    if (!this.selectedFile) return;
    this.propertiesService.uploadPropertyMedia(this.property.id, this.selectedFile, {
      isFeatured: this.isFeatured,
      displayOrder: this.mediaDisplayOrder,
      mediaType: this.mediaType
    }).subscribe({
      next: () => {
        this.selectedFile = null;
        this.mediaDisplayOrder = 0;
        this.mediaType = 'Photo';
        this.isFeatured = false;
        this.loadPropertyDetails();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error uploading photo:', err)
    });
  }

  loadPropertyTypes() {
    this.propertiesService.getPropertyTypes().subscribe({
      next: (res) => {
        this.propertyTypes = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading property types:', err)
    });
  }

  onAddPropertyType(payload: { name: string; description: string }) {
    this.propertiesService.createPropertyType({ typeName: payload.name, description: payload.description }).subscribe({
      next: (res) => {
        this.loadPropertyTypes();
        this.editProperty.propertyTypeId = res.id;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error creating property type:', err)
    });
  }

  onEditPropertyType(event: { id: number; name: string }) {
    this.propertiesService.updatePropertyType(event.id, { typeName: event.name }).subscribe({
      next: () => {
        this.loadPropertyTypes();
      },
      error: (err) => console.error('Error updating property type:', err)
    });
  }

  onDeletePropertyType(id: number) {
    this.propertiesService.deletePropertyType(id).subscribe({
      next: () => {
        this.loadPropertyTypes();
      },
      error: (err) => console.error('Error deleting property type:', err)
    });
  }

  openEditModal() {
    this.editErrorMessage = '';
    this.editProperty = {
      propertyName: this.property.propertyName,
      propertyTypeId: this.property.propertyType?.id || 0,
      description: this.property.description || '',
      country: this.property.country || 'Ethiopia',
      city: this.property.city || 'Addis Ababa',
      subCity: this.property.subCity || '',
      address: this.property.address || '',
      latitude: this.property.latitude || null,
      longitude: this.property.longitude || null,
      totalLandArea: this.property.totalLandArea || null,
      totalBuiltupArea: this.property.totalBuiltupArea || null,
      launchDate: this.property.launchDate ? this.property.launchDate.split('T')[0] : '',
      completionDate: this.property.completionDate ? this.property.completionDate.split('T')[0] : '',
      propertyStatus: this.property.propertyStatus || '',
      developerName: this.property.developerName || '',
      contactPhone: this.property.contactPhone || '',
      contactEmail: this.property.contactEmail || '',
      website: this.property.website || '',
      remarks: this.property.remarks || ''
    };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.cdr.detectChanges();
  }

  onSubmitEditProperty(event: Event) {
    event.preventDefault();
    this.editErrorMessage = '';
    const payload: any = { ...this.editProperty };
    if (!payload.launchDate) delete payload.launchDate;
    if (!payload.completionDate) delete payload.completionDate;

    this.propertiesService.updateProperty(this.property.id, payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadPropertyDetails();
      },
      error: (err) => {
        console.error('Error updating property:', err);
        this.editErrorMessage = err.error?.message || 'An error occurred while updating the property.';
        this.cdr.detectChanges();
        setTimeout(() => {
          const modalBody = document.querySelector('.modal-body');
          if (modalBody) modalBody.scrollTop = 0;
        }, 50);
      }
    });
  }
}
