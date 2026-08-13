import { Routes } from '@angular/router';

export const ALLENAMENTI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/lista-allenamenti/lista-allenamenti').then(
        (m) => m.ListaAllenamenti
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/dettaglio-allenamento/dettaglio-allenamento').then(
        (m) => m.DettaglioAllenamento
      ),
  },
];