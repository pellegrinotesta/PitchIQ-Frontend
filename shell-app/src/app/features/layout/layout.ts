import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface VoceMenu {
  label: string;
  icon: string;
  route: string;
  prefix: string;
  escludi?: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private router = inject(Router);
  private auth = inject(AuthService);

  readonly voci: VoceMenu[] = [
    { label: 'Home', icon: 'pi pi-home', route: '/', prefix: '/' },
    { label: 'Squadre', icon: 'pi pi-users', route: '/squadre', prefix: '/squadre' },
    { label: 'Allenamenti', icon: 'pi pi-calendar', route: '/allenamenti', prefix: '/allenamenti' },
    { label: 'Tattiche', icon: 'pi pi-map', route: '/tattiche', prefix: '/tattiche' },
    { label: 'Statistiche', icon: 'pi pi-chart-line', route: '/statistiche', prefix: '/statistiche' },
    { label: 'Partite', icon: 'pi pi-circle-fill', route: '/partite', prefix: '/partite' },
    { label: 'Tracking', icon: 'pi pi-map-marker', route: '/tracking', prefix: '/tracking', escludi: '/tracking/statsbomb' },
    { label: 'StatsBomb', icon: 'pi pi-chart-bar', route: '/tracking/statsbomb', prefix: '/tracking/statsbomb' },
  ];

  readonly collassata = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly titolo = computed(() => this.voci.find(v => this.attiva(v))?.label ?? 'PitchIQ');

  attiva(v: VoceMenu): boolean {
    const u = this.url();
    return u.startsWith(v.prefix) && !(v.escludi && u.startsWith(v.escludi));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}