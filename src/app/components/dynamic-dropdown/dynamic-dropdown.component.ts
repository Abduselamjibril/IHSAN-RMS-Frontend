import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { customConfirm } from '../../utils/confirm';

@Component({
  selector: 'app-dynamic-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dynamic-dropdown-container">
      <!-- Select Box Trigger -->
      <div class="select-box flex justify-between align-center" (click)="toggleDropdown($event)">
        <span class="selected-text" [class.text-muted]="!selectedLabel">
          {{ selectedLabel || placeholder }}
        </span>
        <span class="material-icons-outlined arrow-icon" [class.arrow-rotate]="isOpen">expand_more</span>
      </div>

      <!-- Dropdown Menu List -->
      <div class="dropdown-menu animate-fade" *ngIf="isOpen" (click)="$event.stopPropagation()">
        <!-- Search bar inside dropdown -->
        <div class="search-bar-container">
          <span class="material-icons-outlined search-icon">search</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search option..." 
            class="dropdown-search-input" 
          />
        </div>

        <!-- Scrollable Options List -->
        <div class="options-list">
          <div *ngFor="let opt of filteredOptions()" class="option-item flex align-center justify-between">
            <!-- Normal Mode -->
            <ng-container *ngIf="editingId !== opt[valueKey]">
              <span class="option-text" (click)="selectOption(opt)">{{ opt[displayKey] }}</span>
              <div class="option-actions flex gap-1">
                <button type="button" class="action-btn edit-btn" (click)="startEdit(opt, $event)" title="Edit Name">
                  <span class="material-icons-outlined">edit</span>
                </button>
                <button type="button" class="action-btn delete-btn" (click)="onDeleteClick(opt, $event)" title="Delete Option">
                  <span class="material-icons-outlined">delete</span>
                </button>
              </div>
            </ng-container>

            <!-- Inline Edit Mode -->
            <ng-container *ngIf="editingId === opt[valueKey]">
              <input 
                type="text" 
                [(ngModel)]="editName" 
                class="inline-edit-input" 
                (keydown.enter)="saveEdit(opt, $event)" 
                (click)="$event.stopPropagation()"
                #editInput
              />
              <div class="option-actions-edit flex gap-1">
                <button type="button" class="action-btn save-btn" (click)="saveEdit(opt, $event)" title="Save Changes">
                  <span class="material-icons-outlined">check</span>
                </button>
                <button type="button" class="action-btn cancel-btn" (click)="cancelEdit($event)" title="Cancel">
                  <span class="material-icons-outlined">close</span>
                </button>
              </div>
            </ng-container>
          </div>

          <div *ngIf="filteredOptions().length === 0 && !isAdding" class="no-options-text">
            No options found.
          </div>
        </div>

        <!-- Add New Section inside dropdown -->
        <div class="add-new-section">
          <!-- Button State -->
          <button type="button" *ngIf="!isAdding" class="add-btn flex align-center justify-center gap-1" (click)="startAdd($event)">
            <span class="material-icons-outlined" style="font-size: 16px;">add</span>
            <span>Add New / Other...</span>
          </button>

          <!-- Input State -->
          <div *ngIf="isAdding" class="add-input-container flex flex-col gap-2" style="padding: 4px;">
            <input 
              type="text" 
              [(ngModel)]="newName" 
              placeholder="Enter new type name..." 
              class="inline-add-input"
              #addInput
            />
            <textarea
              [(ngModel)]="newDescription"
              placeholder="Description (optional)"
              class="inline-add-input"
              rows="2"
            ></textarea>
            <div class="flex gap-1 justify-end mt-1">
              <button type="button" class="action-btn save-btn-main px-2" (click)="saveAdd($event)" [disabled]="!newName.trim()">
                <span class="material-icons-outlined font-sm">check</span>
              </button>
              <button type="button" class="action-btn cancel-btn-main px-2" (click)="cancelAdd($event)">
                <span class="material-icons-outlined font-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dynamic-dropdown-container {
      position: relative;
      width: 100%;
      user-select: none;
    }
    .select-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      cursor: pointer;
      min-height: 42px;
      transition: var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }
    .select-box:hover {
      border-color: var(--brand-primary);
      box-shadow: var(--shadow-md);
    }
    .selected-text {
      font-size: 14px;
      color: var(--text-main);
    }
    .text-muted {
      color: var(--text-muted) !important;
    }
    .arrow-icon {
      font-size: 20px;
      color: var(--text-secondary);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .arrow-rotate {
      transform: rotate(180deg);
      color: var(--brand-primary);
    }
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      width: 100%;
      min-width: 260px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-premium);
      z-index: 1100;
      display: flex;
      flex-direction: column;
      max-height: 320px;
      overflow: hidden;
    }
    .search-bar-container {
      position: relative;
      padding: 8px 10px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-main);
    }
    .search-icon {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      color: var(--text-secondary);
    }
    .dropdown-search-input {
      width: 100%;
      padding: 8px 12px 8px 34px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 13px;
      outline: none;
      background-color: var(--bg-card);
      transition: var(--transition-fast);
    }
    .dropdown-search-input:focus {
      border-color: var(--brand-primary);
    }
    .options-list {
      overflow-y: auto;
      flex: 1;
      padding: 6px;
      max-height: 180px;
    }
    .option-item {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
      min-height: 38px;
    }
    .option-item:hover {
      background-color: var(--brand-primary-light);
    }
    .option-text {
      flex: 1;
      font-size: 13.5px;
      color: var(--text-main);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .option-actions {
      opacity: 0;
      display: flex;
      gap: 4px;
      transition: opacity 0.15s ease;
    }
    .option-item:hover .option-actions {
      opacity: 1;
    }
    .option-actions-edit {
      display: flex;
      gap: 4px;
    }
    .action-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      transition: var(--transition-fast);
    }
    .action-btn span {
      font-size: 16px;
    }
    .edit-btn:hover {
      color: var(--brand-primary);
      background-color: rgba(99, 102, 241, 0.1);
    }
    .delete-btn:hover {
      color: var(--color-lost);
      background-color: rgba(239, 68, 68, 0.1);
    }
    .save-btn {
      color: var(--color-qualified);
      background-color: rgba(16, 185, 129, 0.1);
    }
    .save-btn:hover {
      background-color: rgba(16, 185, 129, 0.2);
    }
    .cancel-btn {
      color: var(--text-secondary);
      background-color: rgba(100, 116, 139, 0.1);
    }
    .cancel-btn:hover {
      background-color: rgba(100, 116, 139, 0.2);
    }
    .save-btn-main {
      color: white;
      background-color: var(--brand-primary);
    }
    .save-btn-main:hover:not(:disabled) {
      background-color: var(--brand-primary-hover);
    }
    .save-btn-main:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cancel-btn-main {
      color: var(--text-secondary);
      background-color: var(--border-color);
    }
    .cancel-btn-main:hover {
      background-color: #cbd5e1;
    }
    .no-options-text {
      padding: 12px;
      font-style: italic;
      color: var(--text-secondary);
      font-size: 13px;
      text-align: center;
    }
    .inline-edit-input {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--brand-primary);
      border-radius: var(--radius-sm);
      font-size: 13px;
      outline: none;
      margin-right: 8px;
      background-color: var(--bg-card);
    }
    .add-new-section {
      padding: 8px 10px;
      background-color: var(--bg-main);
      border-top: 1px solid var(--border-color);
    }
    .add-btn {
      width: 100%;
      padding: 8px;
      background: transparent;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--brand-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: var(--transition-fast);
    }
    .add-btn:hover {
      background-color: var(--brand-primary-light);
      border-color: var(--brand-primary);
    }
    .add-input-container {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .inline-add-input {
      flex: 1;
      padding: 7px 10px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 13px;
      outline: none;
      background-color: var(--bg-card);
      transition: var(--transition-fast);
    }
    .inline-add-input:focus {
      border-color: var(--brand-primary);
    }
  `]
})
export class DynamicDropdownComponent implements OnInit, OnChanges {
  @Input() options: any[] = [];
  @Input() value: number | string = 0;
  @Input() displayKey: string = 'typeName';
  @Input() valueKey: string = 'id';
  @Input() placeholder: string = 'Select Option';

  @Output() valueChange = new EventEmitter<number | string>();
  @Output() add = new EventEmitter<{ name: string; description: string }>();
  @Output() edit = new EventEmitter<{ id: number; name: string }>();
  @Output() delete = new EventEmitter<number>();

  isOpen = false;
  searchQuery = '';
  selectedLabel = '';

  // Inline edit state
  editingId: number | null = null;
  editName = '';

  // Add new state
  isAdding = false;
  newName = '';
  newDescription = '';

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.updateSelectedLabel();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] || changes['value']) {
      this.updateSelectedLabel();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.cancelAdd(event);
      this.cancelEdit(event);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchQuery = '';
    } else {
      this.cancelAdd(event);
      this.cancelEdit(event);
    }
  }

  updateSelectedLabel() {
    if (!this.options || this.options.length === 0) {
      this.selectedLabel = '';
      return;
    }
    const selected = this.options.find(opt => String(opt[this.valueKey]) === String(this.value));
    this.selectedLabel = selected ? selected[this.displayKey] : '';
  }

  filteredOptions() {
    if (!this.searchQuery.trim()) {
      return this.options;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.options.filter(opt => 
      String(opt[this.displayKey]).toLowerCase().includes(query)
    );
  }

  selectOption(opt: any) {
    this.value = opt[this.valueKey];
    this.selectedLabel = opt[this.displayKey];
    this.valueChange.emit(this.value);
    this.isOpen = false;
  }

  startEdit(opt: any, event: Event) {
    event.stopPropagation();
    this.editingId = opt[this.valueKey];
    this.editName = opt[this.displayKey];
  }

  saveEdit(opt: any, event: Event) {
    event.stopPropagation();
    if (!this.editName.trim()) return;
    this.edit.emit({ id: opt[this.valueKey], name: this.editName.trim() });
    this.editingId = null;
    this.editName = '';
  }

  cancelEdit(event?: Event) {
    if (event) event.stopPropagation();
    this.editingId = null;
    this.editName = '';
  }

  onDeleteClick(opt: any, event: Event) {
    event.stopPropagation();
    customConfirm(`Are you sure you want to delete "${opt[this.displayKey]}"?`).then(confirmed => {
      if (confirmed) {
        this.delete.emit(opt[this.valueKey]);
        if (String(this.value) === String(opt[this.valueKey])) {
          this.value = 0;
          this.selectedLabel = '';
          this.valueChange.emit(0);
        }
      }
    });
  }

  startAdd(event: Event) {
    event.stopPropagation();
    this.isAdding = true;
    this.newName = '';
    this.newDescription = '';
  }

  saveAdd(event: Event) {
    event.stopPropagation();
    if (!this.newName.trim()) return;
    this.add.emit({ name: this.newName.trim(), description: this.newDescription.trim() });
    this.isAdding = false;
    this.newName = '';
    this.newDescription = '';
  }

  cancelAdd(event?: Event) {
    if (event) event.stopPropagation();
    this.isAdding = false;
    this.newName = '';
    this.newDescription = '';
  }
}
