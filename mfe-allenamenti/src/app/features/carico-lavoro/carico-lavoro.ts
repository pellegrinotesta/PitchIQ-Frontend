import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaricoGiocatore, ZonaCarico, zonaCarico } from '../../core/models/allenamento.model';
import { AllenamentoService } from '../../core/services/allenamento.service';

const ORDINE: Record<ZonaCarico, number> = {
  ALTO: 0, ATTENZIONE: 1, BASSO: 2, OTTIMALE: 3, NON_VALUTABILE: 4,
};

@Component({
  selector: 'all-carico',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './carico-lavoro.html',
  styleUrl: './carico-lavoro.css',
})
export class CaricoLavoro implements OnInit {
  private service = inject(AllenamentoService);

  readonly dati = signal<CaricoGiocatore[]>([]);
  readonly loading = signal(true);
  readonly errore = signal(false);
  readonly al = signal(this.oggi());

  readonly etichette: Record<ZonaCarico, string> = {
    ALTO: 'Carico alto',
    ATTENZIONE: 'Attenzione',
    BASSO: 'Carico basso',
    OTTIMALE: 'Ottimale',
    NON_VALUTABILE: 'Non valutabile',
  };

  /** Prima chi richiede attenzione, poi per rapporto decrescente */
  readonly righe = computed(() =>
    this.dati()
      .map((c) => ({ ...c, zona: zonaCarico(c) }))
      .sort(
        (a, b) =>
          ORDINE[a.zona] - ORDINE[b.zona] ||
          (b.acwr ?? 0) - (a.acwr ?? 0) ||
          a.cognomeGiocatore.localeCompare(b.cognomeGiocatore, 'it'),
      ),
  );
  readonly daMonitorare = computed(
    () => this.righe().filter((r) => r.zona === 'ALTO' || r.zona === 'ATTENZIONE').length,
  );
  readonly senzaRpe = computed(() => this.dati().reduce((s, c) => s + c.seduteSenzaRpe, 0));

  ngOnInit(): void {
    this.carica();
  }

  cambiaData(valore: string): void {
    if (!valore) return;
    this.al.set(valore);
    this.carica();
  }

  carica(): void {
    this.loading.set(true);
    this.errore.set(false);
    this.service.getCarico(this.al()).subscribe({
      next: (dati) => { this.dati.set(dati); this.loading.set(false); },
      error: () => { this.errore.set(true); this.loading.set(false); },
    });
  }

  private oggi(): string {
    const d = new Date();
    const due = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
  }
}
