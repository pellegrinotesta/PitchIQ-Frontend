import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { authGuard } from './core/guards/auth.guard';
import federationManifest from '../../public/federation.manifest.json';

function loadRemoteRoutes(remoteName: keyof typeof federationManifest) {
    const remoteEntry = federationManifest[remoteName];
    return loadRemoteModule({ remoteName, remoteEntry, exposedModule: './Routes' });
}

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
                    loadRemoteRoutes('mfe-squadre').then((m) => m.SQUADRE_ROUTES),
            },
            {
                path: 'allenamenti',
                loadChildren: () =>
                    loadRemoteRoutes('mfe-allenamenti').then((m) => m.ALLENAMENTI_ROUTES),
            },
            {
                path: 'tattiche',
                loadChildren: () =>
                    loadRemoteRoutes('mfe-tattiche').then((m) => m.TATTICHE_ROUTES),
            },
            {
                path: 'statistiche',
                loadChildren: () =>
                    loadRemoteRoutes('mfe-statistiche').then((m) => m.STATISTICHE_ROUTES),
            },
            {
                path: 'partite',
                loadChildren: () =>
                    loadRemoteRoutes('mfe-partite').then((m) => m.PARTITE_ROUTES),
            },
            {
                path: 'tracking',
                loadChildren: () =>
                    loadRemoteRoutes('mfe-tracking').then((m) => m.routes),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];