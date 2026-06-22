import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo-icon">I</div>
        <div class="brand-text-wrapper">
          <span class="brand-title">IHSAN</span>
          <span class="brand-subtitle">PROPERTIES & BUSINESS</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <ul>
          <li>
            <a (click)="toggleLeads($event)" class="menu-item cursor-pointer" [class.active-parent]="isLeadsActive()">
              <span class="material-icons-outlined">people_outline</span>
              <span class="menu-text">Leads Module</span>
              <span class="material-icons-outlined arrow-icon">{{ isLeadsSubmenuOpen ? 'expand_less' : 'expand_more' }}</span>
            </a>
            
            <ul class="submenu" [class.open]="isLeadsSubmenuOpen">
              <li>
                <a routerLink="/dashboard" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">dashboard</span>
                  <span class="menu-text">Dashboard</span>
                </a>
              </li>
              <li>
                <a routerLink="/leads" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">people_outline</span>
                  <span class="menu-text">Leads</span>
                </a>
              </li>
              <li>
                <a routerLink="/agents" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">people</span>
                  <span class="menu-text">Sales Agents</span>
                </a>
              </li>
              <li>
                <a routerLink="/lead-sources" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">share</span>
                  <span class="menu-text">Lead Sources</span>
                </a>
              </li>
              <li>
                <a routerLink="/log-interaction" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">history_edu</span>
                  <span class="menu-text">Log Interaction</span>
                </a>
              </li>
              <li>
                <a routerLink="/follow-ups" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">alarm</span>
                  <span class="menu-text">Follow-ups</span>
                </a>
              </li>
              <li>
                <a routerLink="/opportunities" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">trending_up</span>
                  <span class="menu-text">Opportunities</span>
                </a>
              </li>
              <li>
                <a routerLink="/forecasting" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">insights</span>
                  <span class="menu-text">Forecasting</span>
                </a>
              </li>
              <li>
                <a routerLink="/lead-tracking" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">timeline</span>
                  <span class="menu-text">Lead Tracking</span>
                </a>
              </li>
              <li>
                <a routerLink="/communications" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">chat_bubble_outline</span>
                  <span class="menu-text">Communications</span>
                </a>
              </li>
              <li>
                <a routerLink="/documents" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">description</span>
                  <span class="menu-text">Documents</span>
                </a>
              </li>
              <li>
                <a routerLink="/segmentation" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">segment</span>
                  <span class="menu-text">Segmentation</span>
                </a>
              </li>
            </ul>
          </li>

          <!-- Collapsible Property Management Section -->
          <li>
            <a (click)="toggleProperties()" class="menu-item cursor-pointer" [class.active-parent]="isPropertyActive()">
              <span class="material-icons-outlined">business</span>
              <span class="menu-text">Property Module</span>
              <span class="material-icons-outlined arrow-icon">{{ propertiesExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="propertiesExpanded()">
              <li>
                <a routerLink="/properties/dashboard" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">dashboard</span>
                  <span class="menu-text">Dashboard</span>
                </a>
              </li>
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
          <li>
            <a (click)="toggleSales()" class="menu-item cursor-pointer" [class.active-parent]="isSalesActive()">
              <span class="material-icons-outlined">monetization_on</span>
              <span class="menu-text">Sales Module</span>
              <span class="material-icons-outlined arrow-icon">{{ salesExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="salesExpanded()">
              <li>
                <a routerLink="/sales/dashboard" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">dashboard</span>
                  <span class="menu-text">Dashboard</span>
                </a>
              </li>
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

          <!-- Collapsible Marketing Management Section -->
          <li>
            <a (click)="toggleMarketing()" class="menu-item cursor-pointer" [class.active-parent]="isMarketingActive()">
              <span class="material-icons-outlined">campaign</span>
              <span class="menu-text">Marketing Module</span>
              <span class="material-icons-outlined arrow-icon">{{ marketingExpanded() ? 'expand_less' : 'expand_more' }}</span>
            </a>
            <ul class="submenu" [class.open]="marketingExpanded()">
              <li>
                <a routerLink="/marketing/dashboard" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">dashboard</span>
                  <span class="menu-text">Dashboard</span>
                </a>
              </li>
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
              <li>
                <a routerLink="/marketing/reports" routerLinkActive="active" class="submenu-item">
                  <span class="material-icons-outlined font-sm">bar_chart</span>
                  <span class="menu-text">Reports</span>
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

      <div class="sidebar-profile">
        <div class="avatar">AK</div>
        <div class="profile-info">
          <span class="profile-name">Abebe Kebede</span>
          <span class="profile-role">Sales Manager</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background-color: var(--bg-sidebar);
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      font-weight: 500;
    }

    .sidebar-brand {
      height: 72px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #7c3aed, #4c3a93);
      color: white;
      font-weight: 800;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .brand-text-wrapper {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      color: white;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.5px;
    }

    .brand-subtitle {
      font-size: 8px;
      color: #7c73b0;
      letter-spacing: 1px;
      font-weight: 700;
    }

    .sidebar-menu {
      flex: 1;
      padding: 24px 16px;
      overflow-y: auto;
    }

    .sidebar-menu ul {
      list-style: none;
    }

    .sidebar-menu li {
      margin-bottom: 6px;
    }

    .menu-group {
      display: flex;
      flex-direction: column;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      color: #a0aec0;
      transition: var(--transition-fast);
      user-select: none;
      cursor: pointer;
      position: relative;
    }

    .menu-item:hover {
      color: white;
      background-color: rgba(255, 255, 255, 0.04);
    }

    .menu-item.active {
      color: white;
      background-color: var(--brand-primary);
      box-shadow: 0 4px 12px rgba(76, 58, 147, 0.25);
    }

    .menu-item.active-parent {
      color: white;
      background-color: rgba(255, 255, 255, 0.04);
      border-left: 3px solid var(--brand-primary);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .menu-item.active .material-icons-outlined {
      color: white;
    }

    .expand-icon {
      margin-left: auto;
      font-size: 18px;
      color: #718096;
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
      color: #94a3b8;
    }

    .submenu-item .material-icons-outlined {
      font-size: 18px;
    }

    .submenu-item.active {
      background-color: rgba(124, 58, 237, 0.12);
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
      background-color: #5b46b8;
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
      color: #7c73b0;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .arrow-icon {
      margin-left: auto;
      font-size: 18px;
    }

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
  propertiesExpanded = signal(false);
  salesExpanded = signal(false);
  marketingExpanded = signal(false);
  
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
    if (this.router.url.includes('/marketing')) {
      this.marketingExpanded.set(true);
    }
  }

  toggleProperties() {
    this.propertiesExpanded.update(v => !v);
  }

  toggleSales() {
    this.salesExpanded.update(v => !v);
  }

  toggleMarketing() {
    this.marketingExpanded.update(v => !v);
  }

  isPropertyActive(): boolean {
    return this.router.url.includes('/properties');
  }

  isSalesActive(): boolean {
    return this.router.url.includes('/sales');
  }

  isMarketingActive(): boolean {
    return this.router.url.includes('/marketing');
  }

  isLeadsActive(): boolean {
    const url = this.router.url;
    return url === '/dashboard' ||
           url === '/' ||
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
    const isLeadsUrl = url === '/dashboard' ||
                        url === '/' ||
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
