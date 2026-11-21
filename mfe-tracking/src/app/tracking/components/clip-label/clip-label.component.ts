import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TrackingApi } from '../../data/tracking.api';
import { ETICHETTE_EVENTO, EtichettaEvento, EventoVideoDto, ModelloEventiDto } from '../../data/tracking.models';

/**
 * Etichettatura di una clip: indizi trasparenti, proposta del modello da confermare e scelta manuale.
 * Ogni etichetta è un esempio per il classificatore, che si riaddestra subito.
 */
@Component({
  selector: 'tk-clip-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clip-label.component.html',
  styleUrl: './clip-label.component.scss',
})
export class ClipLabelComponent {
  private readonly api = inject(TrackingApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly analisiId = input.required<string>();
  readonly evento = input.required<EventoVideoDto>();
  readonly etichettata = output<ModelloEventiDto>();

  protected readonly etichette = ETICHETTE_EVENTO;
  /** Segue l'etichetta salvata quando l'analisi viene ricaricata, ma si può aggiornare subito al clic. */
  protected readonly scelta = linkedSignal<EtichettaEvento | null>(() => this.evento().etichettaUtente ?? null);
  protected readonly salvataggio = signal<EtichettaEvento | 'rimozione' | null>(null);
  protected readonly errore = signal<string | null>(null);

  protected readonly etichettabile = computed(() => !!this.evento().caratteristiche);
  protected readonly indizi = computed(() => this.evento().indizi ?? []);
  protected readonly proposta = computed(() => {
    const p = this.evento().proposta;
    return p && !this.scelta() ? { ...p, nome: this.nome(p.etichetta) } : null;
  });

  protected nome(valore: EtichettaEvento): string {
    return this.etichette.find(e => e.valore === valore)?.nome ?? valore;
  }

  protected scegli(valore: EtichettaEvento): void {
    if (this.salvataggio()) return;
    if (this.scelta() === valore) {
      this.rimuovi();
      return;
    }
    const precedente = this.scelta();
    this.scelta.set(valore); // aggiornamento ottimistico, annullato in caso di errore
    this.salvataggio.set(valore);
    this.errore.set(null);
    this.api.etichettaClip(this.analisiId(), this.evento().id, valore)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: modello => {
          this.salvataggio.set(null);
          this.etichettata.emit(modello);
        },
        error: (e: HttpErrorResponse) => {
          this.salvataggio.set(null);
          // 503: l'etichetta è salvata, solo il modello non è aggiornato
          if (e.status !== 503) this.scelta.set(precedente);
          this.errore.set(this.messaggio(e));
        },
      });
  }

  private rimuovi(): void {
    const precedente = this.scelta();
    this.scelta.set(null);
    this.salvataggio.set('rimozione');
    this.errore.set(null);
    this.api.rimuoviEtichettaClip(this.analisiId(), this.evento().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: modello => {
          this.salvataggio.set(null);
          this.etichettata.emit(modello);
        },
        error: (e: HttpErrorResponse) => {
          this.salvataggio.set(null);
          if (e.status !== 503) this.scelta.set(precedente);
          this.errore.set(this.messaggio(e));
        },
      });
  }

  private messaggio(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Server non raggiungibile.';
    const body = e.error as { detail?: string; message?: string } | null;
    return body?.detail ?? body?.message ?? `Etichetta non salvata (errore ${e.status}).`;
  }
}
