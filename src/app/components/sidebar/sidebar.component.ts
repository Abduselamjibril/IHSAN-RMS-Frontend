import { Component, inject } from '@angular/core';
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
            <a routerLink="/dashboard" routerLinkActive="active" class="menu-item">
              <span class="material-icons-outlined">dashboard</span>
              <span class="menu-text">Dashboard</span>
            </a>
          </li>
          
          <li class="menu-group">
            <a routerLink="/leads" routerLinkActive="active" class="menu-item" (click)="toggleLeads($event)">
              <span class="material-icons-outlined">people_outline</span>
              <span class="menu-text">Leads</span>
              <span class="material-icons-outlined expand-icon" [style.transform]="isLeadsSubmenuOpen ? 'rotate(180deg)' : 'rotate(0)'">
                expand_more
              </span>
            </a>
            
            <ul class="submenu" [class.open]="isLeadsSubmenuOpen">
              <li>
                <a routerLink="/agents" routerLinkActive="active" class="menu-item submenu-item">
                  <span class="material-icons-outlined">people</span>
                  <span class="menu-text">Sales Agents</span>
                </a>
              </li>
              <li>
                <a routerLink="/lead-sources" routerLinkActive="active" class="menu-item submenu-item">
                  <span class="material-icons-outlined">share</span>
                  <span class="menu-text">Lead Sources</span>
                </a>
              </li>
              <li>
                <a routerLink="/follow-ups" routerLinkActive="active" class="menu-item submenu-item">
                  <span class="material-icons-outlined">alarm</span>
                  <span class="menu-text">Follow-ups</span>
                </a>
              </li>
              <li>
                <a routerLink="/lead-tracking" routerLinkActive="active" class="menu-item submenu-item">
                  <span class="material-icons-outlined">timeline</span>
                  <span class="menu-text">Lead Tracking</span>
                </a>
              </li>
              <li>
                <a routerLink="/communications" routerLinkActive="active" class="menu-item submenu-item">
                  <span class="material-icons-outlined">chat_bubble_outline</span>
                  <span class="menu-text">Communications</span>
                </a>
              </li>
              <li>
                <a routerLink="/documents" routerLinkActive="active" class="menu-item submenu-item">
                  <span class="material-icons-outlined">description</span>
                  <span class="menu-text">Documents</span>
                </a>
              </li>
            </ul>
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
  `]
})
export class SidebarComponent {
  private router = inject(Router);
  
  private manualClosed = false;
  private manualOpened = false;
  private lastUrl = '';

  get isLeadsSubmenuOpen(): boolean {
    const url = this.router.url;
    const isLeadsUrl = url.includes('/leads') || 
                        url.includes('/agents') || 
                        url.includes('/lead-sources') || 
                        url.includes('/follow-ups') ||
                        url.includes('/communications') ||
                        url.includes('/documents') ||
                        url.includes('/lead-tracking');
                        
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
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      if (url !== this.lastUrl) {
        this.manualClosed = false;
        this.manualOpened = false;
        this.lastUrl = url;
      }
    });
  }
}

