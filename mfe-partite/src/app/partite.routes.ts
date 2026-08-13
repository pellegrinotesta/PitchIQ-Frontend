import { Routes } from '@angular/router';

export const PARTITE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/registro-partite/registro-partite').then(
        (m) => m.RegistroPartite
      ),
  },
  {
    path: 'scouting',
    loadComponent: () =>
      import('./features/scouting/scouting').then(
        (m) => m.Scouting
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/dettaglio-partita/dettaglio-partita').then(
        (m) => m.DettaglioPartita
      ),
  },
];