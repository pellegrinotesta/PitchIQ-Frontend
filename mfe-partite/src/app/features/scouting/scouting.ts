import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ScoutingAvversario } from '../../core/models/partita.model';
import { PartitaService } from '../../core/services/partita.service';
import { FormScouting } from '../form-scouting/form-scouting';

@Component({
  selector: 'par-scouting',
  imports: [RouterLink, FormsModule, DynamicDialogModule],
  providers: [DialogService],
  templateUrl: './scouting.html',
  styleUrl: './scouting.scss',
})
export class Scouting implements OnInit {
  private service = inject(PartitaService);
  private dialogService = inject(DialogService);
  private ref: DynamicDialogRef | null = null;

  avversari = signal<ScoutingAvversario[]>([]);
  selezionato = signal<ScoutingAvversario | null>(null);
  loading = signal(true);

  ngOnInit(): void { this.carica(); }

  carica(): void {
    this.service.getAllScouting().subscribe({
      next: (list) => { this.avversari.set(list); this.loading.set(false); },
    });
  }

  apriNuovo(): void {
    this.ref = this.dialogService.open(FormScouting, {
      header: 'Nuovo scouting',
      width: '580px',
      modal: true,
      data: { avversario: null },
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  apriModifica(a: ScoutingAvversario): void {
    this.ref = this.dialogService.open(FormScouting, {
      header: 'Modifica scouting',
      width: '580px',
      modal: true,
      data: { avversario: a },
    });
    this.ref?.onClose.subscribe((ok) => { if (ok) this.carica(); });
  }

  elimina(a: ScoutingAvversario): void {
    this.service.deleteScouting(a.id).subscribe({
      next: () => {
        if (this.selezionato()?.id === a.id) this.selezionato.set(null);
        this.carica();
      },
    });
  }
}
