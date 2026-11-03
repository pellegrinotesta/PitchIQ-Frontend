import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  PartitaService,
  StatsBombCompetition,
  StatsBombMatch,
} from '../../core/services/partita.service';

@Component({
  selector: 'par-import-statsbomb',
  imports: [FormsModule],
  templateUrl: './import-statsbomb.html',
  styleUrl: './import-statsbomb.scss',
})
export class ImportStatsBomb implements OnInit {
  private service = inject(PartitaService);
  private ref = inject(DynamicDialogRef);

  competizioni = signal<StatsBombCompetition[]>([]);
  partite = signal<StatsBombMatch[]>([]);
  loadingCompetizioni = signal(true);
  loadingPartite = signal(false);
  importing = signal(false);
  errore = signal<string | null>(null);

  competizioneId: number | null = null;
  stagioneId: number | null = null;
  partitaId: number | null = null;
  lato: 'CASA' | 'TRASFERTA' = 'CASA';

  get competizioniDisponibili(): StatsBombCompetition[] {
    const seen = new Set<number>();
    return this.competizioni().filter((item) => {
      if (seen.has(item.competition_id)) return false;
      seen.add(item.competition_id);
      return true;
    });
  }

  get stagioniDisponibili(): StatsBombCompetition[] {
    return this.competizioni().filter((item) => item.competition_id === this.competizioneId);
  }

  ngOnInit(): void {
    this.service.getStatsBombCompetitions().subscribe({
      next: (items) => {
        this.competizioni.set(items);
        this.loadingCompetizioni.set(false);
      },
      error: () => {
        this.errore.set('Impossibile caricare le competizioni StatsBomb.');
        this.loadingCompetizioni.set(false);
      },
    });
  }

  selezionaCompetizione(): void {
    this.stagioneId = null;
    this.partitaId = null;
    this.partite.set([]);
    this.errore.set(null);
  }

  selezionaStagione(): void {
    this.partitaId = null;
    this.partite.set([]);
    this.errore.set(null);
    if (this.competizioneId === null || this.stagioneId === null) return;

    this.loadingPartite.set(true);
    this.service.getStatsBombMatches(this.competizioneId, this.stagioneId).subscribe({
      next: (matches) => {
        this.partite.set(matches);
        this.loadingPartite.set(false);
      },
      error: () => {
        this.errore.set('Impossibile caricare le partite della stagione.');
        this.loadingPartite.set(false);
      },
    });
  }

  importa(): void {
    if (this.competizioneId === null || this.stagioneId === null || this.partitaId === null) return;
    this.importing.set(true);
    this.errore.set(null);
    this.service.importStatsBomb({
      competitionId: this.competizioneId,
      seasonId: this.stagioneId,
      matchId: this.partitaId,
      lato: this.lato,
    }).subscribe({
      next: () => this.ref.close(true),
      error: (error: HttpErrorResponse) => {
        this.errore.set(error.status === 409
          ? 'Questa partita è già presente nel registro.'
          : error.error?.message ?? 'Importazione non riuscita. Riprova tra poco.');
        this.importing.set(false);
      },
    });
  }

  annulla(): void {
    this.ref.close(false);
  }
}