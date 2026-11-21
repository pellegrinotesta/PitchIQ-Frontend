import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CaricoGiocatore, GiocatoreDisponibile, PosizioneCampo } from '../../core/model/formazione.model';
import { segnali } from '../../core/disponibilita';
import { inPanchina, rimuovi } from '../../core/movimenti-rosa';

/** Panchina della formazione: si riempie trascinando dalla rosa o dal campo; da qui si trascina in campo o su un titolare per il cambio. */
@Component({
  selector: 'app-panchina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panchina.html',
  styleUrl: './panchina.scss',
})
export class Panchina {
  readonly posizioni = input.required<PosizioneCampo[]>();
  readonly rosa = input.required<GiocatoreDisponibile[]>();
  readonly carichi = input<Map<number, CaricoGiocatore>>(new Map());
  readonly posizioniChange = output<PosizioneCampo[]>();

  protected readonly sopra = signal(false);

  protected readonly riserve = computed(() => {
    const rosa = new Map(this.rosa().map(g => [g.id, g]));
    return this.posizioni()
      .filter(p => !p.titolare)
      .map(p => {
        const g = rosa.get(p.giocatoreId);
        return { p, ruolo: g?.ruolo ?? '', segnali: g ? segnali(g, this.carichi().get(g.id)) : [] };
      });
  });

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.sopra.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.sopra.set(false);
    const dati = event.dataTransfer;
    const raw = dati?.getData('posizione') || dati?.getData('giocatore');
    if (!raw) return;
    const dato = JSON.parse(raw) as { giocatoreId?: number; id?: number };
    const id = dato.giocatoreId ?? dato.id;  // dal campo arriva una posizione, dalla rosa un giocatore
    const g = this.rosa().find(r => r.id === id);
    if (g) this.posizioniChange.emit(inPanchina(this.posizioni(), g));
  }

  protected onDragStart(event: DragEvent, p: PosizioneCampo): void {
    event.dataTransfer?.setData('panchina', JSON.stringify({ giocatoreId: p.giocatoreId }));
  }

  protected rimuovi(p: PosizioneCampo): void {
    this.posizioniChange.emit(rimuovi(this.posizioni(), p.giocatoreId));
  }
}
