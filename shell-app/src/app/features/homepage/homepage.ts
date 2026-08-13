import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-homepage',
  imports: [RouterLink, ButtonModule, CardModule],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class Homepage {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly sezioni = [
    { label: 'Squadre & Rosa', icon: 'pi pi-users', route: '/squadre', descrizione: 'Gestisci la rosa, aggiungi e modifica giocatori' },
    { label: 'Allenamenti', icon: 'pi pi-calendar', route: '/allenamenti', descrizione: 'Pianifica le sedute e registra le presenze' },
    { label: 'Tattiche', icon: 'pi pi-map', route: '/tattiche', descrizione: 'Crea formazioni e schemi di gioco' },
    { label: 'Statistiche', icon: 'pi pi-chart-line', route: '/statistiche', descrizione: 'Analizza la crescita e il rendimento dei giocatori' },
    { label: 'Partite', icon: 'pi pi-futbol', route: '/partite', descrizione: 'Registra le partite, gli eventi e le statistiche' },
  ];

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
