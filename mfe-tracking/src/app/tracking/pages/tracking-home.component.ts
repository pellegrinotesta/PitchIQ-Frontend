import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, switchMap, takeWhile, timer } from 'rxjs';
import { EsitoBarsComponent } from '../components/esito-bars.component';
import { UploadPanelComponent } from '../components/upload-panel.component';
import { TrackingApi } from '../data/tracking.api';
import { AggregatoEsitoDto, ImportDto, PartitaDto } from '../data/tracking.models';

interface RigaConfronto {
  partita: PartitaDto;
  percentualeSuperate: number | null;
  scostamentoBenchmark: number | null;
}

@Component({
  selector: 'tk-tracking-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UploadPanelComponent, EsitoBarsComponent, RouterLink, DatePipe],
  templateUrl: './tracking-home.component.html',
  styleUrl: './tracking-home.component.scss',
})
export class TrackingHomeComponent {
  private readonly api = inject(TrackingApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly partite = signal<PartitaDto[]>([]);
  protected readonly aggregati = signal<AggregatoEsitoDto[]>([]);
  protected readonly importRecenti = signal<ImportDto[]>([]);
  protected readonly ultimaCaricata = signal<number | null>(null);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);
  protected readonly storicoCaricato = signal(false);
  protected readonly filtroImport = signal('');
  protected readonly erroreStorico = signal<string | null>(null);
  protected readonly ritentandoId = signal<number | null>(null);
  protected readonly filtroStagione = signal('');
  protected readonly filtroCompetizione = signal('');
  protected readonly filtroSquadra = signal('');
  protected readonly filtroDal = signal('');
  protected readonly filtroAl = signal('');

  protected readonly stagioni = computed(() => [...new Set(
    this.partite().map(p => this.stagione(p.dataPartita)),
  )].sort((a, b) => b.localeCompare(a)));
  protected readonly competizioni = computed(() => [...new Set(
    this.partite().map(p => p.competizione ?? '__senza_competizione__'),
  )].sort((a, b) => a.localeCompare(b)));
  protected readonly squadre = computed(() => [...new Set(
    this.partite().flatMap(p => [p.squadraCasa, p.squadraTrasferta]),
  )].sort((a, b) => a.localeCompare(b)));
  protected readonly partiteFiltrate = computed(() => {
    const stagione = this.filtroStagione();
    const competizione = this.filtroCompetizione();
    const squadra = this.filtroSquadra();
    const dal = this.filtroDal();
    const al = this.filtroAl();

    return this.partite()
      .filter(p => {
        const data = p.dataPartita.slice(0, 10);
        return (!stagione || this.stagione(p.dataPartita) === stagione)
          && (!competizione || (p.competizione ?? '__senza_competizione__') === competizione)
          && (!squadra || p.squadraCasa === squadra || p.squadraTrasferta === squadra)
          && (!dal || data >= dal)
          && (!al || data <= al);
      })
      .sort((a, b) => a.dataPartita.localeCompare(b.dataPartita));
  });
  protected readonly totalePossessi = computed(() => this.partiteFiltrate()
    .reduce((totale, p) => totale + p.possessiPressati, 0));
  protected readonly totaleSuperate = computed(() => this.partiteFiltrate()
    .reduce((totale, p) => totale + p.pressioniSuperate, 0));
  protected readonly benchmark = computed(() => {
    const possessi = this.totalePossessi();
    return possessi ? this.totaleSuperate() / possessi * 100 : null;
  });
  protected readonly confronto = computed<RigaConfronto[]>(() => {
    const benchmark = this.benchmark();
    return this.partiteFiltrate().map(partita => {
      const percentualeSuperate = partita.possessiPressati
        ? partita.pressioniSuperate / partita.possessiPressati * 100
        : null;
      return {
        partita,
        percentualeSuperate,
        scostamentoBenchmark: percentualeSuperate === null || benchmark === null
          ? null
          : percentualeSuperate - benchmark,
      };
    });
  });

  protected readonly statoLabel: Record<ImportDto['stato'], string> = {
    IN_CODA: 'In coda', IN_ELABORAZIONE: 'In elaborazione', COMPLETATO: 'Completato', ERRORE: 'Errore',
  };

  constructor() { this.ricarica(); }

  protected onImportConcluso(imp: ImportDto): void {
    if (imp.stato === 'COMPLETATO') this.ultimaCaricata.set(imp.matchId);
    this.ricarica();
  }

  protected onFiltroImport(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.filtroImport.set(query);
    if (this.timerRicerca) clearTimeout(this.timerRicerca);
    this.timerRicerca = setTimeout(() => this.ricaricaStorico(query), 250);
  }

  protected ritentaImport(id: number): void {
    this.ritentandoId.set(id);
    this.erroreStorico.set(null);
    this.api.ritentaImport(id).pipe(
      switchMap(() => timer(0, 1500).pipe(
        switchMap(() => this.api.statoImport(id)),
        takeWhile(s => s.stato !== 'COMPLETATO' && s.stato !== 'ERRORE', true),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: imp => {
        this.importRecenti.update(lista => lista.map(x => x.id === id ? imp : x));
        if (imp.stato === 'COMPLETATO' || imp.stato === 'ERRORE') {
          this.ritentandoId.set(null);
          this.ricaricaStorico(this.filtroImport());
        }
      },
      error: (err: HttpErrorResponse) => {
        this.ritentandoId.set(null);
        const body = err.error as { message?: string; detail?: string } | null;
        this.erroreStorico.set(body?.detail ?? body?.message ?? 'Non è stato possibile ritentare l’import.');
      },
    });
  }

  private timerRicerca?: ReturnType<typeof setTimeout>;

  protected azzeraFiltri(): void {
    this.filtroStagione.set('');
    this.filtroCompetizione.set('');
    this.filtroSquadra.set('');
    this.filtroDal.set('');
    this.filtroAl.set('');
  }

  private stagione(data: string): string {
    const [anno, mese] = data.slice(0, 10).split('-').map(Number);
    const inizio = mese >= 7 ? anno : anno - 1;
    return `${inizio}/${String(inizio + 1).slice(-2)}`;
  }

  private ricarica(): void {
    forkJoin({
      partite: this.api.partite(),
      aggregati: this.api.aggregati(),
      recenti: this.api.importRecenti(this.filtroImport()),
    })
      .subscribe({
        next: r => {
          this.partite.set(r.partite);
          this.aggregati.set(r.aggregati);
          this.importRecenti.set(r.recenti);
          this.storicoCaricato.set(true);
          this.errore.set(null);
          this.caricamento.set(false);
        },
        error: () => {
          this.errore.set('Non riesco a leggere i dati di tracking dal server.');
          this.caricamento.set(false);
        },
      });
  }

  private ricaricaStorico(query: string): void {
    this.api.importRecenti(query).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: imports => {
        this.importRecenti.set(imports);
        this.storicoCaricato.set(true);
        this.erroreStorico.set(null);
      },
      error: () => this.erroreStorico.set('Non riesco a leggere la cronologia degli import.'),
    });
  }
}