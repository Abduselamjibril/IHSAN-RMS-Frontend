import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Delivery Channels & Preferences</h1>
        <p>Choose which alerts you receive and toggle Email, Telegram or In-App delivery channels per category.</p>
      </div>
    </header>

    <div class="grid grid-cols-3 gap-6 margin-y-4">
      <!-- Matrix Settings Card -->
      <div class="col-span-2 card p-6">
        <h3 class="mb-4 text-main">Notification Delivery Matrix</h3>
        <p class="font-sm text-secondary mb-6">
          Toggle options below to control how you receive messages. Note: direct Telegram alerts require a configured session and phone number on your user profile.
        </p>

        <div class="table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th style="width: 40%;">Notification Category</th>
                <th class="text-center" style="width: 20%;">In-App Inbox</th>
                <th class="text-center" style="width: 20%;">Email Alerts</th>
                <th class="text-center" style="width: 20%;">Telegram DM</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of categories">
                <td>
                  <div class="flex flex-col">
                    <span class="font-bold text-main">{{ cat.categoryName }}</span>
                    <span class="text-muted font-xs">{{ getCategoryDescription(cat.categoryCode) }}</span>
                  </div>
                </td>
                
                <!-- INAPP -->
                <td class="text-center">
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      [checked]="hasPreference(cat.id, 'INAPP')"
                      (change)="togglePreference(cat.id, 'INAPP', $event)"
                    />
                    <span class="slider round"></span>
                  </label>
                </td>

                <!-- EMAIL -->
                <td class="text-center">
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      [checked]="hasPreference(cat.id, 'EMAIL')"
                      (change)="togglePreference(cat.id, 'EMAIL', $event)"
                    />
                    <span class="slider round"></span>
                  </label>
                </td>

                <!-- TELEGRAM -->
                <td class="text-center">
                  <label class="switch">
                    <input 
                      type="checkbox" 
                      [checked]="hasPreference(cat.id, 'TELEGRAM')"
                      (change)="togglePreference(cat.id, 'TELEGRAM', $event)"
                    />
                    <span class="slider round"></span>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Tips and status settings info card -->
      <div class="flex flex-col gap-6">
        <div class="card p-6 bg-light">
          <h4 class="text-main mb-3 flex align-center gap-2">
            <span class="material-icons-outlined text-indigo">telegram</span>
            Telegram Integration Setup
          </h4>
          <p class="font-sm text-secondary mb-3" style="line-height: 1.5;">
            To receive direct messages over Telegram:
          </p>
          <ol class="font-sm text-secondary list-decimal pl-4 flex flex-col gap-2">
            <li>Ensure your profile phone number is correct.</li>
            <li>Enable the Telegram DM toggle switch for the category.</li>
            <li>The administrator must have initialized the MTProto userbot session on the server.</li>
          </ol>
        </div>

        <div class="card p-6 bg-light-green">
          <h4 class="text-main mb-3 flex align-center gap-2">
            <span class="material-icons-outlined text-green">security</span>
            Preference Lock
          </h4>
          <p class="font-sm text-secondary" style="line-height: 1.5;">
            Critical security events, account locks, and system upgrades bypass these preferences and are always delivered via all channels to ensure service integrity.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Toggle switch CSS */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 22px;
    }
    .switch input { 
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: .2s;
      transition: .2s;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      -webkit-transition: .2s;
      transition: .2s;
    }
    input:checked + .slider {
      background-color: var(--primary-color, #14b8a6);
    }
    input:focus + .slider {
      box-shadow: 0 0 1px var(--primary-color, #14b8a6);
    }
    input:checked + .slider:before {
      -webkit-transform: translateX(22px);
      -ms-transform: translateX(22px);
      transform: translateX(22px);
    }
    .slider.round {
      border-radius: 34px;
    }
    .slider.round:before {
      border-radius: 50%;
    }
    .list-decimal {
      list-style-type: decimal;
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit {
  private service = inject(NotificationsService);

  categories: any[] = [];
  channels: any[] = [];
  preferences: any[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.service.getCategories().subscribe({
      next: (res) => this.categories = res,
      error: (err) => console.error('Error fetching categories:', err)
    });

    this.service.getChannels().subscribe({
      next: (res) => this.channels = res,
      error: (err) => console.error('Error fetching channels:', err)
    });

    this.service.getPreferences().subscribe({
      next: (res) => this.preferences = res,
      error: (err) => console.error('Error fetching preferences:', err)
    });
  }

  hasPreference(categoryId: number, channelCode: string): boolean {
    const channel = this.channels.find(ch => ch.channelCode === channelCode);
    if (!channel) return false;

    const pref = this.preferences.find(p => 
      Number(p.category?.id) === Number(categoryId) && 
      Number(p.channel?.id) === Number(channel.id)
    );

    // If no preference set yet, default to enabled for INAPP and EMAIL, disabled for TELEGRAM
    if (!pref) {
      return channelCode !== 'TELEGRAM';
    }
    return pref.isEnabled;
  }

  togglePreference(categoryId: number, channelCode: string, event: Event) {
    const isEnabled = (event.target as HTMLInputElement).checked;
    const channel = this.channels.find(ch => ch.channelCode === channelCode);
    if (!channel) return;

    this.service.updatePreference({
      categoryId,
      channelId: channel.id,
      isEnabled
    }).subscribe({
      next: () => {
        // Update local list
        const idx = this.preferences.findIndex(p => 
          Number(p.category?.id) === Number(categoryId) && 
          Number(p.channel?.id) === Number(channel.id)
        );

        if (idx !== -1) {
          this.preferences[idx].isEnabled = isEnabled;
        } else {
          this.preferences.push({
            category: { id: categoryId },
            channel: { id: channel.id },
            isEnabled
          });
        }
      },
      error: (err) => console.error('Failed to update channel preference:', err)
    });
  }

  getCategoryDescription(code: string): string {
    switch (code) {
      case 'PAYMENT': return 'Upcoming payments, installment invoices, past due reminders.';
      case 'RESERVATION': return 'Reservation confirmations, expiry updates, inventory release notices.';
      case 'FOLLOWUP': return 'Assigned leads reminders, contact followups logs, escalations.';
      default: return 'System upgrades, workflow approval requests, role adjustments.';
    }
  }
}
