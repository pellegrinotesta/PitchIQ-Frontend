import { Component, HostListener, computed, inject, OnInit, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { CampoDiCalcio } from '../campo-di-calcio/campo-di-calcio';
import { CaricoGiocatore, Formazione, GiocatoreDisponibile, PosizioneCampo } from '../../core/model/formazione.model';
import { indisponibile, segnali, verificaFormazione } from '../../core/disponibilita';
import { Panchina } from '../panchina/panchina';
import { PreparazionePartita } from '../preparazione-partita/preparazione-partita';
import { CampoFase } from '../campo-fase/campo-fase';
import { ElementoTrascinato, Trascina, TrascinamentoService } from '../../core/trascinamento';
import { FASI, copiaDa, haContenuto, ripristina } from '../../core/fasi';
import { Fase, FasiFormazione } from '../../core/model/formazione.model';
import { Partita } from '../../core/model/partita.model';
import { posizioniDaPartita } from '../../core/posizioni-fonte';
import { FormazioneService } from '../../core/services/formazione.service';
import { SchemaFormazione, SlotSchema, FrecciaSchema } from '../../core/model/schema.model';
import { CampoSchema } from '../campo-schema/campo-schema';
import { ConfirmService } from '../confirm-dialog/confirm.service';
import { assegnaASlot, repartoSlot } from '../../core/ruoli';

@Component({
  selector: 'app-editor-tattiche',
  imports: [
    FormsModule,
    NgTemplateOutlet,
    ButtonModule,
    SelectModule,
    InputTextModule,
    DynamicDialogModule,
    ToastModule,
    CampoDiCalcio,
    CampoSchema,
    Panchina,
    PreparazionePartita,
    CampoFase,
    Trascina],
  providers: [MessageService, DialogService, ConfirmService, TrascinamentoService],
  templateUrl: './editor-tattiche.html',
  styleUrl: './editor-tattiche.scss',
})
export class EditorTattiche implements OnInit {
  private service = inject(FormazioneService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmService);

  // Tab attivo
  tabAttivo: 'formazioni' | 'schemi' = 'formazioni';
  readonly history = history;

  // Formazioni
  formazioni = signal<Formazione[]>([]);
  formazioneAttiva = signal<Formazione | null>(null);
  rosa = signal<GiocatoreDisponibile[]>([]);
  carichi = signal(new Map<number, CaricoGiocatore>());

  /** Trascinamento condiviso da rosa, panchina e campo; la sagoma segue il puntatore. */
  readonly trascinamento = inject(TrascinamentoService);

  elementoRosa(g: GiocatoreDisponibile): ElementoTrascinato {
    return { giocatoreId: g.id, origine: 'rosa', etichetta: g.cognome, numero: g.numeroMaglia };
  }

  // Fasi di gioco: "SCHIERAMENTO" è la disposizione di base, le altre la modificano
  readonly fasiDisponibili = FASI;
  faseAttiva = signal<'SCHIERAMENTO' | Fase>('SCHIERAMENTO');

  readonly fasiConContenuto = computed(() => {
    const fasi = this.formazioneAttiva()?.fasi;
    return new Set(FASI.filter(f => haContenuto(fasi, f.valore)).map(f => f.valore));
  });

  readonly faseCorrente = computed(() => {
    const f = this.faseAttiva();
    return f === 'SCHIERAMENTO' ? null : f;
  });

  onFasiChange(fasi: FasiFormazione): void {
    const f = this.formazioneAttiva();
    if (f) { this.formazioneAttiva.set({ ...f, fasi }); this.modificata.set(true); }
  }

  ripristinaFase(): void {
    const fase = this.faseCorrente();
    const f = this.formazioneAttiva();
    if (!fase || !f) return;
    this.onFasiChange(ripristina(f.fasi, fase));
  }

  copiaFaseDa(da: string): void {
    const fase = this.faseCorrente();
    const f = this.formazioneAttiva();
    if (!fase || !f || !da) return;
    this.onFasiChange(copiaDa(f.fasi, da as Fase, fase, f.posizioni));
  }

  nomeFase(fase: Fase): string {
    return FASI.find(f => f.valore === fase)?.nome ?? fase;
  }

  // Partite: collegamento della formazione al calendario
  partite = signal<Partita[]>([]);
  caricandoBase = signal<number | null>(null);

  readonly partitaAttiva = computed(() => {
    const id = this.formazioneAttiva()?.partitaId;
    return id ? this.partite().find(p => p.id === id) ?? null : null;
  });

  /** Scouting dell'avversario della partita collegata (ricaricato quando cambia la partita). */
  readonly scouting = toSignal(
    toObservable(computed(() => this.partitaAttiva()?.scoutingId ?? null)).pipe(
      switchMap(id => id ? this.service.getScouting(id).pipe(catchError(() => of(null))) : of(null)),
    ),
    { initialValue: null },
  );

  /** Opzioni della scelta partita: prima quelle da giocare (dalla più vicina), poi le giocate (dalla più recente). */
  readonly partiteDaGiocare = computed(() =>
    this.partite().filter(p => !p.giocata).sort((a, b) => a.data.localeCompare(b.data)));
  readonly partiteGiocate = computed(() =>
    this.partite().filter(p => p.giocata).sort((a, b) => b.data.localeCompare(a.data)));

  /** Ultime 5 partite giocate, esclusa quella collegata, da usare come base. */
  readonly recenti = computed(() =>
    this.partiteGiocate().filter(p => p.id !== this.partitaAttiva()?.id).slice(0, 5));

  etichettaPartita(p: Partita): string {
    const [anno, mese, giorno] = p.data.split('-');
    return `${giorno}/${mese}/${anno.slice(2)} · ${p.casaTrasferta === 'CASA' ? 'vs' : '@'} ${p.avversario}`;
  }

  sottotitoloFormazione(f: Formazione): string {
    const p = f.partitaId ? this.partite().find(x => x.id === f.partitaId) : null;
    return p ? `${f.modulo} · ${p.casaTrasferta === 'CASA' ? 'vs' : '@'} ${p.avversario}` : f.modulo;
  }

  onPartitaChange(valore: string): void {
    const f = this.formazioneAttiva();
    if (!f) return;
    const partitaId = valore ? Number(valore) : null;
    const partita = this.partite().find(p => p.id === partitaId);
    // un nome mai toccato diventa quello della partita
    const nome = partita && (f.nome === 'Nuova formazione' || /^(vs|@) /.test(f.nome))
      ? `${partita.casaTrasferta === 'CASA' ? 'vs' : '@'} ${partita.avversario}` : f.nome;
    this.formazioneAttiva.set({ ...f, partitaId, nome });
    this.modificata.set(true);
  }

  /** Porta in campo i titolari di una partita giocata; la panchina attuale resta (tranne chi diventa titolare). */
  usaComeBase(partita: Partita): void {
    const f = this.formazioneAttiva();
    if (!f) return;
    const procedi = f.posizioni.some(p => p.titolare)
      ? this.confirmService.conferma({
          header: 'Usa come base',
          messaggio: `Sostituire i titolari con quelli schierati contro ${partita.avversario}? La panchina resta.`,
          labelConferma: 'Sostituisci',
          labelAnnulla: 'Annulla',
          pericoloso: false,
        })
      : of(true);
    procedi.subscribe(ok => {
      if (!ok) return;
      this.caricandoBase.set(partita.id);
      this.service.getTitolariPartita(partita.id).subscribe({
        next: titolari => {
          this.caricandoBase.set(null);
          if (!titolari.length) {
            this.toast('error', `Formazione non registrata per la partita contro ${partita.avversario}`);
            return;
          }
          const corrente = this.formazioneAttiva();
          if (!corrente) return;
          const nuovi = posizioniDaPartita(titolari);
          const titolariIds = new Set(nuovi.map(p => p.giocatoreId));
          const panchina = corrente.posizioni.filter(p => !p.titolare && !titolariIds.has(p.giocatoreId));
          const modulo = partita.modulo ?? titolari.find(t => t.moduloFonte)?.moduloFonte ?? corrente.modulo;
          this.formazioneAttiva.set({ ...corrente, modulo, posizioni: [...nuovi, ...panchina] });
          this.modificata.set(true);
          this.toast('success', `Titolari contro ${partita.avversario} caricati: ora adattali`);
        },
        error: () => {
          this.caricandoBase.set(null);
          this.toast('error', 'Formazione della partita non disponibile');
        },
      });
    });
  }

  /** Controlli sulla formazione aperta: titolari, portieri, indisponibili, lista, carico. */
  readonly controlli = computed(() => {
    const f = this.formazioneAttiva();
    return f ? verificaFormazione(f.posizioni, this.rosa(), this.carichi()) : [];
  });

  /** Rosa per la barra laterale: disponibili e non disponibili, con dove si trova già il giocatore. */
  readonly rosaVista = computed(() => {
    const dove = new Map((this.formazioneAttiva()?.posizioni ?? []).map(p => [p.giocatoreId, p.titolare ? 'campo' : 'panchina'] as const));
    const voci = [...this.rosa()]
      .sort((a, b) => (a.numeroMaglia ?? 999) - (b.numeroMaglia ?? 999))
      .map(g => ({ g, dove: dove.get(g.id) ?? null, segnali: segnali(g, this.carichi().get(g.id)) }));
    return {
      disponibili: voci.filter(v => !indisponibile(v.g)),
      nonDisponibili: voci.filter(v => indisponibile(v.g)),
    };
  });

  // Schemi
  schemi = signal<SchemaFormazione[]>([]);
  schemaAttivo = signal<SchemaFormazione | null>(null);

  loading = signal(false);
  salvando = signal(false);
  /** Modifiche non ancora salvate della formazione o dello schema aperti. */
  modificata = signal(false);

  @HostListener('window:beforeunload', ['$event'])
  avvisaPrimaDiUscire(event: BeforeUnloadEvent): void {
    if (this.modificata()) event.preventDefault();
  }

  /** Chiede conferma prima di abbandonare modifiche non salvate. */
  private puoiAbbandonare(): Observable<boolean> {
    if (!this.modificata()) return of(true);
    return this.confirmService.conferma({
      header: 'Modifiche non salvate',
      messaggio: 'Hai modifiche non salvate: se continui andranno perse.',
      labelConferma: 'Continua senza salvare',
      labelAnnulla: 'Resta qui',
      pericoloso: true,
    });
  }

  readonly moduliOptions = [
    '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3'
  ];

  // Coordinate standard per modulo (coordX, coordY, slotRuolo)
  private readonly POSIZIONI_MODULO: Record<string, { coordX: number; coordY: number; slotRuolo: string; categoria: string }[]> = {
    '4-3-3': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 20, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 80, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 25, coordY: 50, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 75, coordY: 50, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 20, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
      { coordX: 82, coordY: 20, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
    ],
    '4-4-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 15, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 85, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 15, coordY: 50, slotRuolo: 'LM', categoria: 'CENTROCAMPISTA' },
      { coordX: 38, coordY: 52, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 62, coordY: 52, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 85, coordY: 50, slotRuolo: 'RM', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '4-2-3-1': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 15, coordY: 72, slotRuolo: 'LB', categoria: 'DIFENSORE' },
      { coordX: 38, coordY: 75, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 62, coordY: 75, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 85, coordY: 72, slotRuolo: 'RB', categoria: 'DIFENSORE' },
      { coordX: 35, coordY: 57, slotRuolo: 'DM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 65, coordY: 57, slotRuolo: 'DM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 35, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 32, slotRuolo: 'AM', categoria: 'CENTROCAMPISTA' },
      { coordX: 82, coordY: 35, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
    ],
    '3-5-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 25, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 75, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 10, coordY: 52, slotRuolo: 'LWB', categoria: 'CENTROCAMPISTA' },
      { coordX: 30, coordY: 48, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 70, coordY: 48, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 90, coordY: 52, slotRuolo: 'RWB', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '5-3-2': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 10, coordY: 68, slotRuolo: 'LWB', categoria: 'DIFENSORE' },
      { coordX: 28, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 72, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 90, coordY: 68, slotRuolo: 'RWB', categoria: 'DIFENSORE' },
      { coordX: 25, coordY: 48, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 44, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 75, coordY: 48, slotRuolo: 'CM3', categoria: 'CENTROCAMPISTA' },
      { coordX: 35, coordY: 18, slotRuolo: 'ST1', categoria: 'ATTACCANTE' },
      { coordX: 65, coordY: 18, slotRuolo: 'ST2', categoria: 'ATTACCANTE' },
    ],
    '3-4-3': [
      { coordX: 50, coordY: 88, slotRuolo: 'GK', categoria: 'PORTIERE' },
      { coordX: 25, coordY: 74, slotRuolo: 'CB1', categoria: 'DIFENSORE' },
      { coordX: 50, coordY: 76, slotRuolo: 'CB2', categoria: 'DIFENSORE' },
      { coordX: 75, coordY: 74, slotRuolo: 'CB3', categoria: 'DIFENSORE' },
      { coordX: 15, coordY: 52, slotRuolo: 'LM', categoria: 'CENTROCAMPISTA' },
      { coordX: 38, coordY: 50, slotRuolo: 'CM1', categoria: 'CENTROCAMPISTA' },
      { coordX: 62, coordY: 50, slotRuolo: 'CM2', categoria: 'CENTROCAMPISTA' },
      { coordX: 85, coordY: 52, slotRuolo: 'RM', categoria: 'CENTROCAMPISTA' },
      { coordX: 18, coordY: 20, slotRuolo: 'LW', categoria: 'CENTROCAMPISTA' },
      { coordX: 50, coordY: 14, slotRuolo: 'ST', categoria: 'ATTACCANTE' },
      { coordX: 82, coordY: 20, slotRuolo: 'RW', categoria: 'CENTROCAMPISTA' },
    ],
  };

  readonly ruoliSlot = [
    { label: 'Portiere', value: 'PORTIERE' },
    { label: 'Difensore', value: 'DIFENSORE' },
    { label: 'Centrocampista', value: 'CENTROCAMPISTA' },
    { label: 'Attaccante', value: 'ATTACCANTE' },
  ];

  /**
   * Opzioni della select: i moduli standard più, se serve, il modulo corrente
   * della formazione (es. un 4-5-1 o 4-3-1-2 riconosciuto dai pin).
   */
  get moduliDisponibili(): string[] {
    const corrente = this.formazioneAttiva()?.modulo;
    return corrente && !this.moduliOptions.includes(corrente)
      ? [...this.moduliOptions, corrente]
      : this.moduliOptions;
  }

  ngOnInit(): void {
    this.service.getPartite().subscribe({ next: partite => this.partite.set(partite) });
    this.caricaFormazioni();
    this.caricaRosa();
    this.caricaSchemi();
  }

  // ===== TAB =====
  cambiaTab(tab: 'formazioni' | 'schemi'): void {
    this.tabAttivo = tab;
  }

  // ===== FORMAZIONI =====
  caricaFormazioni(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (list) => { this.formazioni.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  caricaRosa(): void {
    this.service.getRosaDisponibile().subscribe({
      next: (rosa) => this.rosa.set(rosa),
    });
    // il carico è un'informazione in più: se non è disponibile (es. nessuna seduta registrata) si va avanti senza
    this.service.getCarichi().subscribe({
      next: (carichi) => this.carichi.set(new Map(carichi.map(c => [c.giocatoreId, c]))),
      error: () => this.carichi.set(new Map()),
    });
  }

  selezionaFormazione(f: Formazione): void {
    if (f.id === this.formazioneAttiva()?.id) return;
    this.puoiAbbandonare().subscribe(ok => {
      if (!ok) return;
      this.service.getById(f.id).subscribe({
        next: (full) => { this.formazioneAttiva.set(full); this.modificata.set(false); this.faseAttiva.set('SCHIERAMENTO'); },
      });
    });
  }

  nuovaFormazione(): void {
    this.puoiAbbandonare().subscribe(ok => {
      if (!ok) return;
      // proposta: la prossima partita da giocare, se c'è
      const prossima = this.partiteDaGiocare()[0] ?? null;
      this.formazioneAttiva.set({
        id: 0,
        nome: prossima ? `${prossima.casaTrasferta === 'CASA' ? 'vs' : '@'} ${prossima.avversario}` : 'Nuova formazione',
        modulo: '4-3-3', data: null, note: null, partitaId: prossima?.id ?? null, posizioni: [], fasi: null,
      });
      this.faseAttiva.set('SCHIERAMENTO');
      this.modificata.set(true);
    });
  }

  onPosizioniChange(posizioni: PosizioneCampo[]): void {
    const f = this.formazioneAttiva();
    if (f) { this.formazioneAttiva.set({ ...f, posizioni }); this.modificata.set(true); }
  }

  onNomeChange(nome: string): void {
    const f = this.formazioneAttiva();
    if (f) { this.formazioneAttiva.set({ ...f, nome }); this.modificata.set(true); }
  }

  /**
   * Modulo scelto dalla select: riposiziona i titolari sulle coordinate standard.
   * Ogni giocatore va sullo slot più adatto al suo ruolo mantenendo il lato del campo;
   * nessuno viene tolto dal campo, al massimo finisce fuori reparto.
   */
  onModuloChange(modulo: string): void {
    const f = this.formazioneAttiva();
    if (!f) return;
    this.modificata.set(true);

    const coordinate = this.POSIZIONI_MODULO[modulo];
    const titolari = f.posizioni.filter(p => p.titolare);
    if (!coordinate || titolari.length === 0) {
      this.formazioneAttiva.set({ ...f, modulo });
      return;
    }

    const giocatori = titolari.map(p => ({
      p, x: p.coordX, ruolo: this.rosa().find(r => r.id === p.giocatoreId)?.ruolo ?? null,
    }));
    const slot = coordinate.map(c => ({ ...c, x: c.coordX, reparto: repartoSlot(c.slotRuolo) ?? 'CENTROCAMPISTA' as const }));
    const assegnati = assegnaASlot(giocatori, slot);

    const riposizionati: PosizioneCampo[] = [];
    assegnati.forEach((g, s) => riposizionati.push({
      ...g.p, coordX: s.coordX, coordY: s.coordY, slotRuolo: s.slotRuolo,
    }));
    const panchina = f.posizioni.filter(p => !p.titolare);
    this.formazioneAttiva.set({ ...f, modulo, posizioni: [...riposizionati, ...panchina] });
  }

  /**
   * Modulo riconosciuto dalla disposizione dei pin: aggiorna solo il campo
   * modulo (finisce nel DB con Salva) senza spostare i giocatori.
   */
  onModuloRiconosciuto(modulo: string): void {
    const f = this.formazioneAttiva();
    if (f && f.modulo !== modulo) {
      this.formazioneAttiva.set({ ...f, modulo });
    }
  }


  salvaFormazione(): void {
    const f = this.formazioneAttiva();
    if (!f) return;
    this.salvando.set(true);

    const req = {
      nome: f.nome, modulo: f.modulo, data: f.data, note: f.note, partitaId: f.partitaId ?? null,
      fasi: f.fasi ?? null,
      posizioni: f.posizioni.map(p => ({
        giocatoreId: p.giocatoreId, coordX: p.coordX, coordY: p.coordY,
        slotRuolo: p.slotRuolo, titolare: p.titolare,
      })),
    };

    const op$ = f.id
      ? this.service.update(f.id, req)
      : this.service.create(req);

    op$.subscribe({
      next: (saved) => {
        this.salvando.set(false);
        this.formazioneAttiva.set(saved);
        this.modificata.set(false);
        this.caricaFormazioni();
        this.toast('success', 'Formazione salvata');
      },
      error: () => { this.salvando.set(false); this.toast('error', 'Salvataggio fallito'); },
    });
  }

  eliminaFormazione(f: Formazione): void {
    this.confirmService.conferma({
      header: 'Elimina formazione',
      messaggio: `Eliminare "${f.nome}"? L'operazione non può essere annullata.`,
      labelConferma: 'Elimina',
      labelAnnulla: 'Annulla',
      pericoloso: true,
    }).subscribe(confermato => {
      if (!confermato) return;
      this.service.delete(f.id).subscribe({
        next: () => {
          if (this.formazioneAttiva()?.id === f.id) { this.formazioneAttiva.set(null); this.modificata.set(false); }
          this.caricaFormazioni();
        },
      });
    });
  }

  // ===== SCHEMI =====
  caricaSchemi(): void {
    this.service.getAllSchemi().subscribe({
      next: (list) => this.schemi.set(list),
    });
  }

  selezionaSchema(s: SchemaFormazione): void {
    if (s.id === this.schemaAttivo()?.id) return;
    this.puoiAbbandonare().subscribe(ok => {
      if (!ok) return;
      this.service.getSchemaById(s.id).subscribe({
        next: (full) => { this.schemaAttivo.set(full); this.modificata.set(false); },
      });
    });
  }

  nuovoSchema(): void {
    this.puoiAbbandonare().subscribe(ok => {
      if (!ok) return;
      this.schemaAttivo.set({
        id: 0, nome: 'Nuovo schema',
        modulo: '4-3-3', descrizione: null, slot: [], frecce: [],
      });
      this.modificata.set(true);
    });
  }

  private aggiornaSchema(modifica: Partial<SchemaFormazione>): void {
    const s = this.schemaAttivo();
    if (s) { this.schemaAttivo.set({ ...s, ...modifica }); this.modificata.set(true); }
  }

  onSlotChange(slot: SlotSchema[]): void { this.aggiornaSchema({ slot }); }

  onFrecceChange(frecce: FrecciaSchema[]): void { this.aggiornaSchema({ frecce }); }

  onNomeSchemaChange(nome: string): void { this.aggiornaSchema({ nome }); }

  onModuloSchemaChange(modulo: string): void { this.aggiornaSchema({ modulo }); }

  salvaSchema(): void {
    const s = this.schemaAttivo();
    if (!s) return;
    this.salvando.set(true);

    const req = {
      nome: s.nome, modulo: s.modulo, descrizione: s.descrizione,
      slot: s.slot.map(sl => ({
        slotRuolo: sl.slotRuolo, ruolo: sl.ruolo,
        coordX: sl.coordX, coordY: sl.coordY, note: sl.note,
      })),
      frecce: s.frecce.map(fr => ({
        startX: fr.startX, startY: fr.startY,
        endX: fr.endX, endY: fr.endY,
        colore: fr.colore, etichetta: fr.etichetta,
      })),
    };

    const op$ = s.id
      ? this.service.updateSchema(s.id, req)
      : this.service.createSchema(req);

    op$.subscribe({
      next: (saved) => {
        this.salvando.set(false);
        this.schemaAttivo.set(saved);
        this.modificata.set(false);
        this.caricaSchemi();
        this.toast('success', 'Schema salvato');
      },
      error: () => { this.salvando.set(false); this.toast('error', 'Salvataggio fallito'); },
    });
  }

  eliminaSchema(s: SchemaFormazione): void {
    this.confirmService.conferma({
      messaggio: `Eliminare "${s.nome}"? L'operazione non può essere annullata.`,
      header: 'Elimina schema',
      labelConferma: 'Elimina',
      labelAnnulla: 'Annulla',
      pericoloso: true,
    }).subscribe(confermato => {
      if (!confermato) return;
      this.service.deleteSchema(s.id).subscribe({
        next: () => {
          if (this.schemaAttivo()?.id === s.id) { this.schemaAttivo.set(null); this.modificata.set(false); }
          this.caricaSchemi();
        },
      });
    });
  }

  // Applica schema alla formazione attiva
  applicaSchema(s: SchemaFormazione): void {
    const f = this.formazioneAttiva();
    if (!f?.id) {
      this.toast('error', 'Salva prima la formazione');
      return;
    }
    this.confirmService.conferma({
      messaggio: this.modificata()
        ? `Applicare "${s.nome}" a "${f.nome}"? Lo schema parte dalla versione salvata: le modifiche non salvate andranno perse.`
        : `Applicare "${s.nome}" a "${f.nome}"? I titolari verranno ridisposti secondo lo schema; la panchina resta.`,
      header: 'Applica schema',
      labelConferma: 'Applica',
      labelAnnulla: 'Annulla',
      pericoloso: false,
    }).subscribe(confermato => {
      if (!confermato) return;
      this.service.applicaSchema(s.id, f.id).subscribe({
        next: (updated) => {
          this.formazioneAttiva.set(updated);
          this.modificata.set(false);
          this.cambiaTab('formazioni');
          this.toast('success', 'Schema applicato');
        },
        error: (e: HttpErrorResponse) => this.toast('error', e.error?.detail ?? 'Applicazione fallita'),
      });
    });
  }

  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({ severity, summary: severity === 'success' ? 'OK' : 'Errore', detail });
  }
}