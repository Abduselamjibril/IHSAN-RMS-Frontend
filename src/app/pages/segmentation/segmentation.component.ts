import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../services/crm.service';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-segmentation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header animate-fade-in">
      <div class="app-title-section">
        <h1>Customer & Lead Segmentation</h1>
        <p>Define rules to dynamically group leads, target marketing campaigns, and assign custom tag labels</p>
      </div>
    </header>

    <!-- Metrics Row -->
    <div class="metrics-grid margin-y-4 animate-fade-in">
      <div class="metric-card card">
        <div class="metric-icon bg-purple">
          <span class="material-icons-outlined">pie_chart</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Segments</span>
          <span class="metric-value">{{ segments.length }}</span>
          <span class="metric-subtext">Active filter groups</span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-blue">
          <span class="material-icons-outlined">label</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Customer Tags</span>
          <span class="metric-value">{{ tags.length }}</span>
          <span class="metric-subtext">Active status tags</span>
        </div>
      </div>

      <div class="metric-card card">
        <div class="metric-icon bg-green">
          <span class="material-icons-outlined">groups</span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Segmented Leads</span>
          <span class="metric-value">{{ getSegmentedLeadsCount() }}</span>
          <span class="metric-subtext">Unique leads in segments</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace Layout -->
    <div class="workspace-layout">
      
      <!-- Left side: Segment List & Tags -->
      <div class="sidebar-column">
        
        <!-- Segments List Card -->
        <div class="card margin-b-4">
          <div class="card-title-bar flex justify-between align-center mb-3">
            <h3>Filter Segments</h3>
            <button class="btn btn-primary btn-sm flex align-center gap-1" (click)="openCreateModal()">
              <span class="material-icons-outlined font-sm">add</span> New
            </button>
          </div>
          
          <div class="segments-list">
            <div 
              *ngFor="let seg of segments" 
              class="segment-item-box"
              [class.active]="selectedSegment?.id === seg.id"
              (click)="selectSegment(seg.id)"
            >
              <div class="flex justify-between align-start mb-1">
                <span class="segment-name font-bold">{{ seg.segmentName }}</span>
                <span class="badge badge-low font-xs">{{ seg.memberCount }} members</span>
              </div>
              <p class="segment-desc font-xs">{{ seg.description || 'No description provided' }}</p>
              
              <!-- Rule Badges preview -->
              <div class="rule-badges-preview mt-2 flex gap-1 flex-wrap">
                <span *ngFor="let r of seg.rules" class="rule-preview-badge font-xs">
                  {{ getFieldLabel(r.fieldName) }} {{ r.operator }} {{ r.value }}
                </span>
              </div>
            </div>
            
            <div *ngIf="segments.length === 0" class="text-center py-6 text-secondary italic font-sm">
              No segments defined yet. Click "New" to create one.
            </div>
          </div>
        </div>

        <!-- Tags Management Card -->
        <div class="card">
          <div class="card-title-bar mb-3">
            <h3>Manage Tags</h3>
          </div>

          <!-- Add tag input -->
          <div class="add-tag-box flex gap-2 mb-3">
            <input 
              type="text" 
              placeholder="Tag name (e.g. VIP)" 
              [(ngModel)]="newTag.tagName" 
              class="tag-input"
            />
            <input 
              type="color" 
              [(ngModel)]="newTag.colorCode" 
              class="color-picker-input"
            />
            <button class="btn btn-secondary btn-sm" (click)="onCreateTag()" [disabled]="!newTag.tagName.trim()">
              Add
            </button>
          </div>

          <!-- Tags list -->
          <div class="tags-container-grid flex gap-2 flex-wrap">
            <span 
              *ngFor="let t of tags" 
              class="tag-pill" 
              [style.background-color]="t.colorCode + '15'" 
              [style.color]="t.colorCode"
              [style.border]="'1px solid ' + t.colorCode + '30'"
            >
              <span class="tag-dot" [style.background-color]="t.colorCode"></span>
              {{ t.tagName }}
            </span>
            <div *ngIf="tags.length === 0" class="w-full text-center text-secondary italic font-xs py-2">
              No tags defined.
            </div>
          </div>
        </div>

      </div>

      <!-- Right side: Segment Detail & Members list -->
      <div class="content-column card">
        <div *ngIf="!selectedSegment" class="flex flex-col align-center justify-center py-16 text-secondary italic">
          <span class="material-icons-outlined" style="font-size: 48px; color: var(--border-color);">pie_chart</span>
          <p class="mt-2 font-sm">Select a segment from the left sidebar to view rule constraints and grouped members.</p>
        </div>

        <div *ngIf="selectedSegment" class="animate-fade-in">
          
          <!-- Segment Header Actions -->
          <div class="segment-detail-header flex justify-between align-center mb-4">
            <div class="flex flex-col">
              <h2>{{ selectedSegment.segmentName }}</h2>
              <p class="text-secondary font-sm mt-1">{{ selectedSegment.description }}</p>
            </div>
            
            <div class="flex gap-2">
              <button 
                class="btn btn-secondary flex align-center gap-1" 
                (click)="onRecalculate(selectedSegment.id)"
                [disabled]="isRecalculating"
              >
                <span class="material-icons-outlined font-sm" [class.spin-animation]="isRecalculating">sync</span>
                {{ isRecalculating ? 'Syncing...' : 'Sync Members' }}
              </button>
              <button class="btn btn-secondary flex align-center gap-1" (click)="exportSegmentCsv()">
                <span class="material-icons-outlined font-sm">download</span> Export CSV
              </button>
              <button class="btn btn-secondary flex align-center gap-1 btn-danger-hover" (click)="onDeleteSegment(selectedSegment.id)">
                <span class="material-icons-outlined font-sm">delete</span> Delete
              </button>
            </div>
          </div>

          <!-- Rules Summary Section -->
          <div class="rules-summary-panel border p-3 bg-main mb-4 rounded">
            <h4 class="font-xs font-bold uppercase text-secondary mb-2">Segment Query Constraints (AND join)</h4>
            <div class="flex gap-2 flex-wrap">
              <div *ngFor="let rule of selectedSegment.rules" class="rule-card-tag flex align-center gap-2">
                <span class="field-lbl font-semibold">{{ getFieldLabel(rule.fieldName) }}</span>
                <span class="operator-lbl font-bold">{{ rule.operator }}</span>
                <span class="val-lbl font-bold">{{ rule.value }}</span>
              </div>
            </div>
          </div>

          <!-- Members Table -->
          <div class="members-table-container">
            <div class="flex justify-between align-center mb-2">
              <h3 class="font-bold" style="font-size: 14px; margin: 0;">Segment Members List</h3>
              <span class="font-xs text-secondary">{{ selectedSegment.members?.length || 0 }} members found</span>
            </div>

            <div class="table-container">
              <table class="leads-table">
                <thead>
                  <tr>
                    <th>Lead Code</th>
                    <th>Full Name</th>
                    <th>Primary Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Assigned Agent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let lead of selectedSegment.members">
                    <td class="lead-code-cell font-bold">{{ lead.leadCode }}</td>
                    <td class="font-semibold text-main">{{ lead.fullName }}</td>
                    <td>{{ lead.primaryPhone }}</td>
                    <td>{{ lead.primaryEmail || '-' }}</td>
                    <td>
                      <span class="badge" [style.background-color]="lead.leadStatus?.colorCode + '15'" [style.color]="lead.leadStatus?.colorCode" [style.border]="'1px solid ' + lead.leadStatus?.colorCode + '30'">
                        {{ lead.leadStatus?.statusName }}
                      </span>
                    </td>
                    <td>{{ lead.leadSource?.sourceName || '-' }}</td>
                    <td>{{ lead.assignedSalesAgent?.fullName || 'Unassigned' }}</td>
                  </tr>
                  <tr *ngIf="!selectedSegment.members || selectedSegment.members.length === 0">
                    <td colspan="7" class="text-center py-8 text-secondary italic font-sm">
                      No members qualify for this segment. Make sure rules are accurate or click "Sync Members" to compile.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- 3. Create Segment Builder Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="closeCreateModal()">
      <div class="modal-container segment-modal" (click)="$event.stopPropagation()">
        
        <div class="modal-header flex justify-between align-center">
          <h2>Create Customer Segment</h2>
          <button class="header-icon-btn close-btn" (click)="closeCreateModal()">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <form class="modal-form" (submit)="onSubmitCreate($event)">
            
            <div class="form-group flex flex-col">
              <label>Segment Name *</label>
              <input 
                type="text" 
                placeholder="e.g. VIP Addis Investors" 
                [(ngModel)]="newSegment.segmentName" 
                name="segmentName" 
                required 
              />
            </div>

            <div class="form-group flex flex-col">
              <label>Description</label>
              <textarea 
                placeholder="Describe the target audience for this segment..." 
                [(ngModel)]="newSegment.description" 
                name="description" 
                rows="2"
              ></textarea>
            </div>

            <!-- Dynamic Rules Builder Section -->
            <div class="form-group flex flex-col rules-builder-group">
              <div class="flex justify-between align-center mb-2">
                <label style="margin: 0;">Rule Constraints (AND filter condition)</label>
                <button type="button" class="btn btn-secondary btn-xs flex align-center gap-1" (click)="addRule()">
                  <span class="material-icons-outlined font-xs">add</span> Add Rule
                </button>
              </div>

              <!-- Rules list editor -->
              <div class="rules-list-editor flex flex-col gap-2">
                <div *ngFor="let rule of newSegment.rules; let i = index" class="rule-edit-row flex gap-2 align-center">
                  <!-- Select Field -->
                  <select [(ngModel)]="rule.fieldName" [name]="'rule_field_' + i" class="flex-2" (change)="onRuleFieldChange(rule)">
                    <option value="budgetMin">Min Budget (ETB)</option>
                    <option value="budgetMax">Max Budget (ETB)</option>
                    <option value="city">City</option>
                    <option value="nationality">Nationality</option>
                    <option value="gender">Gender</option>
                    <option value="statusId">Status</option>
                    <option value="sourceId">Lead Source</option>
                  </select>

                  <!-- Select Operator -->
                  <select [(ngModel)]="rule.operator" [name]="'rule_op_' + i" class="flex-1">
                    <option value="=">Equals (=)</option>
                    <option value="!=">Not Equals (!=)</option>
                    <option value=">" *ngIf="isNumericField(rule.fieldName)">Greater Than (&gt;)</option>
                    <option value="<" *ngIf="isNumericField(rule.fieldName)">Less Than (&lt;)</option>
                    <option value="LIKE" *ngIf="!isNumericField(rule.fieldName)">Contains (LIKE)</option>
                    <option value="IN">In List (IN)</option>
                  </select>

                  <!-- Value inputs (Text, Select dropdown, etc.) -->
                  <div class="value-input-wrapper flex-2">
                    <!-- If field is statusId -->
                    <select 
                      *ngIf="rule.fieldName === 'statusId'" 
                      [(ngModel)]="rule.value" 
                      [name]="'rule_val_' + i"
                    >
                      <option *ngFor="let st of metadata?.statuses" [value]="st.id">{{ st.statusName }}</option>
                    </select>

                    <!-- If field is sourceId -->
                    <select 
                      *ngIf="rule.fieldName === 'sourceId'" 
                      [(ngModel)]="rule.value" 
                      [name]="'rule_val_' + i"
                    >
                      <option *ngFor="let src of metadata?.sources" [value]="src.id">{{ src.sourceName }}</option>
                    </select>

                    <!-- Text input for generic fields -->
                    <input 
                      *ngIf="rule.fieldName !== 'statusId' && rule.fieldName !== 'sourceId'"
                      type="text" 
                      [placeholder]="rule.operator === 'IN' ? 'Val1, Val2, Val3' : 'Constraint value'" 
                      [(ngModel)]="rule.value" 
                      [name]="'rule_val_' + i"
                      required
                    />
                  </div>

                  <!-- Delete rule button -->
                  <button type="button" class="header-icon-btn text-red" (click)="removeRule(i)" [disabled]="newSegment.rules.length === 1">
                    <span class="material-icons-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="modal-footer flex justify-end gap-3 mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newSegment.segmentName.trim() || !isFormValid()">
                Build Segment
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .workspace-layout {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 24px;
    }
    
    .sidebar-column {
      display: flex;
      flex-direction: column;
    }
    
    .segments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 450px;
      overflow-y: auto;
    }
    
    .segment-item-box {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      background-color: var(--bg-main);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    
    .segment-item-box:hover {
      border-color: #cbd5e1;
      background-color: #f1f5f9;
    }
    
    .segment-item-box.active {
      border-color: var(--brand-primary);
      background-color: rgba(124, 58, 237, 0.04);
      border-left: 4px solid var(--brand-primary);
    }
    
    .segment-name {
      color: var(--text-main);
      font-size: 14px;
    }
    
    .segment-desc {
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .rule-preview-badge {
      background-color: #f1f5f9;
      color: #64748b;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10.5px;
      border: 1px solid #e2e8f0;
    }

    .segment-item-box.active .rule-preview-badge {
      background-color: rgba(124, 58, 237, 0.08);
      color: var(--brand-primary);
      border-color: rgba(124, 58, 237, 0.15);
    }

    /* Tags styles */
    .add-tag-box .tag-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      outline: none;
      font-size: 13px;
    }
    
    .color-picker-input {
      width: 40px;
      height: 35px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      padding: 0;
    }
    
    .tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--radius-round);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .tag-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--radius-round);
    }

    .rule-card-tag {
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12.5px;
    }

    .rule-card-tag .field-lbl { color: var(--text-secondary); }
    .rule-card-tag .operator-lbl { color: var(--brand-primary); }
    .rule-card-tag .val-lbl { color: var(--text-main); }

    .btn-danger-hover:hover {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: var(--color-high);
      color: var(--color-high);
    }

    .spin-animation {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .segment-modal {
      width: 550px;
      max-width: 90%;
    }

    .rule-edit-row select, .rule-edit-row input {
      padding: 8px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      outline: none;
      font-size: 13px;
    }

    .rule-edit-row select {
      background-color: white;
    }

    .rule-edit-row input {
      width: 100%;
    }
  `]
})
export class SegmentationComponent implements OnInit {
  private crmService = inject(CrmService);

  segments: any[] = [];
  tags: any[] = [];
  metadata: any = null;

  selectedSegment: any = null;
  isRecalculating = false;

  showCreateModal = false;
  newSegment = {
    segmentName: '',
    description: '',
    rules: [
      { fieldName: 'budgetMin', operator: '>', value: '' }
    ]
  };

  newTag = {
    tagName: '',
    colorCode: '#6b7280'
  };

  ngOnInit() {
    this.loadSegments();
    this.loadTags();
    this.loadMetadata();
  }

  loadSegments() {
    this.crmService.getSegments().subscribe({
      next: (data) => {
        this.segments = data;
        // Keep selected segment updated if applicable
        if (this.selectedSegment) {
          const updated = data.find((s: any) => s.id === this.selectedSegment.id);
          if (updated) {
            this.selectSegment(updated.id);
          }
        }
      },
      error: (err) => console.error('Failed to load segments:', err)
    });
  }

  loadTags() {
    this.crmService.getTags().subscribe({
      next: (data) => this.tags = data,
      error: (err) => console.error('Failed to load tags:', err)
    });
  }

  loadMetadata() {
    // We can fetch metadata details from agents/metadata which returns sources, statuses, agents
    this.crmService.getMetadata().subscribe({
      next: (res) => this.metadata = res,
      error: (err) => console.error('Failed to load segment dropdown metadata:', err)
    });
  }

  getSegmentedLeadsCount(): number {
    const uniqueLeadIds = new Set<number>();
    this.segments.forEach(seg => {
      // note: if rules details are populated, segment.memberCount represents cached count.
      // For getting total count of unique segmented leads we could query details.
    });
    // Return approximate sum of members for display
    return this.segments.reduce((sum, s) => sum + (s.memberCount || 0), 0);
  }

  selectSegment(id: number) {
    this.crmService.getSegmentDetails(id).subscribe({
      next: (data) => {
        this.selectedSegment = data;
      },
      error: (err) => console.error('Failed to load segment details:', err)
    });
  }

  onRecalculate(id: number) {
    this.isRecalculating = true;
    this.crmService.recalculateSegment(id).subscribe({
      next: () => {
        this.isRecalculating = false;
        this.selectSegment(id);
        this.loadSegments();
      },
      error: (err) => {
        this.isRecalculating = false;
        console.error('Failed to recalculate segment:', err);
      }
    });
  }

  onDeleteSegment(id: number) {
    customConfirm('Are you sure you want to delete this segment?').then(confirmed => {
      if (confirmed) {
        this.crmService.deleteSegment(id).subscribe({
          next: () => {
            this.selectedSegment = null;
            this.loadSegments();
          },
          error: (err) => console.error('Failed to delete segment:', err)
        });
      }
    });
  }

  onCreateTag() {
    if (!this.newTag.tagName.trim()) return;
    this.crmService.createTag(this.newTag).subscribe({
      next: () => {
        this.newTag = { tagName: '', colorCode: '#6b7280' };
        this.loadTags();
      },
      error: (err) => console.error('Failed to create tag:', err)
    });
  }

  openCreateModal() {
    this.newSegment = {
      segmentName: '',
      description: '',
      rules: [
        { fieldName: 'budgetMin', operator: '>', value: '' }
      ]
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  addRule() {
    this.newSegment.rules.push({ fieldName: 'budgetMin', operator: '>', value: '' });
  }

  removeRule(index: number) {
    this.newSegment.rules.splice(index, 1);
  }

  onRuleFieldChange(rule: any) {
    // Reset operators/values depending on field change
    if (rule.fieldName === 'budgetMin' || rule.fieldName === 'budgetMax') {
      rule.operator = '>';
      rule.value = '';
    } else if (rule.fieldName === 'statusId' || rule.fieldName === 'sourceId') {
      rule.operator = '=';
      // Default to first option
      if (rule.fieldName === 'statusId' && this.metadata?.statuses?.length > 0) {
        rule.value = this.metadata.statuses[0].id.toString();
      } else if (rule.fieldName === 'sourceId' && this.metadata?.sources?.length > 0) {
        rule.value = this.metadata.sources[0].id.toString();
      } else {
        rule.value = '';
      }
    } else {
      rule.operator = 'LIKE';
      rule.value = '';
    }
  }

  isNumericField(field: string): boolean {
    return field === 'budgetMin' || field === 'budgetMax';
  }

  isFormValid(): boolean {
    return this.newSegment.rules.every(r => r.value.trim() !== '');
  }

  onSubmitCreate(event: Event) {
    event.preventDefault();
    if (!this.newSegment.segmentName.trim() || !this.isFormValid()) return;

    this.crmService.createSegment(this.newSegment).subscribe({
      next: (res) => {
        this.closeCreateModal();
        this.loadSegments();
        this.selectSegment(res.id);
      },
      error: (err) => console.error('Failed to create segment:', err)
    });
  }

  exportSegmentCsv() {
    if (!this.selectedSegment || !this.selectedSegment.members) return;

    const headers = ['Lead Code', 'Full Name', 'Primary Phone', 'Email', 'Status', 'Source', 'Agent'];
    const rows = this.selectedSegment.members.map((lead: any) => [
      lead.leadCode,
      `"${lead.fullName.replace(/"/g, '""')}"`,
      lead.primaryPhone,
      lead.primaryEmail || '',
      lead.leadStatus?.statusName || '',
      lead.leadSource?.sourceName || '',
      lead.assignedSalesAgent?.fullName || 'Unassigned'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `segment_${this.selectedSegment.segmentName.replace(/\s+/g, '_')}_members.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getFieldLabel(field: string): string {
    switch (field) {
      case 'budgetMin': return 'Min Budget';
      case 'budgetMax': return 'Max Budget';
      case 'city': return 'City';
      case 'nationality': return 'Nationality';
      case 'gender': return 'Gender';
      case 'statusId': return 'Status';
      case 'sourceId': return 'Lead Source';
      default: return field;
    }
  }
}
