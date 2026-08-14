import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RadarChart } from '../radar-chart/radar-chart';
import { GiocatoreStatistica, ConfrontoDto } from '../../core/models/statistica.model';
import { StatisticaService } from '../../core/services/statistica.service';

@Component({
  selector: 'stat-confronto',
  imports: [RouterLink, FormsModule, RadarChart],
  templateUrl: './confronto-giocatori.html',
  styleUrl: './confronto-giocatori.css',
})
export class ConfrontoGiocatori implements OnInit {
  private service = inject(StatisticaService);

  rosa = signal<GiocatoreStatistica[]>([]);
  confronto = signal<ConfrontoDto | null>(null);
  loading = signal(false);

  giocatore1Id: number | null = null;
  giocatore2Id: number | null = null;

  ngOnInit(): void {
    this.service.getRosa().subscribe({
      next: (r) => this.rosa.set(r),
    });
  }

  eseguiConfronto(): void {
    if (!this.giocatore1Id || !this.giocatore2Id) return;
    if (this.giocatore1Id === this.giocatore2Id) return;

    this.loading.set(true);
    this.service.confronta(this.giocatore1Id, this.giocatore2Id).subscribe({
      next: (c) => { this.confronto.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  get g1Nome(): string {
    return this.confronto()?.giocatore1.nomeGiocatore ?? '';
  }

  get g2Nome(): string {
    return this.confronto()?.giocatore2.nomeGiocatore ?? '';
  }

  // Calcola chi vince su ogni categoria
  getVincitore(index: number): 1 | 2 | 0 {
    const c = this.confronto();
    if (!c) return 0;
    const v1 = c.giocatore1.valori[index]?.valorePct ?? 0;
    const v2 = c.giocatore2.valori[index]?.valorePct ?? 0;
    if (v1 > v2) return 1;
    if (v2 > v1) return 2;
    return 0;
  }
}
