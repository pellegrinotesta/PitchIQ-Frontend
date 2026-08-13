import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Partita } from '../../core/models/partita.model';
import { PartitaService } from '../../core/services/partita.service';
import { FormPartita } from '../form-partita/form-partita';

@Component({
  selector: 'par-registro',
  imports: [RouterLink, DynamicDialogModule],
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

  // Statistiche aggregate
  get vittorie() { return this.partite().filter(p => p.risultato === 'V').length; }
  get pareggi()  { return this.partite().filter(p => p.risultato === 'N').length; }
  get sconfitte(){ return this.partite().filter(p => p.risultato === 'P').length; }
  get golFatti() { return this.partite().reduce((s, p) => s + p.golFatti, 0); }
  get golSubiti(){ return this.partite().reduce((s, p) => s + p.golSubiti, 0); }

  ngOnInit(): void { this.carica(); }

  carica(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (list) => { this.partite.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  apriNuova(): void {
    this.ref = this.dialogService.open(FormPartita, {
      header: 'Nuova partita',
      width: '540px',
      modal: true,
      data: { partita: null },
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

  getRisultatoClass(r: string): string {
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


