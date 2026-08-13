import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/login/login').then((m) => m.Login),
    },
    {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/homepage/homepage').then(
                (m) => m.Homepage
            ),
    },
    {
        path: 'squadre',
        canActivate: [authGuard],
        loadChildren: () =>
            loadRemoteModule('mfe-squadre', './Routes').then((m) => m.SQUADRE_ROUTES),
    },
    {
        path: 'allenamenti',
        canActivate: [authGuard],
        loadChildren: () =>
            loadRemoteModule('mfe-allenamenti', './Routes').then(
                (m) => m.ALLENAMENTI_ROUTES
            ),
    },
    {
        path: 'tattiche',
        canActivate: [authGuard],
        loadChildren: () =>
            loadRemoteModule('mfe-tattiche', './Routes').then(
                (m) => m.TATTICHE_ROUTES
            ),
    },
    {
        path: 'statistiche',
        canActivate: [authGuard],
        loadChildren: () =>
            loadRemoteModule('mfe-statistiche', './Routes').then(
                (m) => m.STATISTICHE_ROUTES
            ),
    },
    {
        path: 'partite',
        canActivate: [authGuard],
        loadChildren: () =>
            loadRemoteModule('mfe-partite', './Routes').then(
                (m) => m.PARTITE_ROUTES
            )
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];