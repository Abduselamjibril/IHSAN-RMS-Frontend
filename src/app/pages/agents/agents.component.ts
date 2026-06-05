import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="app-title-section">
        <h1>Sales Agents Directory</h1>
        <p>Manage real estate sales agents, teams, and active statuses</p>
      </div>
      <div class="app-header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-icons-outlined">add</span>
          New Agent
        </button>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4">
      <div class="metric-card card">
        <div class="metric-icon bg-indigo">
          <span class="material-icons-outlined">people</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Agents</span>
          <span class="metric-value">{{ agents.length }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">check_circle</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Active Agents</span>
          <span class="metric-value">{{ getActiveCount() }}</span>
        </div>
      </div>
      <div class="metric-card card">
        <div class="metric-icon bg-orange">
          <span class="material-icons-outlined">domain</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Departments</span>
          <span class="metric-value">{{ getDepartmentCount() }}</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace Area -->
    <div class="agents-workspace card">
      
      <!-- Filter and Search Bar -->
      <div class="filter-bar flex justify-between align-center gap-4">
        <div class="search-box">
          <span class="material-icons-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search by name, email, department..." 
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="flex align-center gap-3">
          <select [(ngModel)]="statusFilter">
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      <!-- Agents Table -->
      <div class="table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 30%;">Agent</th>
              <th style="width: 20%;">Email</th>
              <th style="width: 15%;">Phone</th>
              <th style="width: 12%;">Department</th>
              <th style="width: 13%;">Joined Date</th>
              <th style="width: 5%;">Status</th>
              <th style="width: 5%;" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let agent of getFilteredAgents(); let i = index">
              <td>
                <div class="contact-info flex align-center gap-3">
                  <span class="row-index">{{ i + 1 }}</span>
                  <div class="table-avatar" [style.background-color]="agent.isActive ? '#5b46b8' : '#64748b'">
                    {{ getInitials(agent.fullName) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="lead-name font-bold">{{ agent.fullName }}</span>
                    <span class="text-muted font-xs">{{ agent.employeeCode }}</span>
                  </div>
                </div>
              </td>
              <td>{{ agent.email || '-' }}</td>
              <td>{{ agent.phone || '-' }}</td>
              <td>
                <span class="department-tag">{{ agent.department || 'Unassigned' }}</span>
              </td>
              <td class="text-secondary font-sm">{{ agent.joinedAt ? (agent.joinedAt | date:'mediumDate') : '-' }}</td>
              <td>
                <span class="badge" [class.badge-new]="agent.isActive" [class.badge-lost]="!agent.isActive">
                  {{ agent.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex gap-2 justify-end">
                  <button class="btn btn-secondary btn-xs flex align-center" (click)="openEditModal(agent)">
                    <span class="material-icons-outlined font-sm">edit</span> Edit
                  </button>
                  <button 
                    *ngIf="agent.isActive" 
                    class="btn btn-secondary btn-xs flex align-center btn-danger-hover" 
                    (click)="deactivateAgent(agent.id)"
                  >
                    <span class="material-icons-outlined font-sm">block</span> Deactivate
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="getFilteredAgents().length === 0">
              <td colspan="8" class="text-center py-6 text-secondary">
                No sales agents found matching the criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal Dialog -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        
        <div class="modal-header flex justify-between align-center">
          <h2>{{ isEditMode ? 'Edit Sales Agent' : 'Register New Sales Agent' }}</h2>
          <button class="header-icon-btn close-btn" (click)="closeModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitAgent($event)">
            
            <!-- Full Name -->
            <div class="form-group">
              <label>Full Customer Name *</label>
              <input 
                type="text" 
                placeholder="Enter full name" 
                [(ngModel)]="agentForm.fullName" 
                name="fullName"
                required 
              />
            </div>

            <!-- Employee Code & Department -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Employee Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. AGT005 (Optional)" 
                  [(ngModel)]="agentForm.employeeCode" 
                  name="employeeCode"
                />
              </div>
              <div class="form-group flex-1">
                <label>Department / Team</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sales, Marketing" 
                  [(ngModel)]="agentForm.department" 
                  name="department"
                />
              </div>
            </div>

            <!-- Phone & Email -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. +251911..." 
                  [(ngModel)]="agentForm.phone" 
                  name="phone"
                />
              </div>
              <div class="form-group flex-1">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@ihsanproperties.com" 
                  [(ngModel)]="agentForm.email" 
                  name="email"
                />
              </div>
            </div>

            <!-- Joined Date & Status -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Joined Date</label>
                <input 
                  type="date" 
                  [(ngModel)]="agentForm.joinedAtString" 
                  name="joinedAtString"
                />
              </div>
              <div class="form-group flex-1 flex align-center gap-2" style="margin-top: 24px;">
                <input 
                  type="checkbox" 
                  id="isActiveCheck"
                  [(ngModel)]="agentForm.isActive" 
                  name="isActive"
                />
                <label for="isActiveCheck" class="margin-0">Agent is Active</label>
              </div>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!agentForm.fullName">
                {{ isEditMode ? 'Save Changes' : 'Register Agent' }}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .margin-y-4 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
    .margin-0 { margin: 0; }
    .mt-4 { margin-top: 1rem; }
    .mt-2 { margin-top: 0.5rem; }
    .btn-danger-hover:hover {
      background-color: #fecaca !important;
      color: #dc2626 !important;
      border-color: #f87171 !important;
    }
    .department-tag {
      background-color: rgba(124, 58, 237, 0.08);
      color: #7c3aed;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }
  `]
})
export class AgentsComponent implements OnInit {
  private crmService = inject(CrmService);

  agents: any[] = [];
  searchQuery: string = '';
  statusFilter: string = 'all';

  showModal: boolean = false;
  isEditMode: boolean = false;
  selectedAgentId?: number;

  agentForm: any = {
    fullName: '',
    employeeCode: '',
    phone: '',
    email: '',
    department: '',
    isActive: true,
    joinedAtString: ''
  };

  ngOnInit() {
    this.loadAgents();
  }

  loadAgents() {
    this.crmService.getAgents().subscribe({
      next: (data) => {
        this.agents = data;
      },
      error: (err) => console.error('Failed to load agents', err)
    });
  }

  getActiveCount(): number {
    return this.agents.filter(a => a.isActive).length;
  }

  getDepartmentCount(): number {
    const depts = new Set(this.agents.map(a => a.department).filter(Boolean));
    return depts.size || 1;
  }

  getFilteredAgents(): any[] {
    return this.agents.filter(agent => {
      const matchesSearch = !this.searchQuery ? true : (
        agent.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (agent.email && agent.email.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (agent.department && agent.department.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (agent.employeeCode && agent.employeeCode.toLowerCase().includes(this.searchQuery.toLowerCase()))
      );

      const matchesStatus = this.statusFilter === 'all' ? true : (
        this.statusFilter === 'active' ? agent.isActive : !agent.isActive
      );

      return matchesSearch && matchesStatus;
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedAgentId = undefined;
    const today = new Date().toISOString().substring(0, 10);
    this.agentForm = {
      fullName: '',
      employeeCode: '',
      phone: '',
      email: '',
      department: '',
      isActive: true,
      joinedAtString: today
    };
    this.showModal = true;
  }

  openEditModal(agent: any) {
    this.isEditMode = true;
    this.selectedAgentId = agent.id;
    
    let joinedStr = '';
    if (agent.joinedAt) {
      joinedStr = new Date(agent.joinedAt).toISOString().substring(0, 10);
    }

    this.agentForm = {
      fullName: agent.fullName,
      employeeCode: agent.employeeCode,
      phone: agent.phone,
      email: agent.email,
      department: agent.department,
      isActive: agent.isActive,
      joinedAtString: joinedStr
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmitAgent(event: Event) {
    event.preventDefault();
    if (!this.agentForm.fullName) return;

    const payload = {
      fullName: this.agentForm.fullName,
      employeeCode: this.agentForm.employeeCode || undefined,
      phone: this.agentForm.phone || undefined,
      email: this.agentForm.email || undefined,
      department: this.agentForm.department || undefined,
      isActive: this.agentForm.isActive,
      joinedAt: this.agentForm.joinedAtString ? new Date(this.agentForm.joinedAtString) : undefined
    };

    if (this.isEditMode && this.selectedAgentId) {
      this.crmService.updateAgent(this.selectedAgentId, payload).subscribe({
        next: () => {
          this.loadAgents();
          this.closeModal();
        },
        error: (err) => console.error('Failed to update agent', err)
      });
    } else {
      this.crmService.createAgent(payload).subscribe({
        next: () => {
          this.loadAgents();
          this.closeModal();
        },
        error: (err) => console.error('Failed to create agent', err)
      });
    }
  }

  deactivateAgent(id: number) {
    if (confirm('Are you sure you want to deactivate this agent?')) {
      this.crmService.deleteAgent(id).subscribe({
        next: () => this.loadAgents(),
        error: (err) => console.error('Failed to deactivate agent', err)
      });
    }
  }
}
