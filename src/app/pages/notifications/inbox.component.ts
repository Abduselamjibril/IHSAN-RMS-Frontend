import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Notifications Center</h1>
        <p>Manage, view, and organize all your alerts, payment notices, and system logs.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary flex align-center gap-2" (click)="loadInboxData()">
          <span class="material-icons-outlined">refresh</span>
          Refresh
        </button>
      </div>
    </header>

    <!-- Notification Analytics -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">notifications</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Received</span>
          <span class="metric-value">{{ inboxItems.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-amber">
          <span class="material-icons-outlined">mark_as_unread</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Unread Messages</span>
          <span class="metric-value text-amber">{{ unreadCount }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">done_all</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Read Rate</span>
          <span class="metric-value text-green">{{ getReadRate() }}%</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="inbox-workspace card">
      <!-- Filters and Search -->
      <div class="filter-bar flex justify-between align-center gap-4">
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search notifications by title or message..." 
            [(ngModel)]="searchQuery"
          />
        </div>
        <div class="flex align-center gap-3">
          <select [(ngModel)]="selectedCategory">
            <option value="">All Categories</option>
            <option value="PAYMENT">Payments & Billing</option>
            <option value="RESERVATION">Reservations</option>
            <option value="FOLLOWUP">CRM Follow-ups</option>
            <option value="SYSTEM">System Alerts</option>
          </select>
          <select [(ngModel)]="selectedStatus">
            <option value="">All Statuses</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list flex flex-col gap-3">
        <div 
          *ngFor="let item of getFilteredItems()" 
          class="notification-item flex justify-between align-center p-4"
          [class.unread]="!item.readDate"
          [class.priority-high]="item.notification?.priority === 'HIGH' || item.notification?.priority === 'CRITICAL'"
          (click)="openDetail(item)"
        >
          <div class="flex align-center gap-4">
            <!-- Icon by Category -->
            <div class="category-icon-wrapper" [ngClass]="getCategoryBg(item.notification?.category?.categoryCode)">
              <span class="material-icons-outlined">{{ getCategoryIcon(item.notification?.category?.categoryCode) }}</span>
            </div>

            <!-- Content preview -->
            <div class="flex flex-col gap-1">
              <div class="flex align-center gap-2">
                <span class="title font-bold text-main">{{ item.notification?.notificationTitle }}</span>
                <span class="badge" [ngClass]="getPriorityClass(item.notification?.priority)">
                  {{ item.notification?.priority }}
                </span>
              </div>
              <span class="body-preview text-muted">{{ item.notification?.notificationBody | slice:0:120 }}{{ item.notification?.notificationBody?.length > 120 ? '...' : '' }}</span>
              <span class="timestamp text-muted font-xs">{{ item.deliveredDate | date:'medium' }}</span>
            </div>
          </div>

          <div class="flex align-center gap-3" (click)="$event.stopPropagation()">
            <!-- Read Toggle Button -->
            <button 
              *ngIf="!item.readDate" 
              class="btn btn-secondary btn-sm flex align-center gap-1"
              (click)="markRead(item)"
              title="Mark as Read"
            >
              <span class="material-icons-outlined" style="font-size: 16px;">check</span>
              Read
            </button>
            <span *ngIf="item.readDate" class="read-status font-xs text-green flex align-center gap-1">
              <span class="material-icons-outlined" style="font-size: 16px;">done_all</span>
              Read
            </span>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="getFilteredItems().length === 0" class="empty-state py-8">
          <span class="material-icons-outlined text-secondary" style="font-size: 48px;">notifications_off</span>
          <h3 class="mt-2 text-main">No notifications found</h3>
          <p class="font-sm text-secondary">You are all caught up! No notifications match your active filters.</p>
        </div>
      </div>
    </div>

    <!-- Detail View Modal -->
    <div class="modal-backdrop" *ngIf="selectedDetail" (click)="closeDetail()">
      <div class="modal-content card max-width-600" (click)="$event.stopPropagation()">
        <div class="modal-header flex justify-between align-center border-bottom pb-3">
          <div class="flex align-center gap-2">
            <span class="material-icons-outlined text-indigo" style="font-size: 24px;">info</span>
            <h3>Alert Details</h3>
          </div>
          <button class="close-btn" (click)="closeDetail()">&times;</button>
        </div>

        <div class="modal-body py-4 flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-secondary font-xs font-bold uppercase tracking-wider">Title</span>
            <span class="text-main font-lg font-bold">{{ selectedDetail.notification?.notificationTitle }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-secondary font-xs font-bold uppercase tracking-wider">Message Details</span>
            <div class="body-text p-3 bg-light rounded text-main" style="white-space: pre-wrap; line-height: 1.6;">
              {{ selectedDetail.notification?.notificationBody }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-secondary font-xs font-bold uppercase tracking-wider">Category</span>
              <span class="text-main font-sm font-bold">{{ selectedDetail.notification?.category?.categoryName }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-secondary font-xs font-bold uppercase tracking-wider">Priority</span>
              <span class="badge w-max" [ngClass]="getPriorityClass(selectedDetail.notification?.priority)">
                {{ selectedDetail.notification?.priority }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-secondary font-xs font-bold uppercase tracking-wider">Delivered At</span>
              <span class="text-main font-sm">{{ selectedDetail.deliveredDate | date:'medium' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-secondary font-xs font-bold uppercase tracking-wider">Read Confirm</span>
              <span class="text-main font-sm">
                {{ selectedDetail.readDate ? (selectedDetail.readDate | date:'medium') : 'Unread' }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer flex justify-end border-top pt-3">
          <button class="btn btn-secondary" (click)="closeDetail()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inbox-workspace {
      padding: 24px;
    }
    .notification-item {
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      cursor: pointer;
      background: var(--card-bg, #ffffff);
      transition: all 0.2s ease-in-out;
    }
    .notification-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border-color: var(--primary-color, #14b8a6);
    }
    .notification-item.unread {
      background: rgba(20, 184, 166, 0.03);
      border-left: 4px solid var(--primary-color, #14b8a6);
    }
    .notification-item.priority-high {
      border-left: 4px solid var(--error-color, #ef4444);
    }
    .category-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .category-icon-wrapper span {
      font-size: 20px;
    }
    .bg-light-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .bg-light-amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .bg-light-green { background: rgba(16, 185, 129, 0.1); color: #10b881; }
    .bg-light-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }
    .w-max { width: max-content; }
  `]
})
export class NotificationInboxComponent implements OnInit {
  private service = inject(NotificationsService);

  inboxItems: any[] = [];
  unreadCount = 0;
  selectedDetail: any | null = null;

  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';

  ngOnInit() {
    this.loadInboxData();
  }

  loadInboxData() {
    this.service.getInbox().subscribe({
      next: (res) => {
        this.inboxItems = res;
        this.updateUnreadCount();
      },
      error: (err) => console.error('Error loading notifications inbox:', err)
    });
  }

  updateUnreadCount() {
    this.unreadCount = this.inboxItems.filter(item => !item.readDate).length;
  }

  getReadRate(): number {
    if (this.inboxItems.length === 0) return 100;
    const read = this.inboxItems.filter(item => item.readDate).length;
    return Math.round((read / this.inboxItems.length) * 100);
  }

  getFilteredItems(): any[] {
    return this.inboxItems.filter(item => {
      // 1. Category Filter
      if (this.selectedCategory && item.notification?.category?.categoryCode !== this.selectedCategory) {
        return false;
      }
      // 2. Status Filter
      if (this.selectedStatus === 'unread' && item.readDate) return false;
      if (this.selectedStatus === 'read' && !item.readDate) return false;

      // 3. Search Query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const title = (item.notification?.notificationTitle || '').toLowerCase();
        const body = (item.notification?.notificationBody || '').toLowerCase();
        return title.includes(query) || body.includes(query);
      }

      return true;
    });
  }

  markRead(item: any) {
    this.service.markAsRead(item.id).subscribe({
      next: () => {
        item.readDate = new Date();
        this.updateUnreadCount();
      },
      error: (err) => console.error('Failed to mark notification as read:', err)
    });
  }

  openDetail(item: any) {
    this.selectedDetail = item;
    if (!item.readDate) {
      this.markRead(item);
    }
  }

  closeDetail() {
    this.selectedDetail = null;
  }

  getCategoryBg(code: string): string {
    switch (code) {
      case 'PAYMENT': return 'bg-light-green';
      case 'RESERVATION': return 'bg-light-blue';
      case 'FOLLOWUP': return 'bg-light-amber';
      default: return 'bg-light-purple';
    }
  }

  getCategoryIcon(code: string): string {
    switch (code) {
      case 'PAYMENT': return 'payments';
      case 'RESERVATION': return 'event_available';
      case 'FOLLOWUP': return 'contact_phone';
      default: return 'info';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return 'badge-rejected';
      case 'HIGH': return 'badge-contracted';
      case 'LOW': return 'badge-draft';
      default: return 'badge-active';
    }
  }
}
