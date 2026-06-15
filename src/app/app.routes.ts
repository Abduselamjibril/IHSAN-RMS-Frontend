import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeadsComponent } from './pages/leads/leads.component';
import { PropertiesDashboardComponent } from './pages/properties/dashboard/properties-dashboard.component';
import { PropertiesListComponent } from './pages/properties/list/properties-list.component';
import { PropertiesDetailsComponent } from './pages/properties/details/properties-details.component';
import { BuildingsComponent } from './pages/properties/buildings/buildings.component';
import { UnitsComponent } from './pages/properties/units/units.component';
import { UnitStatusComponent } from './pages/properties/unit-status/unit-status.component';
import { PricingComponent } from './pages/properties/pricing/pricing.component';
import { FloorPlansComponent } from './pages/properties/floor-plans/floor-plans.component';
import { MediaDocumentsComponent } from './pages/properties/media-documents/media-documents.component';
import { AmenitiesComponent } from './pages/properties/amenities/amenities.component';
import { ReportsComponent } from './pages/properties/reports/reports.component';
import { AgentsComponent } from './pages/agents/agents.component';
import { LeadSourcesComponent } from './pages/lead-sources/lead-sources.component';
import { FollowupsComponent } from './pages/followups/followups.component';
import { CommunicationsComponent } from './pages/communications/communications.component';
import { DocumentsComponent } from './pages/documents/documents.component';
import { LeadTrackingComponent } from './pages/lead-tracking/lead-tracking.component';
import { LogInteractionComponent } from './pages/log-interaction/log-interaction.component';
import { OpportunitiesComponent } from './pages/opportunities/opportunities.component';
import { ForecastingComponent } from './pages/forecasting/forecasting.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'leads', component: LeadsComponent },
  
  // Property management routes
  { path: 'properties/dashboard', component: PropertiesDashboardComponent },
  { path: 'properties/list', component: PropertiesListComponent },
  { path: 'properties/details/:id', component: PropertiesDetailsComponent },
  { path: 'properties/buildings', component: BuildingsComponent },
  { path: 'properties/units', component: UnitsComponent },
  { path: 'properties/unit-status', component: UnitStatusComponent },
  { path: 'properties/pricing', component: PricingComponent },
  { path: 'properties/floor-plans', component: FloorPlansComponent },
  { path: 'properties/media', component: MediaDocumentsComponent },
  { path: 'properties/amenities', component: AmenitiesComponent },
  { path: 'properties/reports', component: ReportsComponent },

  // CRM/Agent management routes
  { path: 'agents', component: AgentsComponent },
  { path: 'lead-sources', component: LeadSourcesComponent },
  { path: 'log-interaction', component: LogInteractionComponent },
  { path: 'follow-ups', component: FollowupsComponent },
  { path: 'opportunities', component: OpportunitiesComponent },
  { path: 'forecasting', component: ForecastingComponent },
  { path: 'communications', component: CommunicationsComponent },
  { path: 'documents', component: DocumentsComponent },
  { path: 'lead-tracking', component: LeadTrackingComponent },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];

