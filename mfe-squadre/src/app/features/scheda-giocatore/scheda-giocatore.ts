import { Component, computed, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, EMPTY, forkJoin, of, switchMap } from 'rxjs';
import {
  Giocatore,
  RUOLO_CATEGORIA,
  RUOLO_LABEL,
  RuoloGiocatore,
  StatoGiocatore,
} from '../../core/models/giocatore.model';
import { giorniContratto, ruoliSecondari } from '../../core/models/rosa-insights';
import { GiocatoreService, StatisticaOsservata } from '../../core/services/giocatore.service';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { FormGiocatore } from '../form-giocatore/form-giocatore';
import { ProfiloTattico } from './profilo-tattico/profilo-tattico';

type Tab = 'rendimento' | 'tattica' | 'anagrafica' | 'contratto' | 'medico' | 'qualita';
const METRICHE: Record<string, string> = {
  VALUTAZIONE_MEDIA: 'Valutazione media',
  PRESENZE_PCT: 'Presenze (%)',
  VELOCITA: 'Velocità',
  RESISTENZA: 'Resistenza',
  FORZA: 'Forza',
  MINUTI_GIOCATI: 'Minuti giocati',
  GOL: 'Gol',
  ASSIST: 'Assist',
  AMMONIZIONI: 'Ammonizioni',
};

