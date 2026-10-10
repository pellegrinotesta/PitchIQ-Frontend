import { Routes } from '@angular/router';

/**
 * Esposte via Native Federation come './routes'.
 * Nello shell-app: { path: 'tracking', loadChildren: () => loadRemoteModule('mfe-tracking', './routes').then(m => m.routes) }
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tracking/pages/tracking-home.component').then(m => m.TrackingHomeComponent),
    title: 'Laboratorio pressione · PitchIQ',
  },
  {
    path: 'partita/:matchId',
    loadComponent: () => import('./tracking/pages/partita-dettaglio.component').then(m => m.PartitaDettaglioComponent),
    title: 'Partita · Laboratorio pressione',
  },
];
