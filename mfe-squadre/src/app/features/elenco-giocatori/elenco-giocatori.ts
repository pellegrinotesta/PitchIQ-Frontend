import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Giocatore,
  RUOLO_LABEL,
  RuoloGiocatore,
  StatoGiocatore,
} from '../../core/models/giocatore.model';
import {
  coperturaRuoli,
  esportaRosaCsv,
  filtraRosa,
  FiltriRosa,
  giorniContratto,
  riepilogoRosa,
} from '../../core/models/rosa-insights';
import { GiocatoreService } from '../../core/services/giocatore.service';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { FormGiocatore } from '../form-giocatore/form-giocatore';

type Vista = 'rosa' | 'copertura' | 'contratti';
const FILTRI_INIZIALI: FiltriRosa = {
  ricerca: '',
  ruolo: null,
  stato: null,
  piede: '',
  contratto: 'TUTTI',
};

@Component({
  selector: 'app-elenco-giocatori',
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    DecimalPipe,
    TableModule,
    ConfirmDialogModule,
    DynamicDialogModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, DialogService],
  templateUrl: './elenco-giocatori.html',
  styleUrl: './elenco-giocatori.scss',
})
export class ElencoGiocatori implements OnInit {
  private service = inject(GiocatoreService);
  private confirmationService = inject(ConfirmationService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  readonly giocatori = signal<Giocatore[]>([]);
  readonly loading = signal(true);
  readonly errore = signal<string | null>(null);
  readonly avviso = signal('');
  readonly aggiornato = signal<Date | null>(null);
  readonly vista = signal<Vista>('rosa');
  readonly filtri = signal<FiltriRosa>({ ...FILTRI_INIZIALI });
  readonly selezionati = signal<number[]>([]);
  readonly confrontoAperto = signal(false);
  readonly eliminando = signal<number | null>(null);
  readonly ruoloLabel = RUOLO_LABEL;
  readonly ruoliOptions = Object.entries(RUOLO_LABEL).map(([value, label]) => ({ value, label }));
  readonly statiLabel: Record<StatoGiocatore, string> = {
    ATTIVO: 'Attivo',
    INFORTUNATO: 'Infortunato',
    SQUALIFICATO: 'Squalificato',
  };
  readonly riepilogo = computed(() =>
    riepilogoRosa(this.giocatori(), this.aggiornato() ?? new Date()),
  );
  readonly filtrati = computed(() =>
    filtraRosa(this.giocatori(), this.filtri(), this.aggiornato() ?? new Date()),
  );
  readonly copertura = computed(() => coperturaRuoli(this.filtrati()));
  readonly confronto = computed(() =>
    this.selezionati().flatMap((id) => this.giocatori().filter((giocatore) => giocatore.id === id)),
  );
  readonly contratti = computed(() =>
    [...this.filtrati()].sort(
      (primo, secondo) =>
        (this.giorni(primo.contrattoFine) ?? Infinity) -
        (this.giorni(secondo.contrattoFine) ?? Infinity),
    ),
  );
  readonly filtriAttivi = computed(() =>
    Object.entries(this.filtri()).some(
      ([chiave, valore]) => valore !== FILTRI_INIZIALI[chiave as keyof FiltriRosa],
    ),
  );
  primaRiga = 0;

  ngOnInit(): void {
    this.carica();
  }

  carica(): void {
    if (this.loading() && this.aggiornato()) return;
    if (this.eliminando() !== null) return;
    this.loading.set(true);
    this.errore.set(null);
    this.service
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.giocatori.set(lista);
          this.selezionati.update((ids) =>
            ids.filter((id) => lista.some((giocatore) => giocatore.id === id)),
          );
          if (this.selezionati().length < 2) this.confrontoAperto.set(false);
          this.aggiornato.set(new Date());
          this.loading.set(false);
        },
        error: () => {
          this.errore.set('Impossibile aggiornare la rosa. Verifica la connessione e riprova.');
          this.loading.set(false);
        },
      });
  }

  filtra(patch: Partial<FiltriRosa>): void {
    this.filtri.update((filtri) => ({ ...filtri, ...patch }));
    this.primaRiga = 0;
  }

  resetFiltri(): void {
    this.filtri.set({ ...FILTRI_INIZIALI });
    this.primaRiga = 0;
  }
  cambiaVista(vista: Vista): void {
    this.vista.set(vista);
    this.primaRiga = 0;
  }

  seleziona(giocatore: Giocatore): void {
    this.avviso.set('');
    if (this.selezionati().includes(giocatore.id)) {
      this.selezionati.update((ids) => ids.filter((id) => id !== giocatore.id));
    } else if (this.selezionati().length < 4) {
      this.selezionati.update((ids) => [...ids, giocatore.id]);
    } else {
      this.avviso.set(
        'Puoi confrontare al massimo 4 giocatori. Rimuovi una selezione per continuare.',
      );
    }
    if (this.selezionati().length < 2) this.confrontoAperto.set(false);
  }

  svuotaConfronto(): void {
    this.selezionati.set([]);
    this.confrontoAperto.set(false);
    this.avviso.set('');
  }

  descrizioneRuolo(giocatore: Giocatore): string {
    return RUOLO_LABEL[giocatore.ruolo];
  }
  descrizioneStato(giocatore: Giocatore): string {
    return this.statiLabel[giocatore.stato];
  }

  valuta(valore: number | null): string {
    return valore === null
      ? 'N/D'
      : new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR',
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(valore);
  }

  piede(valore: string | null): string {
    const etichette: Record<string, string> = {
      DESTRO: 'Destro',
      SINISTRO: 'Sinistro',
      AMBIDESTRO: 'Ambidestro',
    };
    return valore ? (etichette[valore] ?? valore) : 'N/D';
  }

  giorni(data: string | null): number | null {
    return giorniContratto(data, this.aggiornato() ?? new Date());
  }

  statoContratto(data: string | null): string {
    const giorni = this.giorni(data);
    if (giorni === null) return 'Scadenza non disponibile';
    if (giorni < 0) return `Scaduto da ${Math.abs(giorni)} giorni`;
    if (giorni === 0) return 'In scadenza oggi';
    return `${giorni} giorni residui`;
  }

  esporta(soloConfronto = false): void {
    const rosa = soloConfronto
      ? this.confronto()
      : this.vista() === 'contratti'
        ? this.contratti()
        : this.filtrati();
    if (!rosa.length || this.loading() || this.errore()) return;
    const url = URL.createObjectURL(
      new Blob([esportaRosaCsv(rosa)], { type: 'text/csv;charset=utf-8;' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `pitchiq-${soloConfronto ? 'confronto' : this.vista()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.avviso.set(`Export completato: ${rosa.length} giocatori.`);
  }

  apriNuovo(): void {
    this.apriDialog(null);
  }
  apriModifica(giocatore: Giocatore): void {
    this.apriDialog(giocatore);
  }

  private apriDialog(giocatore: Giocatore | null): void {
    const ref = this.dialogService.open(FormGiocatore, {
      header: giocatore ? 'Modifica giocatore' : 'Nuovo giocatore',
      width: '720px',
      breakpoints: { '800px': '95vw' },
      modal: true,
      closable: true,
      draggable: false,
      resizable: false,
      data: { giocatore },
    });
    ref?.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((salvato: boolean) => {
      if (salvato) {
        this.avviso.set('Giocatore salvato.');
        this.carica();
      }
    });
  }

  elimina(giocatore: Giocatore): void {
    this.confirmationService.confirm({
      message: `Eliminare definitivamente ${giocatore.cognome} ${giocatore.nome} dalla rosa?`,
      header: 'Elimina giocatore',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (this.eliminando() !== null) return;
        this.eliminando.set(giocatore.id);
        this.service
          .delete(giocatore.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.eliminando.set(null);
              this.avviso.set('Giocatore eliminato.');
              this.carica();
            },
            error: () => {
              this.eliminando.set(null);
              this.avviso.set('Eliminazione non riuscita. Nessuna modifica confermata.');
            },
          });
      },
    });
  }
}
