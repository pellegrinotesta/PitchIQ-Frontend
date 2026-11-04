import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { SQUADRE_ROUTES } from './squadre.routes';
import { provideHttpClient } from '@angular/common/http';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(SQUADRE_ROUTES),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.dark' },
      },
    }),
  ],
};
