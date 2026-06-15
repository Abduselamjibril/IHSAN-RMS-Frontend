import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeadsComponent } from './pages/leads/leads.component';
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
// Touch to trigger rebuild again - activated communications, documents, lead-tracking and log-interaction routes

