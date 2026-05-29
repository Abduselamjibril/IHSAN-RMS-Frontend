import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
          <li>
            <a routerLink="/leads" routerLinkActive="active" class="menu-item">
              <span class="material-icons-outlined">people_outline</span>
              <span class="menu-text">Leads</span>
            </a>
          </li>
          <li>
            <a class="menu-item disabled">
              <span class="material-icons-outlined">trending_up</span>
              <span class="menu-text">Opportunities</span>
            </a>
          </li>
          <li>
            <a class="menu-item disabled">
              <span class="material-icons-outlined">alarm</span>
              <span class="menu-text">Follow-ups</span>
            </a>
          </li>
          <li>
            <a class="menu-item disabled">
              <span class="material-icons-outlined">chat_bubble_outline</span>
              <span class="menu-text">Communications</span>
            </a>
          </li>
          <li>
            <a class="menu-item disabled">
              <span class="material-icons-outlined">person_outline</span>
              <span class="menu-text">Customers</span>
            </a>
          </li>
          <li>
            <a class="menu-item disabled">
              <span class="material-icons-outlined">assessment</span>
              <span class="menu-text">Reports</span>
            </a>
          </li>
          <li>
            <a class="menu-item disabled">
              <span class="material-icons-outlined">description</span>
              <span class="menu-text">Documents</span>
            </a>
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

    .menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      color: #a0aec0;
      transition: var(--transition-fast);
      user-select: none;
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
export class SidebarComponent {}
