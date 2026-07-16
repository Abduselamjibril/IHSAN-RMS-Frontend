import { Component, signal, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img class="brand-logo" src="/IHSAN LOGO 2.jpg" alt="IHSAN Properties and Business Services">
        <div class="brand-text-wrapper">
          <span class="brand-title">IHSAN</span>
          <span class="brand-subtitle">PROPERTY MANAGEMENT</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <ul>
          <li class="menu-label">OVERVIEW</li>
          <li>
            <a routerLink="/dashboard" routerLinkActive="active" class="menu-item">
              <span class="material-icons-outlined">dashboard</span>
              <span class="menu-text">Executive Dashboard</span>
            </a>
          </li>
          <li class="menu-label">OPERATIONS</li>
          <li *ngIf="authService.hasModuleAccess('crm.')">
            <a (click)="toggleLeads($event)" class="menu-item cursor-pointer" [class.active-parent]="isLeadsActive()">
              <span class="material-icons-outlined">people_outline</span>
              <span class="menu-text">Leads Module</span>
              <span class="material-icons-outlined arrow-icon">{{ isLeadsSubmenuOpen ? 'expand_less' : 'expand_more' }}</span>
            </a>
            
            <ul class="submenu" [class.open]="isLeadsSubmenuOpen">
              <li *ngIf="authService.hasPermission('crm.leads.read_all', 'view')">
                <a routerLink="/leads" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">people_outline</span>
                  <span class="menu-text">Leads</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.agents.read', 'view')">
                <a routerLink="/agents" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">people</span>
                  <span class="menu-text">Sales Agents</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.lead_sources.read_all', 'view')">
                <a routerLink="/lead-sources" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">share</span>
                  <span class="menu-text">Lead Sources</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.leads.activities.create', 'create')">
                <a routerLink="/log-interaction" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">history_edu</span>
                  <span class="menu-text">Log Interaction</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.agents.reminders.read', 'view')">
                <a routerLink="/follow-ups" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">alarm</span>
                  <span class="menu-text">Follow-ups</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.opportunities.read_all', 'view')">
                <a routerLink="/opportunities" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">trending_up</span>
                  <span class="menu-text">Opportunities</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.opportunities.forecast.read', 'view')">
                <a routerLink="/forecasting" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">insights</span>
                  <span class="menu-text">Forecasting</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.leads.read_all', 'view')">
                <a routerLink="/lead-tracking" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">timeline</span>
                  <span class="menu-text">Lead Tracking</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.leads.read_all', 'view')">
                <a routerLink="/communications" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">chat_bubble_outline</span>
                  <span class="menu-text">Communications</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.documents.read_all', 'view')">
                <a routerLink="/documents" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">description</span>
                  <span class="menu-text">Documents</span>
                </a>
              </li>
              <li *ngIf="authService.hasPermission('crm.segments.read_all', 'view')">
                <a routerLink="/segmentation" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">segment</span>
                  <span class="menu-text">Segmentation</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Collapsible Property Management Section -->
          <li *ngIf="authService.hasModuleAccess('properties.')">
            <a (click)="toggleProperties()" class="menu-item cursor-pointer" [class.active-parent]="isPropertyActive()">
              <span class="material-icons-outlined">business</span>
              <span class="menu-text">Property Module</span>
              <span class="material-icons-outlined arrow-icon">{{ propertiesExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="propertiesExpanded()">
              <li>
                <a routerLink="/properties/list" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">business</span>
                  <span class="menu-text">Properties</span>
                </a>
              </li>
              <li>
                <a routerLink="/properties/buildings" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">domain</span>
                  <span class="menu-text">Buildings</span>
                </a>
              </li>
              <li>
                <a routerLink="/properties/units" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">apartment</span>
                  <span class="menu-text">Units / Inventory</span>
                </a>
              </li>
              <li>
                <a routerLink="/properties/unit-status" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">sync</span>
                  <span class="menu-text">Unit Status</span>
                </a>
              </li>
              <li>
                <a routerLink="/properties/pricing" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">monetization_on</span>
                  <span class="menu-text">Pricing</span>
                </a>
              </li>
              <li>
                <a routerLink="/properties/floor-plans" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">map</span>
                  <span class="menu-text">Floor / Plans</span>
                </a>
              </li>
              <li>
                <a routerLink="/properties/media" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">photo_library</span>
                  <span class="menu-text">Media & Docs</span>
                </a>
              </li>
              <li>
                <a routerLink="/properties/amenities" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">pool</span>
                  <span class="menu-text">Amenities</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Collapsible Sales Management Section -->
          <li *ngIf="authService.hasModuleAccess('sales.')">
            <a (click)="toggleSales()" class="menu-item cursor-pointer" [class.active-parent]="isSalesActive()">
              <span class="material-icons-outlined">monetization_on</span>
              <span class="menu-text">Sales Module</span>
              <span class="material-icons-outlined arrow-icon">{{ salesExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="salesExpanded()">
              <li>
                <a routerLink="/sales/customers" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">people</span>
                  <span class="menu-text">Customers</span>
                </a>
              </li>
              <li>
                <a routerLink="/sales/reservations" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">schedule</span>
                  <span class="menu-text">Reservations</span>
                </a>
              </li>
              <li>
                <a routerLink="/sales/quotations" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">request_quote</span>
                  <span class="menu-text">Quotations & Rules</span>
                </a>
              </li>
              <li>
                <a routerLink="/sales/bookings" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">book_online</span>
                  <span class="menu-text">Bookings</span>
                </a>
              </li>
              <li>
                <a routerLink="/sales/contracts" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">gavel</span>
                  <span class="menu-text">Contracts & Agrmts</span>
                </a>
              </li>
              <li>
                <a routerLink="/sales/installments" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">calendar_month</span>
                  <span class="menu-text">Installments Ledger</span>
                </a>
              </li>
              <li>
                <a routerLink="/sales/commissions" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">payments</span>
                  <span class="menu-text">Commissions</span>
                </a>
              </li>
            </ul>
          </li>

          <li class="menu-label">FINANCE & GROWTH</li>
          <!-- Collapsible Finance & Collections Section -->
          <li *ngIf="authService.hasModuleAccess('finance.')">
            <a (click)="toggleFinance()" class="menu-item cursor-pointer" [class.active-parent]="isFinanceActive()">
              <span class="material-icons-outlined">account_balance_wallet</span>
              <span class="menu-text">Finance & Collections</span>
              <span class="material-icons-outlined arrow-icon">{{ financeExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="financeExpanded()">
              <li>
                <a routerLink="/finance/collections" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">receipt_long</span>
                  <span class="menu-text">Collections Ledger</span>
                </a>
              </li>
              <li>
                <a routerLink="/finance/installments" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">edit_calendar</span>
                  <span class="menu-text">Reschedule & Penalties</span>
                </a>
              </li>
              <li>
                <a routerLink="/finance/receipts" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">receipt</span>
                  <span class="menu-text">Receipts & Templates</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Collapsible Marketing Management Section -->
          <li *ngIf="authService.hasModuleAccess('marketing.')">
            <a (click)="toggleMarketing()" class="menu-item cursor-pointer" [class.active-parent]="isMarketingActive()">
              <span class="material-icons-outlined">campaign</span>
              <span class="menu-text">Marketing Module</span>
              <span class="material-icons-outlined arrow-icon">{{ marketingExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="marketingExpanded()">
              <li>
                <a routerLink="/marketing/campaigns" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">campaign</span>
                  <span class="menu-text">Campaigns</span>
                </a>
              </li>
              <li>
                <a routerLink="/marketing/ads" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">ads_click</span>
                  <span class="menu-text">Ads & Channels</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Collapsible Broker Management Section -->
          <li *ngIf="authService.hasModuleAccess('broker.')">
            <a (click)="toggleBroker()" class="menu-item cursor-pointer" [class.active-parent]="isBrokerActive()">
              <span class="material-icons-outlined">support_agent</span>
              <span class="menu-text">Broker Module</span>
              <span class="material-icons-outlined arrow-icon">{{ brokerExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="brokerExpanded()">
              <li>
                <a routerLink="/broker/list" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">people</span>
                  <span class="menu-text">Brokers Directory</span>
                </a>
              </li>
              <li>
                <a routerLink="/broker/assignments" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">assignment_ind</span>
                  <span class="menu-text">Assignments</span>
                </a>
              </li>
              <li>
                <a routerLink="/broker/plans" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">settings_suggest</span>
                  <span class="menu-text">Commission Plans</span>
                </a>
              </li>
              <li>
                <a routerLink="/broker/commissions" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">payments</span>
                  <span class="menu-text">Sales & Commissions</span>
                </a>
              </li>
              <li>
                <a routerLink="/broker/payments" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">account_balance</span>
                  <span class="menu-text">Payouts</span>
                </a>
              </li>
            </ul>
          </li>

          <li class="menu-label" *ngIf="authService.hasModuleAccess('reports.')">REPORTING & INSIGHTS</li>
          <li *ngIf="authService.hasModuleAccess('reports.')">
            <a routerLink="/reports" routerLinkActive="active" class="menu-item">
              <span class="material-icons-outlined">analytics</span>
              <span class="menu-text">Reports & Analytics</span>
            </a>
          </li>

          <li class="menu-label">SYSTEM</li>
          <!-- Collapsible Notifications Section -->
          <li>
            <a (click)="toggleNotifications()" class="menu-item cursor-pointer" [class.active-parent]="isNotificationsActive()">
              <span class="material-icons-outlined">notifications</span>
              <span class="menu-text">Notifications</span>
              <span class="badge badge-rejected" *ngIf="unreadCount > 0" style="margin-left: auto; padding: 2px 6px; font-size: 10px; border-radius: 10px; background: #ef4444; color: white;">{{ unreadCount }}</span>
              <span class="material-icons-outlined arrow-icon" [style.margin-left]="unreadCount > 0 ? '8px' : 'auto'">{{ notificationsExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="notificationsExpanded() || isNotificationsActive()">
              <li>
                <a routerLink="/notifications/inbox" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">inbox</span>
                  <span class="menu-text">Inbox</span>
                </a>
              </li>
              <li>
                <a routerLink="/notifications/preferences" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">toggle_on</span>
                  <span class="menu-text">Preferences</span>
                </a>
              </li>
              <li>
                <a routerLink="/notifications/templates" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">palette</span>
                  <span class="menu-text">Templates</span>
                </a>
              </li>
            </ul>
          </li>

          <li *ngIf="authService.currentUser()?.roles?.includes('System Administrator')">
            <a (click)="toggleSecurity()" class="menu-item cursor-pointer" [class.active-parent]="isSecurityActive()">
              <span class="material-icons-outlined">admin_panel_settings</span>
              <span class="menu-text">Security & Roles</span>
              <span class="material-icons-outlined arrow-icon">{{ securityExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="securityExpanded() || isSecurityActive()">
              <li>
                <a routerLink="/security/users" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">people_outline</span>
                  <span class="menu-text">User Directory</span>
                </a>
              </li>
              <li>
                <a routerLink="/security/roles" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">lock_open</span>
                  <span class="menu-text">Permissions Matrix</span>
                </a>
              </li>
              <li>
                <a routerLink="/security/workflows" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">task_alt</span>
                  <span class="menu-text">Approval Workflows</span>
                </a>
              </li>
              <li>
                <a routerLink="/security/audit" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">receipt_long</span>
                  <span class="menu-text">Security Auditing</span>
                </a>
              </li>
            </ul>
          </li>

          <li>
            <a class="menu-item disabled">
              <span class="material-icons-outlined">settings</span>
              <span class="menu-text">Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-profile" *ngIf="authService.currentUser() as user">
        <div class="avatar">
          {{ getInitials(user.firstName, user.lastName) }}
        </div>
        <div class="profile-info">
          <span class="profile-name">{{ user.firstName }} {{ user.lastName }}</span>
          <span class="profile-role">{{ user.roles?.[0] || 'User' }}</span>
        </div>
        <button (click)="themeToggle.emit()" [title]="darkMode ? 'Use light mode' : 'Use dark mode'" class="theme-toggle">
          <span class="material-icons-outlined">{{ darkMode ? 'light_mode' : 'dark_mode' }}</span>
        </button>
        <button (click)="authService.logout()" title="Sign Out" class="icon-btn text-danger" style="margin-left: auto; width: 28px; height: 28px; background-color: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;">
          <span class="material-icons-outlined" style="font-size: 16px; color: #ef4444;">logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: linear-gradient(180deg, #071a3c 0%, #03102a 58%, #020a1c 100%);
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(93, 177, 255, 0.14);
      font-weight: 500;
    }

    .sidebar-brand {
      min-height: 82px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .brand-logo {
      width: 48px;
      height: 48px;
      object-fit: cover;
      object-position: center 22%;
      border-radius: 14px;
      border: 1px solid rgba(245, 190, 67, .6);
      box-shadow: 0 8px 18px rgba(0, 0, 0, .28);
    }

    .brand-text-wrapper {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      color: white;
      font-weight: 700;
      font-size: 18px;
      letter-spacing: 1.4px;
    }

    .brand-subtitle {
      font-size: 8px;
      color: #91caff;
      letter-spacing: .7px;
      font-weight: 700;
    }

    .sidebar-menu {
      flex: 1;
      padding: 18px 14px;
      overflow-y: auto;
    }

    .sidebar-menu ul {
      list-style: none;
    }

    .sidebar-menu li {
      margin-bottom: 6px;
    }

    .sidebar-menu .menu-label {
      margin: 20px 10px 8px;
      color: #6f9ed1;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.3px;
    }
    .sidebar-menu .menu-label:first-child { margin-top: 3px; }

    .menu-group {
      display: flex;
      flex-direction: column;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 13px;
      border-radius: var(--radius-md);
      color: #b7cce6;
      transition: var(--transition-fast);
      user-select: none;
      cursor: pointer;
      position: relative;
    }

    .menu-item:hover {
      color: white;
      background-color: rgba(49, 150, 237, 0.12);
    }

    .menu-item.active {
      color: white;
      background: linear-gradient(90deg, #0878ca, #0466b1);
      box-shadow: 0 8px 18px rgba(0, 126, 211, .25);
    }

    .menu-item.active-parent {
      color: white;
      background-color: rgba(255, 255, 255, 0.04);
      border-left: 3px solid #f4bf4f;
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .menu-item.active .material-icons-outlined {
      color: white;
    }

    .expand-icon {
      margin-left: auto;
      font-size: 18px;
      color: #72a9dc;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .menu-item:hover .expand-icon {
      color: white;
    }

    .submenu {
      list-style: none;
      padding-left: 10px;
      margin-left: 26px;
      border-left: 1px dashed rgba(255, 255, 255, 0.12);
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin 0.35s;
    }

    .submenu.open {
      max-height: 500px;
      margin-top: 4px;
      margin-bottom: 8px;
    }

    .submenu-item {
      padding: 9px 12px;
      font-size: 13px;
      gap: 10px;
      color: #9ab8d8;
    }

    .submenu-item .material-icons-outlined {
      font-size: 18px;
    }

    .submenu-item.active {
      background-color: rgba(20, 138, 227, .16);
      color: white;
      box-shadow: none;
    }

    .menu-item.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .menu-item.disabled:hover {
      background-color: transparent;
      color: #a0aec0;
    }

    .material-icons-outlined {
      font-size: 22px;
      color: #718096;
      transition: var(--transition-fast);
    }

    .menu-item:hover .material-icons-outlined {
      color: white;
    }

    .menu-text {
      font-size: 14px;
    }

    .sidebar-profile {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      gap: 12px;
      background-color: rgba(0, 0, 0, 0.15);
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-round);
      background: linear-gradient(135deg, #f3c45c, #b97818);
      color: white;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .profile-info {
      display: flex;
      flex-direction: column;
    }

    .profile-name {
      color: white;
      font-size: 14px;
      font-weight: 600;
    }

    .profile-role {
      font-size: 11px;
      color: #8fb9e3;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .arrow-icon {
      margin-left: auto;
      font-size: 18px;
    }

    .theme-toggle {
      width: 32px;
      height: 32px;
      margin-left: auto;
      border: 1px solid rgba(140, 197, 244, .22);
      border-radius: 10px;
      color: #f4bf4f;
      background: rgba(43, 126, 202, .13);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .theme-toggle .material-icons-outlined { color: inherit; font-size: 18px; }

    .submenu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      color: #a0aec0;
      font-size: 13px;
      transition: var(--transition-fast);
    }

    .submenu-item:hover {
      color: white;
      background-color: rgba(255, 255, 255, 0.03);
    }

    .submenu-item.active {
      color: white;
      background-color: rgba(255, 255, 255, 0.08);
    }

    .font-sm {
      font-size: 16px;
    }
  `]
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  @Input() darkMode = false;
  @Output() themeToggle = new EventEmitter<void>();
  
  propertiesExpanded = signal(false);
  salesExpanded = signal(false);
  financeExpanded = signal(false);
  marketingExpanded = signal(false);
  brokerExpanded = signal(false);
  securityExpanded = signal(false);
  notificationsExpanded = signal(false);

  unreadCount = 0;
  private notificationsService = inject(NotificationsService);
  
  private manualClosed = false;
  private manualOpened = false;
  private lastUrl = '';

  ngOnInit() {
    // Auto-expand menus based on route
    if (this.router.url.includes('/properties')) {
      this.propertiesExpanded.set(true);
    }
    if (this.router.url.includes('/sales')) {
      this.salesExpanded.set(true);
    }
    if (this.router.url.includes('/finance')) {
      this.financeExpanded.set(true);
    }
    if (this.router.url.includes('/marketing')) {
      this.marketingExpanded.set(true);
    }
    if (this.router.url.includes('/broker')) {
      this.brokerExpanded.set(true);
    }
    if (this.router.url.includes('/security')) {
      this.securityExpanded.set(true);
    }
    if (this.router.url.includes('/notifications')) {
      this.notificationsExpanded.set(true);
    }

    this.loadUnreadCount();
    // Poll unread count every 30s
    setInterval(() => this.loadUnreadCount(), 30000);
  }

  loadUnreadCount() {
    if (this.authService.isAuthenticated()) {
      this.notificationsService.getUnreadCount().subscribe({
        next: (count) => this.unreadCount = count,
        error: () => {}
      });
    }
  }

  toggleProperties() {
    this.propertiesExpanded.update(v => !v);
  }

  toggleSales() {
    this.salesExpanded.update(v => !v);
  }

  toggleFinance() {
    this.financeExpanded.update(v => !v);
  }

  toggleMarketing() {
    this.marketingExpanded.update(v => !v);
  }

  toggleBroker() {
    this.brokerExpanded.update(v => !v);
  }

  toggleSecurity() {
    this.securityExpanded.update(v => !v);
  }

  toggleNotifications() {
    this.notificationsExpanded.update(v => !v);
  }

  isNotificationsActive(): boolean {
    return this.router.url.includes('/notifications');
  }

  isPropertyActive(): boolean {
    return this.router.url.includes('/properties');
  }

  isSalesActive(): boolean {
    return this.router.url.includes('/sales');
  }

  isFinanceActive(): boolean {
    return this.router.url.includes('/finance');
  }

  isMarketingActive(): boolean {
    return this.router.url.includes('/marketing');
  }

  isBrokerActive(): boolean {
    return this.router.url.includes('/broker');
  }

  isSecurityActive(): boolean {
    return this.router.url.includes('/security');
  }

  getInitials(first: string, last: string): string {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  }

  isLeadsActive(): boolean {
    const url = this.router.url;
    return url === '/' ||
           url.includes('/leads') || 
           url.includes('/agents') || 
           url.includes('/lead-sources') || 
           url.includes('/follow-ups') ||
           url.includes('/opportunities') ||
           url.includes('/forecasting') ||
           url.includes('/communications') ||
           url.includes('/documents') ||
           url.includes('/segmentation') ||
           url.includes('/lead-tracking') ||
           url.includes('/log-interaction');
  }

  get isLeadsSubmenuOpen(): boolean {
    const url = this.router.url;
    const isLeadsUrl = url === '/' ||
                        url.includes('/leads') || 
                        url.includes('/agents') || 
                        url.includes('/lead-sources') || 
                        url.includes('/follow-ups') ||
                        url.includes('/opportunities') ||
                        url.includes('/forecasting') ||
                        url.includes('/communications') ||
                        url.includes('/documents') ||
                        url.includes('/segmentation') ||
                        url.includes('/lead-tracking') ||
                        url.includes('/log-interaction');
                        
    if (this.manualClosed) {
      return false;
    }
    if (this.manualOpened) {
      return true;
    }
    return isLeadsUrl;
  }

  toggleLeads(event: MouseEvent) {
    if (this.isLeadsSubmenuOpen) {
      this.manualClosed = true;
      this.manualOpened = false;
    } else {
      this.manualOpened = true;
      this.manualClosed = false;
    }
  }

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      if (url !== this.lastUrl) {
        this.manualClosed = false;
        this.manualOpened = false;
        this.lastUrl = url;
      }
    });
  }
}
