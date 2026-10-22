import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EsitoBarsComponent } from '../components/esito-bars.component';
import { UploadPanelComponent } from '../components/upload-panel.component';
import { TrackingApi } from '../data/tracking.api';
import { AggregatoEsitoDto, ImportDto, PartitaDto } from '../data/tracking.models';

@Component({
  selector: 'tk-tracking-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UploadPanelComponent, EsitoBarsComponent, RouterLink, DatePipe],
  templateUrl: './tracking-home.component.html',
  styleUrl: './tracking-home.component.scss',
})
export class TrackingHomeComponent {
  private readonly api = inject(TrackingApi);

  protected readonly partite = signal<PartitaDto[]>([]);
  protected readonly aggregati = signal<AggregatoEsitoDto[]>([]);
  protected readonly importRecenti = signal<ImportDto[]>([]);
  protected readonly ultimaCaricata = signal<number | null>(null);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal<string | null>(null);

  protected readonly statoLabel: Record<ImportDto['stato'], string> = {
    IN_CODA: 'In coda', IN_ELABORAZIONE: 'In elaborazione', COMPLETATO: 'Completato', ERRORE: 'Errore',
  };

  constructor() { this.ricarica(); }

  protected onImportConcluso(imp: ImportDto): void {
    if (imp.stato === 'COMPLETATO') this.ultimaCaricata.set(imp.matchId);
    this.ricarica();
  }

  private ricarica(): void {
    forkJoin({ partite: this.api.partite(), aggregati: this.api.aggregati(), recenti: this.api.importRecenti() })
      .subscribe({
        next: r => {
          this.partite.set(r.partite);
          this.aggregati.set(r.aggregati);
          this.importRecenti.set(r.recenti);
          this.errore.set(null);
          this.caricamento.set(false);
        },
        error: () => {
          this.errore.set('Non riesco a leggere i dati di tracking dal server.');
          this.caricamento.set(false);
        },
      });
  }
}