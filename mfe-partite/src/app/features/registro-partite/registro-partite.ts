import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { from, mergeMap, toArray } from 'rxjs';
import { Partita } from '../../core/models/partita.model';
import {
  applicaRegolaCampionato,
  bilancio,
  bilancioPerCampo,
  calendario,
  eGiocata,
  competizioniDisponibili,
  filtraPartite,
  forma,
  situazioneDisciplinare,
  SituazioneDisciplinare,
  stagioniDisponibili,
} from '../../core/models/stagione-insights';
import { PartitaService } from '../../core/services/partita.service';
import { FormPartita } from '../form-partita/form-partita';
import { ImportStatsBomb } from '../import-statsbomb/import-statsbomb';

@Component({
  selector: 'par-registro',
  imports: [RouterLink, DynamicDialogModule, DatePipe, DecimalPipe],
  providers: [DialogService, ConfirmationService],
  templateUrl: './registro-partite.html',
  styleUrl: './registro-partite.scss',
})
export class RegistroPartite implements OnInit {
  private service        = inject(PartitaService);
  private dialogService  = inject(DialogService);
  private confirmService = inject(ConfirmationService);
  private ref: DynamicDialogRef | null = null;

  partite  = signal<Partita[]>([]);
  loading  = signal(true);

  // Filtri: stagione sportiva e competizione
  stagione     = signal<string | null>(null);
  competizione = signal<string | null>(null);

  readonly stagioni     = computed(() => stagioniDisponibili(this.partite()));
  readonly competizioni = computed(() => competizioniDisponibili(this.partite()));
  readonly filtrate     = computed(() =>
    filtraPartite(this.partite(), this.stagione(), this.competizione()),
  );

  readonly giocate      = computed(() => this.filtrate().filter(eGiocata));
  readonly inCalendario = computed(() => calendario(this.filtrate(), this.oggi));
  private readonly oggi = this.dataIso(new Date());

  // Rendimento sul perimetro filtrato
  readonly totale    = computed(() => bilancio(this.filtrate()));
  readonly casa      = computed(() => bilancioPerCampo(this.filtrate(), 'CASA'));
  readonly trasferta = computed(() => bilancioPerCampo(this.filtrate(), 'TRASFERTA'));
  readonly ultime    = computed(() => forma(this.filtrate()));

  // Disciplina: richiede gli eventi, che l'elenco partite non contiene
  disciplina           = signal<SituazioneDisciplinare | null>(null);
  caricamentoDisciplina = signal(false);
  erroreDisciplina     = signal(false);

  ngOnInit(): void { this.carica(); }

  carica(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (list) => {
        this.partite.set(list);
        const stagioni = this.stagioni();
        if (!this.stagione() || !stagioni.includes(this.stagione()!)) {
          this.stagione.set(stagioni[0] ?? null);
        }
        if (this.competizione() && !this.competizioni().includes(this.competizione()!)) {
          this.competizione.set(null);
        }
        this.disciplina.set(null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cambiaStagione(valore: string): void {
    this.stagione.set(valore || null);
    this.disciplina.set(null);
  }

  cambiaCompetizione(valore: string): void {
    this.competizione.set(valore || null);
    this.disciplina.set(null);
  }

  calcolaDisciplina(): void {
    const competizione = this.competizione();
    const partite = this.giocate();
    if (!competizione || !this.stagione() || this.caricamentoDisciplina()) return;

    this.caricamentoDisciplina.set(true);
    this.erroreDisciplina.set(false);
    from(partite)
      .pipe(mergeMap((p) => this.service.getById(p.id), 4), toArray())
      .subscribe({
        next: (dettagli) => {
          // I filtri possono essere cambiati durante il caricamento
          if (this.competizione() === competizione && this.giocate() === partite) {
            this.disciplina.set(
              situazioneDisciplinare(dettagli, applicaRegolaCampionato(competizione)),
            );
          }
          this.caricamentoDisciplina.set(false);
        },
        error: () => {
          this.erroreDisciplina.set(true);
          this.caricamentoDisciplina.set(false);
        },
      });
  }

  apriNuova(): void {
    this.ref = this.dialogService.open(FormPartita, {
      header: 'Nuova partita',
      width: '540px',
      modal: true,
      data: { partita: null, competizione: this.competizione() },
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  apriImportStatsBomb(): void {
    this.ref = this.dialogService.open(ImportStatsBomb, {
      header: 'Importa partita StatsBomb',
      width: '620px',
      modal: true,
      data: {},
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  apriModifica(p: Partita, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.ref = this.dialogService.open(FormPartita, {
      header: 'Modifica partita',
      width: '540px',
      modal: true,
      data: { partita: p },
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  elimina(p: Partita, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.confirmService.confirm({
      message: `Eliminare ${p.avversario} del ${p.data}?`,
      header: 'Conferma',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(p.id).subscribe({ next: () => this.carica() });
      },
    });
  }

  inserisciRisultato(p: Partita, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.ref = this.dialogService.open(FormPartita, {
      header: 'Inserisci risultato',
      width: '540px',
      modal: true,
      data: { partita: p, giocata: true },
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  private dataIso(d: Date): string {
    const due = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
  }

  getRisultatoClass(r: string | null): string {
    if (r === 'V') return 'vittoria';
    if (r === 'P') return 'sconfitta';
    return 'pareggio';
  }

  getCasaTrasfertaLabel(ct: string): string {
    if (ct === 'CASA') return 'Casa';
    if (ct === 'TRASFERTA') return 'Trasferta';
    return 'Neutro';
  }
}
