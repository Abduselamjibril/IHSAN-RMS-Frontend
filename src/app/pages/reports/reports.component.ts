import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../services/reports.service';
import { PropertiesService } from '../../services/properties.service';
import { CrmService } from '../../services/crm.service';
import { BrokerService } from '../../services/broker.service';
import { FinanceService } from '../../services/finance.service';
import { SalesService } from '../../services/sales.service';


@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Reports Center</h1>
        <p>Consolidated cross-department operational metrics, auditing ledgers, and data exports</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="exportActiveReport()" *ngIf="activeTab !== 'overall'">
          <span class="material-icons-outlined">file_download</span>
          Export Current Tab CSV
        </button>
      </div>
    </header>

    <!-- Tab Selection Bar -->
    <div class="tab-container card">
      <div class="tabs-bar">
        <button class="tab-btn" [class.active]="activeTab === 'overall'" (click)="setTab('overall')">
          <span class="material-icons-outlined">apps</span> Overall Overview
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'sales'" (click)="setTab('sales')">
          <span class="material-icons-outlined">trending_up</span> Sales Report
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'inventory'" (click)="setTab('inventory')">
          <span class="material-icons-outlined">business</span> Inventory Report
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'revenue'" (click)="setTab('revenue')">
          <span class="material-icons-outlined">account_balance</span> Revenue Report
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'collections'" (click)="setTab('collections')">
          <span class="material-icons-outlined">receipt_long</span> Collections Report
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'receivables'" (click)="setTab('receivables')">
          <span class="material-icons-outlined">money_off</span> Outstanding Balances
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'leads'" (click)="setTab('leads')">
          <span class="material-icons-outlined">filter_alt</span> Lead Conversions
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'brokers'" (click)="setTab('brokers')">
          <span class="material-icons-outlined">badge</span> Broker Commissions
        </button>
      </div>
    </div>

    <!-- Filters Bar (Dynamic based on tab) -->
    <div class="filter-bar card mt-4" *ngIf="activeTab !== 'overall'">
      <div class="filter-grid">
        <div class="filter-item" *ngIf="showPropertyFilter()">
          <label>Select Project/Property</label>
          <select [(ngModel)]="filters.propertyId" (change)="onPropertyChange()">
            <option [value]="null">All Properties</option>
            <option *ngFor="let p of properties" [value]="p.id">{{ p.propertyName }}</option>
          </select>
        </div>

        <div class="filter-item" *ngIf="sites.length > 0">
          <label>Select Site</label>
          <select [(ngModel)]="filters.siteId" (change)="onFilterChange()">
            <option [value]="null">All Sites</option>
            <option *ngFor="let s of sites" [value]="s.id">{{ s.siteName }}</option>
          </select>
        </div>

        <div class="filter-item" *ngIf="showDateFilter()">
          <label>Start Date</label>
          <input type="date" [(ngModel)]="filters.startDate" (change)="onFilterChange()" />
        </div>

        <div class="filter-item" *ngIf="showDateFilter()">
          <label>End Date</label>
          <input type="date" [(ngModel)]="filters.endDate" (change)="onFilterChange()" />
        </div>

        <div class="filter-item" *ngIf="activeTab === 'inventory'">
          <label>Unit Status</label>
          <select [(ngModel)]="filters.statusId" (change)="onFilterChange()">
            <option [value]="null">All Statuses</option>
            <option *ngFor="let s of statuses" [value]="s.id">{{ s.statusName }}</option>
          </select>
        </div>

        <div class="filter-item" *ngIf="activeTab === 'inventory' || activeTab === 'sales'">
          <label>Unit Type</label>
          <select [(ngModel)]="filters.unitTypeId" (change)="onFilterChange()">
            <option [value]="null">All Types</option>
            <option *ngFor="let t of unitTypes" [value]="t.id">{{ t.typeName }}</option>
          </select>
        </div>

        <div class="filter-item" *ngIf="['sales', 'inventory', 'brokers'].includes(activeTab)">
          <label>Sales Agent</label>
          <select [(ngModel)]="filters.salespersonId" (change)="onFilterChange()">
            <option [value]="null">All Agents</option>
            <option *ngFor="let a of agents" [value]="a.id">{{ a.fullName }}</option>
          </select>
        </div>

        <div class="filter-item" *ngIf="['sales', 'inventory', 'brokers'].includes(activeTab)">
          <label>Broker Name</label>
          <select [(ngModel)]="filters.brokerId" (change)="onFilterChange()">
            <option [value]="null">All Brokers</option>
            <option *ngFor="let b of brokers" [value]="b.id">{{ b.brokerName }}</option>
          </select>
        </div>

        <div class="filter-item" *ngIf="['revenue', 'collections'].includes(activeTab)">
          <label>Payment Method</label>
          <select [(ngModel)]="filters.paymentMethodId" (change)="onFilterChange()">
            <option [value]="null">All Methods</option>
            <option *ngFor="let m of paymentMethods" [value]="m.id">{{ m.paymentMethodName }}</option>
          </select>
        </div>

        <div class="filter-item customer-dropdown-container" *ngIf="['revenue', 'collections', 'receivables'].includes(activeTab)" style="position: relative;">
          <label>Customer Filter</label>
          <div class="select-box flex justify-between align-center" (click)="customerDropdownOpen = !customerDropdownOpen" style="cursor: pointer; min-height: 42px; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 14px; background-color: var(--bg-main); display: flex; justify-content: space-between; align-items: center;">
            <span class="selected-text" style="font-size: 13px;">
              {{ getSelectedCustomerName() }}
            </span>
            <span class="material-icons-outlined arrow-icon" [style.transform]="customerDropdownOpen ? 'rotate(180deg)' : 'none'" style="font-size: 20px; transition: transform 0.2s; color: var(--text-secondary);">expand_more</span>
          </div>

          <!-- Dropdown Options Panel -->
          <div class="customer-dropdown-menu animate-fade" *ngIf="customerDropdownOpen" (click)="$event.stopPropagation()" style="position: absolute; top: 100%; left: 0; width: 100%; min-width: 250px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-premium); z-index: 1200; display: flex; flex-direction: column; max-height: 300px; margin-top: 4px; overflow: hidden;">
            <!-- Search field on top of options list -->
            <div style="padding: 8px; border-bottom: 1px solid var(--border-color); background-color: var(--bg-main); display: flex; align-items: center; gap: 6px;">
              <span class="material-icons-outlined" style="font-size: 18px; color: var(--text-secondary);">search</span>
              <input 
                type="text" 
                [(ngModel)]="customerSearchQuery" 
                placeholder="Search customer by name or phone..." 
                style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 12px; outline: none; background-color: var(--bg-card); color: var(--text-main);"
              />
            </div>

            <!-- Options List -->
            <div style="overflow-y: auto; max-height: 220px; padding: 4px;">
              <!-- Option: All Customers -->
              <div (click)="selectCustomer(null)" 
                   [style.background-color]="!filters.customerId ? 'var(--brand-primary-light)' : 'transparent'"
                   style="padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--text-main); transition: background-color 0.15s;"
                   class="customer-option-item">
                <strong>All Customers</strong>
              </div>

              <!-- Customer Options -->
              <div *ngFor="let c of filteredCustomers()" 
                   (click)="selectCustomer(c.id)" 
                   [style.background-color]="filters.customerId === c.id ? 'var(--brand-primary-light)' : 'transparent'"
                   style="padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--text-main); display: flex; flex-direction: column; gap: 2px; transition: background-color 0.15s;"
                   class="customer-option-item">
                <span style="font-weight: 600;">{{ c.fullName }}</span>
                <span *ngIf="c.phone" style="font-size: 11px; color: var(--text-secondary);">{{ c.phone }}</span>
              </div>

              <!-- No Options State -->
              <div *ngIf="filteredCustomers().length === 0" style="padding: 12px; font-style: italic; color: var(--text-secondary); font-size: 12px; text-align: center;">
                No matching customers found.
              </div>
            </div>
          </div>
        </div>

        <div class="filter-item" *ngIf="activeTab === 'inventory'">
          <label>Min Price (ETB)</label>
          <input type="number" [(ngModel)]="filters.priceMin" placeholder="Min price" (change)="onFilterChange()" />
        </div>

        <div class="filter-item" *ngIf="activeTab === 'inventory'">
          <label>Max Price (ETB)</label>
          <input type="number" [(ngModel)]="filters.priceMax" placeholder="Max price" (change)="onFilterChange()" />
        </div>
      </div>
    </div>

    <!-- MAIN VIEW AREA -->
    <div class="reports-content mt-4">

      <!-- ==================== OVERALL OVERVIEW TAB ==================== -->
      <div *ngIf="activeTab === 'overall'" class="grid gap-6">
        <!-- Welcome & Refresh Header Row -->
        <div class="card text-white bg-gradient-brand flex justify-between align-center py-4 px-6" style="flex-direction: row; display: flex;">
          <div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Ihsan Reports Dashboard Overview</h2>
            <p class="mt-1 text-white-50" style="margin: 4px 0 0 0; font-size: 13px;">Consolidated metrics, trends, and telemetry sweeps across all department reports.</p>
          </div>
          <div>
            <button class="btn btn-secondary text-main" (click)="loadOverviewData()" style="padding: 6px 14px; font-size: 12px; background: rgba(255,255,255,0.15); border: none; color: white;">
              <span class="material-icons-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 4px;">refresh</span> Sync Dashboard
            </button>
          </div>
        </div>

        <!-- 4 Core Report KPIs -->
        <div class="grid grid-4 gap-6">
          <div class="metric-card card border-indigo cursor-pointer hover-card" (click)="setTab('sales')" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; padding: 18px 20px;">
            <span class="metric-label" style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Total Sales Value</span>
            <span class="metric-value" style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-top: 4px;">ETB {{ formatShortVal(overviewKpis?.totalRevenue ?? 0) }}</span>
            <span class="metric-trend text-indigo font-xs font-bold mt-2" style="font-size: 11px; color: var(--brand-primary); font-weight: 600;">
              {{ overviewKpis?.unitsSold ?? 0 }} Units Sold
            </span>
          </div>
          
          <div class="metric-card card border-green cursor-pointer hover-card" (click)="setTab('collections')" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; padding: 18px 20px;">
            <span class="metric-label" style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Collections Volume</span>
            <span class="metric-value" style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-top: 4px;">ETB {{ formatShortVal(overviewKpis?.totalCollections ?? 0) }}</span>
            <span class="metric-trend text-green font-xs font-bold mt-2" style="font-size: 11px; color: var(--color-qualified); font-weight: 600;">
              Rate: {{ getOverviewCollectionRate() }}%
            </span>
          </div>

          <div class="metric-card card border-orange cursor-pointer hover-card" (click)="setTab('receivables')" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; padding: 18px 20px;">
            <span class="metric-label" style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Outstanding Debt</span>
            <span class="metric-value" style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-top: 4px;">ETB {{ formatShortVal(overviewKpis?.outstandingBalances ?? 0) }}</span>
            <span class="metric-trend text-orange font-xs font-bold mt-2" style="font-size: 11px; color: var(--color-medium); font-weight: 600;">
              Arrears Installments
            </span>
          </div>

          <div class="metric-card card border-teal cursor-pointer hover-card" (click)="setTab('leads')" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; padding: 18px 20px;">
            <span class="metric-label" style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Active Funnel Leads</span>
            <span class="metric-value" style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-top: 4px;">{{ overviewKpis?.activeLeads ?? 0 }} Profiles</span>
            <span class="metric-trend text-teal font-xs font-bold mt-2" style="font-size: 11px; color: var(--color-converted); font-weight: 600;">
              Conv. Rate: {{ overviewKpis?.leadConversionRate ?? 0 }}%
            </span>
          </div>
        </div>

        <!-- Cross-Module Analysis Charts & Highlights -->
        <div class="grid grid-2-1 gap-6">
          
          <!-- Sales Trends & Inventory Breakdown -->
          <div class="grid gap-6">
            <!-- Sales Velocity Card -->
            <div class="card">
              <div class="flex justify-between align-center mb-4" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 700;">Monthly Sales Quantity Trajectory</h3>
                <span class="text-secondary font-xs font-bold uppercase" style="font-size: 10px; color: var(--text-secondary);">Sales Performance</span>
              </div>
              <div style="height: 140px; display: flex; align-items: flex-end; justify-content: space-around; padding: 0 10px;">
                <div *ngFor="let s of overviewSalesTrends" class="flex flex-col align-center gap-1" style="display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 60px;">
                  <span class="font-xs font-bold text-main" style="font-size: 9px; font-weight: 700;">{{ $any(s).salesCount }}</span>
                  <div style="width: 20px; height: 90px; background: var(--bg-main); border-radius: 2px; display: flex; align-items: flex-end;">
                    <div [style.height.%]="getOverviewSalesHeightPercent($any(s).salesCount)" style="width: 100%; background: linear-gradient(180deg, var(--brand-primary), #6366f1); border-radius: 2px;"></div>
                  </div>
                  <span class="font-xs text-secondary" style="font-size: 9px; margin-top: 4px;">{{ formatMonthLabel($any(s).period) }}</span>
                </div>
                <div *ngIf="!overviewSalesTrends || overviewSalesTrends.length === 0" class="text-center py-10 text-secondary italic font-sm w-full">
                  No sales trends compiled.
                </div>
              </div>
            </div>

            <!-- Departmental Summary Stats -->
            <div class="grid grid-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Inventory Overview -->
              <div class="card hover-card cursor-pointer flex flex-col justify-between" (click)="setTab('inventory')" style="display: flex; flex-direction: column; justify-content: space-between; padding: 16px 20px;">
                <div>
                  <h4 class="font-bold text-main" style="margin: 0; font-size: 13px; font-weight: 700;">Property Inventory Stock</h4>
                  <p class="text-secondary font-xs mt-1" style="margin: 2px 0 0 0; font-size: 11px; color: var(--text-secondary);">Stock status & allocations</p>
                </div>
                <div class="mt-4 flex flex-col gap-2" style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
                  <div class="flex justify-between font-xs font-bold" style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700;">
                    <span>Available Stock Ratio</span>
                    <span class="text-teal" style="color: var(--color-converted);">{{ overviewKpis?.availableInventory ?? 0 }} Units</span>
                  </div>
                  <div class="progress-bar-wrapper" style="height: 6px; width: 100%; background-color: var(--bg-main); border-radius: 10px; overflow: hidden;">
                    <div class="progress-bar-fill" style="height: 100%; background-color: var(--color-converted); border-radius: 10px;" [style.width.%]="getInventoryAllocationPercent()"></div>
                  </div>
                </div>
              </div>

              <!-- Broker Commissions Summary -->
              <div class="card hover-card cursor-pointer flex flex-col justify-between" (click)="setTab('brokers')" style="display: flex; flex-direction: column; justify-content: space-between; padding: 16px 20px;">
                <div>
                  <h4 class="font-bold text-main" style="margin: 0; font-size: 13px; font-weight: 700;">Brokerage Referred Sales</h4>
                  <p class="text-secondary font-xs mt-1" style="margin: 2px 0 0 0; font-size: 11px; color: var(--text-secondary);">Commission referral standings</p>
                </div>
                <div class="mt-4 flex flex-col gap-2" style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
                  <div class="flex justify-between font-xs font-bold" style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700;">
                    <span>Broker Referrals Volume</span>
                    <span class="text-indigo" style="color: var(--brand-primary);">ETB {{ formatShortVal(overviewKpis?.brokerSales ?? 0) }}</span>
                  </div>
                  <div class="progress-bar-wrapper" style="height: 6px; width: 100%; background-color: var(--bg-main); border-radius: 10px; overflow: hidden;">
                    <div class="progress-bar-fill" style="height: 100%; background-color: var(--brand-primary); border-radius: 10px; width: 100%;"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Lead Sources & Quick Navigation -->
          <div class="card flex flex-col justify-between" style="display: flex; flex-direction: column; justify-content: space-between; padding: 20px;">
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: 700;">Acquisition Leads Channels</h3>
              <p class="text-secondary font-xs mb-4" style="margin: 2px 0 16px 0; font-size: 11px; color: var(--text-secondary);">Top client source acquisition streams</p>
              
              <div class="flex flex-col gap-3 mt-4" style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                <div class="flex justify-between align-center" *ngFor="let s of overviewLeadTrends?.leadAcquisitionTrend | slice:0:3" style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="font-xs text-secondary flex align-center gap-2" style="font-size: 12px; display: flex; align-items: center; color: var(--text-secondary);">
                    <span class="legend-dot" [style.background-color]="getSourceColor($any(s).source)" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                    {{ $any(s).source }}
                  </span>
                  <span class="font-xs font-bold text-main" style="font-size: 12px; font-weight: 700; color: var(--text-main);">{{ $any(s).count }} leads</span>
                </div>
                <div *ngIf="!overviewLeadTrends?.leadAcquisitionTrend || overviewLeadTrends?.leadAcquisitionTrend.length === 0" class="text-center py-6 text-secondary italic font-xs">
                  No lead source data.
                </div>
              </div>
            </div>

            <!-- Quick Navigation Shortcuts -->
            <div class="border-top mt-6 pt-4" style="border-top: 1px solid var(--border-color); margin-top: 24px; padding-top: 16px;">
              <h4 class="font-xs text-secondary uppercase font-bold tracking-wider mb-2" style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.5px;">Switch Report Module</h4>
              <div class="flex flex-wrap gap-2" style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button class="btn btn-secondary font-xs py-1 px-3 flex align-center gap-1" style="font-size: 11px; padding: 6px 12px; background-color: var(--bg-hover);" (click)="setTab('sales')">
                  <span class="material-icons-outlined" style="font-size: 14px; vertical-align: middle; margin-right: 2px;">trending_up</span> Sales
                </button>
                <button class="btn btn-secondary font-xs py-1 px-3 flex align-center gap-1" style="font-size: 11px; padding: 6px 12px; background-color: var(--bg-hover);" (click)="setTab('inventory')">
                  <span class="material-icons-outlined" style="font-size: 14px; vertical-align: middle; margin-right: 2px;">business</span> Stock
                </button>
                <button class="btn btn-secondary font-xs py-1 px-3 flex align-center gap-1" style="font-size: 11px; padding: 6px 12px; background-color: var(--bg-hover);" (click)="setTab('revenue')">
                  <span class="material-icons-outlined" style="font-size: 14px; vertical-align: middle; margin-right: 2px;">account_balance</span> Financials
                </button>
                <button class="btn btn-secondary font-xs py-1 px-3 flex align-center gap-1" style="font-size: 11px; padding: 6px 12px; background-color: var(--bg-hover);" (click)="setTab('collections')">
                  <span class="material-icons-outlined" style="font-size: 14px; vertical-align: middle; margin-right: 2px;">receipt_long</span> Collections
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ==================== SALES PERFORMANCE TAB ==================== -->
      <div *ngIf="activeTab === 'sales'" class="grid gap-6">
        <!-- Stats Cards -->
        <div class="grid grid-4 gap-6">
          <div class="metric-card card border-blue">
            <span class="metric-label">Units Sold</span>
            <span class="metric-value">{{ reportData?.metrics?.unitsSold ?? 0 }}</span>
          </div>
          <div class="metric-card card border-indigo">
            <span class="metric-label">Total Value</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.totalSalesValue ?? 0) }}</span>
          </div>
          <div class="metric-card card border-green">
            <span class="metric-label">Avg sales value</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.avgSalesValue ?? 0) }}</span>
          </div>
          <div class="metric-card card border-orange">
            <span class="metric-label">Reservations</span>
            <span class="metric-value">{{ reportData?.metrics?.reservations ?? 0 }}</span>
          </div>
        </div>

        <!-- Data Table & SVG Chart Grid -->
        <div class="grid grid-2-1 gap-6">
          <div class="card">
            <h3>Contracts Log</h3>
            <div class="table-container mt-4" style="overflow-x: auto;">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Contract No</th>
                    <th>Site Name</th>
                    <th>Property Code</th>
                    <th>Property Name</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Sales Agent</th>
                    <th>Broker Name</th>
                    <th>Start Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of reportData?.items">
                    <td class="font-bold font-mono">{{ item.contractNo }}</td>
                    <td>{{ item.siteName }}</td>
                    <td>{{ item.propertyCode }}</td>
                    <td>{{ item.propertyName }}</td>
                    <td>{{ item.propertyType }}</td>
                    <td class="font-bold text-indigo">ETB {{ formatValue(item.contractAmount) }}</td>
                    <td>{{ item.salesAgent || 'N/A' }}</td>
                    <td>{{ item.brokerName || 'N/A' }}</td>
                    <td>{{ item.contractDate | date:'mediumDate' }}</td>
                    <td>
                      <span class="badge" [class.badge-new]="item.status === 'ACTIVE'" [class.badge-proposal]="item.status === 'COMPLETED'">{{ item.status }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="!reportData?.items || reportData?.items.length === 0">
                    <td colspan="10" class="text-center text-secondary italic py-6">No matching records found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Sales SVG Chart -->
          <div class="chart-wrapper card p-4 flex flex-col justify-between">
            <div>
              <h3>Sales Contract Sizes</h3>
              <p class="text-secondary font-xs mb-4">Contract sizes comparison (relative heights)</p>
            </div>
            <div style="height: 160px; display: flex; align-items: flex-end; justify-content: center; gap: 8px;">
              <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                <line x1="0" y1="90" x2="200" y2="90" stroke="var(--border-color)" stroke-width="1"/>
                <rect *ngFor="let item of reportData?.items | slice:0:5; let i = index"
                      [attr.x]="10 + i * 38"
                      [attr.y]="90 - getContractBarHeight($any(item).contractAmount)"
                      width="24"
                      [attr.height]="getContractBarHeight($any(item).contractAmount)"
                      fill="var(--brand-primary)"
                      rx="2"/>
              </svg>
            </div>
            <div *ngIf="!reportData?.items || reportData?.items.length === 0" class="text-center py-6 text-secondary italic font-xs">
              No sales to chart.
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== INVENTORY AVAILABILITY TAB ==================== -->
      <div *ngIf="activeTab === 'inventory'" class="grid gap-6">
        <!-- Stats Cards -->
        <div class="grid grid-4 gap-6">
          <div class="metric-card card border-teal">
            <span class="metric-label">Total Units</span>
            <span class="metric-value">{{ reportData?.metrics?.totalUnits ?? 0 }}</span>
          </div>
          <div class="metric-card card border-green">
            <span class="metric-label">Available Units</span>
            <span class="metric-value">{{ reportData?.metrics?.availableUnits ?? 0 }}</span>
          </div>
          <div class="metric-card card border-yellow">
            <span class="metric-label">Reserved Units</span>
            <span class="metric-value">{{ reportData?.metrics?.reservedUnits ?? 0 }}</span>
          </div>
          <div class="metric-card card border-blue">
            <span class="metric-label">Sold Units</span>
            <span class="metric-value">{{ reportData?.metrics?.soldUnits ?? 0 }}</span>
          </div>
        </div>

        <div class="grid grid-2-1 gap-6">
          <!-- Inventory List Table -->
          <div class="card">
            <h3>Inventory Availability List</h3>
            <div class="table-container mt-4" style="overflow-x: auto;">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Property Code</th>
                    <th>Unit Number</th>
                    <th>Site Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Reserved By / Date</th>
                    <th>Sold To / Date</th>
                    <th>Sales Agent</th>
                    <th>Broker Name</th>
                    <th>Last Update</th>
                    <th>Days Avail.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of reportData?.items">
                    <td class="font-bold font-mono">{{ item.propertyCode }}</td>
                    <td>{{ item.propertyName }}</td>
                    <td>{{ item.siteName }}</td>
                    <td>{{ item.propertyType }}</td>
                    <td>{{ item.unitSize }} sqm</td>
                    <td class="font-bold text-indigo">ETB {{ formatValue(item.listingPrice) }}</td>
                    <td>
                      <span class="badge" 
                        [class.badge-new]="item.currentStatus === 'AVAILABLE'" 
                        [class.badge-medium]="item.currentStatus === 'RESERVED'"
                        [class.badge-proposal]="item.currentStatus === 'SOLD'"
                        [class.badge-high]="item.currentStatus === 'BLOCKED'">
                        {{ item.currentStatus }}
                      </span>
                    </td>
                    <td>
                      <div *ngIf="item.reservedBy" class="font-bold">{{ item.reservedBy }}</div>
                      <div *ngIf="item.reservationDate" class="text-secondary font-xs">{{ item.reservationDate | date:'shortDate' }}</div>
                      <span *ngIf="!item.reservedBy" class="text-secondary italic">-</span>
                    </td>
                    <td>
                      <div *ngIf="item.soldTo" class="font-bold">{{ item.soldTo }}</div>
                      <div *ngIf="item.saleDate" class="text-secondary font-xs">{{ item.saleDate | date:'shortDate' }}</div>
                      <span *ngIf="!item.soldTo" class="text-secondary italic">-</span>
                    </td>
                    <td>{{ item.salesAgent || '-' }}</td>
                    <td>{{ item.brokerName || '-' }}</td>
                    <td>{{ item.lastStatusUpdateDate | date:'shortDate' }}</td>
                    <td>{{ item.daysAvailable }} Days</td>
                  </tr>
                  <tr *ngIf="!reportData?.items || reportData?.items.length === 0">
                    <td colspan="13" class="text-center text-secondary italic py-6">No matching records found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Inventory Status Donut Chart -->
          <div class="chart-wrapper card p-4 flex flex-col justify-between">
            <div>
              <h3>Inventory Allocation</h3>
              <p class="text-secondary font-xs mb-4">Allocation ratio segments</p>
            </div>
            <div class="flex flex-col align-center justify-center gap-4">
              <div class="donut-chart-container">
                <svg width="110" height="110" viewBox="0 0 42 42" class="donut">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" stroke-width="4"></circle>
                  <circle *ngFor="let seg of getInventorySegments()"
                          cx="21" cy="21" r="15.915"
                          fill="transparent"
                          [attr.stroke]="seg.color"
                          stroke-width="4.5"
                          [attr.stroke-dasharray]="seg.dasharray"
                          [attr.stroke-dashoffset]="seg.dashoffset">
                  </circle>
                </svg>
                <div class="donut-center-text">
                  <span class="big-number" style="font-size: 16px;">{{ reportData?.metrics?.totalUnits ?? 0 }}</span>
                  <span class="small-label" style="font-size: 8px;">Units</span>
                </div>
              </div>
              
              <div class="source-legend w-full">
                <div class="legend-item">
                  <span class="flex align-center"><span class="legend-dot" style="background-color: var(--color-qualified);"></span><span class="legend-name">Available</span></span>
                  <span class="legend-val">{{ reportData?.metrics?.availableUnits ?? 0 }}</span>
                </div>
                <div class="legend-item">
                  <span class="flex align-center"><span class="legend-dot" style="background-color: var(--color-contacted);"></span><span class="legend-name">Reserved</span></span>
                  <span class="legend-val">{{ reportData?.metrics?.reservedUnits ?? 0 }}</span>
                </div>
                <div class="legend-item">
                  <span class="flex align-center"><span class="legend-dot" style="background-color: var(--color-lost);"></span><span class="legend-name">Sold</span></span>
                  <span class="legend-val">{{ reportData?.metrics?.soldUnits ?? 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== REVENUE TAB ==================== -->
      <div *ngIf="activeTab === 'revenue'" class="grid gap-6">
        <div class="grid grid-3 gap-6">
          <div class="metric-card card border-green">
            <span class="metric-label">Gross Revenue</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.grossRevenue ?? 0) }}</span>
          </div>
          <div class="metric-card card border-teal">
            <span class="metric-label">Collected Revenue</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.collectedRevenue ?? 0) }}</span>
          </div>
          <div class="metric-card card border-orange">
            <span class="metric-label">Outstanding Balance</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.outstandingRevenue ?? 0) }}</span>
          </div>
        </div>

        <div class="grid grid-2-1 gap-6">
          <div class="card">
            <h3>Revenue Breakdown by Contract</h3>
            <div class="table-container mt-4">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Contract No</th>
                    <th>Property Name</th>
                    <th>Property Type</th>
                    <th>Contract Amount</th>
                    <th>Collected</th>
                    <th>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of reportData?.items">
                    <td class="font-bold font-mono">{{ item.contractNo }}</td>
                    <td>{{ item.propertyName }}</td>
                    <td>{{ item.propertyType }}</td>
                    <td class="font-bold">ETB {{ formatValue(item.contractAmount) }}</td>
                    <td class="text-green font-bold">ETB {{ formatValue(item.collected) }}</td>
                    <td class="text-red font-bold">ETB {{ formatValue(item.outstanding) }}</td>
                  </tr>
                  <tr *ngIf="!reportData?.items || reportData?.items.length === 0">
                    <td colspan="6" class="text-center text-secondary italic py-6">No revenue logs found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Revenue Graph -->
          <div class="chart-wrapper card p-4 flex flex-col justify-between">
            <div>
              <h3>Realization Health</h3>
              <p class="text-secondary font-xs mb-4">Cash flow billing collections vs balance rates</p>
            </div>
            <div class="flex flex-col gap-4 mt-2">
              <div>
                <div class="flex justify-between font-xs font-bold text-secondary mb-1">
                  <span>Collected Cash Flow</span>
                  <span class="text-green">{{ getRevenuePercent(reportData?.metrics?.collectedRevenue) }}%</span>
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-fill bg-green" [style.width.%]="getRevenuePercent(reportData?.metrics?.collectedRevenue)"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-xs font-bold text-secondary mb-1">
                  <span>Outstanding Receivables</span>
                  <span class="text-red">{{ getRevenuePercent(reportData?.metrics?.outstandingRevenue) }}%</span>
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-fill bg-red" [style.width.%]="getRevenuePercent(reportData?.metrics?.outstandingRevenue)"></div>
                </div>
              </div>
            </div>
            <div class="alert alert-info py-2 font-xs mt-4">
              Revenue collections rate is stable.
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== COLLECTIONS TAB ==================== -->
      <div *ngIf="activeTab === 'collections'" class="grid gap-6">
        <div class="grid grid-3 gap-6">
          <div class="metric-card card border-blue">
            <span class="metric-label">Total Collections</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.totalCollection ?? 0) }}</span>
          </div>
          <div class="metric-card card border-teal">
            <span class="metric-label">Total Due Installments</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.totalDue ?? 0) }}</span>
          </div>
          <div class="metric-card card border-green">
            <span class="metric-label">Collection Rate</span>
            <span class="metric-value">{{ reportData?.metrics?.collectionRate | number:'1.1-2' }}%</span>
          </div>
        </div>

        <div class="grid grid-2-1 gap-6">
          <div class="card">
            <h3>Collection Ledger</h3>
            <div class="table-container mt-4">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Receipt Ref</th>
                    <th>Property Name</th>
                    <th>Payment Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of reportData?.items">
                    <td class="font-bold font-mono">{{ item.paymentReference }}</td>
                    <td>{{ item.propertyName }}</td>
                    <td>{{ item.paymentDate | date:'mediumDate' }}</td>
                    <td class="font-bold text-green">ETB {{ formatValue(item.paymentAmount) }}</td>
                    <td><span class="badge badge-indigo font-xs">{{ item.paymentMethod }}</span></td>
                  </tr>
                  <tr *ngIf="!reportData?.items || reportData?.items.length === 0">
                    <td colspan="5" class="text-center text-secondary italic py-6">No collections registered.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Collection Path Trend SVG -->
          <div class="chart-wrapper card p-4 flex flex-col justify-between">
            <div>
              <h3>Receipt Velocity</h3>
              <p class="text-secondary font-xs mb-4">Collection receipts timeline path</p>
            </div>
            <div style="height: 140px; position: relative; width: 100%;">
              <svg width="100%" height="100%" viewBox="0 0 300 100">
                <!-- Horizontal Grid Lines -->
                <line x1="0" y1="20" x2="300" y2="20" stroke="var(--border-color)" stroke-dasharray="4 4" stroke-width="0.5"/>
                <line x1="0" y1="50" x2="300" y2="50" stroke="var(--border-color)" stroke-dasharray="4 4" stroke-width="0.5"/>
                <line x1="0" y1="80" x2="300" y2="80" stroke="var(--border-color)" stroke-width="1"/>

                <!-- Area under path -->
                <path [attr.d]="getCollectionAreaPath()" fill="var(--color-qualified)" fill-opacity="0.1" stroke="none"/>

                <!-- Line path -->
                <path [attr.d]="getCollectionPath()" fill="none" stroke="var(--color-qualified)" stroke-width="2.5" [attr.stroke-dasharray]="getCollectionPoints().length === 1 ? '4 4' : 'none'"/>

                <!-- Interactive Circles / Data points -->
                <circle *ngFor="let p of getCollectionPoints()"
                        [attr.cx]="p.x"
                        [attr.cy]="p.y"
                        r="4.5"
                        fill="var(--color-qualified)"
                        stroke="#ffffff"
                        stroke-width="2"/>
              </svg>
            </div>
            <div *ngIf="!reportData?.items || reportData?.items.length === 0" class="text-center py-6 text-secondary italic font-xs">
              No points to trend.
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== RECEIVABLES TAB ==================== -->
      <div *ngIf="activeTab === 'receivables'" class="grid gap-6">
        <div class="grid grid-5 gap-4">
          <div class="metric-card card border-green">
            <span class="metric-label">Current due</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.agingBuckets?.current ?? 0) }}</span>
          </div>
          <div class="metric-card card border-yellow">
            <span class="metric-label">1–30 Days</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.agingBuckets?.['1-30 Days'] ?? 0) }}</span>
          </div>
          <div class="metric-card card border-orange">
            <span class="metric-label">31–60 Days</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.agingBuckets?.['31-60 Days'] ?? 0) }}</span>
          </div>
          <div class="metric-card card border-red">
            <span class="metric-label">61–90 Days</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.agingBuckets?.['61-90 Days'] ?? 0) }}</span>
          </div>
          <div class="metric-card card border-high">
            <span class="metric-label">90+ Days</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.agingBuckets?.['90+ Days'] ?? 0) }}</span>
          </div>
        </div>

        <div class="grid grid-2-1 gap-6">
          <div class="card">
            <h3>Customer Receivables Ledger</h3>
            <div class="table-container mt-4">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Contract No</th>
                    <th>Property</th>
                    <th>Contract Price</th>
                    <th>Total Paid</th>
                    <th>Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of reportData?.items">
                    <td class="font-bold text-main">{{ item.customerName }}</td>
                    <td class="font-mono">{{ item.contractNo }}</td>
                    <td>{{ item.propertyName }}</td>
                    <td class="font-bold">ETB {{ formatValue(item.contractAmount) }}</td>
                    <td class="text-green font-bold">ETB {{ formatValue(item.totalPaid) }}</td>
                    <td class="text-red font-bold">ETB {{ formatValue(item.outstandingBalance) }}</td>
                  </tr>
                  <tr *ngIf="!reportData?.items || reportData?.items.length === 0">
                    <td colspan="6" class="text-center text-secondary italic py-6">No receivables outstanding.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Aging SVG Bar Chart -->
          <div class="chart-wrapper card p-4 flex flex-col justify-between">
            <div>
              <h3>Aging Debt Breakdown</h3>
              <p class="text-secondary font-xs mb-4">Receivables distribution across age brackets</p>
            </div>
            <div style="height: 140px; display: flex; align-items: flex-end; justify-content: space-between; padding: 0 10px;">
              <div class="flex flex-col align-center gap-1" style="flex: 1;">
                <span class="font-xs font-bold text-main" style="font-size: 8px;">{{ formatShortVal(reportData?.metrics?.agingBuckets?.current) }}</span>
                <div style="width: 14px; height: 80px; background: var(--bg-main); border-radius: 2px; display: flex; align-items: flex-end;">
                  <div [style.height.%]="getAgingPercent('current')" style="width: 100%; background-color: var(--color-qualified); border-radius: 2px;"></div>
                </div>
                <span class="font-xs text-secondary" style="font-size: 8px;">Current</span>
              </div>
              <div class="flex flex-col align-center gap-1" style="flex: 1;">
                <span class="font-xs font-bold text-main" style="font-size: 8px;">{{ formatShortVal(reportData?.metrics?.agingBuckets?.['1-30 Days']) }}</span>
                <div style="width: 14px; height: 80px; background: var(--bg-main); border-radius: 2px; display: flex; align-items: flex-end;">
                  <div [style.height.%]="getAgingPercent('1-30 Days')" style="width: 100%; background-color: var(--color-contacted); border-radius: 2px;"></div>
                </div>
                <span class="font-xs text-secondary" style="font-size: 8px;">1-30</span>
              </div>
              <div class="flex flex-col align-center gap-1" style="flex: 1;">
                <span class="font-xs font-bold text-main" style="font-size: 8px;">{{ formatShortVal(reportData?.metrics?.agingBuckets?.['31-60 Days']) }}</span>
                <div style="width: 14px; height: 80px; background: var(--bg-main); border-radius: 2px; display: flex; align-items: flex-end;">
                  <div [style.height.%]="getAgingPercent('31-60 Days')" style="width: 100%; background-color: var(--color-medium); border-radius: 2px;"></div>
                </div>
                <span class="font-xs text-secondary" style="font-size: 8px;">31-60</span>
              </div>
              <div class="flex flex-col align-center gap-1" style="flex: 1;">
                <span class="font-xs font-bold text-main" style="font-size: 8px;">{{ formatShortVal(reportData?.metrics?.agingBuckets?.['61-90 Days']) }}</span>
                <div style="width: 14px; height: 80px; background: var(--bg-main); border-radius: 2px; display: flex; align-items: flex-end;">
                  <div [style.height.%]="getAgingPercent('61-90 Days')" style="width: 100%; background-color: var(--color-lost); border-radius: 2px;"></div>
                </div>
                <span class="font-xs text-secondary" style="font-size: 8px;">61-90</span>
              </div>
              <div class="flex flex-col align-center gap-1" style="flex: 1;">
                <span class="font-xs font-bold text-main" style="font-size: 8px;">{{ formatShortVal(reportData?.metrics?.agingBuckets?.['90+ Days']) }}</span>
                <div style="width: 14px; height: 80px; background: var(--bg-main); border-radius: 2px; display: flex; align-items: flex-end;">
                  <div [style.height.%]="getAgingPercent('90+ Days')" style="width: 100%; background-color: var(--color-high); border-radius: 2px;"></div>
                </div>
                <span class="font-xs text-secondary" style="font-size: 8px;">90+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== LEAD CONVERSIONS TAB ==================== -->
      <div *ngIf="activeTab === 'leads'" class="grid gap-6">
        <div class="grid grid-3 gap-6">
          <div class="metric-card card border-blue">
            <span class="metric-label">Total Leads</span>
            <span class="metric-value">{{ reportData?.metrics?.totalLeads ?? 0 }}</span>
          </div>
          <div class="metric-card card border-green">
            <span class="metric-label">Closed Conversions</span>
            <span class="metric-value">{{ reportData?.metrics?.conversions ?? 0 }}</span>
          </div>
          <div class="metric-card card border-teal">
            <span class="metric-label">Conversion Rate</span>
            <span class="metric-value">{{ reportData?.metrics?.conversionRate | number:'1.1-2' }}%</span>
          </div>
        </div>

        <div class="grid grid-2-1 gap-6">
          <!-- Visual Funnel Progress -->
          <div class="card">
            <h3>Lead Funnel Progress</h3>
            <div class="funnel-container mt-4 flex flex-col gap-3">
              <div class="funnel-stage" *ngFor="let f of reportData?.funnel; let i = index">
                <div class="funnel-bar bg-brand-light" [style.width.%]="getFunnelWidth($any(f).count)">
                  <span class="stage-label">{{ $any(f).stage }}</span>
                  <span class="stage-val font-bold font-mono">{{ $any(f).count }} Leads</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Conversion Status Alerts -->
          <div class="card flex flex-col justify-between">
            <div>
              <h3>Conversion Telemetry</h3>
              <p class="text-secondary font-xs mt-2">Aggregated stages analytics metrics</p>
            </div>
            <div class="alert alert-warning py-3 font-xs mt-4">
              <strong>Funnel status:</strong> Stage qualification conversions are trending up.
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== BROKER COMMISSIONS TAB ==================== -->
      <div *ngIf="activeTab === 'brokers'" class="grid gap-6">
        <div class="grid grid-4 gap-6">
          <div class="metric-card card border-indigo">
            <span class="metric-label">Commission Earned</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.commissionEarned ?? 0) }}</span>
          </div>
          <div class="metric-card card border-green">
            <span class="metric-label">Commission Paid</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.commissionPaid ?? 0) }}</span>
          </div>
          <div class="metric-card card border-yellow">
            <span class="metric-label">Pending</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.pendingCommission ?? 0) }}</span>
          </div>
          <div class="metric-card card border-orange">
            <span class="metric-label">Outstanding Payouts</span>
            <span class="metric-value">ETB {{ formatValue(reportData?.metrics?.outstandingCommission ?? 0) }}</span>
          </div>
        </div>

        <div class="grid grid-2-1 gap-6">
          <div class="card">
            <h3>Broker Commissions Summary</h3>
            <div class="table-container mt-4">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Broker Name</th>
                    <th>Property Name</th>
                    <th>Sale Value</th>
                    <th>Commission Amount</th>
                    <th>Calculated Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of reportData?.items">
                    <td class="font-bold text-main">{{ item.brokerName }}</td>
                    <td>{{ item.propertyName }}</td>
                    <td class="font-bold font-mono">ETB {{ formatValue(item.saleAmount) }}</td>
                    <td class="font-bold text-indigo font-mono">ETB {{ formatValue(item.commissionAmount) }}</td>
                    <td>{{ item.calculatedDate | date:'mediumDate' }}</td>
                    <td>
                      <span class="badge" 
                        [class.badge-new]="item.status === 'PAID'"
                        [class.badge-medium]="item.status === 'APPROVED' || item.status === 'PAYABLE'"
                        [class.badge-high]="item.status === 'PENDING'">
                        {{ item.status }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="!reportData?.items || reportData?.items.length === 0">
                    <td colspan="6" class="text-center text-secondary italic py-6">No broker commissions generated.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Leaderboard SVG Graph -->
          <div class="chart-wrapper card p-4 flex flex-col justify-between">
            <div>
              <h3>Commission Outputs</h3>
              <p class="text-secondary font-xs mb-4">Leaderboard shares comparison</p>
            </div>
            <div class="flex flex-col gap-4">
              <div *ngFor="let item of reportData?.items | slice:0:4" class="flex flex-col gap-1 w-full">
                <div class="flex justify-between font-xs font-bold text-secondary">
                  <span>{{ $any(item).brokerName }}</span>
                  <span class="text-indigo">ETB {{ formatShortVal($any(item).commissionAmount) }}</span>
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-fill bg-indigo" [style.width.%]="getBrokerPercent($any(item).commissionAmount)"></div>
                </div>
              </div>
              <div *ngIf="!reportData?.items || reportData?.items.length === 0" class="text-center py-6 text-secondary italic font-xs">
                No broker rankings compiled.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .tab-container {
      padding: 6px;
      overflow-x: auto;
    }
    .tabs-bar {
      display: inline-flex;
      min-width: 100%;
      gap: 6px;
      white-space: nowrap;
      justify-content: flex-start;
    }
    .tab-btn {
      padding: 10px 16px;
      border: none;
      background: none;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .tab-btn:hover {
      color: var(--text-main);
      background-color: var(--bg-hover);
    }
    .tab-btn.active {
      color: white;
      background-color: var(--brand-primary);
    }
    .tab-btn .material-icons-outlined {
      font-size: 18px;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .customer-option-item:hover {
      background-color: var(--brand-primary-light) !important;
    }
    .filter-item label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .filter-item select, .filter-item input {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      font-size: 13px;
      color: var(--text-main);
      background-color: var(--bg-main);
    }

    .grid {
      display: grid;
      gap: 20px;
    }
    .grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .grid-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    .grid-5 {
      grid-template-columns: repeat(5, 1fr);
    }
    .grid-2-1 {
      grid-template-columns: 2.2fr 1fr;
    }
    .gap-6 {
      gap: 24px;
    }
    .mt-4 {
      margin-top: 16px;
    }

    .metric-card {
      display: flex;
      flex-direction: column;
      padding: 16px 20px;
      border-left: 4px solid var(--border-color);
    }
    .border-blue { border-left-color: var(--color-new); }
    .border-indigo { border-left-color: var(--brand-primary); }
    .border-green { border-left-color: var(--color-qualified); }
    .border-orange { border-left-color: var(--color-medium); }
    .border-teal { border-left-color: var(--color-converted); }
    .border-yellow { border-left-color: var(--color-contacted); }
    .border-red { border-left-color: var(--color-lost); }
    .border-high { border-left-color: var(--color-high); }

    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 4px;
    }
    .metric-label {
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 700;
    }

    .icon-large {
      font-size: 40px;
    }
    .text-blue { color: var(--color-new); }
    .text-indigo { color: var(--brand-primary); }
    .text-green { color: var(--color-qualified); }
    .text-red { color: var(--color-lost); }

    .funnel-container {
      background-color: var(--bg-hover);
      border-radius: var(--radius-md);
      padding: 20px;
    }
    .funnel-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--brand-primary), #6366f1);
      color: white;
      min-width: 150px;
      max-width: 100%;
      transition: width 0.8s ease-in-out;
    }
    .stage-label {
      font-weight: 600;
    }

    .chart-wrapper {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }

    /* Premium styled table rules */
    .report-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .report-table th {
      padding: 12px 16px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-secondary);
      background-color: var(--bg-main);
      border-bottom: 1px solid var(--border-color);
    }
    .report-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: var(--text-main);
      vertical-align: middle;
    }
    .report-table tr:hover td {
      background-color: #f8fafc;
    }
    .badge-indigo {
      background-color: var(--brand-primary-fade);
      color: var(--brand-primary);
    }

    .donut-chart-container {
      position: relative;
      display: inline-block;
    }
    .donut-center-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .donut-center-text .big-number { font-weight: 700; color: var(--text-main); }
    .donut-center-text .small-label { color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
    
    .source-legend {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
    }
    .legend-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-right: 6px;
      display: inline-block;
    }
    .legend-name { color: var(--text-secondary); }
    .legend-val { font-weight: 700; color: var(--text-main); }

    .progress-bar-wrapper {
      height: 6px;
      width: 100%;
      background-color: var(--bg-main);
      border-radius: var(--radius-round);
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-round);
    }
    .bg-gradient-brand {
      background: linear-gradient(135deg, var(--brand-primary) 0%, #3c2c7f 100%);
    }
    .text-white-50 {
      color: rgba(255, 255, 255, 0.7);
    }
  `]
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private propertiesService = inject(PropertiesService);
  private crmService = inject(CrmService);
  private brokerService = inject(BrokerService);
  private financeService = inject(FinanceService);
  private salesService = inject(SalesService);

  activeTab = 'overall';
  properties: any[] = [];
  statuses: any[] = [];
  unitTypes: any[] = [];
  agents: any[] = [];
  brokers: any[] = [];
  paymentMethods: any[] = [];
  sites: any[] = [];
  customers: any[] = [];
  customerSearchQuery = '';
  customerDropdownOpen = false;

  reportData: any = null;
  filters: any = {
    propertyId: null,
    startDate: null,
    endDate: null,
    statusId: null,
    unitTypeId: null,
    siteId: null,
    buildingId: null,
    floorId: null,
    salespersonId: null,
    brokerId: null,
    paymentMethodId: null,
    customerId: null,
    agingBucket: null,
    priceMin: null,
    priceMax: null,
    sizeMin: null,
    sizeMax: null,
    status: null,
  };

  overviewKpis: any = null;
  overviewRealtime: any = null;
  overviewSalesTrends: any[] = [];
  overviewLeadTrends: any = null;
  overviewBrokerTrends: any = null;

  ngOnInit() {
    this.loadFilterMetadata();
    this.loadOverviewData();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.reportData = null;
    this.resetFilters();
    if (tab !== 'overall') {
      this.fetchReportData();
    } else {
      this.loadOverviewData();
    }
  }

  resetFilters() {
    this.filters = {
      propertyId: null,
      startDate: null,
      endDate: null,
      statusId: null,
      unitTypeId: null,
      siteId: null,
      buildingId: null,
      floorId: null,
      salespersonId: null,
      brokerId: null,
      paymentMethodId: null,
      customerId: null,
      agingBucket: null,
      priceMin: null,
      priceMax: null,
      sizeMin: null,
      sizeMax: null,
      status: null,
    };
    this.sites = [];
  }

  loadFilterMetadata() {
    this.propertiesService.getProperties().subscribe(res => this.properties = res.items || []);
    this.propertiesService.getUnitStatuses().subscribe(res => this.statuses = res || []);
    this.propertiesService.getUnitTypes().subscribe(res => this.unitTypes = res || []);
    this.crmService.getAgents().subscribe(res => this.agents = res || []);
    this.brokerService.getBrokers().subscribe(res => this.brokers = res || []);
    this.financeService.getPaymentMethods().subscribe(res => this.paymentMethods = res || []);
    this.salesService.getCustomers().subscribe(res => this.customers = res || []);
  }

  onPropertyChange() {
    this.sites = [];
    this.filters.siteId = null;
    if (this.filters.propertyId) {
      this.propertiesService.getSites(this.filters.propertyId).subscribe(res => this.sites = res || []);
    }
    this.onFilterChange();
  }

  fetchReportData() {
    const cleanFilters: any = {};
    Object.keys(this.filters).forEach(k => {
      if (this.filters[k] !== null && this.filters[k] !== 'null') {
        cleanFilters[k] = this.filters[k];
      }
    });

    switch (this.activeTab) {
      case 'sales':
        this.reportsService.getSalesReport(cleanFilters).subscribe(res => this.reportData = res);
        break;
      case 'inventory':
        this.reportsService.getInventoryAvailabilityReport(cleanFilters).subscribe(res => this.reportData = res);
        break;
      case 'revenue':
        this.reportsService.getRevenueReport(cleanFilters).subscribe(res => this.reportData = res);
        break;
      case 'collections':
        this.reportsService.getCollectionReport(cleanFilters).subscribe(res => this.reportData = res);
        break;
      case 'receivables':
        this.reportsService.getReceivablesReport(cleanFilters).subscribe(res => this.reportData = res);
        break;
      case 'leads':
        this.reportsService.getLeadFunnelReport(cleanFilters).subscribe(res => this.reportData = res);
        break;
      case 'brokers':
        this.reportsService.getBrokerCommissionsReport(cleanFilters).subscribe(res => this.reportData = res);
        break;
    }
  }

  onFilterChange() {
    this.fetchReportData();
  }

  getSelectedCustomerName(): string {
    if (!this.filters.customerId) return 'All Customers';
    const cust = this.customers.find(c => String(c.id) === String(this.filters.customerId));
    return cust ? cust.fullName : 'All Customers';
  }

  filteredCustomers(): any[] {
    if (!this.customerSearchQuery.trim()) return this.customers;
    const query = this.customerSearchQuery.toLowerCase().trim();
    return this.customers.filter(c => 
      String(c.fullName).toLowerCase().includes(query) ||
      String(c.id).toLowerCase().includes(query) ||
      String(c.phone || '').toLowerCase().includes(query)
    );
  }

  selectCustomer(id: number | null) {
    this.filters.customerId = id;
    this.customerDropdownOpen = false;
    this.customerSearchQuery = '';
    this.onFilterChange();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.customer-dropdown-container')) {
      this.customerDropdownOpen = false;
    }
  }

  exportActiveReport() {
    if (this.activeTab === 'overall') {
      alert('Please select a specific report tab to export.');
      return;
    }

    let reportCode = '';
    let columns: string[] = [];

    switch (this.activeTab) {
      case 'sales':
        reportCode = 'SALES_PERFORMANCE';
        columns = ['contractNo', 'siteName', 'propertyCode', 'propertyName', 'propertyType', 'contractAmount', 'salesAgent', 'brokerName', 'contractDate', 'status'];
        break;
      case 'inventory':
        reportCode = 'INVENTORY_AVAILABILITY';
        columns = ['propertyCode', 'propertyName', 'siteName', 'propertyType', 'unitSize', 'listingPrice', 'currentStatus', 'reservedBy', 'reservationDate', 'soldTo', 'saleDate', 'salesAgent', 'brokerName', 'lastStatusUpdateDate', 'daysAvailable'];
        break;
      case 'revenue':
        reportCode = 'REVENUE_ANALYSIS';
        columns = ['contractNo', 'propertyName', 'propertyType', 'contractAmount', 'collected', 'outstanding'];
        break;
      case 'collections':
        reportCode = 'COLLECTION_MONITORING';
        columns = ['paymentReference', 'propertyName', 'paymentDate', 'paymentAmount', 'paymentMethod'];
        break;
      case 'receivables':
        reportCode = 'RECEIVABLE_MONITORING';
        columns = ['customerName', 'contractNo', 'propertyName', 'contractAmount', 'totalPaid', 'outstandingBalance'];
        break;
      case 'brokers':
        reportCode = 'BROKER_COMMISSIONS';
        columns = ['brokerName', 'propertyName', 'saleAmount', 'commissionAmount', 'calculatedDate', 'status'];
        break;
    }

    if (!reportCode) {
      alert('Export not supported for this tab.');
      return;
    }

    const cleanFilters: any = {};
    Object.keys(this.filters).forEach(k => {
      if (this.filters[k] !== null && this.filters[k] !== 'null') {
        cleanFilters[k] = this.filters[k];
      }
    });

    this.reportsService.exportReport(reportCode, cleanFilters, columns).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${this.activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => console.error('Export failed:', err)
    });
  }

  showPropertyFilter(): boolean {
    return ['sales', 'inventory', 'revenue', 'collections', 'receivables', 'brokers'].includes(this.activeTab);
  }

  showDateFilter(): boolean {
    return ['sales', 'inventory', 'revenue', 'collections', 'leads', 'brokers'].includes(this.activeTab);
  }

  formatValue(val: any): string {
    if (val === null || val === undefined) return '0.00';
    const num = Number(val);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatShortVal(val: any): string {
    if (val === null || val === undefined) return '0';
    const num = Number(val);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }

  getFunnelWidth(count: number): number {
    if (!this.reportData || !this.reportData.metrics || this.reportData.metrics.totalLeads === 0) return 10;
    const max = this.reportData.metrics.totalLeads;
    const pct = (count / max) * 100;
    return pct < 15 ? 15 : pct;
  }

  // --- Dynamic SVG Chart Scaling calculations ---

  getContractBarHeight(val: any): number {
    if (!this.reportData || !this.reportData.items || this.reportData.items.length === 0) return 0;
    const max = Math.max(...this.reportData.items.map((i: any) => Number(i.contractAmount || 0)), 1);
    return Math.round((Number(val) / max) * 80);
  }

  getInventorySegments() {
    if (!this.reportData || !this.reportData.metrics) return [];
    const metrics = this.reportData.metrics;
    const total = (metrics.availableUnits || 0) + (metrics.reservedUnits || 0) + (metrics.soldUnits || 0);
    if (total === 0) return [];
    
    const segments = [
      { count: metrics.availableUnits || 0, color: 'var(--color-qualified)' },
      { count: metrics.reservedUnits || 0, color: 'var(--color-contacted)' },
      { count: metrics.soldUnits || 0, color: 'var(--color-lost)' },
    ];
    let offset = 100;
    return segments.map(s => {
      const pct = Math.round((s.count / total) * 100);
      const dasharray = `${pct} ${100 - pct}`;
      const dashoffset = offset;
      offset -= pct;
      return { dasharray, dashoffset, color: s.color };
    });
  }

  getRevenuePercent(val: any): number {
    if (!this.reportData || !this.reportData.metrics) return 0;
    const gross = Number(this.reportData.metrics.grossRevenue || 1);
    return Math.round((Number(val) / gross) * 100);
  }

  getCollectionPoints(): { x: number; y: number; amount: number }[] {
    if (!this.reportData || !this.reportData.items || this.reportData.items.length === 0) return [];
    const items = this.reportData.items.slice(0, 5);
    const len = items.length;
    return items.map((item: any, idx: number) => {
      let x = 150; // default center for 1 item
      if (len > 1) {
        x = 20 + idx * (260 / (len - 1));
      }
      const y = 80 - this.getCollectionY(item.paymentAmount);
      return { x, y, amount: Number(item.paymentAmount || 0) };
    });
  }

  getCollectionPath(): string {
    const points = this.getCollectionPoints();
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M 0 ${points[0].y} L 300 ${points[0].y}`;
    }
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  getCollectionAreaPath(): string {
    const points = this.getCollectionPoints();
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M 0 ${points[0].y} L 300 ${points[0].y} L 300 80 L 0 80 Z`;
    }
    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} 80 L ${first.x} 80 Z`;
  }

  getCollectionY(amount: any): number {
    if (!this.reportData || !this.reportData.items || this.reportData.items.length === 0) return 0;
    const maxVal = Math.max(...this.reportData.items.map((i: any) => Number(i.paymentAmount || 0)), 1);
    return Math.round((Number(amount) / maxVal) * 60);
  }

  getAgingPercent(bucketName: string): number {
    if (!this.reportData || !this.reportData.metrics || !this.reportData.metrics.agingBuckets) return 0;
    const buckets = this.reportData.metrics.agingBuckets;
    const maxVal = Math.max(
      Number(buckets.current || 0),
      Number(buckets['1-30 Days'] || 0),
      Number(buckets['31-60 Days'] || 0),
      Number(buckets['61-90 Days'] || 0),
      Number(buckets['90+ Days'] || 0),
      1
    );
    const amount = Number(buckets[bucketName] || 0);
    return Math.round((amount / maxVal) * 100);
  }

  getFunnelPercent(count: number): number {
    if (!this.reportData || !this.reportData.metrics || this.reportData.metrics.totalLeads === 0) return 0;
    return Math.round((count / this.reportData.metrics.totalLeads) * 100);
  }

  getBrokerPercent(amount: any): number {
    if (!this.reportData || !this.reportData.items || this.reportData.items.length === 0) return 0;
    const maxVal = Math.max(...this.reportData.items.map((i: any) => Number(i.commissionAmount || 0)), 1);
    return Math.round((Number(amount) / maxVal) * 100);
  }

  loadOverviewData() {
    this.reportsService.getKpis().subscribe({
      next: (res) => this.overviewKpis = res,
      error: (err) => console.error('Error fetching overall KPIs:', err)
    });

    this.reportsService.getRealTimeStats().subscribe({
      next: (res) => this.overviewRealtime = res,
      error: (err) => console.error('Error fetching overall realtime stats:', err)
    });
    
    this.reportsService.getSalesTrends('monthly').subscribe({
      next: (res) => {
        this.overviewSalesTrends = res ? res.slice(-5) : [];
      },
      error: (err) => console.error('Error fetching overall sales trends:', err)
    });

    this.reportsService.getLeadTrends().subscribe({
      next: (res) => this.overviewLeadTrends = res,
      error: (err) => console.error('Error fetching overall lead trends:', err)
    });

    this.reportsService.getBrokerTrends().subscribe({
      next: (res) => this.overviewBrokerTrends = res,
      error: (err) => console.error('Error fetching overall broker trends:', err)
    });
  }

  getOverviewCollectionRate(): string {
    if (!this.overviewKpis || !this.overviewKpis.totalRevenue) return '0.0';
    return ((this.overviewKpis.totalCollections / this.overviewKpis.totalRevenue) * 100).toFixed(1);
  }

  getOverviewSalesHeightPercent(count: number): number {
    if (!this.overviewSalesTrends || this.overviewSalesTrends.length === 0) return 0;
    const max = Math.max(...this.overviewSalesTrends.map(s => s.salesCount), 1);
    return Math.round((count / max) * 100);
  }

  getInventoryAllocationPercent(): number {
    if (!this.overviewKpis) return 0;
    const total = (this.overviewKpis.availableInventory || 0) + (this.overviewKpis.unitsSold || 0);
    if (total === 0) return 0;
    return Math.round((this.overviewKpis.availableInventory / total) * 100);
  }

  getSourceColor(monthName: string): string {
    const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
    let hash = 0;
    if (monthName) {
      for (let i = 0; i < monthName.length; i++) {
        hash = monthName.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  formatMonthLabel(periodStr: string): string {
    if (!periodStr) return '';
    const parts = periodStr.split('-');
    if (parts.length === 2) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return monthNames[monthIdx] || periodStr;
    }
    return periodStr;
  }
}
