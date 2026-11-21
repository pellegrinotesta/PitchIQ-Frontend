import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElementoTrascinato, Trascina, TrascinamentoService } from '../../core/trascinamento';
import { CaricoGiocatore, GiocatoreDisponibile, PosizioneCampo } from '../../core/model/formazione.model';
import { segnali } from '../../core/disponibilita';
import { inPanchina, rimuovi } from '../../core/movimenti-rosa';

/** Panchina della formazione: si riempie trascinando dalla rosa o dal campo; da qui si trascina in campo o su un titolare per il cambio. */
@Component({
  selector: 'app-panchina',
  imports: [Trascina],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panchina.html',
  styleUrl: './panchina.scss',
})
export class Panchina {
  readonly posizioni = input.required<PosizioneCampo[]>();
  readonly rosa = input.required<GiocatoreDisponibile[]>();
  readonly carichi = input<Map<number, CaricoGiocatore>>(new Map());
  readonly posizioniChange = output<PosizioneCampo[]>();

  protected readonly riserve = computed(() => {
    const rosa = new Map(this.rosa().map(g => [g.id, g]));
    return this.posizioni()
      .filter(p => !p.titolare)
      .map(p => {
        const g = rosa.get(p.giocatoreId);
        return { p, ruolo: g?.ruolo ?? '', segnali: g ? segnali(g, this.carichi().get(g.id)) : [] };
      });
  });

  private readonly trascinamento = inject(TrascinamentoService, { optional: true });

  /** Evidenziata mentre ci passa sopra un giocatore trascinato. */
  protected readonly sopra = computed(() => this.trascinamento?.sopra() === 'panchina');

  constructor() {
    this.trascinamento?.rilascio$.pipe(takeUntilDestroyed()).subscribe(({ elemento, bersaglio }) => {
      if (bersaglio.tipo !== 'panchina') return;
      const g = this.rosa().find(r => r.id === elemento.giocatoreId);
      if (g) this.posizioniChange.emit(inPanchina(this.posizioni(), g));
    });
  }

  protected elemento(p: PosizioneCampo): ElementoTrascinato {
    return { giocatoreId: p.giocatoreId, origine: 'panchina', etichetta: p.cognomeGiocatore, numero: p.numeroMaglia };
  }

  protected rimuovi(p: PosizioneCampo): void {
    this.posizioniChange.emit(rimuovi(this.posizioni(), p.giocatoreId));
  }
}
