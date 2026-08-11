import { Routes } from '@angular/router';

// Esposto via Native Federation come './Routes' e montato dallo shell sotto /squadre
export const SQUADRE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./features/elenco-giocatori/elenco-giocatori').then(
                (m) => m.ElencoGiocatori
            ),
    },
    {
        path: 'nuovo',
        loadComponent: () =>
            import('./features/form-giocatore/form-giocatore').then(
                (m) => m.FormGiocatore
            ),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./features/scheda-giocatore/scheda-giocatore').then(
                (m) => m.SchedaGiocatore
            ),
    },
    {
        path: ':id/modifica',
        loadComponent: () =>
            import('./features/form-giocatore/form-giocatore').then(
                (m) => m.FormGiocatore
            ),
    },
];