@Component({
  selector: 'app-scheda-giocatore',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    DecimalPipe,
    ChartModule,
    TableModule,
    DynamicDialogModule,
    ProfiloTattico,
  ],
  templateUrl: './scheda-giocatore.html',
  providers: [DialogService],
  styleUrl: './scheda-giocatore.scss',
})
export class SchedaGiocatore implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(GiocatoreService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  private reload = new BehaviorSubject<void>(undefined);

  giocatore = signal<Giocatore | null>(null);
  loading = signal(true);
  errore = signal<string | null>(null);
  erroreStatistiche = signal<string | null>(null);
  statistiche = signal<StatisticaOsservata[]>([]);
  aggiornato = signal<Date | null>(null);
  tabAttivo = signal<Tab>('rendimento');
  categoria = signal('VALUTAZIONE_MEDIA');
  dal = signal('');
  al = signal('');
  readonly ruoloLabel = RUOLO_LABEL;
  readonly secondari = computed(() => (this.giocatore() ? ruoliSecondari(this.giocatore()!) : []));
  readonly intervalloInvalido = computed(
    () => !!this.dal() && !!this.al() && this.dal() > this.al(),
  );
  readonly datiValidi = computed(() =>
    this.statistiche().filter(
      (dato) =>
        Object.hasOwn(METRICHE, dato.categoria) &&
        /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(dato.periodo) &&
        dato.valore !== null &&
        Number.isFinite(dato.valore),
    ),
  );
  readonly categorieDisponibili = computed(() =>
    Object.entries(METRICHE)
      .filter(([codice]) => this.datiValidi().some((dato) => dato.categoria === codice))
      .map(([value, label]) => ({ value, label })),
  );
  readonly serie = computed(() =>
    this.intervalloInvalido()
      ? []
      : this.datiValidi()
          .filter(
            (dato) =>
              dato.categoria === this.categoria() &&
              (!this.dal() || dato.periodo >= this.dal()) &&
              (!this.al() || dato.periodo <= this.al()),
          )
          .sort((primo, secondo) => primo.periodo.localeCompare(secondo.periodo)),
  );
  readonly ultimoDato = computed(() => this.serie().at(-1) ?? null);
  readonly variazione = computed(() =>
    this.serie().length > 1 ? this.serie().at(-1)!.valore! - this.serie()[0].valore! : null,
  );
  readonly titoloMetrica = computed(() => METRICHE[this.categoria()] ?? this.categoria());
  readonly grafico = computed(() => ({
    labels: this.serie().map((dato) => dato.periodo),
    datasets: [
      {
        label: this.titoloMetrica(),
        data: this.serie().map((dato) => dato.valore),
        backgroundColor: '#61efa4',
        maxBarThickness: 36,
        borderRadius: 3,
      },
    ],
  }));
  readonly opzioniGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#b2c2b9' }, grid: { display: false } },
      y: { ticks: { color: '#b2c2b9' }, grid: { color: '#29372f' } },
    },
  };
  readonly campiQualita = computed(() => {
    const giocatore = this.giocatore();
    if (!giocatore) return [];
    return [
      { label: 'Data di nascita', presente: !!giocatore.dataNascita },
      { label: 'Nazionalità', presente: !!giocatore.nazionalita?.trim() },
      { label: 'Piede preferito', presente: !!giocatore.piedePreferito },
      { label: 'Altezza', presente: giocatore.altezzaCm !== null },
      { label: 'Peso', presente: giocatore.pesoKg !== null },
      { label: 'Inizio contratto', presente: !!giocatore.contrattoInizio },
      { label: 'Fine contratto', presente: !!giocatore.contrattoFine },
      { label: 'Valore di mercato', presente: giocatore.valoreMercato !== null },
      { label: 'Agente', presente: !!giocatore.agente?.trim() },
    ];
  });
  readonly campiPresenti = computed(
    () => this.campiQualita().filter((campo) => campo.presente).length,
  );

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.reload])
      .pipe(
        switchMap(([params]) => {
          const id = Number(params.get('id'));
          this.loading.set(true);
          this.errore.set(null);
          this.erroreStatistiche.set(null);
          this.giocatore.set(null);
          this.statistiche.set([]);
          if (!Number.isSafeInteger(id) || id <= 0) {
            this.errore.set('Identificativo giocatore non valido.');
            this.loading.set(false);
            return EMPTY;
          }
          return forkJoin({
            giocatore: this.service.getById(id),
            statistiche: this.service.getStorico(id).pipe(
              catchError(() => {
                this.erroreStatistiche.set(
                  'Storico non disponibile. Il profilo rimane consultabile.',
                );
                return of([]);
              }),
            ),
          }).pipe(
            catchError((errore) => {
              this.errore.set(
                errore.status === 404
                  ? 'Giocatore non trovato.'
                  : 'Impossibile caricare il dossier. Verifica la connessione o la sessione.',
              );
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ giocatore, statistiche }) => {
        this.giocatore.set(giocatore);
        this.statistiche.set(statistiche);
        if (!this.categorieDisponibili().some((metrica) => metrica.value === this.categoria())) {
          this.categoria.set(this.categorieDisponibili()[0]?.value ?? 'VALUTAZIONE_MEDIA');
        }
        this.aggiornato.set(new Date());
        this.loading.set(false);
      });
  }

  ricarica(): void {
    this.reload.next();
  }
  azzeraPeriodo(): void {
    this.dal.set('');
    this.al.set('');
  }

  getSeverityClass(stato: StatoGiocatore): string {
    if (stato === 'ATTIVO') return 'attivo';
    if (stato === 'INFORTUNATO') return 'infortunato';
    return 'squalificato';
  }

  getRuoloColore(ruolo: string): string {
    const map: Record<string, string> = {
      PORTIERE: '#f59e0b',
      DIFENSORE: '#3b82f6',
      CENTROCAMPISTA: '#00ff87',
      ATTACCANTE: '#ef4444',
    };
    return map[RUOLO_CATEGORIA[ruolo as RuoloGiocatore]] ?? '#888';
  }

  getIniziali(g: Giocatore): string {
    return `${g.nome[0] ?? ''}${g.cognome[0] ?? ''}`.toUpperCase();
  }

  formatValuta(v: number | null): string {
    if (v === null) return 'N/D';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(v);
  }

  giorniAllaScadenza(data: string | null): number | null {
    return giorniContratto(data, this.aggiornato() ?? new Date());
  }

  getScadenzaClass(giorni: number | null): string {
    if (giorni === null) return '';
    if (giorni <= 90) return 'scadenza-critica';
    if (giorni <= 180) return 'scadenza-warning';
    return 'scadenza-ok';
  }

  calcolaLarghezzaScadenza(giorni: number): number {
    const giocatore = this.giocatore();
    if (!giocatore?.contrattoInizio || !giocatore.contrattoFine) return 0;
    const durata = giorniContratto(
      giocatore.contrattoFine,
      new Date(`${giocatore.contrattoInizio}T12:00:00`),
    );
    return durata && durata > 0 ? Math.min(100, Math.max(0, (giorni / durata) * 100)) : 0;
  }

  contenutoDossier() {
    const giocatore = this.giocatore();
    if (!giocatore) return null;
    return {
      fonte: 'Anagrafica e statistiche periodiche PitchIQ',
      estrattoIl: this.aggiornato()?.toISOString(),
      profilo: {
        id: giocatore.id,
        nome: giocatore.nome,
        cognome: giocatore.cognome,
        ruolo: giocatore.ruolo,
        ruoliSecondari: this.secondari(),
        numeroMaglia: giocatore.numeroMaglia,
        dataNascita: giocatore.dataNascita,
        nazionalita: giocatore.nazionalita,
        piedePreferito: giocatore.piedePreferito,
        altezzaCm: giocatore.altezzaCm,
        pesoKg: giocatore.pesoKg,
        movimentiConsentiti: giocatore.movimentiConsentiti ?? null,
      },
      filtro: { categoria: this.categoria(), dal: this.dal() || null, al: this.al() || null },
      statoStorico: this.erroreStatistiche() ? 'NON_DISPONIBILE' : 'DISPONIBILE',
      osservazioni: this.serie(),
    };
  }

  esportaDossier(): void {
    const contenuto = this.contenutoDossier();
    if (!contenuto || this.loading() || this.intervalloInvalido()) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(contenuto, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `pitchiq-dossier-${contenuto.profilo.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  apriModifica(): void {
    const g = this.giocatore();
    if (!g) return;

    const ref = this.dialogService.open(FormGiocatore, {
      header: 'Modifica giocatore',
      width: '720px',
      breakpoints: { '800px': '95vw' },
      modal: true,
      closable: true,
      data: { giocatore: g },
    });

    ref?.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((salvato: boolean) => {
      if (salvato) this.ricarica();
    });
  }
}
