import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatisticaService } from '../../core/services/statistica.service';
import { GiocatoreStatistica, TrendDto } from '../../core/models/statistica.model';

@Component({
  selector: 'app-dashboard-statistiche',
  imports: [RouterLink],
  templateUrl: './dashboard-statistiche.html',
  styleUrl: './dashboard-statistiche.css',
})
export class DashboardStatistiche implements OnInit {
  private service = inject(StatisticaService);

  rosa = signal<GiocatoreStatistica[]>([]);
  panoramica = signal<TrendDto[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.service.getRosa().subscribe({
      next: (rosa) => this.rosa.set(rosa),
    });
    this.service.getPanoramicaRosa().subscribe({
      next: (data) => { this.panoramica.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getTrend(giocatoreId: number): TrendDto | null {
    return this.panoramica().find(t => t.giocatoreId === giocatoreId) ?? null;
  }

  getTendenzaIcon(tendenza: string): string {
    if (tendenza === 'CRESCITA') return 'pi pi-arrow-up';
    if (tendenza === 'CALO') return 'pi pi-arrow-down';
    return 'pi pi-minus';
  }

  getTendenzaClass(tendenza: string): string {
    if (tendenza === 'CRESCITA') return 'crescita';
    if (tendenza === 'CALO') return 'calo';
    return 'stabile';
  }

  getSparklinePoints(storico: { periodo: string; valore: number }[]): string {
    if (storico.length < 2) return '';
    const valori = storico.map(p => p.valore);
    const min = Math.min(...valori);
    const max = Math.max(...valori);
    const range = max - min || 1;

    return storico.map((p, i) => {
      const x = (i / (storico.length - 1)) * 100;
      const y = 28 - ((p.valore - min) / range) * 24;
      return `${x},${y}`;
    }).join(' ');
  }
}
