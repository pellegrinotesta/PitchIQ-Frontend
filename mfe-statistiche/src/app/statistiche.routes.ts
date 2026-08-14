import { Routes } from '@angular/router';

export const STATISTICHE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard-statistiche/dashboard-statistiche').then(
        (m) => m.DashboardStatistiche
      ),
  },
  {
    path: 'confronto',
    loadComponent: () =>
      import('./features/confronto-giocatori/confronto-giocatori').then(
        (m) => m.ConfrontoGiocatori
      ),
  },
  {
    path: 'giocatore/:id',
    loadComponent: () =>
      import('./features/scheda-statistiche/scheda-statistiche').then(
        (m) => m.SchedaStatistiche
      ),
  },
];