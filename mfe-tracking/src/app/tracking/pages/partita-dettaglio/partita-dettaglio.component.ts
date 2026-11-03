import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, filter, map, of, switchMap, tap } from 'rxjs';
import { EsitoBarsComponent } from '../../components/esito-bars/esito-bars.component';
import { SequencePlayerComponent } from '../../components/sequence-player/sequence-player.component';
import { TrackingApi } from '../../data/tracking.api';
import {
  AnimazioneDto, ESITI, ESITO_LABEL, EsitoPressione, FINE_POSSESSO_LABEL, PartitaDettaglioDto,
  SequenzaDto, TERZO_LABEL, pct,
} from '../../data/tracking.models';

interface StatisticaSequenze {
  chiave: string;
  etichetta: string;
  dettaglio: string | null;
  possessi: number;
  superate: number;
  tiri: number;
  tassoSuperate: number;
  tassoTiri: number;
}

function aggregaSequenze(
  sequenze: SequenzaDto[],
  selettore: (sequenza: SequenzaDto) => { chiave: string; etichetta: string; dettaglio?: string },
): StatisticaSequenze[] {
  const gruppi = new Map<string, StatisticaSequenze>();
  for (const sequenza of sequenze) {
    const selezione = selettore(sequenza);
    const gruppo = gruppi.get(selezione.chiave) ?? {
      chiave: selezione.chiave,
      etichetta: selezione.etichetta,
      dettaglio: selezione.dettaglio ?? null,
      possessi: 0,
      superate: 0,
      tiri: 0,
      tassoSuperate: 0,
      tassoTiri: 0,
    };
    gruppo.possessi++;
    if (sequenza.esito === 'SUPERATA') gruppo.superate++;
    if (sequenza.portaAlTiro) gruppo.tiri++;
    gruppi.set(selezione.chiave, gruppo);
  }
  return [...gruppi.values()].map(gruppo => ({
    ...gruppo,
    tassoSuperate: gruppo.superate / gruppo.possessi,
    tassoTiri: gruppo.tiri / gruppo.possessi,
  }));
}

