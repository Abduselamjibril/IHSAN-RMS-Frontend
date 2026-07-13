import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeadsComponent } from './pages/leads/leads.component';
import { NotificationInboxComponent } from './pages/notifications/inbox.component';
import { NotificationPreferencesComponent } from './pages/notifications/preferences.component';
import { NotificationTemplatesComponent } from './pages/notifications/templates.component';
import { PropertiesListComponent } from './pages/properties/list/properties-list.component';
import { PropertiesDetailsComponent } from './pages/properties/details/properties-details.component';
import { BuildingsComponent } from './pages/properties/buildings/buildings.component';
import { UnitsComponent } from './pages/properties/units/units.component';
import { UnitStatusComponent } from './pages/properties/unit-status/unit-status.component';
import { PricingComponent } from './pages/properties/pricing/pricing.component';
import { FloorPlansComponent } from './pages/properties/floor-plans/floor-plans.component';
import { MediaDocumentsComponent } from './pages/properties/media-documents/media-documents.component';
import { AmenitiesComponent } from './pages/properties/amenities/amenities.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { AgentsComponent } from './pages/agents/agents.component';
import { LeadSourcesComponent } from './pages/lead-sources/lead-sources.component';
import { FollowupsComponent } from './pages/followups/followups.component';
import { CommunicationsComponent } from './pages/communications/communications.component';
import { DocumentsComponent } from './pages/documents/documents.component';
import { LeadTrackingComponent } from './pages/lead-tracking/lead-tracking.component';
import { LogInteractionComponent } from './pages/log-interaction/log-interaction.component';
import { OpportunitiesComponent } from './pages/opportunities/opportunities.component';
import { ForecastingComponent } from './pages/forecasting/forecasting.component';
import { SegmentationComponent } from './pages/segmentation/segmentation.component';

// Sales module imports
import { CustomersComponent } from './pages/sales/customers.component';
import { ReservationsComponent } from './pages/sales/reservations.component';
import { QuotationsComponent } from './pages/sales/quotations.component';
import { BookingsComponent } from './pages/sales/bookings.component';
import { ContractsComponent } from './pages/sales/contracts.component';
import { InstallmentsComponent } from './pages/sales/installments.component';
import { CommissionsComponent } from './pages/sales/commissions.component';

// Finance module imports
import { CollectionsComponent } from './pages/finance/collections.component';
import { FinanceInstallmentsComponent } from './pages/finance/installments.component';
import { ReceiptsComponent } from './pages/finance/receipts.component';

// Marketing module imports
import { CampaignsComponent } from './pages/marketing/campaigns.component';
import { AdvertisementsComponent } from './pages/marketing/advertisements.component';

// Broker module imports
import { BrokerListComponent } from './pages/broker/broker-list.component';
import { BrokerAssignmentsComponent } from './pages/broker/broker-assignments.component';
import { BrokerPlansComponent } from './pages/broker/broker-plans.component';
import { BrokerCommissionsComponent } from './pages/broker/broker-commissions.component';
import { BrokerPaymentsComponent } from './pages/broker/broker-payments.component';

// Security module imports
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/security/login.component';
import { UsersComponent } from './pages/security/users.component';
import { RolesComponent } from './pages/security/roles.component';
import { WorkflowsComponent } from './pages/security/workflows.component';
import { AuditComponent } from './pages/security/audit.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'leads', component: LeadsComponent, canActivate: [authGuard] },
  
  // Property management routes
  { path: 'properties/list', component: PropertiesListComponent, canActivate: [authGuard] },
  { path: 'properties/details/:id', component: PropertiesDetailsComponent, canActivate: [authGuard] },
  { path: 'properties/buildings', component: BuildingsComponent, canActivate: [authGuard] },
  { path: 'properties/units', component: UnitsComponent, canActivate: [authGuard] },
  { path: 'properties/unit-status', component: UnitStatusComponent, canActivate: [authGuard] },
  { path: 'properties/pricing', component: PricingComponent, canActivate: [authGuard] },
  { path: 'properties/floor-plans', component: FloorPlansComponent, canActivate: [authGuard] },
  { path: 'properties/media', component: MediaDocumentsComponent, canActivate: [authGuard] },
  { path: 'properties/amenities', component: AmenitiesComponent, canActivate: [authGuard] },

  // CRM/Agent management routes
  { path: 'agents', component: AgentsComponent, canActivate: [authGuard] },
  { path: 'lead-sources', component: LeadSourcesComponent, canActivate: [authGuard] },
  { path: 'log-interaction', component: LogInteractionComponent, canActivate: [authGuard] },
  { path: 'follow-ups', component: FollowupsComponent, canActivate: [authGuard] },
  { path: 'opportunities', component: OpportunitiesComponent, canActivate: [authGuard] },
  { path: 'forecasting', component: ForecastingComponent, canActivate: [authGuard] },
  { path: 'communications', component: CommunicationsComponent, canActivate: [authGuard] },
  { path: 'documents', component: DocumentsComponent, canActivate: [authGuard] },
  { path: 'segmentation', component: SegmentationComponent, canActivate: [authGuard] },
  { path: 'lead-tracking', component: LeadTrackingComponent, canActivate: [authGuard] },

  // Notification module routes
  { path: 'notifications/inbox', component: NotificationInboxComponent, canActivate: [authGuard] },
  { path: 'notifications/preferences', component: NotificationPreferencesComponent, canActivate: [authGuard] },
  { path: 'notifications/templates', component: NotificationTemplatesComponent, canActivate: [authGuard] },

  // Sales module routes
  { path: 'sales/customers', component: CustomersComponent, canActivate: [authGuard] },
  { path: 'sales/reservations', component: ReservationsComponent, canActivate: [authGuard] },
  { path: 'sales/quotations', component: QuotationsComponent, canActivate: [authGuard] },
  { path: 'sales/bookings', component: BookingsComponent, canActivate: [authGuard] },
  { path: 'sales/contracts', component: ContractsComponent, canActivate: [authGuard] },
  { path: 'sales/installments', component: InstallmentsComponent, canActivate: [authGuard] },
  { path: 'sales/commissions', component: CommissionsComponent, canActivate: [authGuard] },

  // Finance module routes
  { path: 'finance/collections', component: CollectionsComponent, canActivate: [authGuard] },
  { path: 'finance/installments', component: FinanceInstallmentsComponent, canActivate: [authGuard] },
  { path: 'finance/receipts', component: ReceiptsComponent, canActivate: [authGuard] },

  // Marketing module routes
  { path: 'marketing/campaigns', component: CampaignsComponent, canActivate: [authGuard] },
  { path: 'marketing/ads', component: AdvertisementsComponent, canActivate: [authGuard] },

  // Broker module routes
  { path: 'broker/list', component: BrokerListComponent, canActivate: [authGuard] },
  { path: 'broker/assignments', component: BrokerAssignmentsComponent, canActivate: [authGuard] },
  { path: 'broker/plans', component: BrokerPlansComponent, canActivate: [authGuard] },
  { path: 'broker/commissions', component: BrokerCommissionsComponent, canActivate: [authGuard] },
  { path: 'broker/payments', component: BrokerPaymentsComponent, canActivate: [authGuard] },

  // User & Role security management routes
  { path: 'security/users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'security/roles', component: RolesComponent, canActivate: [authGuard] },
  { path: 'security/workflows', component: WorkflowsComponent, canActivate: [authGuard] },
  { path: 'security/audit', component: AuditComponent, canActivate: [authGuard] },

  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];

