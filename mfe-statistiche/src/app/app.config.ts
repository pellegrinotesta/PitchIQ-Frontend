import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import Aura from '@primeuix/themes/aura';
import { STATISTICHE_ROUTES } from './statistiche.routes';
import { providePrimeNG } from 'primeng/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(STATISTICHE_ROUTES),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.dark' }
      }
    }),
  ]
};
