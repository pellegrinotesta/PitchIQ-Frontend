import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Giocatore, StatoGiocatore } from '../../core/models/giocatore.model';
import { GiocatoreService } from '../../core/services/giocatore.service';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { FormGiocatore } from '../form-giocatore/form-giocatore';

type Tab = 'anagrafica' | 'contratto' | 'medico';

@Component({
  selector: 'app-scheda-giocatore',
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    CardModule,
    ProgressSpinnerModule,
    MessageModule,
    DividerModule,
    DynamicDialogModule
  ],
  templateUrl: './scheda-giocatore.html',
  providers: [DialogService],
  styleUrl: './scheda-giocatore.scss',
})
export class SchedaGiocatore implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(GiocatoreService);
  private dialogService = inject(DialogService);


  giocatore = signal<Giocatore | null>(null);
  loading = signal(true);
  errore = signal<string | null>(null);
  tabAttivo: Tab = 'anagrafica';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (g) => { this.giocatore.set(g); this.loading.set(false); },
      error: () => { this.errore.set('Giocatore non trovato.'); this.loading.set(false); },
    });
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
    return map[ruolo] ?? '#888';
  }

  getIniziali(g: Giocatore): string {
    return `${g.nome[0]}${g.cognome[0]}`.toUpperCase();
  }

  formatValuta(v: number | null): string {
    if (!v) return '–';
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
    return `€${v}`;
  }

  giorniAllaScadenza(data: string | null): number | null {
    if (!data) return null;
    const diff = new Date(data).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getScadenzaClass(giorni: number | null): string {
    if (!giorni) return '';
    if (giorni < 90) return 'scadenza-critica';
    if (giorni < 180) return 'scadenza-warning';
    return 'scadenza-ok';
  }

  calcolaLarghezzaScadenza(giorni: number): number {
    return Math.min(100, Math.max(0, (giorni / 365) * 100));
  }

  apriModifica(): void {
    const g = this.giocatore();
    if (!g) return;

    const ref = this.dialogService.open(FormGiocatore, {
      header: 'Modifica giocatore',
      width: '560px',
      modal: true,
      data: { giocatore: g },
    });

    ref?.onClose.subscribe((salvato: boolean) => {
      if (salvato) {
        // Ricarica i dati aggiornati
        this.service.getById(g.id).subscribe({
          next: (updated) => this.giocatore.set(updated),
        });
      }
    });
  }
}
