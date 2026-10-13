import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Escludi chiamate esterne da autenticazione e gestione 401
    if (req.url.startsWith('https://api.github.com') ||
        req.url.startsWith('https://raw.githubusercontent.com') ||
        req.url.includes('github.com') && req.url.includes('/info/lfs/')) {
        return next(req);
    }

    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
                authService.logout();
                router.navigate(['/login']);
            }
            return throwError(() => err);
        })
    );
};