import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Giocatore, RuoloGiocatore, StatoGiocatore } from '../../core/models/giocatore.model';
import { GiocatoreService } from '../../core/services/giocatore.service';

@Component({
  selector: 'app-elenco-giocatori',
  imports: [RouterLink, FormsModule],
  templateUrl: './elenco-giocatori.html',
  styleUrl: './elenco-giocatori.scss',
})
export class ElencoGiocatori implements OnInit {
  private service = inject(GiocatoreService);

  giocatori = signal<Giocatore[]>([]);
  loading = signal(false);
  errore = signal<string | null>(null);

  // Filtri
  filtroCognome = '';
  filtroRuolo: RuoloGiocatore | '' = '';
  filtroStato: StatoGiocatore | '' = '';

  readonly ruoli: RuoloGiocatore[] = ['PORTIERE', 'DIFENSORE', 'CENTROCAMPISTA', 'ATTACCANTE'];
  readonly stati: StatoGiocatore[] = ['ATTIVO', 'INFORTUNATO', 'SQUALIFICATO'];

  ngOnInit(): void {
    this.carica();
  }

  carica(): void {
    this.loading.set(true);
    this.errore.set(null);

    this.service.getAll({
      ruolo: this.filtroRuolo || undefined,
      stato: this.filtroStato || undefined,
      cognome: this.filtroCognome || undefined,
    }).subscribe({
      next: (lista) => {
        this.giocatori.set(lista);
        this.loading.set(false);
      },
      error: () => {
        this.errore.set('Impossibile caricare la rosa. Riprova.');
        this.loading.set(false);
      },
    });
  }

  elimina(id: number): void {
    if (!confirm('Eliminare il giocatore?')) return;
    this.service.delete(id).subscribe({
      next: () => this.carica(),
      error: () => this.errore.set('Eliminazione fallita.'),
    });
  }
}