@Component({
  selector: 'tk-partita-dettaglio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EsitoBarsComponent, SequencePlayerComponent],
  templateUrl: './partita-dettaglio.component.html',
  styleUrl: './partita-dettaglio.component.scss',
})
export class PartitaDettaglioComponent {
  private readonly api = inject(TrackingApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly esiti = ESITI;
  protected readonly esitoLabel = ESITO_LABEL;
  protected readonly pct = pct;

  protected readonly statistichePortatori = computed(() => aggregaSequenze(this.sequenze(), s => ({
    chiave: `${s.teamId}:${s.portatoreId}`,
    etichetta: s.portatore,
    dettaglio: s.squadra,
  })).sort((a, b) => b.possessi - a.possessi || a.etichetta.localeCompare(b.etichetta)));

  protected readonly statisticheTerzi = computed(() => aggregaSequenze(this.sequenze(), s => ({
    chiave: s.terzo ?? 'non_disponibile',
    etichetta: s.terzo ? (TERZO_LABEL[s.terzo] ?? s.terzo) : 'Dato non disponibile',
  })).sort((a, b) => a.etichetta.localeCompare(b.etichetta)));

  protected readonly statistichePeriodi = computed(() => aggregaSequenze(this.sequenze(), s => ({
    chiave: String(s.periodo),
    etichetta: s.periodo === 1 ? '1° tempo' : s.periodo === 2 ? '2° tempo' : `Periodo ${s.periodo}`,
  })).sort((a, b) => a.chiave.localeCompare(b.chiave, undefined, { numeric: true })));

  protected readonly conclusioniPossesso = computed(() => aggregaSequenze(this.sequenze(), s => ({
    chiave: `${s.esito}:${s.esitoPossesso ?? ''}`,
    etichetta: s.esitoPossesso
      ? (FINE_POSSESSO_LABEL[s.esitoPossesso] ?? s.esitoPossesso)
      : 'Dato non disponibile',
    dettaglio: ESITO_LABEL[s.esito],
  })).sort((a, b) => (a.dettaglio ?? '').localeCompare(b.dettaglio ?? '')
    || a.etichetta.localeCompare(b.etichetta)));

  protected readonly esito = signal<EsitoPressione | null>(null);
  protected readonly teamId = signal<number | null>(null);
  protected readonly soloAnimate = signal(false);
  protected readonly selezionata = signal<number | null>(null);
  protected readonly confermaElimina = signal(false);
  protected readonly erroreDettaglio = signal<string | null>(null);
  protected readonly erroreAnimazione = signal<string | null>(null);
  protected readonly statoCondivisione = signal<string | null>(null);

  constructor() {
    const query = this.route.snapshot.queryParamMap;
    const esitoIniziale = query.get('esito') as EsitoPressione | null;
    if (esitoIniziale && ESITI.includes(esitoIniziale)) this.esito.set(esitoIniziale);

    const teamIdIniziale = Number(query.get('teamId'));
    if (Number.isSafeInteger(teamIdIniziale) && teamIdIniziale > 0) this.teamId.set(teamIdIniziale);
    this.soloAnimate.set(query.get('soloAnimate') === 'true');

    const sequenzaIniziale = Number(query.get('seq'));
    if (Number.isSafeInteger(sequenzaIniziale) && sequenzaIniziale > 0) {
      this.selezionata.set(sequenzaIniziale);
    }
  }

  private readonly matchId = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('matchId')))), { initialValue: NaN });

  protected readonly dettaglio = toSignal(
    toObservable(this.matchId).pipe(
      filter(id => !Number.isNaN(id)),
      switchMap(id => this.api.dettaglio(id).pipe(catchError(() => {
        this.erroreDettaglio.set('Partita non trovata o server non raggiungibile.');
        return of(null);
      }))),
    ), { initialValue: null as PartitaDettaglioDto | null });

  private readonly filtri = computed(() => ({
    matchId: this.matchId(), esito: this.esito(), teamId: this.teamId(), soloAnimate: this.soloAnimate(),
  }));

  protected readonly sequenze = toSignal(
    toObservable(this.filtri).pipe(
      filter(f => !Number.isNaN(f.matchId)),
      switchMap(f => this.api.sequenze(f.matchId, f).pipe(catchError(() => of([] as SequenzaDto[])))),
      tap(list => {
        if (this.selezionata() !== null && list.some(s => s.id === this.selezionata())) return;

        // Seleziona un highlight visibile quando cambia il filtro o si apre un deep link non valido.
        this.selezionata.set(null);
        if (list.length) {
          const animate = list.filter(s => s.haFrame);
          const sup = animate.filter(s => s.esito === 'SUPERATA');
          const supTiro = sup.filter(s => s.portaAlTiro);
          const pool = supTiro.length ? supTiro : sup.length ? sup : animate;
          const migliore = pool.reduce<SequenzaDto | null>((m, s) => (!m || s.valoreMigliore > m.valoreMigliore ? s : m), null);
          if (migliore) this.selezionata.set(migliore.id);
        }
      }),
    ), { initialValue: [] as SequenzaDto[] });

  protected readonly animazione = toSignal(
    toObservable(this.selezionata).pipe(
      switchMap(id => {
        this.erroreAnimazione.set(null);
        if (id == null) return of(null);
        return this.api.animazione(id).pipe(catchError(() => {
          this.erroreAnimazione.set('Animazione non disponibile per questa sequenza.');
          return of(null);
        }));
      }),
    ), { initialValue: null as AnimazioneDto | null });

  protected onSquadra(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.teamId.set(v ? Number(v) : null);
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected esportaCsv(): void {
    const partita = this.dettaglio()?.partita;
    if (!partita || !this.sequenze().length) return;

    const intestazioni = [
      'match_id', 'data', 'competizione', 'squadra_casa', 'gol_casa', 'squadra_trasferta',
      'gol_trasferta', 'periodo', 'minuto', 'secondo', 'esito_pressione', 'squadra_possesso',
      'portatore', 'terzo', 'numero_pressori', 'numero_opzioni', 'valore_portatore',
      'valore_medio_opzioni', 'valore_migliore_opzione', 'esito_possesso', 'porta_al_tiro', 'animazione_disponibile',
    ];
    const righe = this.sequenze().map(s => [
      partita.matchId,
      partita.dataPartita,
      partita.competizione ?? '',
      partita.squadraCasa,
      partita.golCasa,
      partita.squadraTrasferta,
      partita.golTrasferta,
      s.periodo,
      s.minuto,
      s.secondo,
      this.esitoLabel[s.esito],
      s.squadra,
      s.portatore,
      s.terzo ?? '',
      s.nPressori,
      s.nOpzioni,
      s.valorePortatore ?? '',
      s.valoreMedio,
      s.valoreMigliore,
      s.esitoPossesso ?? '',
      s.portaAlTiro ? 'Sì' : 'No',
      s.haFrame ? 'Sì' : 'No',
    ]);
    const csv = [intestazioni, ...righe]
      .map(riga => riga.map(valore => this.cellaCsv(valore)).join(';'))
      .join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pitchiq-${partita.matchId}-sequenze.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async condividiAnalisi(): Promise<void> {
    const url = new URL(this.router.url, window.location.origin);
    url.search = '';
    if (this.esito()) url.searchParams.set('esito', this.esito()!);
    if (this.teamId() !== null) url.searchParams.set('teamId', String(this.teamId()));
    if (this.soloAnimate()) url.searchParams.set('soloAnimate', 'true');
    const selezionataVisibile = this.sequenze().some(s => s.id === this.selezionata());
    if (selezionataVisibile && this.selezionata() !== null) {
      url.searchParams.set('seq', String(this.selezionata()));
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      this.statoCondivisione.set('Link copiato');
    } catch {
      this.statoCondivisione.set('Impossibile copiare il link. Copialo dalla barra del browser.');
    }
  }

  private cellaCsv(valore: string | number): string {
    let testo = String(valore).replace(/[\r\n]+/g, ' ');
    if (/^[=+\-@]/.test(testo)) testo = `'${testo}`;
    return `"${testo.replaceAll('"', '""')}"`;
  }

  protected elimina(matchId: number): void {
    this.api.eliminaPartita(matchId).subscribe({
      next: () => this.router.navigate(['../..'], { relativeTo: this.route }),
      error: () => this.erroreDettaglio.set('Eliminazione non riuscita.'),
    });
  }
}
