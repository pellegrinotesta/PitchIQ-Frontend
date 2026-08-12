import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Giocatore, RuoloGiocatore, StatoGiocatore } from '../../core/models/giocatore.model';
import { GiocatoreService } from '../../core/services/giocatore.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService } from 'primeng/api';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGiocatore } from '../form-giocatore/form-giocatore';

@Component({
  selector: 'app-elenco-giocatori',
  imports: [
    RouterLink,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    ConfirmDialogModule,
    DynamicDialogModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService, DialogService],
  templateUrl: './elenco-giocatori.html',
  styleUrl: './elenco-giocatori.scss',
})
export class ElencoGiocatori implements OnInit {
  private service = inject(GiocatoreService);
  private confirmationService = inject(ConfirmationService);
  private dialogService = inject(DialogService);
  private ref: DynamicDialogRef | null = null;

  giocatori = signal<Giocatore[]>([]);
  loading = signal(false);
  errore = signal<string | null>(null);

  filtroCognome = '';
  filtroRuolo: RuoloGiocatore | null = null;
  filtroStato: StatoGiocatore | null = null;

  readonly ruoliOptions = [
    { label: 'Tutti i ruoli', value: null },
    { label: 'Portiere', value: 'PORTIERE' },
    { label: 'Difensore', value: 'DIFENSORE' },
    { label: 'Centrocampista', value: 'CENTROCAMPISTA' },
    { label: 'Attaccante', value: 'ATTACCANTE' },
  ];

  readonly statiOptions = [
    { label: 'Tutti gli stati', value: null },
    { label: 'Attivo', value: 'ATTIVO' },
    { label: 'Infortunato', value: 'INFORTUNATO' },
    { label: 'Squalificato', value: 'SQUALIFICATO' },
  ];

  ngOnInit(): void { this.carica(); }

  carica(): void {
    this.loading.set(true);
    this.errore.set(null);
    this.service.getAll({
      ruolo: this.filtroRuolo ?? undefined,
      stato: this.filtroStato ?? undefined,
      cognome: this.filtroCognome || undefined,
    }).subscribe({
      next: (lista) => { this.giocatori.set(lista); this.loading.set(false); },
      error: () => { this.errore.set('Impossibile caricare la rosa.'); this.loading.set(false); },
    });
  }

  apriNuovo(): void {
    this.apriDialog(null);
  }

  apriModifica(g: Giocatore): void {
    this.apriDialog(g);
  }

  private apriDialog(giocatore: Giocatore | null): void {
    this.ref = this.dialogService.open(FormGiocatore, {
      header: giocatore ? 'Modifica giocatore' : 'Nuovo giocatore',
      width: '560px',
      modal: true,
      closable: true,
      draggable: false,
      resizable: false,
      data: { giocatore },
    });

    this.ref?.onClose.subscribe((salvato: boolean) => {
      if (salvato) this.carica();
    });
  }

  getSeverity(stato: StatoGiocatore): 'success' | 'danger' | 'warn' {
    const map: Record<StatoGiocatore, 'success' | 'danger' | 'warn'> = {
      ATTIVO: 'success', INFORTUNATO: 'danger', SQUALIFICATO: 'warn',
    };
    return map[stato];
  }

  elimina(g: Giocatore): void {
    this.confirmationService.confirm({
      message: `Eliminare ${g.cognome} ${g.nome}?`,
      header: 'Conferma eliminazione',
      icon: 'pi pi-trash',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(g.id).subscribe({
          next: () => this.carica(),
          error: () => this.errore.set('Eliminazione fallita.'),
        });
      },
    });
  }
}
