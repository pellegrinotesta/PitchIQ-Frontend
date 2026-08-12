import { Routes } from '@angular/router';

export const TATTICHE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/editor-tattiche/editor-tattiche').then(
        (m) => m.EditorTattiche
      ),
  },
];