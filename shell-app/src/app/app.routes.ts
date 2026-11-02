import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./features/login/login').then((m) => m.Login),
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/layout/layout').then((m) => m.Layout),
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'home',
            },
            {
                path: 'home',
                loadComponent: () =>
                    import('./features/homepage/homepage').then((m) => m.Homepage),
            },
            {
                path: 'squadre',
                loadChildren: () =>
                    loadRemoteModule('mfe-squadre', './Routes').then((m) => m.SQUADRE_ROUTES),
            },
            {
                path: 'allenamenti',
                loadChildren: () =>
                    loadRemoteModule('mfe-allenamenti', './Routes').then((m) => m.ALLENAMENTI_ROUTES),
            },
            {
                path: 'tattiche',
                loadChildren: () =>
                    loadRemoteModule('mfe-tattiche', './Routes').then((m) => m.TATTICHE_ROUTES),
            },
            {
                path: 'statistiche',
                loadChildren: () =>
                    loadRemoteModule('mfe-statistiche', './Routes').then((m) => m.STATISTICHE_ROUTES),
            },
            {
                path: 'partite',
                loadChildren: () =>
                    loadRemoteModule('mfe-partite', './Routes').then((m) => m.PARTITE_ROUTES),
            },
            {
                path: 'tracking',
                loadChildren: () =>
                    loadRemoteModule('mfe-tracking', './Routes').then((m) => m.routes),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];