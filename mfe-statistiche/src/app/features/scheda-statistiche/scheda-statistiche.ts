import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GraficoTrend } from '../grafico-trend/grafico-trend';
import { FormsModule } from '@angular/forms';
import { TrendDto, CategoriaMetrica, StatisticaRequest } from '../../core/models/statistica.model';
import { StatisticaService } from '../../core/services/statistica.service';

@Component({
  selector: 'stat-scheda',
  imports: [RouterLink, FormsModule, GraficoTrend],
  templateUrl: './scheda-statistiche.html',
  styleUrl: './scheda-statistiche.css',
})
export class SchedaStatistiche implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(StatisticaService);

  giocatoreId = 0;
  trends = signal<TrendDto[]>([]);
  trendSelezionato = signal<TrendDto | null>(null);
  loading = signal(true);
  salvando = signal(false);
  messaggioSalvataggio = signal<string | null>(null);

  // Form inserimento dato
  nuovoPeriodo = this.periodoCorrente();
  nuovaCategoria: CategoriaMetrica = 'VALUTAZIONE_MEDIA';
  nuovoValore: number | null = null;
  mesiProiezione = 6;

  readonly categorieOptions: { label: string; value: CategoriaMetrica }[] = [
    { label: 'Valutazione media', value: 'VALUTAZIONE_MEDIA' },
    { label: 'Presenze %', value: 'PRESENZE_PCT' },
    { label: 'Velocità', value: 'VELOCITA' },
    { label: 'Resistenza', value: 'RESISTENZA' },
    { label: 'Forza', value: 'FORZA' },
    { label: 'Minuti giocati', value: 'MINUTI_GIOCATI' },
    { label: 'Gol', value: 'GOL' },
    { label: 'Assist', value: 'ASSIST' },
    { label: 'Ammonizioni', value: 'AMMONIZIONI' },
  ];

  ngOnInit(): void {
    this.giocatoreId = Number(this.route.snapshot.paramMap.get('id'));
    this.caricaTrend();
  }

  caricaTrend(): void {
    this.loading.set(true);
    this.service.getAllTrend(this.giocatoreId, this.mesiProiezione).subscribe({
      next: (trends) => {
        this.trends.set(trends);
        if (trends.length > 0 && !this.trendSelezionato()) {
          this.trendSelezionato.set(trends[0]);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selezionaCategoria(trend: TrendDto): void {
    this.trendSelezionato.set(trend);
    this.nuovaCategoria = trend.categoria;
  }

  inserisciDato(): void {
    if (!this.nuovoValore || !this.nuovoPeriodo) return;
    this.salvando.set(true);

    const req: StatisticaRequest = {
      giocatoreId: this.giocatoreId,
      periodo: this.nuovoPeriodo,
      categoria: this.nuovaCategoria,
      valore: this.nuovoValore,
    };

    this.service.upsert(req).subscribe({
      next: () => {
        this.salvando.set(false);
        this.messaggioSalvataggio.set('Dato salvato');
        this.nuovoValore = null;
        this.caricaTrend();
        setTimeout(() => this.messaggioSalvataggio.set(null), 2000);
      },
      error: () => {
        this.salvando.set(false);
        this.messaggioSalvataggio.set('Errore nel salvataggio');
      },
    });
  }

  getCategoriaLabel(cat: CategoriaMetrica): string {
    return this.categorieOptions.find(c => c.value === cat)?.label ?? cat;
  }

  getTendenzaClass(tendenza: string): string {
    if (tendenza === 'CRESCITA') return 'crescita';
    if (tendenza === 'CALO') return 'calo';
    return 'stabile';
  }

  getTendenzaIcon(tendenza: string): string {
    if (tendenza === 'CRESCITA') return 'pi pi-arrow-up';
    if (tendenza === 'CALO') return 'pi pi-arrow-down';
    return 'pi pi-minus';
  }

  private periodoCorrente(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
