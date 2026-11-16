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
    path: 'carico',
    loadComponent: () =>
      import('./features/carico-lavoro/carico-lavoro').then((m) => m.CaricoLavoro),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/dettaglio-allenamento/dettaglio-allenamento').then(
        (m) => m.DettaglioAllenamento
      ),
  },
];